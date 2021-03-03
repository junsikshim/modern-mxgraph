import { addProp, isSet } from '../Helpers';
import Shape from '../shape/Shape';
import {
  ALIGN_CENTER,
  ALIGN_MIDDLE,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DEFAULT_FONTSTYLE,
  DEFAULT_TEXT_DIRECTION,
  STYLE_ROTATION,
  TEXT_DIRECTION_AUTO,
  TEXT_DIRECTION_LTR,
  TEXT_DIRECTION_RTL
} from '../util/Constants';
import Rectangle from '../util/Rectangle';
import SvgCanvas2D from '../util/SvgCanvas2D';
import {
  isNode,
  getValue,
  getBoundingBox as _getBoundingBox,
  setOpacity as _setOpacity,
  getAlignmentAsPoint
} from '../util/Utils';

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
  textDirection
) => {
  const {
    getBounds,
    setBounds,
    getRotation,
    setRotation,
    getScale,
    setScale,
    getNode,
    resetStyles: _resetStyles,
    apply: _apply,
    getStyle
  } = Shape();

  const [getData, setData] = addProp(data);
  const [getColor, setColor] = addProp(color);
  const [getAlign, setAlign] = addProp(align);
  const [getValign, setValign] = addProp(valign);
  const [getFamily, setFamily] = addProp(family);
  const [getSize, setSize] = addProp(size);
  const [getFontStyle, setFontStyle] = addProp(fontStyle);
  const [_getSpacing, setSpacing] = addProp(parseInt(spacing));
  const [getSpacingTop, setSpacingTop] = addProp(
    getSpacing() + parseInt(spacingTop)
  );
  const [getSpacingRight, setSpacingRight] = addProp(
    getSpacing() + parseInt(spacingRight)
  );
  const [getSpacingBottom, setSpacingBottom] = addProp(
    getSpacing() + parseInt(spacingBottom)
  );
  const [getSpacingLeft, setSpacingLeft] = addProp(
    getSpacing() + parseInt(spacingLeft)
  );
  const [isHorizontal, setHorizontal] = addProp(horizontal);
  const [getBackground, setBackground] = addProp(background);
  const [getBorder, setBorder] = addProp(border);
  const [isWrap, setWrap] = addProp(wrap);
  const [isClipped, setClipped] = addProp(clipped);
  const [getOverflow, setOverflow] = addProp(overflow);
  const [getLabelPadding, setLabelPadding] = addProp(labelPadding);
  const [getTextDirection, setTextDirection] = addProp(textDirection);
  const [getBaseSpacingTop, setBaseSpacingTop] = addProp(0);
  const [getBaseSpacingBottom, setBaseSpacingBottom] = addProp(0);
  const [getBaseSpacingRight, setBaseSpacingRight] = addProp(0);
  const [getBaseSpacingLeft, setBaseSpacingLeft] = addProp(0);
  const [isReplaceLinefeeds, setReplaceLineFeeds] = addProp(true);
  const [getVerticalTextRotation, setVerticalTextRotation] = addProp(-90);
  const [isIgnoreClippedStringSize, setIgnoreClippedStringSize] = addProp(true);
  const [isIgnoreStringSize, setIgnoreStringSize] = addProp(false);
  const [getTextWidthPadding, setTextWidthPadding] = addProp(3);
  const [getLastData, setLastData] = addProp();
  const [isCacheEnabled, setCacheEnabled] = addProp(true);
  const [getMargin, setMargin] = addProp();
  const [getUnrotatedBoundingBox, setUnrotatedBoundingBox] = addProp();

  setBounds(bounds);
  setRotation(0);

  const isHtmlAllowed = () => true;

  const getSvgScreenOffset = () => 0;

  const checkBounds = () => {
    const scale = getScale();
    const bounds = getBounds();

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

  const paint = (c, update) => {
    // Scale is passed-through to canvas
    const s = getScale();
    const x = getBounds().getX() / s;
    const y = getBounds().getY() / s;
    const w = getBounds().getWidth() / s;
    const h = getBounds().getHeight() / s;

    updateTransform(c, x, y, w, h);
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
        getNode()
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
        dir = null;
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

  const redraw = () => {
    if (
      isVisible() &&
      checkBounds() &&
      isCacheEnabled() &&
      getLastData() === getData() &&
      isNode(getData())
    ) {
      if (getNode().nodeName === 'DIV' && isHtmlAllowed()) {
        redrawHtmlShapeWithCss3();

        updateBoundingBox();
      } else {
        const canvas = createCanvas();

        if (isSet(canvas) && isSet(canvas.updateText)) {
          // Specifies if events should be handled
          canvas.setPointerEvents(getPointerEvents());

          paint(canvas, true);
          destroyCanvas(canvas);
          updateBoundingBox();
        }
      }
    } else {
      redraw();

      if (isNode(getData())) {
        setLastData(getData());
      } else {
        setLastData();
      }
    }
  };

  const resetStyles = () => {
    _resetStyles();

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

  const apply = (state) => {
    const style = getStyle();
    const old = getSpacing();
    _apply(state);

    if (isSet(style)) {
      setFontStyle(getValue(style, STYLE_FONTSTYLE, getFontStyle()));
      setFamily(getValue(style, STYLE_FONTFAMILY, getFamily()));
      setSize(getValue(style, STYLE_FONTSIZE, getSize()));
      setColor(getValue(style, STYLE_FONTCOLOR, getColor()));
      setAlign(getValue(style, STYLE_ALIGN, getAlign()));
      setValign(getValue(style, STYLE_VERTICAL_ALIGN, getValign()));
      setSpacing(parseInt(getValue(style, STYLE_SPACING, getSpacing())));
      setSpacingTop(
        parseInt(getValue(style, STYLE_SPACING_TOP, getSpacingTop() - old)) +
          getSpacing()
      );
      setSpacingRight(
        parseInt(
          getValue(style, STYLE_SPACING_RIGHT, getSpacingRight() - old)
        ) + getSpacing()
      );
      setSpacingBottom(
        parseInt(
          getValue(style, STYLE_SPACING_BOTTOM, getSpacingBottom() - old)
        ) + getSpacing()
      );
      setSpacingLeft(
        parseInt(getValue(style, STYLE_SPACING_LEFT, getSpacingLeft() - old)) +
          getSpacing()
      );
      setHorizontal(getValue(style, STYLE_HORIZONTAL, isHorizontal()));
      setBackground(
        getValue(style, STYLE_LABEL_BACKGROUNDCOLOR, getBackground())
      );
      setBorder(getValue(style, STYLE_LABEL_BORDERCOLOR, getBorder()));
      setTextDirection(
        getValue(style, STYLE_TEXT_DIRECTION, DEFAULT_TEXT_DIRECTION)
      );
      setOpacity(getValue(style, STYLE_TEXT_OPACITY, 100));
      updateMargin();
    }

    setFlipV();
    setFlipH();
  };

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

  const getContentNode = () => {
    const result = getNode();

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

  const updateBoundingBox = () => {
    const node = getNode();
    setBoundingBox(getBounds().clone());
    const rot = getTextRotation();
    const style = getStyle();
    const scale = getScale();

    const h = isSet(style)
      ? getValue(style, STYLE_LABEL_POSITION, ALIGN_CENTER)
      : null;
    const v = isSet(style)
      ? getValue(style, STYLE_VERTICAL_LABEL_POSITION, ALIGN_MIDDLE)
      : null;

    if (
      !isIgnoreStringSize() &&
      isSet(node) &&
      getOverflow() !== 'fill' &&
      (!isClipped() ||
        !isIgnoreClippedStringSize() ||
        h !== ALIGN_CENTER ||
        v !== ALIGN_MIDDLE)
    ) {
      let ow = null;
      let oh = null;

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
        const td = isSet(getState()) ? getState().getView().textDiv : null;

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
          Rectangle(getBounds().getX(), getBounds().getY(), ow, oh)
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

  const getShapeRotation = () => 0;

  const getTextRotation = () =>
    isSet(getState()) && isSet(getState().getShape())
      ? getState().getShape().getTextRotation()
      : 0;

  const isPaintBoundsInverted = () =>
    !isHorizontal() &&
    isSet(getState()) &&
    getState().getView().getGraph().getModel().isVertex(getState().getCell());

  const configureCanvas = (c, x, y, w, h) => {
    _configureCanvas(c, x, y, w, h);

    c.setFontColor(getColor());
    c.setFontBackgroundColor(getBackground());
    c.setFontBorderColor(getBorder());
    c.setFontFamily(getFamily());
    c.setFontSize(getSize());
    c.setFontStyle(getFontStyle());
  };

  const getHtmlValue = () => {
    let val = htmlEntities(getData(), false);

    // Handles trailing newlines to make sure they are visible in rendering output
    val = replaceTrailingNewlines(val, '<div><br></div>');
    val = isReplaceLinefeeds() ? val.replace(/\n/g, '<br/>') : val;

    return val;
  };

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
      (isPointerEvents() ? 'all' : 'none') +
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

  const redrawHtmlShape = () => redrawHtmlShapeWithCss3();

  const redrawHtmlShapeWithCss3 = () => {
    const bounds = getBounds();
    const scale = getScale();
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
    const node = getNode();

    SvgCanvas2D.createCss(
      w + 2,
      h,
      getAlign(),
      getValign(),
      isWrap(),
      getOverflow(),
      isClipped(),
      isSet(getBackground()) ? htmlEntities(getBackground()) : null,
      isSet(getBorder()) ? htmlEntities(getBorder()) : null,
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

  const updateMargin = () =>
    setMargin(getAlignmentAsPoint(getAlign(), getValign()));

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

  const me = {
    paint
  };

  return me;
};

export default Text;
