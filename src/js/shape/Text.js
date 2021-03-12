/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet } from '../Helpers';
import Shape from '../shape/Shape';
import {
  ALIGN_CENTER,
  ALIGN_MIDDLE,
  ALIGN_RIGHT,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DEFAULT_FONTSTYLE,
  DEFAULT_TEXT_DIRECTION,
  FONT_BOLD,
  FONT_ITALIC,
  FONT_STRIKETHROUGH,
  FONT_UNDERLINE,
  STYLE_ALIGN,
  STYLE_FONTCOLOR,
  STYLE_FONTFAMILY,
  STYLE_FONTSIZE,
  STYLE_FONTSTYLE,
  STYLE_HORIZONTAL,
  STYLE_LABEL_BACKGROUNDCOLOR,
  STYLE_LABEL_BORDERCOLOR,
  STYLE_LABEL_POSITION,
  STYLE_ROTATION,
  STYLE_SPACING,
  STYLE_SPACING_BOTTOM,
  STYLE_SPACING_LEFT,
  STYLE_SPACING_RIGHT,
  STYLE_SPACING_TOP,
  STYLE_TEXT_DIRECTION,
  STYLE_TEXT_OPACITY,
  STYLE_VERTICAL_ALIGN,
  STYLE_VERTICAL_LABEL_POSITION,
  TEXT_DIRECTION_AUTO,
  TEXT_DIRECTION_LTR,
  TEXT_DIRECTION_RTL
} from '../util/Constants';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import SvgCanvas2D from '../util/SvgCanvas2D';
import {
  isNode,
  getValue,
  getBoundingBox as _getBoundingBox,
  setOpacity as _setOpacity,
  getAlignmentAsPoint
} from '../util/Utils';

/**
 * Class: Text
 *
 * Extends <mxShape> to implement a text shape. To change vertical text from
 * bottom to top to top to bottom, the following code can be used:
 *
 * (code)
 * mxText.prototype.verticalTextRotation = 90;
 * (end)
 *
 * Constructor: Text
 *
 * Constructs a new text shape.
 *
 * Parameters:
 *
 * value - String that represents the text to be displayed. This is stored in
 * <value>.
 * bounds - <mxRectangle> that defines the bounds. This is stored in
 * <mxShape.bounds>.
 * align - Specifies the horizontal alignment. Default is ''. This is stored in
 * <align>.
 * valign - Specifies the vertical alignment. Default is ''. This is stored in
 * <valign>.
 * color - String that specifies the text color. Default is 'black'. This is
 * stored in <color>.
 * family - String that specifies the font family. Default is
 * <mxConstants.DEFAULT_FONTFAMILY>. This is stored in <family>.
 * size - Integer that specifies the font size. Default is
 * <mxConstants.DEFAULT_FONTSIZE>. This is stored in <size>.
 * fontStyle - Specifies the font style. Default is 0. This is stored in
 * <fontStyle>.
 * spacing - Integer that specifies the global spacing. Default is 2. This is
 * stored in <spacing>.
 * spacingTop - Integer that specifies the top spacing. Default is 0. The
 * sum of the spacing and this is stored in <spacingTop>.
 * spacingRight - Integer that specifies the right spacing. Default is 0. The
 * sum of the spacing and this is stored in <spacingRight>.
 * spacingBottom - Integer that specifies the bottom spacing. Default is 0.The
 * sum of the spacing and this is stored in <spacingBottom>.
 * spacingLeft - Integer that specifies the left spacing. Default is 0. The
 * sum of the spacing and this is stored in <spacingLeft>.
 * horizontal - Boolean that specifies if the label is horizontal. Default is
 * true. This is stored in <horizontal>.
 * background - String that specifies the background color. Default is null.
 * This is stored in <background>.
 * border - String that specifies the label border color. Default is null.
 * This is stored in <border>.
 * wrap - Specifies if word-wrapping should be enabled. Default is false.
 * This is stored in <wrap>.
 * clipped - Specifies if the label should be clipped. Default is false.
 * This is stored in <clipped>.
 * overflow - Value of the overflow style. Default is 'visible'.
 */
const Text = (
  data,
  bounds,
  align,
  valign,
  color = 'black',
  family = DEFAULT_FONTFAMILY,
  size = DEFAULT_FONTSIZE,
  fontStyle = DEFAULT_FONTSTYLE,
  spacing = 2,
  spacingTop = 0,
  spacingRight = 0,
  spacingBottom = 0,
  spacingLeft = 0,
  horizontal = true,
  background,
  border,
  wrap = false,
  clipped = false,
  overflow = 'visible',
  labelPadding = 0,
  textDirection,
  overrides = {}
) => {
  const [getData, setData] = addProp(data);
  const [getColor, setColor] = addProp(color);
  const [getAlign, setAlign] = addProp(align);
  const [getValign, setValign] = addProp(valign);
  const [getFamily, setFamily] = addProp(family);
  const [getSize, setSize] = addProp(size);
  const [getFontStyle, setFontStyle] = addProp(fontStyle);
  const [_getSpacing, setSpacing] = addProp(parseInt(spacing));
  const [getSpacingTop, setSpacingTop] = addProp(
    _getSpacing() + parseInt(spacingTop)
  );
  const [getSpacingRight, setSpacingRight] = addProp(
    _getSpacing() + parseInt(spacingRight)
  );
  const [getSpacingBottom, setSpacingBottom] = addProp(
    _getSpacing() + parseInt(spacingBottom)
  );
  const [getSpacingLeft, setSpacingLeft] = addProp(
    _getSpacing() + parseInt(spacingLeft)
  );
  const [isHorizontal, setHorizontal] = addProp(horizontal);
  const [getBackground, setBackground] = addProp(background);
  const [getBorder, setBorder] = addProp(border);
  const [isWrap, setWrap] = addProp(wrap);
  const [isClipped, setClipped] = addProp(clipped);
  const [getOverflow, setOverflow] = addProp(overflow);
  const [getLabelPadding, setLabelPadding] = addProp(labelPadding);
  const [getTextDirection, setTextDirection] = addProp(textDirection);

  /**
   * Variable: baseSpacingTop
   *
   * Specifies the spacing to be added to the top spacing. Default is 0. Use the
   * value 5 here to get the same label positions as in mxGraph 1.x.
   */
  const [getBaseSpacingTop, setBaseSpacingTop] = addProp(0);

  /**
   * Variable: baseSpacingBottom
   *
   * Specifies the spacing to be added to the bottom spacing. Default is 0. Use the
   * value 1 here to get the same label positions as in mxGraph 1.x.
   */
  const [getBaseSpacingBottom, setBaseSpacingBottom] = addProp(0);

  /**
   * Variable: baseSpacingRight
   *
   * Specifies the spacing to be added to the right spacing. Default is 0.
   */
  const [getBaseSpacingRight, setBaseSpacingRight] = addProp(0);

  /**
   * Variable: baseSpacingLeft
   *
   * Specifies the spacing to be added to the left spacing. Default is 0.
   */
  const [getBaseSpacingLeft, setBaseSpacingLeft] = addProp(0);

  /**
   * Variable: replaceLinefeeds
   *
   * Specifies if linefeeds in HTML labels should be replaced with BR tags.
   * Default is true.
   */
  const [isReplaceLinefeeds, setReplaceLineFeeds] = addProp(true);

  /**
   * Variable: verticalTextRotation
   *
   * Rotation for vertical text. Default is -90 (bottom to top).
   */
  const [getVerticalTextRotation, setVerticalTextRotation] = addProp(-90);

  /**
   * Variable: ignoreClippedStringSize
   *
   * Specifies if the string size should be measured in <updateBoundingBox> if
   * the label is clipped and the label position is center and middle. If this is
   * true, then the bounding box will be set to <bounds>. Default is true.
   * <ignoreStringSize> has precedence over this switch.
   */
  const [isIgnoreClippedStringSize, setIgnoreClippedStringSize] = addProp(true);

  /**
   * Variable: ignoreStringSize
   *
   * Specifies if the actual string size should be measured. If disabled the
   * boundingBox will not ignore the actual size of the string, otherwise
   * <bounds> will be used instead. Default is false.
   */
  const [isIgnoreStringSize, setIgnoreStringSize] = addProp(false);

  /**
   * Variable: textWidthPadding
   *
   * Specifies the padding to be added to the text width for the bounding box.
   * This is needed to make sure no clipping is applied to borders. Default is 4
   * for IE 8 standards mode and 3 for all others.
   */
  const [getTextWidthPadding, setTextWidthPadding] = addProp(3);

  /**
   * Variable: lastData
   *
   * Contains the last rendered text value. Used for caching.
   */
  const [getLastData, setLastData] = addProp();

  /**
   * Variable: cacheEnabled
   *
   * Specifies if caching for HTML labels should be enabled. Default is true.
   */
  const [isCacheEnabled, setCacheEnabled] = addProp(true);
  const [getMargin, setMargin] = addProp();
  const [getUnrotatedBoundingBox, setUnrotatedBoundingBox] = addProp();

  /**
   * Function: isHtmlAllowed
   *
   * Returns true if HTML is allowed for this shape. This implementation returns
   * true if the browser is not in IE8 standards mode.
   */
  const isHtmlAllowed = () => true;

  /**
   * Function: getSvgScreenOffset
   *
   * Disables offset in IE9 for crisper image output.
   */
  const getSvgScreenOffset = () => 0;

  /**
   * Function: checkBounds
   *
   * Returns true if the bounds are not null and all of its variables are numeric.
   */
  const checkBounds = () => {
    const scale = _shape.getScale();
    const bounds = _shape.getBounds();

    return (
      !isNaN(scale) &&
      isFinite(scale) &&
      scale > 0 &&
      isSet(bounds) &&
      !isNaN(bounds.getX()) &&
      !isNaN(bounds.getY()) &&
      !isNaN(bounds.getWidth()) &&
      !isNaN(bounds.getHeight())
    );
  };

  /**
   * Function: paint
   *
   * Generic rendering code.
   */
  const paint = (c, update) => {
    // Scale is passed-through to canvas
    const s = _shape.getScale();
    const bounds = _shape.getBounds();
    const x = bounds.getX() / s;
    const y = bounds.getY() / s;
    const w = bounds.getWidth() / s;
    const h = bounds.getHeight() / s;

    _shape.updateTransform(c, x, y, w, h);
    configureCanvas(c, x, y, w, h);

    if (update) {
      c.updateText(
        x,
        y,
        w,
        h,
        getAlign(),
        getValign(),
        isWrap(),
        getOverflow(),
        isClipped(),
        getTextRotation(),
        _shape.getNode()
      );
    } else {
      // Checks if text contains HTML markup
      const realHtml = isNode(getData());
      const fmt = realHtml;
      const val = getData();

      let dir = getTextDirection();

      if (dir === TEXT_DIRECTION_AUTO && !realHtml) {
        dir = getAutoDirection();
      }

      if (dir !== TEXT_DIRECTION_LTR && dir !== TEXT_DIRECTION_RTL) {
        dir = undefined;
      }

      c.text(
        x,
        y,
        w,
        h,
        val,
        getAlign(),
        getValign(),
        isWrap(),
        fmt,
        getOverflow(),
        isClipped(),
        getTextRotation(),
        dir
      );
    }
  };

  /**
   * Function: redraw
   *
   * Renders the text using the given DOM nodes.
   */
  const redraw = () => {
    if (
      _shape.isVisible() &&
      checkBounds() &&
      isCacheEnabled() &&
      getLastData() === getData()
    ) {
      if (_shape.getNode().nodeName === 'DIV' && isHtmlAllowed()) {
        redrawHtmlShapeWithCss3();

        updateBoundingBox();
      } else {
        const canvas = createCanvas();

        if (isSet(canvas) && isSet(canvas.isUpdateText())) {
          // Specifies if events should be handled
          canvas.setPointerEvents(getPointerEvents());

          paint(canvas, true);
          destroyCanvas(canvas);
          updateBoundingBox();
        }
      }
    } else {
      _shape.redraw();

      if (isNode(getData())) {
        setLastData(getData());
      } else {
        setLastData();
      }
    }
  };

  /**
   * Function: resetStyles
   *
   * Resets all styles.
   */
  const resetStyles = () => {
    _shape.resetStyles();

    setColor('black');
    setAlign(ALIGN_CENTER);
    setValign(ALIGN_MIDDLE);
    setFamily(DEFAULT_FONTFAMILY);
    setSize(DEFAULT_FONTSIZE);
    setFontStyle(DEFAULT_FONTSTYLE);
    setSpacing(2);
    setSpacingTop(2);
    setSpacingRight(2);
    setSpacingBottom(2);
    setSpacingLeft(2);
    setHorizontal(true);
    setBackground();
    setBorder();
    setTextDirection(DEFAULT_TEXT_DIRECTION);
    setMargin();
  };

  /**
   * Function: apply
   *
   * Extends mxShape to update the text styles.
   *
   * Parameters:
   *
   * state - <mxCellState> of the corresponding cell.
   */
  const apply = (state) => {
    const style = _shape.getStyle();
    const old = _getSpacing();

    _shape.apply(state);

    if (isSet(style)) {
      setFontStyle(getValue(style, STYLE_FONTSTYLE, getFontStyle()));
      setFamily(getValue(style, STYLE_FONTFAMILY, getFamily()));
      setSize(getValue(style, STYLE_FONTSIZE, getSize()));
      setColor(getValue(style, STYLE_FONTCOLOR, getColor()));
      setAlign(getValue(style, STYLE_ALIGN, getAlign()));
      setValign(getValue(style, STYLE_VERTICAL_ALIGN, getValign()));
      setSpacing(parseInt(getValue(style, STYLE_SPACING, _getSpacing())));
      setSpacingTop(
        parseInt(getValue(style, STYLE_SPACING_TOP, getSpacingTop() - old)) +
          _getSpacing()
      );
      setSpacingRight(
        parseInt(
          getValue(style, STYLE_SPACING_RIGHT, getSpacingRight() - old)
        ) + _getSpacing()
      );
      setSpacingBottom(
        parseInt(
          getValue(style, STYLE_SPACING_BOTTOM, getSpacingBottom() - old)
        ) + _getSpacing()
      );
      setSpacingLeft(
        parseInt(getValue(style, STYLE_SPACING_LEFT, getSpacingLeft() - old)) +
          _getSpacing()
      );
      setHorizontal(getValue(style, STYLE_HORIZONTAL, isHorizontal()));
      setBackground(
        getValue(style, STYLE_LABEL_BACKGROUNDCOLOR, getBackground())
      );
      setBorder(getValue(style, STYLE_LABEL_BORDERCOLOR, getBorder()));
      setTextDirection(
        getValue(style, STYLE_TEXT_DIRECTION, DEFAULT_TEXT_DIRECTION)
      );
      _shape.setOpacity(getValue(style, STYLE_TEXT_OPACITY, 100));
      updateMargin();
    }

    _shape.setFlipV();
    _shape.setFlipH();
  };

  /**
   * Function: getAutoDirection
   *
   * Used to determine the automatic text direction. Returns
   * <mxConstants.TEXT_DIRECTION_LTR> or <mxConstants.TEXT_DIRECTION_RTL>
   * depending on the contents of <value>. This is not invoked for HTML, wrapped
   * content or if <value> is a DOM node.
   */
  const getAutoDirection = () => {
    // Looks for strong (directional) characters
    const tmp = /[A-Za-z\u05d0-\u065f\u066a-\u06ef\u06fa-\u07ff\ufb1d-\ufdff\ufe70-\ufefc]/.exec(
      getData()
    );

    // Returns the direction defined by the character
    return isSet(tmp) && tmp.length > 0 && tmp[0] > 'z'
      ? TEXT_DIRECTION_RTL
      : TEXT_DIRECTION_LTR;
  };

  /**
   * Function: getContentNode
   *
   * Returns the node that contains the rendered input.
   */
  const getContentNode = () => {
    const result = _shape.getNode();

    if (isSet(result)) {
      // Rendered with no foreignObject
      if (isUnset(result.ownerSVGElement)) {
        result = result.firstChild.firstChild;
      } else {
        // Innermost DIV that contains the actual content
        result = result.firstChild.firstChild.firstChild.firstChild.firstChild;
      }
    }

    return result;
  };

  /**
   * Function: updateBoundingBox
   *
   * Updates the <boundingBox> for this shape using the given node and position.
   */
  const updateBoundingBox = () => {
    const node = _shape.getNode();
    setBoundingBox(_shape.getBounds().clone());
    const rot = getTextRotation();
    const style = _shape.getStyle();
    const scale = _shape.getScale();

    const h = isSet(style)
      ? getValue(style, STYLE_LABEL_POSITION, ALIGN_CENTER)
      : undefined;
    const v = isSet(style)
      ? getValue(style, STYLE_VERTICAL_LABEL_POSITION, ALIGN_MIDDLE)
      : undefined;

    if (
      !isIgnoreStringSize() &&
      isSet(node) &&
      getOverflow() !== 'fill' &&
      (!isClipped() ||
        !isIgnoreClippedStringSize() ||
        h !== ALIGN_CENTER ||
        v !== ALIGN_MIDDLE)
    ) {
      let ow;
      let oh;

      if (isSet(node.ownerSVGElement)) {
        if (
          isSet(node.firstChild) &&
          isSet(node.firstChild.firstChild) &&
          node.firstChild.firstChild.nodeName === 'foreignObject'
        ) {
          // Uses second inner DIV for font metrics
          node = node.firstChild.firstChild.firstChild.firstChild;
          oh = node.offsetHeight * scale;

          if (getOverflow() === 'width') {
            ow = getBoundingBox().getWidth();
          } else {
            ow = node.offsetWidth * scale;
          }
        } else {
          try {
            const b = node.getBBox();

            // Workaround for bounding box of empty string
            if (typeof getData() === 'string' && trim(getData()) === 0) {
              setBoundingBox();
            } else if (b.getWidth() === 0 && b.getHeight() === 0) {
              setBoundingBox();
            } else {
              setBoundingBox(
                Rectangle(b.getX(), b.getY(), b.getWidth(), b.getHeight())
              );
            }

            return;
          } catch (e) {
            // Ignores NS_ERROR_FAILURE in FF if container display is none.
          }
        }
      } else {
        const td = isSet(_shape.getState())
          ? _shape.getState().getView().textDiv
          : undefined;

        // Use cached offset size
        if (isSet(getOffsetWidth()) && isSet(getOffsetHeight())) {
          ow = getOffsetWidth() * scale;
          oh = getOffsetHeight() * scale;
        } else {
          // Cannot get node size while container hidden so a
          // shared temporary DIV is used for text measuring
          if (isSet(td)) {
            updateFont(td);
            updateSize(td, false);
            updateInnerHtml(td);

            node = td;
          }

          let sizeDiv = node;

          if (
            isset(sizeDiv.firstChild) &&
            sizeDiv.firstChild.nodeName === 'DIV'
          ) {
            sizeDiv = sizeDiv.firstChild;
          }

          setOffsetWidth(sizeDiv.offsetWidth + getTextWidthPadding());
          setOffsetHeight(sizeDiv.offsetHeight);

          ow = getOffsetWidth() * scale;
          oh = getOffsetHeight() * scale;
        }
      }

      if (isSet(ow) && isSet(oh)) {
        setBoundingBox(
          Rectangle(
            _shape.getBounds().getX(),
            _shape.getBounds().getY(),
            ow,
            oh
          )
        );
      }
    }

    if (isSet(getBoundingBox())) {
      const margin = getMargin();
      const bb = getBoundingBox();

      if (rot !== 0) {
        // Accounts for pre-rotated x and y
        const bbox = _getBoundingBox(
          Rectangle(
            margin.getX() * bb.getWidth(),
            margin.getY() * bb.getHeight(),
            bb.getWidth(),
            bb.getHeight()
          ),
          rot,
          Point(0, 0)
        );

        const ubb = Rectangle.fromRectangle(bb);
        setUnrotatedBoundingBox(ubb);
        ubb.setX(ubb.getX() + margin.getX() * ubb.getWidth());
        ubb.setY(ubb.getY() + margin.getY() * ubb.getHeight());

        bb.setX(bb.getX() + bbox.getX());
        bb.setY(bb.getY() + bbox.getY());
        bb.setWidth(bbox.getWidth());
        bb.setHeight(bbox.getHeight());
      } else {
        bb.setX(bb.getX() + margin.getX() * bb.getWidth());
        bb.setY(bb.getY() + margin.getY() * bb.getHeight());
        setUnrotatedBoundingBox();
      }
    }
  };

  /**
   * Function: getShapeRotation
   *
   * Returns 0 to avoid using rotation in the canvas via updateTransform.
   */
  const getShapeRotation = () => 0;

  /**
   * Function: getTextRotation
   *
   * Returns the rotation for the text label of the corresponding shape.
   */
  const getTextRotation = () =>
    isSet(_shape.getState()) && isSet(_shape.getState().getShape())
      ? _shape.getState().getShape().getTextRotation()
      : 0;

  /**
   * Function: isPaintBoundsInverted
   *
   * Inverts the bounds if <mxShape.isBoundsInverted> returns true or if the
   * horizontal style is false.
   */
  const isPaintBoundsInverted = () =>
    !isHorizontal() &&
    isSet(_shape.getState()) &&
    _shape
      .getState()
      .getView()
      .getGraph()
      .getModel()
      .isVertex(_shape.getState().getCell());

  /**
   * Function: configureCanvas
   *
   * Sets the state of the canvas for drawing the shape.
   */
  const configureCanvas = (c, x, y, w, h) => {
    _shape.configureCanvas(c, x, y, w, h);

    c.setFontColor(getColor());
    c.setFontBackgroundColor(getBackground());
    c.setFontBorderColor(getBorder());
    c.setFontFamily(getFamily());
    c.setFontSize(getSize());
    c.setFontStyle(getFontStyle());
  };

  /**
   * Function: getHtmlValue
   *
   * Private helper function to create SVG elements
   */
  const getHtmlValue = () => {
    let val = htmlEntities(getData(), false);

    // Handles trailing newlines to make sure they are visible in rendering output
    val = replaceTrailingNewlines(val, '<div><br></div>');
    val = isReplaceLinefeeds() ? val.replace(/\n/g, '<br/>') : val;

    return val;
  };

  /**
   * Function: getTextCss
   *
   * Private helper function to create SVG elements
   */
  const getTextCss = () => {
    const lh = ABSOLUTE_LINE_HEIGHT
      ? getSize() * LINE_HEIGHT + 'px'
      : LINE_HEIGHT;

    let css =
      'display: inline-block; font-size: ' +
      getSize() +
      'px; ' +
      'font-family: ' +
      getFamily() +
      '; color: ' +
      getColor() +
      '; line-height: ' +
      lh +
      '; pointer-events: ' +
      (_shape.isPointerEvents() ? 'all' : 'none') +
      '; ';

    if ((getFontStyle() & FONT_BOLD) === FONT_BOLD) {
      css += 'font-weight: bold; ';
    }

    if ((getFontStyle() & FONT_ITALIC) === FONT_ITALIC) {
      css += 'font-style: italic; ';
    }

    const deco = [];

    if ((getFontStyle() & FONT_UNDERLINE) === FONT_UNDERLINE) {
      deco.push('underline');
    }

    if ((getFontStyle() & FONT_STRIKETHROUGH) === FONT_STRIKETHROUGH) {
      deco.push('line-through');
    }

    if (deco.length > 0) {
      css += 'text-decoration: ' + deco.join(' ') + '; ';
    }

    return css;
  };

  /**
   * Function: redrawHtmlShape
   *
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  const redrawHtmlShape = () => redrawHtmlShapeWithCss3();

  /**
   * Function: redrawHtmlShapeWithCss3
   *
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  const redrawHtmlShapeWithCss3 = () => {
    const bounds = _shape.getBounds();
    const scale = _shape.getScale();
    const w = Math.max(0, Math.round(bounds.width / scale));
    const h = Math.max(0, Math.round(bounds.height / scale));
    const flex =
      'position: absolute; left: ' +
      Math.round(bounds.x) +
      'px; ' +
      'top: ' +
      Math.round(bounds.y) +
      'px; pointer-events: none; ';
    const block = getTextCss();
    const margin = getMargin();
    const node = _shape.getNode();

    SvgCanvas2D.createCss(
      w + 2,
      h,
      getAlign(),
      getValign(),
      isWrap(),
      getOverflow(),
      isClipped(),
      isSet(getBackground()) ? htmlEntities(getBackground()) : undefined,
      isSet(getBorder()) ? htmlEntities(getBorder()) : undefined,
      flex,
      block,
      scale,
      (dx, dy, flex, item, block, ofl) => {
        const r = getTextRotation();
        let tr =
          (scale !== 1 ? 'scale(' + scale + ') ' : '') +
          (r !== 0 ? 'rotate(' + r + 'deg) ' : '') +
          (margin.getX() !== 0 || margin.getY() !== 0
            ? 'translate(' +
              margin.getX() * 100 +
              '%,' +
              margin.getY() * 100 +
              '%)'
            : '');

        if (tr !== '') {
          tr = 'transform-origin: 0 0; transform: ' + tr + '; ';
        }

        if (ofl === '') {
          flex += item;
          item = 'display:inline-block; min-width: 100%; ' + tr;
        } else {
          item += tr;

          if (IS_SF) {
            item += '-webkit-clip-path: content-box;';
          }
        }

        if (getOpacity() < 100) {
          block += 'opacity: ' + getOpacity() / 100 + '; ';
        }

        node.setAttribute('style', flex);

        const html = isNode(getData()) ? getData().outerHTML : getHtmlValue();

        if (isUnset(node.firstChild)) {
          node.innerHTML = '<div><div>' + html + '</div></div>';
        }

        node.firstChild.firstChild.setAttribute('style', block);
        node.firstChild.setAttribute('style', item);
      }
    );
  };

  /**
   * Function: getMargin
   *
   * Returns the spacing as an <mxPoint>.
   */
  const updateMargin = () =>
    setMargin(getAlignmentAsPoint(getAlign(), getValign()));

  /**
   * Function: getSpacing
   *
   * Returns the spacing as an <mxPoint>.
   */
  const getSpacing = () => {
    const align = getAlign();
    const valign = getValign();
    let dx = 0;
    let dy = 0;

    if (align === ALIGN_CENTER) {
      dx = (getSpacingLeft() - getSpacingRight()) / 2;
    } else if (align === ALIGN_RIGHT) {
      dx = -getSpacingRight() - getBaseSpacingRight();
    } else {
      dx = getSpacingLeft() + getBaseSpacingLeft();
    }

    if (valign === ALIGN_MIDDLE) {
      dy = (getSpacingTop() - getSpacingBottom()) / 2;
    } else if (valign === ALIGN_BOTTOM) {
      dy = -getSpacingBottom() - getBaseSpacingBottom();
    } else {
      dy = getSpacingTop() + getBaseSpacingTop();
    }

    return Point(dx, dy);
  };

  const _shape = Shape(undefined, {
    apply,
    redraw,
    isHtmlAllowed,
    redrawHtmlShape,
    checkBounds,
    paint,
    getSvgScreenOffset,
    ...overrides
  });

  _shape.setBounds(bounds);
  _shape.setRotation(0);

  const me = {
    ..._shape,
    isHtmlAllowed,
    getSvgScreenOffset,
    checkBounds,
    paint,
    redraw,
    resetStyles,
    apply,
    getAutoDirection,
    getContentNode,
    updateBoundingBox,
    getShapeRotation,
    getTextRotation,
    isPaintBoundsInverted,
    configureCanvas,
    redrawHtmlShape,
    updateMargin,
    getSpacing,
    getData,
    setData,
    getLastData,
    setLastData,
    getMargin,
    setMargin,
    getSpacingLeft,
    setSpacingLeft,
    getSpacingRight,
    setSpacingRight,
    getSpacingTop,
    setSpacingTop,
    getSpacingBottom,
    setSpacingBottom,
    isWrap,
    setWrap,
    isClipped,
    setClipped,
    getOverflow,
    setOverflow
  };

  return me;
};

export default Text;
