/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { IS_FF, IS_IE11 } from '../Client';
import { addProp, isSet, makeComponent } from '../Helpers';
import Text from '../shape/Text';
import {
  ALIGN_CENTER,
  ALIGN_MIDDLE,
  DEFAULT_TEXT_DIRECTION,
  STYLE_ALIGN,
  STYLE_LABEL_POSITION,
  STYLE_OVERFLOW,
  STYLE_SPACING,
  STYLE_SPACING_BOTTOM,
  STYLE_SPACING_LEFT,
  STYLE_SPACING_RIGHT,
  STYLE_SPACING_TOP,
  STYLE_TEXT_DIRECTION,
  STYLE_VERTICAL_LABEL_POSITION,
  TEXT_DIRECTION_AUTO,
  TEXT_DIRECTION_LTR,
  TEXT_DIRECTION_RTL,
  WORD_WRAP
} from '../util/Constants';
import Event from '../util/Event';
import Rectangle from '../util/Rectangle';
import {
  extractTextWithWhitespace,
  getAlignmentAsPoint,
  getValue,
  htmlEntities,
  replaceTrailingNewlines
} from '../util/Utils';

/**
 * Class: CellEditor
 *
 * In-place editor for the graph. To control this editor, use
 * <mxGraph.invokesStopCellEditing>, <mxGraph.enterStopsCellEditing> and
 * <mxGraph.escapeEnabled>. If <mxGraph.enterStopsCellEditing> is true then
 * ctrl-enter or shift-enter can be used to create a linefeed. The F2 and
 * escape keys can always be used to stop editing.
 *
 * To customize the location of the textbox in the graph, override
 * <getEditorBounds> as follows:
 *
 * (code)
 * graph.cellEditor.getEditorBounds = function(state)
 * {
 *   var result = mxCellEditor.prototype.getEditorBounds.apply(this, arguments);
 *
 *   if (this.graph.getModel().isEdge(state.cell))
 *   {
 *     result.x = state.getCenterX() - result.width / 2;
 *     result.y = state.getCenterY() - result.height / 2;
 *   }
 *
 *   return result;
 * };
 * (end)
 *
 * Note that this hook is only called if <autoSize> is false. If <autoSize> is true,
 * then <mxShape.getLabelBounds> is used to compute the current bounds of the textbox.
 *
 * The textarea uses the mxCellEditor CSS class. You can modify this class in
 * your custom CSS. Note: You should modify the CSS after loading the client
 * in the page.
 *
 * Example:
 *
 * To only allow numeric input in the in-place editor, use the following code.
 *
 * (code)
 * var text = graph.cellEditor.textarea;
 *
 * mxEvent.addListener(text, 'keydown', function (evt)
 * {
 *   if (!(evt.keyCode >= 48 && evt.keyCode <= 57) &&
 *       !(evt.keyCode >= 96 && evt.keyCode <= 105))
 *   {
 *     mxEvent.consume(evt);
 *   }
 * });
 * (end)
 *
 * Placeholder:
 *
 * To implement a placeholder for cells without a label, use the
 * <emptyLabelText> variable.
 *
 * Resize in Chrome:
 *
 * Resize of the textarea is disabled by default. If you want to enable
 * this feature extend <init> and set this.textarea.style.resize = ''.
 *
 * To start editing on a key press event, the container of the graph
 * should have focus or a focusable parent should be used to add the
 * key press handler as follows.
 *
 * (code)
 * mxEvent.addListener(graph.container, 'keypress', mxUtils.bind(this, function(evt)
 * {
 *   if (!graph.isEditing() && !graph.isSelectionEmpty() && evt.which !== 0 &&
 *       !mxEvent.isAltDown(evt) && !mxEvent.isControlDown(evt) && !mxEvent.isMetaDown(evt))
 *   {
 *     graph.startEditing();
 *
 *     if (mxClient.IS_FF)
 *     {
 *       graph.cellEditor.textarea.value = String.fromCharCode(evt.which);
 *     }
 *   }
 * }));
 * (end)
 *
 * To allow focus for a DIV, and hence to receive key press events, some browsers
 * require it to have a valid tabindex attribute. In this case the following
 * code may be used to keep the container focused.
 *
 * (code)
 * var graphFireMouseEvent = graph.fireMouseEvent;
 * graph.fireMouseEvent = function(evtName, me, sender)
 * {
 *   if (evtName == mxEvent.MOUSE_DOWN)
 *   {
 *     this.container.focus();
 *   }
 *
 *   graphFireMouseEvent.apply(this, arguments);
 * };
 * (end)
 *
 * Constructor: mxCellEditor
 *
 * Constructs a new in-place editor for the specified graph.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
const CellEditor = (graph) => {
  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: textarea
   *
   * Holds the DIV that is used for text editing. Note that this may be null before the first
   * edit. Instantiated in <init>.
   */
  const [getTextarea, setTextarea] = addProp();

  /**
   * Variable: editingCell
   *
   * Reference to the <mxCell> that is currently being edited.
   */
  const [getEditingCell, setEditingCell] = addProp();

  /**
   * Variable: trigger
   *
   * Reference to the event that was used to start editing.
   */
  const [getTrigger, setTrigger] = addProp();

  /**
   * Variable: modified
   *
   * Specifies if the label has been modified.
   */
  const [isModified, setModified] = addProp(false);

  /**
   * Variable: autoSize
   *
   * Specifies if the textarea should be resized while the text is being edited.
   * Default is true.
   */
  const [isAutoSize, setAutoSize] = addProp(true);

  /**
   * Variable: selectText
   *
   * Specifies if the text should be selected when editing starts. Default is
   * true.
   */
  const [isSelectText, setSelectText] = addProp(true);

  /**
   * Variable: emptyLabelText
   *
   * Text to be displayed for empty labels. Default is '' or '<br>' in Firefox as
   * a workaround for the missing cursor bug for empty content editable. This can
   * be set to eg. "[Type Here]" to easier visualize editing of empty labels. The
   * value is only displayed before the first keystroke and is never used as the
   * actual editing value.
   */
  const [getEmptyLabelText, setEmptyLabelText] = addProp(IS_FF ? '<br>' : '');

  /**
   * Variable: escapeCancelsEditing
   *
   * If true, pressing the escape key will stop editing and not accept the new
   * value. Change this to false to accept the new value on escape, and cancel
   * editing on Shift+Escape instead. Default is true.
   */
  const [isEscapeCancelsEditing, setEscapeCancelsEditing] = addProp(true);

  /**
   * Variable: textNode
   *
   * Reference to the label DOM node that has been hidden.
   */
  const [getTextNode, setTextNode] = addProp('');

  /**
   * Variable: zIndex
   *
   * Specifies the zIndex for the textarea. Default is 5.
   */
  const [getZIndex, setZIndex] = addProp(5);

  /**
   * Variable: minResize
   *
   * Defines the minimum width and height to be used in <resize>. Default is 0x20px.
   */
  const [getMinResize, setMinResize] = addProp(Rectangle(0, 20));

  /**
   * Variable: wordWrapPadding
   *
   * Correction factor for word wrapping width. Default is 2 in quirks, 0 in IE
   * 11 and 1 in all other browsers and modes.
   */
  const [getWordWrapPadding, setWordWrapPadding] = addProp(IS_IE11 ? 0 : 1);

  /**
   * Variable: blurEnabled
   *
   * If <focusLost> should be called if <textarea> loses the focus. Default is false.
   */
  const [isBlurEnabled, setBlurEnabled] = addProp(false);

  /**
   * Variable: initialValue
   *
   * Holds the initial editing value to check if the current value was modified.
   */
  const [_getInitialValue, setInitialValue] = addProp();

  /**
   * Variable: align
   *
   * Holds the current temporary horizontal alignment for the cell style. If this
   * is modified then the current text alignment is changed and the cell style is
   * updated when the value is applied.
   */
  const [getAlign, _setAlign] = addProp();
  const [isClearOnChange, setClearOnChange] = addProp(false);
  const [getTextDirection, setTextDirection] = addProp();

  // Stops editing after zoom changes
  const [getZoomHandler, setZoomHandler] = addProp(() => {
    if (getGraph().isEditing()) {
      resize();
    }
  });

  // Adds handling of deleted cells while editing
  const [getChangeHandler, setChangeHandler] = addProp((sender) => {
    if (
      isSet(getEditingCell()) &&
      isUnset(getGraph().getView().getState(getEditingCell()))
    ) {
      stopEditing(true);
    }
  });

  /**
   * Function: init
   *
   * Creates the <textarea> and installs the event listeners. The key handler
   * updates the <modified> state.
   */
  const init = () => {
    const textarea = setTextarea(document.createElement('div'));
    textarea.className = 'mxCellEditor mxPlainTextEditor';
    textarea.contentEditable = true;

    // Workaround for selection outside of DIV if height is 0
    if (mxClient.IS_GC) {
      textarea.style.minHeight = '1em';
    }

    textarea.style.position = isLegacyEditor() ? 'absolute' : 'relative';
    installListeners(textarea);
  };

  /**
   * Function: applyValue
   *
   * Called in <stopEditing> if cancel is false to invoke <mxGraph.labelChanged>.
   */
  const applyValue = (state, value) =>
    getGraph().labelChanged(state.getCell(), value, trigger);

  /**
   * Function: setAlign
   *
   * Sets the temporary horizontal alignment for the current editing session.
   */
  const setAlign = (align) => {
    if (isSet(getTextarea())) {
      getTextarea().style.textAlign = align;
    }

    _setAlign(align);
    resizeBy();
  };

  /**
   * Function: getInitialValue
   *
   * Gets the initial editing value for the given cell.
   */
  const getInitialValue = (state, trigger) => {
    let result = htmlEntities(
      getGraph().getEditingValue(state.getCell(), trigger),
      false
    );

    result = replaceTrailingNewlines(result, '<div><br></div>');

    return result.replace(/\n/g, '<br>');
  };

  /**
   * Function: getCurrentValue
   *
   * Returns the current editing value.
   */
  const getCurrentValue = (state) =>
    extractTextWithWhitespace(getTextarea().childNodes);

  /**
   * Function: isCancelEditingKeyEvent
   *
   * Returns true if <escapeCancelsEditing> is true and shift, control and meta
   * are not pressed.
   */
  const isCancelEditingKeyEvent = (evt) =>
    isEscapeCancelsEditing() ||
    Event.isShiftDown(evt) ||
    Event.isControlDown(evt) ||
    Event.isMetaDown(evt);

  /**
   * Function: installListeners
   *
   * Installs listeners for focus, change and standard key event handling.
   */
  const installListeners = (elt) => {
    // Applies value if text is dragged
    // LATER: Gesture mouse events ignored for starting move
    Event.addListener(elt, 'dragstart', (evt) => {
      getGraph().stopEditing(false);
      Event.consume(evt);
    });

    // Applies value if focus is lost
    Event.addListener(elt, 'blur', (evt) => {
      if (isBlurEnabled()) {
        focusLost(evt);
      }
    });

    // Updates modified state and handles placeholder text
    Event.addListener(elt, 'keydown', (evt) => {
      if (!Event.isConsumed(evt)) {
        if (isStopEditingEvent(evt)) {
          getGraph().stopEditing(false);
          Event.consume(evt);
        } else if (evt.keyCode === 27 /* Escape */) {
          getGraph().stopEditing(isCancelEditingKeyEvent(evt));
          Event.consume(evt);
        }
      }
    });

    // Keypress only fires if printable key was pressed and handles removing the empty placeholder
    const keypressHandler = (evt) => {
      if (isSet(getEditingCell())) {
        // Clears the initial empty label on the first keystroke
        // and workaround for FF which fires keypress for delete and backspace
        if (
          isClearOnChange() &&
          elt.innerHTML === getEmptyLabelText() &&
          (!IS_FF ||
            (evt.keyCode !== 8 /* Backspace */ &&
              evt.keyCode !== 46)) /* Delete */
        ) {
          setClearOnChange(false);
          elt.innerHTML = '';
        }
      }
    };

    Event.addListener(elt, 'keypress', keypressHandler);
    Event.addListener(elt, 'paste', keypressHandler);

    // Handler for updating the empty label text value after a change
    const keyupHandler = (evt) => {
      if (isSet(getEditingCell())) {
        // Uses an optional text value for sempty labels which is cleared
        // when the first keystroke appears. This makes it easier to see
        // that a label is being edited even if the label is empty.
        // In Safari and FF, an empty text is represented by <BR> which isn't enough to force a valid size
        if (
          getTextarea().innerHTML.length == 0 ||
          getTextarea().innerHTML == '<br>'
        ) {
          getTextarea().innerHTML = getEmptyLabelText();
          setClearOnChange(getTextarea().innerHTML.length > 0);
        } else {
          setClearOnChange(false);
        }
      }
    };

    Event.addListener(elt, !mxClient.IS_IE11 ? 'input' : 'keyup', keyupHandler);
    Event.addListener(elt, 'cut', keyupHandler);
    Event.addListener(elt, 'paste', keyupHandler);

    // Adds automatic resizing of the textbox while typing using input, keyup and/or DOM change events
    const evtName = !mxClient.IS_IE11 ? 'input' : 'keydown';

    const resizeHandler = (evt) => {
      if (isSet(getEditingCell()) && isAutoSize() && !Event.isConsumed(evt)) {
        // Asynchronous is needed for keydown and shows better results for input events overall
        // (ie non-blocking and cases where the offsetWidth/-Height was wrong at this time)
        if (isSet(getResizeThread())) {
          window.clearTimeout(getResizeThread());
        }

        setResizeThread(
          window.setTimeout(() => {
            setResizeThread();
            resize();
          }, 0)
        );
      }
    };

    Event.addListener(elt, evtName, resizeHandler);
    Event.addListener(window, 'resize', resizeHandler);
    Event.addListener(elt, 'cut', resizeHandler);
    Event.addListener(elt, 'paste', resizeHandler);
  };

  /**
   * Function: isStopEditingEvent
   *
   * Returns true if the given keydown event should stop cell editing. This
   * returns true if F2 is pressed of if <mxGraph.enterStopsCellEditing> is true
   * and enter is pressed without control or shift.
   */
  const isStopEditingEvent = (evt) =>
    evt.keyCode === 113 /* F2 */ ||
    (getGraph().isEnterStopsCellEditing() &&
      evt.keyCode === 13 /* Enter */ &&
      !Event.isControlDown(evt) &&
      !Event.isShiftDown(evt));

  /**
   * Function: isEventSource
   *
   * Returns true if this editor is the source for the given native event.
   */
  const isEventSource = (evt) => Event.getSource(evt) === getTextarea();

  /**
   * Function: resize
   *
   * Returns <modified>.
   */
  const resize = () => {
    const graph = getGraph();
    const state = graph.getView().getState(getEditingCell());
    const textarea = getTextarea();
    const bounds = getBounds();

    if (isUnset(state)) {
      stopEditing(true);
    } else if (isSet(textarea)) {
      const isEdge = graph.getModel().isEdge(state.getCell());
      const scale = graph.getView().getScale();
      let m;

      if (!isAutoSize() || state.getStyle()[STYLE_OVERFLOW] === 'fill') {
        // Specifies the bounds of the editor box
        setBounds(getEditorBounds(state));
        textarea.style.width = Math.round(bounds.getWidth() / scale) + 'px';
        textarea.style.height = Math.round(bounds.getHeight() / scale) + 'px';
        textarea.style.left = Math.max(0, Math.round(bounds.getX() + 1)) + 'px';
        textarea.style.top = Math.max(0, Math.round(bounds.getY() + 1)) + 'px';

        // Installs native word wrapping and avoids word wrap for empty label placeholder
        if (
          graph.isWrapping(state.getCell()) &&
          (bounds.getWidth() >= 2 || bounds.getHeight() >= 2) &&
          textarea.innerHTML !== getEmptyLabelText()
        ) {
          textarea.style.wordWrap = WORD_WRAP;
          textarea.style.whiteSpace = 'normal';

          if (state.getStyle()[STYLE_OVERFLOW] !== 'fill') {
            textarea.style.width =
              Math.round(bounds.getWidth() / scale) +
              getWordWrapPadding() +
              'px';
          }
        } else {
          textarea.style.whiteSpace = 'nowrap';

          if (state.getStyle()[STYLE_OVERFLOW] !== 'fill') {
            textarea.style.width = '';
          }
        }
      } else {
        const lw = getValue(state.getStyle(), STYLE_LABEL_WIDTH, null);
        m =
          isSet(state.getText()) && isUnset(getAlign())
            ? state.getText().getMargin()
            : null;

        if (isUnset(m)) {
          m = getAlignmentAsPoint(
            getAlign() || getValue(state.getStyle(), STYLE_ALIGN, ALIGN_CENTER),
            getValue(state.getStyle(), STYLE_VERTICAL_ALIGN, ALIGN_MIDDLE)
          );
        }

        if (isEdge) {
          setBounds(
            Rectangle(
              state.getAbsoluteOffset().getX(),
              state.getAbsoluteOffset().getY(),
              0,
              0
            )
          );

          if (isUnset(lw)) {
            const tmp = (parseFloat(lw) + 2) * scale;
            bounds.setWidth(tmp);
            bounds.setX(bounds.getX() + m.getX() * tmp);
          }
        } else {
          let bds = Rectangle.fromRectangle(state);
          const hpos = getValue(
            state.getStyle(),
            STYLE_LABEL_POSITION,
            ALIGN_CENTER
          );
          const vpos = getValue(
            state.getStyle(),
            STYLE_VERTICAL_LABEL_POSITION,
            ALIGN_MIDDLE
          );

          bds =
            isSet(state.getShape()) &&
            hpos === ALIGN_CENTER &&
            vpos === ALIGN_MIDDLE
              ? state.getShape().getLabelBounds(bds)
              : bds;

          if (isSet(lw)) {
            bds.setWidth(parseFloat(lw) * scale);
          }

          if (
            !state.getView().getGraph().getCellRenderer().isLegacySpacing() ||
            state.getStyle()[STYLE_OVERFLOW] !== 'width'
          ) {
            const spacing =
              parseInt(state.getStyle()[STYLE_SPACING] || 2) * scale;
            const spacingTop =
              (parseInt(state.getStyle()[STYLE_SPACING_TOP] || 0) +
                getBaseSpacingTop()) *
                scale +
              spacing;
            const spacingRight =
              (parseInt(state.getStyle()[STYLE_SPACING_RIGHT] || 0) +
                getBaseSpacingRight()) *
                scale +
              spacing;
            const spacingBottom =
              (parseInt(state.getStyle()[STYLE_SPACING_BOTTOM] || 0) +
                getBaseSpacingBottom()) *
                scale +
              spacing;
            const spacingLeft =
              (parseInt(state.getStyle()[STYLE_SPACING_LEFT] || 0) +
                getBaseSpacingLeft()) *
                scale +
              spacing;

            const hpos = getValue(
              state.getStyle(),
              STYLE_LABEL_POSITION,
              ALIGN_CENTER
            );
            const vpos = getValue(
              state.getStyle(),
              STYLE_VERTICAL_LABEL_POSITION,
              ALIGN_MIDDLE
            );

            bds = Rectangle(
              bds.getX() + spacingLeft,
              bds.getY() + spacingTop,
              bds.getWidth() -
                (hpos === ALIGN_CENTER && isUnset(lw)
                  ? spacingLeft + spacingRight
                  : 0),
              bds.getHeight() -
                (vpos === ALIGN_MIDDLE ? spacingTop + spacingBottom : 0)
            );
          }

          setBounds(
            Rectangle(
              bds.getX() + state.getAbsoluteOffset().getX(),
              bds.getY() + state.getAbsoluteOffset().getY(),
              bds.getWidth(),
              bds.getHeight()
            )
          );
        }

        // Needed for word wrap inside text blocks with oversize lines to match the final result where
        // the width of the longest line is used as the reference for text alignment in the cell
        // TODO: Fix word wrapping preview for edge labels in helloworld.html
        if (
          graph.isWrapping(state.getCell()) &&
          (bounds.getWidth() >= 2 || bounds.getHeight() >= 2) &&
          textarea.innerHTML !== getEmptyLabelText()
        ) {
          textarea.style.wordWrap = WORD_WRAP;
          textarea.style.whiteSpace = 'normal';

          // Forces automatic reflow if text is removed from an oversize label and normal word wrap
          const tmp =
            Math.round(bounds.getWidth() / scale) + getWordWrapPadding();

          if (textarea.style.position !== 'relative') {
            textarea.style.width = tmp + 'px';

            if (textarea.scrollWidth > tmp) {
              textarea.style.width = textarea.scrollWidth + 'px';
            }
          } else {
            textarea.style.maxWidth = tmp + 'px';
          }
        } else {
          // KNOWN: Trailing cursor in IE9 quirks mode is not visible
          textarea.style.whiteSpace = 'nowrap';
          textarea.style.width = '';
        }

        textarea.style.left =
          Math.max(
            0,
            Math.round(bounds.getX() - m.getX() * (bounds.getWidth() - 2)) + 1
          ) + 'px';
        textarea.style.top =
          Math.max(
            0,
            Math.round(
              bounds.getY() -
                m.getY() * (bounds.getHeight() - 4) +
                (m.getY() === -1 ? 3 : 0)
            ) + 1
          ) + 'px';
      }

      setPrefixedStyle(textarea.style, 'transformOrigin', '0px 0px');
      setPrefixedStyle(
        textarea.style,
        'transform',
        'scale(' +
          scale +
          ',' +
          scale +
          ')' +
          (isUnset(m)
            ? ''
            : ' translate(' + m.getX() * 100 + '%,' + m.getY90 * 100 + '%)')
      );
    }
  };

  /**
   * Function: focusLost
   *
   * Called if the textarea has lost focus.
   */
  const focusLost = () => stopEditing(!getGraph().isInvokesStopCellEditing());

  /**
   * Function: getBackgroundColor
   *
   * Returns the background color for the in-place editor. This implementation
   * always returns null.
   */
  const getBackgroundColor = (state) => null;

  /**
   * Function: isLegacyEditor
   *
   * Returns true if max-width is not supported or if the SVG root element in
   * in the graph does not have CSS position absolute. In these cases the text
   * editor must use CSS position absolute to avoid an offset but it will have
   * a less accurate line wrapping width during the text editing preview. This
   * implementation returns true for IE8- and quirks mode or if the CSS position
   * of the SVG element is not absolute.
   */
  const isLegacyEditor = () => {
    let absoluteRoot = false;
    const root = getGraph().getView().getDrawPane().ownerSVGElement;

    if (isSet(root)) {
      const css = getCurrentStyle(root);

      if (isSet(css)) {
        absoluteRoot = css.position === 'absolute';
      }
    }

    return !absoluteRoot;
  };

  /**
   * Function: startEditing
   *
   * Starts the editor for the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> to start editing.
   * trigger - Optional mouse event that triggered the editor.
   */
  const startEditing = (cell, trigger) => {
    const graph = getGraph();
    const textarea = getTextarea();

    stopEditing(true);
    setAlign();

    // Creates new textarea instance
    if (isUnset(textarea)) {
      init();
    }

    if (isSet(graph.getTooltipHandler())) {
      graph.getTooltipHandler().hideTooltip();
    }

    const state = graph.getView().getState(cell);
    const style = state.getStyle();

    if (isSet(state)) {
      // Configures the style of the in-place editor
      const size = getValue(style, STYLE_FONTSIZE, DEFAULT_FONTSIZE);
      const family = getValue(style, STYLE_FONTFAMILY, DEFAULT_FONTFAMILY);
      const color = getValue(style, STYLE_FONTCOLOR, 'black');
      const align = getValue(style, STYLE_ALIGN, ALIGN_LEFT);
      const bold =
        (getValue(style, STYLE_FONTSTYLE, 0) & FONT_BOLD) === FONT_BOLD;
      const italic =
        (getValue(style, STYLE_FONTSTYLE, 0) & FONT_ITALIC) === FONT_ITALIC;
      const txtDecor = [];

      if (
        (getValue(style, STYLE_FONTSTYLE, 0) & FONT_UNDERLINE) ===
        FONT_UNDERLINE
      ) {
        txtDecor.push('underline');
      }

      if (
        (getValue(style, STYLE_FONTSTYLE, 0) & FONT_STRIKETHROUGH) ==
        FONT_STRIKETHROUGH
      ) {
        txtDecor.push('line-through');
      }

      textarea.style.lineHeight = ABSOLUTE_LINE_HEIGHT
        ? Math.round(size * LINE_HEIGHT) + 'px'
        : LINE_HEIGHT;
      textarea.style.backgroundColor = getBackgroundColor(state);
      textarea.style.textDecoration = txtDecor.join(' ');
      textarea.style.fontWeight = bold ? 'bold' : 'normal';
      textarea.style.fontStyle = italic ? 'italic' : '';
      textarea.style.fontSize = Math.round(size) + 'px';
      textarea.style.zIndex = getZIndex();
      textarea.style.fontFamily = family;
      textarea.style.textAlign = align;
      textarea.style.outline = 'none';
      textarea.style.color = color;

      let dir = setTextDirection(
        getValue(style, STYLE_TEXT_DIRECTION, DEFAULT_TEXT_DIRECTION)
      );

      if (dir === TEXT_DIRECTION_AUTO) {
        if (
          isSet(state) &&
          isSet(state.getText()) &&
          !isNode(state.getText().getValue())
        ) {
          dir = state.getText().getAutoDirection();
        }
      }

      if (dir === TEXT_DIRECTION_LTR || dir === TEXT_DIRECTION_RTL) {
        textarea.setAttribute('dir', dir);
      } else {
        textarea.removeAttribute('dir');
      }

      // Sets the initial editing value
      textarea.innerHTML = getInitialValue(state, trigger) || '';
      setInitialValue(textarea.innerHTML);

      // Uses an optional text value for empty labels which is cleared
      // when the first keystroke appears. This makes it easier to see
      // that a label is being edited even if the label is empty.
      if (textarea.innerHTML.length === 0 || textarea.innerHTML === '<br>') {
        textarea.innerHTML = getEmptyLabelText();
        setClearOnChange(true);
      } else {
        setClearOnChange(textarea.innerHTML === getEmptyLabelText());
      }

      graph.getContainer().appendChild(textarea);

      // Update this after firing all potential events that could update the cleanOnChange flag
      setEditingCell(cell);
      setTrigger(trigger);
      setTextNode();

      if (isSet(state.getText()) && isHideLabel(state)) {
        setTextNode(state.getText().getNode());
        getTextNode().style.visibility = 'hidden';
      }

      // Workaround for initial offsetHeight not ready for heading in markup
      if (
        isAutoSize() &&
        (graph.getModel().isEdge(state.getCell()) ||
          style[STYLE_OVERFLOW] !== 'fill')
      ) {
        window.setTimeout(() => resize(), 0);
      }

      resize();

      // Workaround for NS_ERROR_FAILURE in FF
      try {
        // Prefers blinking cursor over no selected text if empty
        textarea.focus();

        if (
          isSelectText() &&
          textarea.innerHTML.length > 0 &&
          (textarea.innerHTML !== getEmptyLabelText() || !isClearOnChange())
        ) {
          document.execCommand('selectAll', false, null);
        }
      } catch (e) {
        throw e;
        // ignore
      }
    }
  };

  /**
   * Function: clearSelection
   *
   * Clears the selection.
   */
  const clearSelection = () => {
    let selection;

    if (window.getSelection) {
      selection = window.getSelection();
    } else if (document.selection) {
      selection = document.selection;
    }

    if (isSet(selection)) {
      if (selection.empty) {
        selection.empty();
      } else if (selection.removeAllRanges) {
        selection.removeAllRanges();
      }
    }
  };

  /**
   * Function: stopEditing
   *
   * Stops the editor and applies the value if cancel is false.
   */
  const stopEditing = (cancel = false) => {
    const graph = getGraph();
    const textarea = getTextarea();

    if (isSet(getEditingCell())) {
      if (isSet(getTextNode())) {
        getTextNode().style.visibility = 'visible';
        setTextNode();
      }

      const state = !cancel ? graph.getView().getState(getEditingCell()) : null;

      const initial = _getInitialValue();
      setInitialValue();
      setEditingCell();
      setTrigger();
      setBounds();
      textarea.blur();
      clearSelection();

      if (isSet(textarea.parentNode)) {
        textarea.parentNode.removeChild(textarea);
      }

      if (isClearOnChange() && textarea.innerHTML === getEmptyLabelText()) {
        textarea.innerHTML = '';
        setClearOnChange(false);
      }

      if (
        isSet(state) &&
        (textarea.innerHTML !== initial || isSet(getAlign()))
      ) {
        prepareTextarea();
        const value = getCurrentValue(state);

        graph.getModel().beginUpdate();

        try {
          if (isSet(value)) {
            applyValue(state, value);
          }

          if (getAlign()) {
            graph.setCellStyles(STYLE_ALIGN, getAlign(), [state.getCell()]);
          }
        } finally {
          graph.getModel().endUpdate();
        }
      }

      // Forces new instance on next edit for undo history reset
      Event.release(textarea);
      setTextarea();
      setAlign();
    }
  };

  /**
   * Function: prepareTextarea
   *
   * Prepares the textarea for getting its value in <stopEditing>.
   * This implementation removes the extra trailing linefeed in Firefox.
   */
  const prepareTextarea = () => {
    const textarea = getTextarea();

    if (isSet(textarea.lastChild) && textarea.lastChild.nodeName === 'BR') {
      textarea.removeChild(textarea.lastChild);
    }
  };

  /**
   * Function: isHideLabel
   *
   * Returns true if the label should be hidden while the cell is being
   * edited.
   */
  const isHideLabel = (state) => true;

  /**
   * Function: getMinimumSize
   *
   * Returns the minimum width and height for editing the given state.
   */
  const getMinimumSize = (state) => {
    const scale = getGraph().getView().getScale();

    return Rectangle(
      0,
      0,
      isUnset(state.getText()) ? 30 : state.getText().getSize() * scale + 20,
      getTextarea().style.textAlign === 'left' ? 120 : 40
    );
  };

  /**
   * Function: getEditorBounds
   *
   * Returns the <mxRectangle> that defines the bounds of the editor.
   */
  const getEditorBounds = (state) => {
    const graph = getGraph();
    const style = state.getStyle();
    const text = state.getText();
    const shape = state.getShape();
    const isEdge = graph.getModel().isEdge(state.getCell());
    const scale = graph.getView().getScale();
    const minSize = getMinimumSize(state);
    const minWidth = minSize.getWidth();
    const minHeight = minSize.getHeight();
    let result = null;

    if (
      !isEdge &&
      state.getView().getGraph().getCellRenderer().isLegacySpacing() &&
      style[STYLE_OVERFLOW] === 'fill'
    ) {
      result = shape.getLabelBounds(Rectangle.fromRectangle(state));
    } else {
      const spacing = parseInt(style[STYLE_SPACING] || 0) * scale;
      const spacingTop =
        (parseInt(style[STYLE_SPACING_TOP] || 0) + getBaseSpacingTop()) *
          scale +
        spacing;
      const spacingRight =
        (parseInt(style[STYLE_SPACING_RIGHT] || 0) + getBaseSpacingRight()) *
          scale +
        spacing;
      const spacingBottom =
        (parseInt(style[STYLE_SPACING_BOTTOM] || 0) + getBaseSpacingBottom()) *
          scale +
        spacing;
      const spacingLeft =
        (parseInt(style[STYLE_SPACING_LEFT] || 0) + getBaseSpacingLeft()) *
          scale +
        spacing;

      result = Rectangle(
        state.getX(),
        state.getY(),
        Math.max(minWidth, state.getWidth() - spacingLeft - spacingRight),
        Math.max(minHeight, state.getHeight() - spacingTop - spacingBottom)
      );
      const hpos = mxUtils.getValue(style, STYLE_LABEL_POSITION, ALIGN_CENTER);
      const vpos = mxUtils.getValue(
        style,
        STYLE_VERTICAL_LABEL_POSITION,
        ALIGN_MIDDLE
      );

      result =
        isSet(shape) && hpos === ALIGN_CENTER && vpos === ALIGN_MIDDLE
          ? shape.getLabelBounds(result)
          : result;

      if (isEdge) {
        result.setX(state.getAbsoluteOffset().getX());
        result.setY(state.getAbsoluteOffset().getY());

        if (isSet(text) && isSet(text.getBoundingBox())) {
          // Workaround for label containing just spaces in which case
          // the bounding box location contains negative numbers
          if (text.getBoundingBox().getX() > 0) {
            result.setX(text.getBoundingBox().getX());
          }

          if (text.getBoundingBox().getY() > 0) {
            result.setY(text.getBoundingBox().getY());
          }
        }
      } else if (isSet(text) && isSet(text.getBoundingBox())) {
        result.setX(Math.min(result.getX(), text.getBoundingBox().getX()));
        result.setY(Math.min(result.getY(), text.getBoundingBox().getY()));
      }

      result.setX(result.getX() + spacingLeft);
      result.setY(result.getY() + spacingTop);

      if (isSet(text) && isSet(text.getBoundingBox())) {
        if (!isEdge) {
          result.setWidth(
            Math.max(result.getWidth(), text.getBoundingBox().getWidth())
          );
          result.setHeight(
            Math.max(result.getHeight(), text.getBoundingBox().getHeight())
          );
        } else {
          result.setWidth(Math.max(minWidth, text.getBoundingBox().getWidth()));
          result.setHeight(
            Math.max(minHeight, text.getBoundingBox().getHeight())
          );
        }
      }

      // Applies the horizontal and vertical label positions
      if (graph.getModel().isVertex(state.getCell())) {
        const horizontal = getValue(style, STYLE_LABEL_POSITION, ALIGN_CENTER);

        if (horizontal === ALIGN_LEFT) {
          result.setX(result.getX() - state.getWidth());
        } else if (horizontal === ALIGN_RIGHT) {
          result.setX(result.getX() + state.getWidth());
        }

        const vertical = getValue(
          style,
          STYLE_VERTICAL_LABEL_POSITION,
          ALIGN_MIDDLE
        );

        if (vertical === ALIGN_TOP) {
          result.setY(result.getY() - state.getHeight());
        } else if (vertical === ALIGN_BOTTOM) {
          result.setY(result.getY() + state.getHeight());
        }
      }
    }

    return Rectangle(
      Math.round(result.getX()),
      Math.round(result.getY()),
      Math.round(result.getWidth()),
      Math.round(result.getHeight())
    );
  };

  /**
   * Function: destroy
   *
   * Destroys the editor and removes all associated resources.
   */
  const destroy = () => {
    const textarea = getTextarea();

    if (isSet(textarea)) {
      Event.release(textarea);

      if (isSet(textarea.parentNode)) {
        textarea.parentNode.removeChild(textarea);
      }

      setTextarea();
    }

    if (isSet(getChangeHandler())) {
      getGraph().getModel().removeListener(getChangeHandler());
      setChangeHandler();
    }

    if (getZoomHandler()) {
      getGraph().getView().removeListener(getZoomHandler());
      setZoomHandler();
    }
  };

  const {
    getBaseSpacingTop,
    getBaseSpcingRight,
    getBaseSpacingBottom,
    getBaseSpacingLeft
  } = Text();

  const me = {
    init,
    applyValue,
    setAlign,
    getInitialValue,
    getCurrentValue,
    isCancelEditingKeyEvent,
    installListeners,
    isStopEditingEvent,
    isEventSource,
    resize,
    focusLost,
    getBackgroundColor,
    isLegacyEditor,
    startEditing,

    /**
     * Function: isSelectText
     *
     * Returns <selectText>.
     */
    isSelectText,
    clearSelection,
    stopEditing,
    prepareTextarea,
    isHideLabel,
    getMinimumSize,
    getEditorBounds,

    /**
     * Function: getEmptyLabelText
     *
     * Returns the initial label value to be used of the label of the given
     * cell is empty. This label is displayed and cleared on the first keystroke.
     * This implementation returns <emptyLabelText>.
     *
     * Parameters:
     *
     * cell - <mxCell> for which a text for an empty editing box should be
     * returned.
     */
    getEmptyLabelText,

    /**
     * Function: getEditingCell
     *
     * Returns the cell that is currently being edited or null if no cell is
     * being edited.
     */
    getEditingCell,
    destroy
  };

  graph.getView().addListener(Event.SCALE, getZoomHandler());
  graph.getView().addListener(Event.SCALE_AND_TRANSLATE, getZoomHandler());
  graph.getModel().addListener(Event.CHANGE, getChangeHandler());

  return me;
};

export default makeComponent(CellEditor);
