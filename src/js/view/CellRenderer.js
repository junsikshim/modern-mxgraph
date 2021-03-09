/**
 * Copyright (c) 2006-2017, JGraph Ltd
 * Copyright (c) 2006-2017, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet, isUnset } from '../Helpers';
import Connector from '../shape/Connector';
import Ellipse from '../shape/Ellipse';
import RectangleShape from '../shape/RectangleShape';
import Rhombus from '../shape/Rhombus';
import StencilRegistry from '../shape/StencilRegistry';
import {
  SHAPE_ACTOR,
  SHAPE_ARROW,
  SHAPE_ARROW_CONNECTOR,
  SHAPE_CLOUD,
  SHAPE_CONNECTOR,
  SHAPE_CYLINDER,
  SHAPE_DOUBLE_ELLIPSE,
  SHAPE_ELLIPSE,
  SHAPE_HEXAGON,
  SHAPE_IMAGE,
  SHAPE_LABEL,
  SHAPE_LINE,
  SHAPE_RECTANGLE,
  SHAPE_RHOMBUS,
  SHAPE_SWIMLANE,
  SHAPE_TRIANGLE
} from '../util/Constants';
import Cylinder from './Cylinder';
import Text from '../shape/Text';
import ImageShape from '../shape/ImageShape';

/**
 * Variable: defaultShapes
 *
 * Static array that contains the globally registered shapes which are
 * known to all instances of this class. For adding new shapes you should
 * use the static <CellRenderer.registerShape> function.
 */
const defaultShapes = {};

/**
 * Class: CellRenderer
 *
 * Renders cells into a document object model. The <defaultShapes> is a global
 * map of shapename, constructor pairs that is used in all instances. You can
 * get a list of all available shape names using the following code.
 *
 * In general the cell renderer is in charge of creating, redrawing and
 * destroying the shape and label associated with a cell state, as well as
 * some other graphical objects, namely controls and overlays. The shape
 * hieararchy in the display (ie. the hierarchy in which the DOM nodes
 * appear in the document) does not reflect the cell hierarchy. The shapes
 * are a (flat) sequence of shapes and labels inside the draw pane of the
 * graph view, with some exceptions, namely the HTML labels being placed
 * directly inside the graph container for certain browsers.
 *
 * (code)
 * mxLog.show();
 * for (var i in CellRenderer.defaultShapes)
 * {
 *   mxLog.debug(i);
 * }
 * (end)
 *
 * Constructor: CellRenderer
 *
 * Constructs a new cell renderer with the following built-in shapes:
 * arrow, rectangle, ellipse, rhombus, image, line, label, cylinder,
 * swimlane, connector, actor and cloud.
 */
const CellRenderer = () => {
  /**
   * Variable: defaultEdgeShape
   *
   * Defines the default shape for edges. Default is <mxConnector>.
   */
  const [getDefaultEdgeShape, setDefaultEdgeShape] = addProp(Connector);

  /**
   * Variable: defaultVertexShape
   *
   * Defines the default shape for vertices. Default is <mxRectangleShape>.
   */
  const [getDefaultVertexShape, setDefaultVertexShape] = addProp(
    RectangleShape
  );

  /**
   * Variable: defaultTextShape
   *
   * Defines the default shape for labels. Default is <mxText>.
   */
  const [getDefaultTextShape, setDefaultTextShape] = addProp(Text);

  /**
   * Variable: legacyControlPosition
   *
   * Specifies if the folding icon should ignore the horizontal
   * orientation of a swimlane. Default is true.
   */
  const [isLegacyControlPosition, setLegacyControlPosition] = addProp(true);

  /**
   * Variable: legacySpacing
   *
   * Specifies if spacing and label position should be ignored if overflow is
   * fill or width. Default is true for backwards compatiblity.
   */
  const [isLegacySpacing, setLegacySpacing] = addProp(true);

  /**
   * Variable: antiAlias
   *
   * Anti-aliasing option for new shapes. Default is true.
   */
  const [isAntiAlias, setAntiAlias] = addProp(true);

  /**
   * Variable: minSvgStrokeWidth
   *
   * Minimum stroke width for SVG output.
   */
  const [getMinSvgStrokeWidth, setMinSvgStrokeWidth] = addProp(1);

  /**
   * Variable: forceControlClickHandler
   *
   * Specifies if the enabled state of the graph should be ignored in the control
   * click handler (to allow folding in disabled graphs). Default is false.
   */
  const [isForceControlClickHandler, setForceControlClickHandler] = addProp(
    false
  );

  /**
   * Function: initializeShape
   *
   * Initializes the shape in the given state by calling its init method with
   * the correct container after configuring it using <configureShape>.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shape should be initialized.
   */
  const initializeShape = (state) => {
    configureShape(state);
    state.getShape().init(state.getView().getDrawPane());
  };

  /**
   * Function: createShape
   *
   * Creates and returns the shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shape should be created.
   */
  const createShape = (state) => {
    let shape;

    if (isSet(state.getStyle())) {
      // Checks if there is a stencil for the name and creates
      // a shape instance for the stencil if one exists
      const stencil = StencilRegistry.getStencil(state.getStyle()[STYLE_SHAPE]);

      if (isSet(stencil)) {
        shape = Shape(stencil);
      } else {
        const ctor = getShapeConstructor(state);
        shape = ctor();
      }
    }

    return shape;
  };

  /**
   * Function: createIndicatorShape
   *
   * Creates the indicator shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the indicator shape should be created.
   */
  const createIndicatorShape = (state) => {
    state
      .getShape()
      .getIndicatorShape(
        getShape(state.getView().getGraph().getIndicatorShape(state))
      );
  };

  /**
   * Function: getShape
   *
   * Returns the shape for the given name from <defaultShapes>.
   */
  const getShape = (name) => (isSet(name) ? defaultShapes[name] : undefined);

  /**
   * Function: getShapeConstructor
   *
   * Returns the constructor to be used for creating the shape.
   */
  const getShapeConstructor = (state) => {
    let ctor = getShape(state.getStyle()[STYLE_SHAPE]);

    if (isUnset(ctor)) {
      ctor = state.getView().getGraph().getModel().isEdge(state.getCell())
        ? getDefaultEdgeShape()
        : getDefaultVertexShape();
    }

    return ctor;
  };

  /**
   * Function: configureShape
   *
   * Configures the shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shape should be configured.
   */
  const configureShape = (state) => {
    const shape = state.getShape();
    const graph = state.getView().getGraph();

    shape.apply(state);
    shape.setImage(graph.getImage(state));
    shape.setIndicatorColor(graph.getIndicatorColor(state));
    shape.setIndicatorStrokeColor(
      state.getStyle()[STYLE_INDICATOR_STROKECOLOR]
    );
    shape.setIndicatorGradientColor(graph.getIndicatorGradientColor(state));
    shape.setIndicatorDirection(state.getStyle()[STYLE_INDICATOR_DIRECTION]);
    shape.setIndicatorImage(graph.getIndicatorImage(state));

    postConfigureShape(state);
  };

  /**
   * Function: postConfigureShape
   *
   * Replaces any reserved words used for attributes, eg. inherit,
   * indicated or swimlane for colors in the shape for the given state.
   * This implementation resolves these keywords on the fill, stroke
   * and gradient color keys.
   */
  const postConfigureShape = (state) => {
    if (isSet(state.getShape())) {
      resolveColor(state, 'indicatorGradientColor', STYLE_GRADIENTCOLOR);
      resolveColor(state, 'indicatorColor', STYLE_FILLCOLOR);
      resolveColor(state, 'gradient', STYLE_GRADIENTCOLOR);
      resolveColor(state, 'stroke', STYLE_STROKECOLOR);
      resolveColor(state, 'fill', STYLE_FILLCOLOR);
    }
  };

  /**
   * Function: checkPlaceholderStyles
   *
   * Checks if the style of the given <mxCellState> contains 'inherit',
   * 'indicated' or 'swimlane' for colors that support those keywords.
   */
  const checkPlaceholderStyles = (state) => {
    // LATER: Check if the color has actually changed
    if (isSet(state.getStyle())) {
      const values = ['inherit', 'swimlane', 'indicated'];
      const styles = [
        STYLE_FILLCOLOR,
        STYLE_STROKECOLOR,
        STYLE_GRADIENTCOLOR,
        STYLE_FONTCOLOR
      ];

      for (let i = 0; i < styles.length; i++) {
        if (values.indexOf(state.getStyle()[styles[i]]) >= 0) {
          return true;
        }
      }
    }

    return false;
  };

  /**
   * Function: resolveColor
   *
   * Resolves special keywords 'inherit', 'indicated' and 'swimlane' and sets
   * the respective color on the shape.
   */
  const resolveColor = (state, field, key) => {
    const shape = key === STYLE_FONTCOLOR ? state.getText() : state.getShape();

    if (isSet(shape)) {
      const graph = state.getView().getGraph();
      const value = shape[field];
      let referenced;

      if (value === 'inherit') {
        referenced = graph.getModel().getParent(state.getCell());
      } else if (value === 'swimlane') {
        shape[field] =
          key === STYLE_STROKECOLOR || key === STYLE_FONTCOLOR
            ? '#000000'
            : '#ffffff';

        if (isSet(graph.getModel().getTerminal(state.getCell(), false))) {
          referenced = graph.getModel().getTerminal(state.getCell(), false);
        } else {
          referenced = state.getCell();
        }

        referenced = graph.getSwimlane(referenced);
        key = graph.getSwimlaneIndicatorColorAttribute();
      } else if (value === 'indicated' && isSet(state.getShape())) {
        shape[field] = state.getShape().getIndicatorColor();
      } else if (
        key !== STYLE_FILLCOLOR &&
        value === STYLE_FILLCOLOR &&
        isSet(state.getShape())
      ) {
        shape[field] = state.getStyle()[STYLE_FILLCOLOR];
      } else if (
        key !== STYLE_STROKECOLOR &&
        value === STYLE_STROKECOLOR &&
        isSet(state.getShape())
      ) {
        shape[field] = state.getStyle()[STYLE_STROKECOLOR];
      }

      if (isSet(referenced)) {
        const rstate = graph.getView().getState(referenced);
        shape[field] = undefined;

        if (isSet(rstate)) {
          const rshape =
            key === STYLE_FONTCOLOR ? rstate.getText() : rstate.getShape();

          if (isSet(rshape) && field !== 'indicatorColor') {
            shape[field] = rshape[field];
          } else {
            shape[field] = rstate.getStyle()[key];
          }
        }
      }
    }
  };

  /**
   * Function: getLabelValue
   *
   * Returns the value to be used for the label.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the label should be created.
   */
  const getLabelValue = (state) =>
    state.getView().getGraph().getLabel(state.getCell());

  /**
   * Function: createLabel
   *
   * Creates the label for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the label should be created.
   */
  const createLabel = (state, value) => {
    const graph = state.getView().getGraph();
    const style = state.getStyle();

    if (style[STYLE_FONTSIZE] > 0 || isUnset(style[STYLE_FONTSIZE])) {
      // Avoids using DOM node for empty labels
      var isForceHtml =
        graph.isHtmlLabel(state.getCell()) || (isSet(value) && isNode(value));

      state.setText(
        defaultTextShape(
          value,
          Rectangle(),
          style[STYLE_ALIGN] || ALIGN_CENTER,
          graph.getVerticalAlign(state),
          style[STYLE_FONTCOLOR],
          style[STYLE_FONTFAMILY],
          style[STYLE_FONTSIZE],
          style[STYLE_FONTSTYLE],
          style[STYLE_SPACING],
          style[STYLE_SPACING_TOP],
          style[STYLE_SPACING_RIGHT],
          style[STYLE_SPACING_BOTTOM],
          style[STYLE_SPACING_LEFT],
          style[STYLE_HORIZONTAL],
          style[STYLE_LABEL_BACKGROUNDCOLOR],
          style[STYLE_LABEL_BORDERCOLOR],
          graph.isWrapping(state.getCell()) &&
            graph.isHtmlLabel(state.getCell()),
          graph.isLabelClipped(state.getCell()),
          style[STYLE_OVERFLOW],
          style[STYLE_LABEL_PADDING],
          getValue(style, STYLE_TEXT_DIRECTION, DEFAULT_TEXT_DIRECTION)
        )
      );
      state.getText().setOpacity(getValue(style, STYLE_TEXT_OPACITY, 100));
      state.getText().setStyle(style);
      state.getText().setState(state);
      initializeLabel(state, state.getText());

      // Workaround for touch devices routing all events for a mouse gesture
      // (down, move, up) via the initial DOM node.
      const getState = (evt) => {
        let result = state;

        if (IS_TOUCH) {
          const x = Event.getClientX(evt);
          const y = Event.getClientY(evt);

          // Dispatches the drop event to the graph which
          // consumes and executes the source function
          const pt = convertPoint(graph.getContainer(), x, y);
          result = graph
            .getView()
            .getState(graph.getCellAt(pt.getX(), pt.getY()));
        }

        return result;
      };

      // TODO: Add handling for special touch device gestures
      Event.addGestureListeners(
        state.getText().getNode(),
        (evt) => {
          if (isLabelEvent(state, evt)) {
            graph.fireMouseEvent(Event.MOUSE_DOWN, MouseEvent(evt, state));
          }
        },
        (evt) => {
          if (this.isLabelEvent(state, evt)) {
            graph.fireMouseEvent(
              Event.MOUSE_MOVE,
              MouseEvent(evt, getState(evt))
            );
          }
        },
        (evt) => {
          if (this.isLabelEvent(state, evt)) {
            graph.fireMouseEvent(
              Event.MOUSE_UP,
              MouseEvent(evt, getState(evt))
            );
          }
        }
      );

      // Uses double click timeout in mxGraph for quirks mode
      if (graph.isNativeDblClickEnabled()) {
        Event.addListener(state.getText().getNode(), 'dblclick', (evt) => {
          if (isLabelEvent(state, evt)) {
            graph.dblClick(evt, state.getCell());
            Event.consume(evt);
          }
        });
      }
    }
  };

  /**
   * Function: initializeLabel
   *
   * Initiailzes the label with a suitable container.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be initialized.
   */
  const initializeLabel = (state, shape) => {
    if (IS_SVG && NO_FO) {
      shape.init(state.getView().getGraph().getContainer());
    } else {
      shape.init(state.getView().getDrawPane());
    }
  };

  /**
   * Function: createCellOverlays
   *
   * Creates the actual shape for showing the overlay for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the overlay should be created.
   */
  const createCellOverlays = (state) => {
    const graph = state.getView().getGraph();
    const overlays = graph.getCellOverlays(state.getCell());
    let dict;

    if (isSet(overlays)) {
      dict = Dictionary();

      for (let i = 0; i < overlays.length; i++) {
        const shape = isSet(state.getOverlays())
          ? state.getOverlays().remove(overlays[i])
          : undefined;

        if (isUnset(shape)) {
          const tmp = ImageShape(Rectangle(), overlays[i].getImage().getSrc());
          tmp.setPreserveImageAspect(false);
          tmp.setOverlay(overlays[i]);
          initializeOverlay(state, tmp);
          installCellOverlayListeners(state, overlays[i], tmp);

          if (isSet(overlays[i].getCursor())) {
            tmp.getNode().getStyle().setCursor(overlays[i].getCursor());
          }

          dict.put(overlays[i], tmp);
        } else {
          dict.put(overlays[i], shape);
        }
      }
    }

    // Removes unused
    if (isSet(state.getOverlays())) {
      state.getOverlays().visit((id, shape) => shape.destroy());
    }

    state.setOverlays(dict);
  };

  /**
   * Function: initializeOverlay
   *
   * Initializes the given overlay.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the overlay should be created.
   * overlay - <mxImageShape> that represents the overlay.
   */
  const initializeOverlay = (state, overlay) =>
    overlay.init(state.getView().getOverlayPane());

  /**
   * Function: installOverlayListeners
   *
   * Installs the listeners for the given <mxCellState>, <mxCellOverlay> and
   * <mxShape> that represents the overlay.
   */
  const installCellOverlayListeners = (state, overlay, shape) => {
    const graph = state.getView().getGraph();

    Event.addListener(shape.getNode(), 'click', (evt) => {
      if (graph.isEditing()) {
        graph.stopEditing(!graph.isInvokesStopCellEditing());
      }

      overlay.fireEvent(
        EventObject(Event.CLICK, 'event', evt, 'cell', state.getCell())
      );
    });

    Event.addGestureListeners(
      shape.getNode(),
      (evt) => Event.consume(evt),
      (evt) => graph.fireMouseEvent(Event.MOUSE_MOVE, MouseEvent(evt, state))
    );

    if (IS_TOUCH) {
      Event.addListener(shape.getNode(), 'touchend', (evt) =>
        overlay.fireEvent(
          EventObject(Event.CLICK, 'event', evt, 'cell', state.getCell())
        )
      );
    }
  };

  /**
   * Function: createControl
   *
   * Creates the control for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the control should be created.
   */
  const createControl = (state) => {
    const graph = state.getView().getGraph();
    const image = graph.getFoldingImage(state);

    if (graph.isFoldingEnabled() && isSet(image)) {
      if (isUnset(state.getControl())) {
        const b = Rectangle(0, 0, image.getWidth(), image.getHeight());
        const control = state.setControl(ImageShape(b, image.getSrc()));
        control.setPreserveImageAspect(false);

        initControl(state, control, true, createControlClickHandler(state));
      }
    } else if (isSet(state.getControl())) {
      state.getControl().destroy();
      state.setControl();
    }
  };

  /**
   * Function: createControlClickHandler
   *
   * Hook for creating the click handler for the folding icon.
   *
   * Parameters:
   *
   * state - <mxCellState> whose control click handler should be returned.
   */
  const createControlClickHandler = (state) => {
    const graph = state.getView().getGraph();

    return (evt) => {
      if (isForceControlClickHandler() || graph.isEnabled()) {
        const collapse = !graph.isCellCollapsed(state.getCell());
        graph.foldCells(collapse, false, [state.getCell()], undefined, evt);
        Event.consume(evt);
      }
    };
  };

  /**
   * Function: initControl
   *
   * Initializes the given control and returns the corresponding DOM node.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the control should be initialized.
   * control - <mxShape> to be initialized.
   * handleEvents - Boolean indicating if mousedown and mousemove should fire events via the graph.
   * clickHandler - Optional function to implement clicks on the control.
   */
  const initControl = (state, control, handleEvents, clickHandler) => {
    const graph = state.getView().getGraph();

    // In the special case where the label is in HTML and the display is SVG the image
    // should go into the graph container directly in order to be clickable. Otherwise
    // it is obscured by the HTML label that overlaps the cell.
    const isForceHtml = graph.isHtmlLabel(state.getCell()) && NO_FO;

    if (isForceHtml) {
      control.init(graph.getContainer());
      control.getNode().style.zIndex = 1;
    } else {
      control.init(state.getView().getOverlayPane());
    }

    const node = control.getInnerNode() || control.getNode();

    // Workaround for missing click event on iOS is to check tolerance below
    if (isSet(clickHandler) && !IS_IOS) {
      if (graph.isEnabled()) {
        node.style.cursor = 'pointer';
      }

      Event.addListener(node, 'click', clickHandler);
    }

    if (handleEvents) {
      let first;

      Event.addGestureListeners(
        node,
        (evt) => {
          first = Point(Event.getClientX(evt), Event.getClientY(evt));
          graph.fireMouseEvent(Event.MOUSE_DOWN, MouseEvent(evt, state));
          Event.consume(evt);
        },
        (evt) => {
          graph.fireMouseEvent(Event.MOUSE_MOVE, MouseEvent(evt, state));
        },
        (evt) => {
          graph.fireMouseEvent(Event.MOUSE_UP, MouseEvent(evt, state));
          Event.consume(evt);
        }
      );

      // Uses capture phase for event interception to stop bubble phase
      if (isSet(clickHandler) && IS_IOS) {
        node.addEventListener(
          'touchend',
          (evt) => {
            if (isSet(first)) {
              const tol = graph.getTolerance();

              if (
                Math.abs(first.getX() - Event.getClientX(evt)) < tol &&
                Math.abs(first.getY() - Event.getClientY(evt)) < tol
              ) {
                clickHandler.call(clickHandler, evt);
                Event.consume(evt);
              }
            }
          },
          true
        );
      }
    }

    return node;
  };

  /**
   * Function: isShapeEvent
   *
   * Returns true if the event is for the shape of the given state. This
   * implementation always returns true.
   *
   * Parameters:
   *
   * state - <mxCellState> whose shape fired the event.
   * evt - Mouse event which was fired.
   */
  const isShapeEvent = (state, evt) => true;

  /**
   * Function: isLabelEvent
   *
   * Returns true if the event is for the label of the given state. This
   * implementation always returns true.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label fired the event.
   * evt - Mouse event which was fired.
   */
  const isLabelEvent = (state, evt) => true;

  /**
   * Function: installListeners
   *
   * Installs the event listeners for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the event listeners should be isntalled.
   */
  const installListeners = (state) => {
    const graph = state.getView().getGraph();

    // Workaround for touch devices routing all events for a mouse
    // gesture (down, move, up) via the initial DOM node. Same for
    // HTML images in all IE versions (VML images are working).
    const getState = (evt) => {
      let result = state;

      if (Event.getSource(evt).nodeName === 'IMG' || IS_TOUCH) {
        const x = Event.getClientX(evt);
        const y = Event.getClientY(evt);

        // Dispatches the drop event to the graph which
        // consumes and executes the source function
        const pt = convertPoint(graph.getContainer(), x, y);
        result = graph
          .getView()
          .getState(graph.getCellAt(pt.getX(), pt.getY()));
      }

      return result;
    };

    Event.addGestureListeners(
      state.getShape().getNode(),
      (evt) => {
        if (isShapeEvent(state, evt)) {
          graph.fireMouseEvent(Event.MOUSE_DOWN, MouseEvent(evt, state));
        }
      },
      (evt) => {
        if (isShapeEvent(state, evt)) {
          fireMouseEvent(Event.MOUSE_MOVE, MouseEvent(evt, getState(evt)));
        }
      },
      (evt) => {
        if (isShapeEvent(state, evt)) {
          fireMouseEvent(Event.MOUSE_UP, MouseEvent(evt, getState(evt)));
        }
      }
    );

    // Uses double click timeout in mxGraph for quirks mode
    if (graph.isNativeDblClickEnabled()) {
      Event.addListener(state.getShape().getNode(), 'dblclick', (evt) => {
        if (isShapeEvent(state, evt)) {
          graph.dblClick(evt, state.getCell());
          Event.consume(evt);
        }
      });
    }
  };

  /**
   * Function: redrawLabel
   *
   * Redraws the label for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be redrawn.
   */
  const redrawLabel = (state, forced) => {
    const graph = state.getView().getGraph();
    const value = getLabelValue(state);
    const wrapping = graph.isWrapping(state.getCell());
    const clipping = graph.isLabelClipped(state.getCell());
    const overflow = state.getStyle()[STYLE_OVERFLOW] || 'visible';

    if (
      isSet(state.getText()) &&
      (state.getText().isWrap() !== wrapping ||
        state.getText().isClipped() !== clipping ||
        state.getText().getOverflow() !== overflow)
    ) {
      state.getText().destroy();
      state.setText();
    }

    if (
      isUnset(state.getText()) &&
      isSet(value) &&
      (isNode(value) || value.length > 0)
    ) {
      createLabel(state, value);
    } else if (
      isSet(state.getText()) &&
      (isUnset(value) || value.length === 0)
    ) {
      state.getText().destroy();
      state.setText();
    }

    const text = getText();

    if (isSet(text)) {
      // Forced is true if the style has changed, so to get the updated
      // result in getLabelBounds we apply the new style to the shape
      if (forced) {
        // Checks if a full repaint is needed
        if (isSet(text.getLastValue()) && isTextShapeInvalid(state, stext)) {
          // Forces a full repaint
          text.setLastValue();
        }

        text.resetStyles();
        text.apply(state);

        // Special case where value is obtained via hook in graph
        text.valign = graph.getVerticalAlign(state);
      }

      const bounds = getLabelBounds(state);
      const nextScale = getTextScale(state);
      resolveColor(state, 'color', STYLE_FONTCOLOR);

      if (
        forced ||
        text.getValue() !== value ||
        text.isWrapping() !== wrapping ||
        text.getOverflow() !== overflow ||
        text.isClipping() !== clipping ||
        text.getScale() !== nextScale ||
        isUnset(text.getBounds()) ||
        !text.getBounds.equals(bounds)
      ) {
        text.setValue(value);
        text.setBounds(bounds);
        text.setScale(nextScale);
        text.setWrap(wrapping);
        text.setClipped(clipping);
        text.setOverflow(overflow);

        // Preserves visible state
        const vis = text.getNode().style.visibility;
        redrawLabelShape(text);
        text.getNode().style.visibility = vis;
      }
    }
  };

  /**
   * Function: isTextShapeInvalid
   *
   * Returns true if the style for the text shape has changed.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be checked.
   * shape - <mxText> shape to be checked.
   */
  const isTextShapeInvalid = (state, shape) => {
    const check = (property, stylename, defaultValue) => {
      let result = false;

      // Workaround for spacing added to directional spacing
      if (
        stylename === 'spacingTop' ||
        stylename === 'spacingRight' ||
        stylename === 'spacingBottom' ||
        stylename === 'spacingLeft'
      ) {
        result =
          parseFloat(shape[property]) - parseFloat(shape.getSpacing()) !=
          (state.getStyle()[stylename] || defaultValue);
      } else {
        result =
          shape[property] !== (state.getStyle()[stylename] || defaultValue);
      }

      return result;
    };

    return (
      check('fontStyle', STYLE_FONTSTYLE, DEFAULT_FONTSTYLE) ||
      check('family', STYLE_FONTFAMILY, DEFAULT_FONTFAMILY) ||
      check('size', STYLE_FONTSIZE, DEFAULT_FONTSIZE) ||
      check('color', STYLE_FONTCOLOR, 'black') ||
      check('align', STYLE_ALIGN, '') ||
      check('valign', STYLE_VERTICAL_ALIGN, '') ||
      check('spacing', STYLE_SPACING, 2) ||
      check('spacingTop', STYLE_SPACING_TOP, 0) ||
      check('spacingRight', STYLE_SPACING_RIGHT, 0) ||
      check('spacingBottom', STYLE_SPACING_BOTTOM, 0) ||
      check('spacingLeft', STYLE_SPACING_LEFT, 0) ||
      check('horizontal', STYLE_HORIZONTAL, true) ||
      check('background', STYLE_LABEL_BACKGROUNDCOLOR) ||
      check('border', STYLE_LABEL_BORDERCOLOR) ||
      check('opacity', STYLE_TEXT_OPACITY, 100) ||
      check('textDirection', STYLE_TEXT_DIRECTION, DEFAULT_TEXT_DIRECTION)
    );
  };

  /**
   * Function: redrawLabelShape
   *
   * Called to invoked redraw on the given text shape.
   *
   * Parameters:
   *
   * shape - <mxText> shape to be redrawn.
   */
  const redrawLabelShape = (shape) => shape.redraw();

  /**
   * Function: getTextScale
   *
   * Returns the scaling used for the label of the given state
   *
   * Parameters:
   *
   * state - <mxCellState> whose label scale should be returned.
   */
  const getTextScale = (state) => state.getView().getScale();

  /**
   * Function: getLabelBounds
   *
   * Returns the bounds to be used to draw the label of the given state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label bounds should be returned.
   */
  const getLabelBounds = (state) => {
    const graph = state.getView().getGraph();
    const scale = state.getView().getScale();
    const isEdge = graph.getModel().isEdge(state.getCell());
    let bounds = Rectangle(
      state.getAbsoluteOffset().getX(),
      state.getAbsoluteOffset().getY()
    );

    if (isEdge) {
      const spacing = state.getText().getSpacing();
      bounds.setX(bounds.getX() + spacing.getX() * scale);
      bounds.setY(bounds.getY() + spacing.getY() * scale);

      const geo = graph.getCellGeometry(state.getCell());

      if (isSet(geo)) {
        bounds.setWidth(Math.max(0, geo.getWidth() * scale));
        bounds.setHeight(Math.max(0, geo.getHeight() * scale));
      }
    } else {
      // Inverts label position
      if (state.getText().isPaintBoundsInverted()) {
        const tmp = bounds.getX();
        bounds.setX(bounds.getY());
        bounds.setY(tmp);
      }

      bounds.setX(bounds.getX() + state.getX());
      bounds.setY(bounds.getY() + state.getY());

      // Minimum of 1 fixes alignment bug in HTML labels
      bounds.setWidth(Math.max(1, state.getWidth()));
      bounds.setHeight(Math.max(1, state.getHeight()));
    }

    if (state.getText().isPaintBoundsInverted()) {
      // Rotates around center of state
      const t = (state.getWidth() - state.getHeight()) / 2;
      bounds.setX(bounds.getX() + t);
      bounds.setY(bounds.getY() - t);
      const tmp = bounds.getWidth();
      bounds.setWidth(bounds.getHeight());
      bounds.setHeight(tmp);
    }

    // Shape can modify its label bounds
    if (isSet(state.getShape())) {
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

      if (hpos === ALIGN_CENTER && vpos === ALIGN_MIDDLE) {
        bounds = state.shape.getLabelBounds(bounds);
      }
    }

    // Label width style overrides actual label width
    const lw = getValue(state.getStyle(), STYLE_LABEL_WIDTH, undefined);

    if (isSet(lw)) {
      bounds.setWidth(parseFloat(lw) * scale);
    }

    if (!isEdge) {
      rotateLabelBounds(state, bounds);
    }

    return bounds;
  };

  /**
   * Function: rotateLabelBounds
   *
   * Adds the shape rotation to the given label bounds and
   * applies the alignment and offsets.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label bounds should be rotated.
   * bounds - <mxRectangle> the rectangle to be rotated.
   */
  const rotateLabelBounds = (state, bounds) => {
    const text = state.getText();
    const style = state.getStyle();

    bounds.setY(bounds.getY() - text.getMargin().getY() * bounds.getHeight());
    bounds.setX(bounds.getX() - text.getMargin().getX() * bounds.getWidth());

    if (
      !isLegacySpacing() ||
      (style[STYLE_OVERFLOW] !== 'fill' && style[STYLE_OVERFLOW] !== 'width')
    ) {
      const s = state.getView().getScale();
      const spacing = text.getSpacing();
      bounds.setX(bounds.getX() + spacing.getX() * s);
      bounds.setY(bounds.getY() + spacing.getY() * s);

      const hpos = getValue(style, STYLE_LABEL_POSITION, ALIGN_CENTER);
      const vpos = getValue(style, STYLE_VERTICAL_LABEL_POSITION, ALIGN_MIDDLE);
      const lw = getValue(style, STYLE_LABEL_WIDTH, undefined);

      bounds.setWidth(
        Math.max(
          0,
          bounds.getWidth() -
            (hpos === ALIGN_CENTER && isUnset(lw)
              ? text.getSpacingLeft() * s + text.getSpacingRight() * s
              : 0)
        )
      );
      bounds.setHeight(
        Math.max(
          0,
          bounds.getHeight() -
            (vpos === ALIGN_MIDDLE
              ? text.getSpacingTop() * s + text.getSpacingBottom() * s
              : 0)
        )
      );
    }

    const theta = text.getTextRotation();

    // Only needed if rotated around another center
    if (
      theta !== 0 &&
      isSet(state) &&
      state.getView().getGraph().getModel().isVertex(state.getCell())
    ) {
      const cx = state.getCenterX();
      const cy = state.getCenterY();

      if (bounds.getX() !== cx || bounds.getY() !== cy) {
        const rad = theta * (Math.PI / 180);
        const pt = getRotatedPoint(
          Point(bounds.getX(), bounds.getY()),
          Math.cos(rad),
          Math.sin(rad),
          Point(cx, cy)
        );

        bounds.setX(pt.getX());
        bounds.setY(pt.getY());
      }
    }
  };

  /**
   * Function: redrawCellOverlays
   *
   * Redraws the overlays for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose overlays should be redrawn.
   */
  const redrawCellOverlays = (state, forced) => {
    createCellOverlays(state);

    if (isSet(state.getOverlays())) {
      const rot = mod(getValue(state.getStyle(), STYLE_ROTATION, 0), 90);
      const rad = toRadians(rot);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      state.getOverlays().visit((id, shape) => {
        const bounds = shape.getOverlay().getBounds(state);

        if (!state.getView().getGraph().getModel().isEdge(state.getCell())) {
          if (isSet(state.getShape()) && rot !== 0) {
            const cx = bounds.getCenterX();
            const cy = bounds.getCenterY();

            const point = getRotatedPoint(
              Point(cx, cy),
              cos,
              sin,
              Point(state.getCenterX(), state.getCenterY())
            );

            cx = point.getX();
            cy = point.getY();
            bounds.setX(Math.round(cx - bounds.getWidth() / 2));
            bounds.setY(Math.round(cy - bounds.getHeight() / 2));
          }
        }

        if (
          forced ||
          isUnset(shape.getBounds()) ||
          shape.getScale() !== state.getView().getScale() ||
          !shape.getBounds().equals(bounds)
        ) {
          shape.setBounds(bounds);
          shape.setScale(state.getView().getScale());
          shape.redraw();
        }
      });
    }
  };

  /**
   * Function: redrawControl
   *
   * Redraws the control for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose control should be redrawn.
   */
  const redrawControl = (state, forced) => {
    const image = state.getView().getGraph().getFoldingImage(state);
    const control = state.getControl();

    if (isSet(control) && isSet(image)) {
      const bounds = getControlBounds(
        state,
        image.getWidth(),
        image.getHeight()
      );
      const r = isLegacyControlPosition()
        ? getValue(state.getStyle(), STYLE_ROTATION, 0)
        : state.getShape().getTextRotation();
      const s = state.getView().getScale();

      if (
        forced ||
        control.getScale() !== s ||
        !control.getBounds().equals(bounds) ||
        control.getRotation() !== r
      ) {
        control.setRotation(r);
        control.setBounds(bounds);
        control.setScale(s);

        control.redraw();
      }
    }
  };

  /**
   * Function: getControlBounds
   *
   * Returns the bounds to be used to draw the control (folding icon) of the
   * given state.
   */
  const getControlBounds = (state, w, h) => {
    if (isSet(state.getControl())) {
      const s = state.getView().getScale();
      let cx = state.getCenterX();
      let cy = state.getCenterY();

      if (!state.getView().getGraph().getModel().isEdge(state.getCell())) {
        cx = state.getX() + w * s;
        cy = state.getY() + h * s;

        if (isSet(state.getShape())) {
          // TODO: Factor out common code
          let rot = state.getShape().getShapeRotation();

          if (isLegacyControlPosition()) {
            rot = getValue(state.getStyle(), STYLE_ROTATION, 0);
          } else {
            if (state.getShape().isPaintBoundsInverted()) {
              const t = (state.getWidth() - state.getHeight()) / 2;
              cx += t;
              cy -= t;
            }
          }

          if (rot !== 0) {
            const rad = toRadians(rot);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const point = getRotatedPoint(
              Point(cx, cy),
              cos,
              sin,
              Point(state.getCenterX(), state.getCenterY())
            );
            cx = point.getX();
            cy = point.getY();
          }
        }
      }

      return state.getView().getGraph().getModel().isEdge(state.getCell())
        ? Rectangle(
            Math.round(cx - (w / 2) * s),
            Math.round(cy - (h / 2) * s),
            Math.round(w * s),
            Math.round(h * s)
          )
        : Rectangle(
            Math.round(cx - (w / 2) * s),
            Math.round(cy - (h / 2) * s),
            Math.round(w * s),
            Math.round(h * s)
          );
    }

    return;
  };

  /**
   * Function: insertStateAfter
   *
   * Inserts the given array of <mxShapes> after the given nodes in the DOM.
   *
   * Parameters:
   *
   * shapes - Array of <mxShapes> to be inserted.
   * node - Node in <drawPane> after which the shapes should be inserted.
   * htmlNode - Node in the graph container after which the shapes should be inserted that
   * will not go into the <drawPane> (eg. HTML labels without foreignObjects).
   */
  const insertStateAfter = (state, node, htmlNode) => {
    const shapes = getShapesForState(state);

    for (let i = 0; i < shapes.length; i++) {
      const n = shapes[i].getNode();

      if (isSet(shapes[i]) && isSet(n)) {
        const html =
          n.parentNode !== state.getView().getDrawPane() &&
          n.parentNode !== state.getView().getOverlayPane();
        const temp = html ? htmlNode : node;

        if (isSet(temp) && temp.nextSibling != n) {
          if (isUnset(temp.nextSibling)) {
            temp.parentNode.appendChild(n);
          } else {
            temp.parentNode.insertBefore(n, temp.nextSibling);
          }
        } else if (isUnset(temp)) {
          // Special case: First HTML node should be first sibling after canvas
          if (n.parentNode === state.getView().getGraph().getContainer()) {
            const canvas = state.getView().getCanvas();

            while (
              isSet(canvas) &&
              canvas.parentNode !== state.getView().getGraph().getContainer()
            ) {
              canvas = canvas.parentNode;
            }

            if (isSet(canvas) && isSet(canvas.nextSibling)) {
              if (canvas.nextSibling !== n) {
                n.parentNode.insertBefore(n, canvas.nextSibling);
              }
            } else {
              n.parentNode.appendChild(n);
            }
          } else if (
            isSet(n.parentNode) &&
            isSet(n.parentNode.firstChild) &&
            n.parentNode.firstChild !== n
          ) {
            // Inserts the node as the first child of the parent to implement the order
            n.parentNode.insertBefore(n, n.parentNode.firstChild);
          }
        }

        if (html) {
          htmlNode = n;
        } else {
          node = n;
        }
      }
    }

    return [node, htmlNode];
  };

  /**
   * Function: getShapesForState
   *
   * Returns the <mxShapes> for the given cell state in the order in which they should
   * appear in the DOM.
   *
   * Parameters:
   *
   * state - <mxCellState> whose shapes should be returned.
   */
  const getShapesForState = (state) => [
    state.getShape(),
    state.getText(),
    state.getControl()
  ];

  /**
   * Function: redraw
   *
   * Updates the bounds or points and scale of the shapes for the given cell
   * state. This is called in mxGraphView.validatePoints as the last step of
   * updating all cells.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shapes should be updated.
   * force - Optional boolean that specifies if the cell should be reconfiured
   * and redrawn without any additional checks.
   * rendering - Optional boolean that specifies if the cell should actually
   * be drawn into the DOM. If this is false then redraw and/or reconfigure
   * will not be called on the shape.
   */
  const redraw = (state, force, rendering) => {
    const shapeChanged = redrawShape(state, force, rendering);

    if (isSet(state.getShape()) && (isUnset(rendering) || rendering)) {
      redrawLabel(state, shapeChanged);
      redrawCellOverlays(state, shapeChanged);
      redrawControl(state, shapeChanged);
    }
  };

  /**
   * Function: redrawShape
   *
   * Redraws the shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be redrawn.
   */
  const redrawShape = (state, force, rendering) => {
    const graph = state.getView().getGraph();
    const model = graph.getModel();
    let shapeChanged = false;

    // Forces creation of new shape if shape style has changed
    if (
      isSet(state.getShape()) &&
      isSet(state.getShape().getStyle()) &&
      isSet(state.getStyle()) &&
      state.getShape().getStyle()[STYLE_SHAPE] !== state.getStyle()[STYLE_SHAPE]
    ) {
      state.getShape().destroy();
      state.setShape();
    }

    if (
      isUnset(state.getShape()) &&
      isSet(graph.getContainer()) &&
      state.getCell() !== state.getView().getCurrentRoot() &&
      (model.isVertex(state.getCell()) || model.isEdge(state.getCell()))
    ) {
      state.setShape(createShape(state));

      if (isSet(state.getShape())) {
        state.getShape().setMinSvgStrokeWidth(getMinSvgStrokeWidth());
        state.getShape().setAntiAlias(isAntiAlias());

        createIndicatorShape(state);
        initializeShape(state);
        createCellOverlays(state);
        installListeners(state);

        // Forces a refresh of the handler if one exists
        graph.getSelectionCellsHandler().updateHandler(state);
      }
    } else if (
      !force &&
      isSet(state.getShape()) &&
      (!equalEntries(state.getShape().getStyle(), state.getStyle()) ||
        checkPlaceholderStyles(state))
    ) {
      state.getShape().resetStyles();
      configureShape(state);
      // LATER: Ignore update for realtime to fix reset of current gesture
      graph.getSelectionCellsHandler().updateHandler(state);
      force = true;
    }

    const shape = state.getShape();

    // Updates indicator shape
    if (
      isSet(shape) &&
      shape.getIndicatorShape() !== getShape(graph.getIndicatorShape(state))
    ) {
      if (isSet(shape.getIndicator())) {
        shape.getIndicator().destroy();
        shape.setIndicator();
      }

      createIndicatorShape(state);

      if (isSet(shape.getIndicatorShape())) {
        shape.setIndicator(shape.getIndicatorShape());
        shape.getIndicator().init(state.getNode());
        force = true;
      }
    }

    if (isSet(shape)) {
      // Handles changes of the collapse icon
      createControl(state);

      // Redraws the cell if required, ignores changes to bounds if points are
      // defined as the bounds are updated for the given points inside the shape
      if (force || isShapeInvalid(state, shape)) {
        if (isSet(state.getAbsolutePoints())) {
          shape.setPoints(state.getAbsolutePoints().slice());
          shape.setBounds();
        } else {
          shape.setPoints();
          shape.setBounds(
            Rectangle(
              state.getX(),
              state.getY(),
              state.getWidth(),
              state.getHeight()
            )
          );
        }

        shape.setScale(state.getView().getScale());

        if (isUnset(rendering) || rendering) {
          doRedrawShape(state);
        } else {
          shape.updateBoundingBox();
        }

        shapeChanged = true;
      }
    }

    return shapeChanged;
  };

  /**
   * Function: doRedrawShape
   *
   * Invokes redraw on the shape of the given state.
   */
  const doRedrawShape = (state) => state.getShape().redraw();

  /**
   * Function: isShapeInvalid
   *
   * Returns true if the given shape must be repainted.
   */
  const isShapeInvalid = (state, shape) =>
    isUnset(shape.getBounds()) ||
    shape.getScale() !== state.getView().getScale() ||
    (isUnset(state.getAbsolutePoints()) && !shape.getBounds().equals(state)) ||
    (isSet(state.getAbsolutePoints()) &&
      !equalPoints(shape.getPoints(), state.getAbsolutePoints()));

  /**
   * Function: destroy
   *
   * Destroys the shapes associated with the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shapes should be destroyed.
   */
  const destroy = (state) => {
    if (isSet(state.getShape())) {
      if (isSet(state.getText())) {
        state.getText().destroy();
        state.setText();
      }

      if (isSet(state.getOverlays())) {
        state.getOverlays().visit((id, shape) => shape.destroy());

        state.setOverlays();
      }

      if (isSet(state.getControl())) {
        state.getControl().destroy();
        state.setControl();
      }

      state.getShape().destroy();
      state.setShape();
    }
  };

  const me = {
    initializeShape,
    createShape,
    createIndicatorShape,
    getShape,
    getShapeConstructor,
    configureShape,
    postConfigureShape,
    checkPlaceholderStyles,
    resolveColor,
    getLabelValue,
    createLabel,
    initializeLabel,
    createCellOverlays,
    initializeOverlay,
    installCellOverlayListeners,
    createControl,
    createControlClickHandler,
    initControl,
    isShapeEvent,
    isLabelEvent,
    installListeners,
    redrawLabel,
    isTextShapeInvalid,
    redrawLabelShape,
    getTextScale,
    getLabelBounds,
    rotateLabelBounds,
    redrawCellOverlays,
    redrawControl,
    getControlBounds,
    insertStateAfter,
    getShapesForState,
    redraw,
    redrawShape,
    doRedrawShape,
    isShapeInvalid,
    destroy
  };

  return me;
};

/**
 * Function: registerShape
 *
 * Registers the given constructor under the specified key in this instance
 * of the renderer.
 *
 * Example:
 *
 * (code)
 * CellRenderer.registerShape(SHAPE_RECTANGLE, mxRectangleShape);
 * (end)
 *
 * Parameters:
 *
 * key - String representing the shape name.
 * shape - Constructor of the <mxShape> subclass.
 */
CellRenderer.registerShape = (key, shape) => (defaultShapes[key] = shape);

// Adds default shapes into the default shapes array
CellRenderer.registerShape(SHAPE_RECTANGLE, RectangleShape);
CellRenderer.registerShape(SHAPE_ELLIPSE, Ellipse);
CellRenderer.registerShape(SHAPE_RHOMBUS, Rhombus);
CellRenderer.registerShape(SHAPE_CYLINDER, Cylinder);
CellRenderer.registerShape(SHAPE_CONNECTOR, Connector);
// CellRenderer.registerShape(SHAPE_ACTOR, Actor);
// CellRenderer.registerShape(SHAPE_TRIANGLE, Triangle);
// CellRenderer.registerShape(SHAPE_HEXAGON, Hexagon);
// CellRenderer.registerShape(SHAPE_CLOUD, Cloud);
// CellRenderer.registerShape(SHAPE_LINE, Line);
// CellRenderer.registerShape(SHAPE_ARROW, Arrow);
// CellRenderer.registerShape(SHAPE_ARROW_CONNECTOR, ArrowConnector);
// CellRenderer.registerShape(SHAPE_DOUBLE_ELLIPSE, DoubleEllipse);
// CellRenderer.registerShape(SHAPE_SWIMLANE, Swimlane);
CellRenderer.registerShape(SHAPE_IMAGE, ImageShape);
// CellRenderer.registerShape(SHAPE_LABEL, Label);

export default CellRenderer;
