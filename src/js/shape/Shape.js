/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import Client from '../Client';
import { noop } from '../Helpers';
import {
  DIALECT_SVG,
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  DIRECTION_WEST,
  LINE_ARCSIZE,
  NONE,
  RECTANGLE_ROUNDING_FACTOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  STYLE_ABSOLUTE_ARCSIZE,
  STYLE_ARCSIZE,
  STYLE_BACKGROUND_OUTLINE,
  STYLE_FILLCOLOR,
  STYLE_FIX_DASH,
  STYLE_HORIZONTAL,
  STYLE_ROUNDED,
  STYLE_SHADOW,
  VML_SHADOWCOLOR
} from '../util/Constants';
import Rectangle from '../util/Rectangle';
import SvgCanvas2D from '../util/SvgCanvas2D';
import {
  addProp,
  addTransparentBackgroundFilter,
  getDirectedBounds,
  getValue,
  isSet,
  isUnset,
  mod
} from '../util/Utils';

/**
 * Class: Shape
 *
 * Base class for all shapes. A shape in mxGraph is a
 * separate implementation for SVG, VML and HTML. Which
 * implementation to use is controlled by the <dialect>
 * property which is assigned from within the <mxCellRenderer>
 * when the shape is created. The dialect must be assigned
 * for a shape, and it does normally depend on the browser and
 * the confiuration of the graph (see <mxGraph> rendering hint).
 *
 * For each supported shape in SVG and VML, a corresponding
 * shape exists in mxGraph, namely for text, image, rectangle,
 * rhombus, ellipse and polyline. The other shapes are a
 * combination of these shapes (eg. label and swimlane)
 * or they consist of one or more (filled) path objects
 * (eg. actor and cylinder). The HTML implementation is
 * optional but may be required for a HTML-only view of
 * the graph.
 *
 * Custom Shapes:
 *
 * To extend from this class, the basic code looks as follows.
 * In the special case where the custom shape consists only of
 * one filled region or one filled region and an additional stroke
 * the <mxActor> and <mxCylinder> should be subclassed,
 * respectively.
 *
 * (code)
 * function CustomShape() { }
 *
 * CustomShape.prototype = new mxShape();
 * CustomShape.prototype.constructor = CustomShape;
 * (end)
 *
 * To register a custom shape in an existing graph instance,
 * one must register the shape under a new name in the graph's
 * cell renderer as follows:
 *
 * (code)
 * mxCellRenderer.registerShape('customShape', CustomShape);
 * (end)
 *
 * The second argument is the name of the constructor.
 *
 * In order to use the shape you can refer to the given name above
 * in a stylesheet. For example, to change the shape for the default
 * vertex style, the following code is used:
 *
 * (code)
 * var style = graph.getStylesheet().getDefaultVertexStyle();
 * style[mxConstants.STYLE_SHAPE] = 'customShape';
 * (end)
 *
 * Constructor: Shape
 *
 * Constructs a new shape.
 */
const Shape = (stencil) => {
  /**
   * Variable: scale
   *
   * Holds the scale in which the shape is being painted.
   */
  const [getScale, setScale] = addProp(1);

  /**
   * Variable: antiAlias
   *
   * Rendering hint for configuring the canvas.
   */
  const [isAntiAlias, setAntiAlias] = addProp(true);

  /**
   * Variable: minSvgStrokeWidth
   *
   * Minimum stroke width for SVG output.
   */
  const [getMinSvgStrokeWidth, setMinSvgStrokeWidth] = addProp(1);

  /**
   * Variable: bounds
   *
   * Holds the <mxRectangle> that specifies the bounds of this shape.
   */
  const [getBounds, setBounds] = addProp();

  /**
   * Variable: points
   *
   * Holds the array of <mxPoints> that specify the points of this shape.
   */
  const [getPoints, setPoints] = addProp();

  /**
   * Variable: node
   *
   * Holds the outermost DOM node that represents this shape.
   */
  const [getNode, setNode] = addProp();

  /**
   * Variable: state
   *
   * Optional reference to the corresponding <mxCellState>.
   */
  const [getState, setState] = addProp();

  /**
   * Variable: style
   *
   * Optional reference to the style of the corresponding <mxCellState>.
   */
  const [getStyle, setStyle] = addProp();

  /**
   * Variable: boundingBox
   *
   * Contains the bounding box of the shape, that is, the smallest rectangle
   * that includes all pixels of the shape.
   */
  const [getBoundingBox, setBoundingBox] = addProp();

  /**
   * Variable: stencil
   *
   * Holds the <mxStencil> that defines the shape.
   */
  const [getStencil, setStencil] = addProp(stencil);

  /**
   * Variable: svgStrokeTolerance
   *
   * Event-tolerance for SVG strokes (in px). Default is 8. This is only passed
   * to the canvas in <createSvgCanvas> if <pointerEvents> is true.
   */
  const [getSvgStrokeTolerance, setSvgStrokeTolerance] = addProp(8);

  /**
   * Variable: pointerEvents
   *
   * Specifies if pointer events should be handled. Default is true.
   */
  const [isPointerEvents, setPointerEvents] = addProp(true);

  /**
   * Variable: svgPointerEvents
   *
   * Specifies if pointer events should be handled. Default is true.
   */
  const [getSvgPointerEvents, setSvgPointerEvents] = addProp('all');

  /**
   * Variable: shapePointerEvents
   *
   * Specifies if pointer events outside of shape should be handled. Default
   * is false.
   */
  const [isShapePointerEvents, setShapePointerEvents] = addProp(false);

  /**
   * Variable: stencilPointerEvents
   *
   * Specifies if pointer events outside of stencils should be handled. Default
   * is false. Set this to true for backwards compatibility with the 1.x branch.
   */
  const [isStencilPointerEvents, setStencilPointerEvents] = addProp(false);

  /**
   * Variable: outline
   *
   * Specifies if the shape should be drawn as an outline. This disables all
   * fill colors and can be used to disable other drawing states that should
   * not be painted for outlines. Default is false. This should be set before
   * calling <apply>.
   */
  const [isOutline, setOutline] = addProp(false);

  /**
   * Variable: visible
   *
   * Specifies if the shape is visible. Default is true.
   */
  const [isVisible, setVisible] = addProp(true);

  /**
   * Variable: useSvgBoundingBox
   *
   * Allows to use the SVG bounding box in SVG. Default is false for performance
   * reasons.
   */
  const [isUseSvgBoundingBox, setUseSvgBoundingBox] = addProp(false);
  const [getStrokeWidth, setStrokeWidth] = addProp(1);
  const [getRotation, setRotation] = addProp(0);
  const [getOpacity, setOpacity] = addProp(100);
  const [getFillOpacity, setFillOpacity] = addProp(100);
  const [getStrokeOpacity, setStrokeOpacity] = addProp(100);
  const [isFlipH, setFlipH] = addProp(false);
  const [isFlipV, setFlipV] = addProp(false);
  const [getCursor, _setCursor] = addProp();
  const [getFill, setFill] = addProp();
  const [getGradient, setGradient] = addProp();
  const [getGradientDirection, setGradientDirection] = addProp();
  const [getStroke, setStroke] = addProp();
  const [getSpacing, setSpacing] = addProp();
  const [getStartSize, setStartSize] = addProp();
  const [getEndSize, setEndSize] = addProp();
  const [getStartArrow, setStartArrow] = addProp();
  const [getEndArrow, setEndArrow] = addProp();
  const [getDirection, setDirection] = addProp();
  const [isRounded, setRounded] = addProp(false);
  const [isGlass, setGlass] = addProp(false);

  /**
   * Function: init
   *
   * Initializes the shape by creaing the DOM node using <create>
   * and adding it into the given container.
   *
   * Parameters:
   *
   * container - DOM node that will contain the shape.
   */
  const init = (container) => {
    if (isUnset(getNode())) {
      setNode(create(container));

      if (isSet(container)) container.appendChild(getNode());
    }
  };

  /**
   * Function: initStyles
   *
   * Sets the styles to their default values.
   */
  const initStyles = (container) => {
    setStrokeWidth(1);
    setRotation(0);
    setOpacity(100);
    setFillOpacity(100);
    setStrokeOpacity(100);
    setFlipH(false);
    setFlipV(false);
  };

  /**
   * Function: isHtmlAllowed
   *
   * Returns true if HTML is allowed for this shape. This implementation always
   * returns false.
   */
  const isHtmlAllowed = () => false;

  /**
   * Function: getSvgScreenOffset
   *
   * Returns 0, or 0.5 if <strokewidth> % 2 == 1.
   */
  const getSvgScreenOffset = () => {
    const stencil = getStencil();
    const sw =
      isSet(stencil) && stencil.getStrokeWidth() !== 'inherit'
        ? Number(stencil.getStrokeWidth())
        : getStrokeWidth();

    return mod(Math.max(1, Math.round(sw * getScale())), 2) === 1 ? 0.5 : 0;
  };

  /**
   * Function: create
   *
   * Creates and returns the DOM node(s) for the shape in
   * the given container. This implementation invokes
   * <createSvg>, <createHtml> or <createVml> depending
   * on the <dialect> and style settings.
   *
   * Parameters:
   *
   * container - DOM node that will contain the shape.
   */
  const create = (container) => {
    if (isSet(container) && isSet(container.ownerSVGElement)) {
      return createSvg(container);
    }
  };

  /**
   * Function: createSvg
   *
   * Creates and returns the SVG node(s) to represent this shape.
   */
  const createSvg = () => document.createElementNS(NS_SVG, 'g');

  /**
   * Function: createHtml
   *
   * Creates and returns the HTML DOM node(s) to represent
   * this shape. This implementation falls back to <createVml>
   * so that the HTML creation is optional.
   */
  const createHtml = () => {
    const node = document.createElement('div');
    node.style.position = 'absolute';

    return node;
  };

  /**
   * Function: reconfigure
   *
   * Reconfigures this shape. This will update the colors etc in
   * addition to the bounds or points.
   */
  const reconfigure = () => redraw();

  /**
   * Function: redraw
   *
   * Creates and returns the SVG node(s) to represent this shape.
   */
  const redraw = () => {
    updateBoundsFromPoints();

    if (isVisible() && checkBounds()) {
      getNode().style.visibility = 'visible';
      clear();

      if (getNode().nodeName === 'DIV' && (isHtmlAllowed() || !Client.IS_VML))
        redrawHtmlShape();
      else redrawShape();

      updateBoundingBox();
    } else {
      getNode().style.visibility = 'hidden';
      setBoundingBox(null);
    }
  };

  /**
   * Function: clear
   *
   * Removes all child nodes and resets all CSS.
   */
  const clear = () => {
    const node = getNode();

    if (isSet(node.ownerSVGElement)) {
      while (isSet(node.lastChild)) {
        node.removeChild(node.lastChild);
      }
    } else {
      node.style.cssText =
        'position: absolute;' +
        (isSet(getCursor()) ? 'cursor: ' + getCursor() + ';' : '');
      node.innerHTML = '';
    }
  };

  /**
   * Function: updateBoundsFromPoints
   *
   * Updates the bounds based on the points.
   */
  const updateBoundsFromPoints = () => {
    const pts = getPoints();

    if (isSet(pts) && pts.length > 0 && isSet(pts[0])) {
      setBounds(Rectangle(Number(pts[0].getX()), Number(pts[0].getY()), 1, 1));

      for (let i = 1; i < pts.length; i++) {
        if (isSet(pts[i])) {
          getBounds().add(
            Rectangle(Number(pts[i].getX()), Number(pts[i].getY()), 1, 1)
          );
        }
      }
    }
  };

  /**
   * Function: getLabelBounds
   *
   * Returns the <mxRectangle> for the label bounds of this shape, based on the
   * given scaled and translated bounds of the shape. This method should not
   * change the rectangle in-place. This implementation returns the given rect.
   */
  const getLabelBounds = (rect) => {
    const d = getValue(getStyle(), STYLE_DIRECTION, DIRECTION_EAST);
    let bounds = rect;
    const state = getState();

    // Normalizes argument for getLabelMargins hook
    if (
      d !== DIRECTION_SOUTH &&
      d !== DIRECTION_NORTH &&
      isSet(state) &&
      isSet(state.getText()) &&
      state.getText().isPaintBoundsInverted()
    ) {
      bounds = bounds.clone();
      const tmp = bounds.getWidth();
      bounds.setWidth(bounds.getHeight());
      bounds.setHeight(tmp);
    }

    const m = getLabelMargins(bounds);

    if (isSet(m)) {
      let flipH = getValue(getStyle(), STYLE_FLIPH, false) === '1';
      let flipV = getValue(getStyle(), STYLE_FLIPV, false) === '1';

      // Handles special case for vertical labels
      if (
        isSet(state) &&
        isSet(state.getText()) &&
        state.getText().isPaintBoundsInverted()
      ) {
        let tmp = m.getX();
        m.setX(m.getHeight());
        m.setHeight(m.getWidth());
        m.setWidth(m.getY());
        m.setY(tmp);

        tmp = flipH;
        flipH = flipV;
        flipV = tmp;
      }

      return getDirectedBounds(rect, m, getStyle(), flipH, flipV);
    }

    return rect;
  };

  /**
   * Function: getLabelMargins
   *
   * Returns the scaled top, left, bottom and right margin to be used for
   * computing the label bounds as an <mxRectangle>, where the bottom and right
   * margin are defined in the width and height of the rectangle, respectively.
   */
  const getLabelMargins = (rect) => null;

  /**
   * Function: checkBounds
   *
   * Returns true if the bounds are not null and all of its variables are numeric.
   */
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
      !isNaN(bounds.getHeight()) &&
      bounds.getWidth() > 0 &&
      bounds.getHeight() > 0
    );
  };

  /**
   * Function: redrawShape
   *
   * Updates the SVG or VML shape.
   */
  const redrawShape = () => {
    const canvas = createCanvas();

    if (isSet(canvas)) {
      // Specifies if events should be handled
      canvas.setPointerEvents(getPointerEvents());

      beforePaint(canvas);
      paint(canvas);
      afterPaint(canvas);

      if (getNode() !== canvas.getRoot()) {
        // Forces parsing in IE8 standards mode - slow! avoid
        getNode().insertAdjacentHTML('beforeend', canvas.getRoot().outerHTML);
      }

      destroyCanvas(canvas);
    }
  };

  /**
   * Function: createCanvas
   *
   * Creates a new canvas for drawing this shape. May return null.
   */
  const createCanvas = () => {
    let canvas = null;

    // LATER: Check if reusing existing DOM nodes improves performance
    if (isSet(getNode().ownerSVGElement)) {
      canvas = createSvgCanvas();
    }

    if (isSet(canvas) && isOutline()) {
      canvas.setStrokeWidth(getStrokewidth());
      canvas.setStrokeColor(getStroke());

      if (isSet(isDashed())) {
        canvas.setDashed(isDashed());
      }

      canvas.setStrokeWidth = function () {};
      canvas.setStrokeColor = function () {};
      canvas.setFillColor = function () {};
      canvas.setGradient = function () {};
      canvas.setDashed = function () {};
      canvas.text = function () {};
    }

    return canvas;
  };

  /**
   * Function: createSvgCanvas
   *
   * Creates and returns an <mxSvgCanvas2D> for rendering this shape.
   */
  const createSvgCanvas = () => {
    const canvas = SvgCanvas2D(getNode(), false);
    canvas.setStrokeTolerance(isPointerEvents() ? getSvgStrokeTolerance() : 0);
    canvas.setPointerEventsValue(getSvgPointerEvents());
    const off = getSvgScreenOffset();

    if (off !== 0) {
      getNode().setAttribute('transform', 'translate(' + off + ',' + off + ')');
    } else {
      getNode().removeAttribute('transform');
    }

    canvas.setMinStrokeWidth(getMinSvgStrokeWidth());

    if (!isAntiAlias()) {
      // Rounds all numbers in the SVG output to integers
      canvas.format = (value) => Math.round(parseFloat(value));
    }

    return canvas;
  };

  /**
   * Function: redrawHtml
   *
   * Allow optimization by replacing VML with HTML.
   */
  const redrawHtmlShape = () => {
    // LATER: Refactor methods
    updateHtmlBounds(getNode());
    updateHtmlFilters(getNode());
    updateHtmlColors(getNode());
  };

  /**
   * Function: updateHtmlFilters
   *
   * Allow optimization by replacing VML with HTML.
   */
  const updateHtmlFilters = (node) => {
    var f = '';

    if (getOpacity() < 100) {
      f += 'alpha(opacity=' + getOpacity() + ')';
    }

    /* TODO: should implement linear gradient the standard way
    if (
      isSet(getFill()) &&
      getFill() !== NONE &&
      getGradient() &&
      getGradient() !== NONE
    ) {
      let start = getFill();
      let end = getGradient();

      const lookup = { east: 0, south: 1, west: 2, north: 3 };
      let dir = isSet(getDirection()) ? lookup[getDirection()] : 0;

      if (isSet(getGradientDirection())) {
        dir = mod(dir + lookup[getGradientDirection()] - 1, 4);
      }

      if (dir === 1) {
        const tmp = start;
        start = end;
        end = tmp;
      } else if (dir === 2) {
        const tmp = start;
        start = end;
        end = tmp;
      }
    }
    */

    node.style.filter = f;
  };

  /**
   * Function: updateHtmlColors
   *
   * Allow optimization by replacing VML with HTML.
   */
  const updateHtmlColors = (node) => {
    let color = getStroke();

    if (isSet(color) && color !== NONE) {
      node.style.borderColor = color;

      if (isDashed()) {
        node.style.borderStyle = 'dashed';
      } else if (getStrokewidth() > 0) {
        node.style.borderStyle = 'solid';
      }

      node.style.borderWidth =
        Math.max(1, Math.ceil(getStrokewidth() * getScale())) + 'px';
    } else {
      node.style.borderWidth = '0px';
    }

    color = isOutline() ? null : getFill();

    if (isSet(color) && color !== NONE) {
      node.style.backgroundColor = color;
      node.style.backgroundImage = 'none';
    } else if (isPointerEvents()) {
      node.style.backgroundColor = 'transparent';
    } else {
      setTransparentBackgroundImage(node);
    }
  };

  /**
   * Function: updateHtmlBounds
   *
   * Allow optimization by replacing VML with HTML.
   */
  const updateHtmlBounds = (node) => {
    let sw = Math.ceil(getStrokewidth() * getScale());
    node.style.borderWidth = Math.max(1, sw) + 'px';
    node.style.overflow = 'hidden';

    node.style.left = Math.round(getBounds().getX() - sw / 2) + 'px';
    node.style.top = Math.round(getBounds().getY() - sw / 2) + 'px';

    sw = -sw;

    node.style.width =
      Math.round(Math.max(0, getBounds().getWidth() + sw)) + 'px';
    node.style.height =
      Math.round(Math.max(0, getBounds().getHeight() + sw)) + 'px';
  };

  /**
   * Function: destroyCanvas
   *
   * Destroys the given canvas which was used for drawing. This implementation
   * increments the reference counts on all shared gradients used in the canvas.
   */
  const destroyCanvas = (canvas) => {
    // Manages reference counts
    if (canvas.constructor === SvgCanvas2D) {
      // Increments ref counts
      for (const key in canvas.getGradients()) {
        const gradient = canvas.getGradients()[key];

        if (isSet(gradient)) {
          gradient.mxRefCount = (gradient.mxRefCount || 0) + 1;
        }
      }

      releaseSvgGradients(getOldGradients());
      setOldGradients(canvas.getGradients());
    }
  };

  /**
   * Function: beforePaint
   *
   * Invoked before paint is called.
   */
  const beforePaint = noop;

  /**
   * Function: afterPaint
   *
   * Invokes after paint was called.
   */
  const afterPaint = noop;

  /**
   * Function: paint
   *
   * Generic rendering code.
   */
  const paint = (c) => {
    let strokeDrawn = false;

    if (isSet(c) && isOutline()) {
      const stroke = c.stroke;

      c.stroke = () => {
        strokeDrawn = true;
        stroke();
      };

      const fillAndStroke = c.fillAndStroke;

      c.fillAndStroke = () => {
        strokeDrawn = true;
        fillAndStroke();
      };
    }

    // Scale is passed-through to canvas
    const s = getScale();
    const b = getBounds();
    let x = b.getX() / s;
    let y = b.getY() / s;
    let w = b.getWidth() / s;
    let h = b.getHeight() / s;

    if (isPaintBoundsInverted()) {
      const t = (w - h) / 2;
      x += t;
      y -= t;
      const tmp = w;
      w = h;
      h = tmp;
    }

    updateTransform(c, x, y, w, h);
    configureCanvas(c, x, y, w, h);

    // Adds background rectangle to capture events
    let bg = null;

    if (
      (isUnset(getStencil()) &&
        isUnset(getPoints()) &&
        isShapePointerEvents()) ||
      (isSet(getStencil()) && isStencilPointerEvents())
    ) {
      const bb = createBoundingBox();

      bg = createTransparentSvgRectangle(
        bb.getX(),
        bb.getY(),
        bb.getWidth(),
        bb.getHeight()
      );
      getNode().appendChild(bg);
    }

    if (isSet(getStencil())) {
      getStencil().drawShape(c, me, x, y, w, h);
    } else {
      // Stencils have separate strokewidth
      c.setStrokeWidth(getStrokewidth());

      if (isSet(getPoints())) {
        // Paints edge shape
        const pts = [];
        const points = getPoints();

        for (let i = 0; i < points.length; i++) {
          if (isSet(points[i])) {
            pts.push(Point(points[i].getX() / s, points[i].getY() / s));
          }
        }

        paintEdgeShape(c, pts);
      } else {
        // Paints vertex shape
        paintVertexShape(c, x, y, w, h);
      }
    }

    if (isSet(bg) && isSet(c.getState()) && isSet(c.getState().transform)) {
      bg.setAttribute('transform', c.getState().transform);
    }

    // Draws highlight rectangle if no stroke was used
    if (isSet(c) && isOutline() && !strokeDrawn) {
      c.rect(x, y, w, h);
      c.stroke();
    }
  };

  /**
   * Function: configureCanvas
   *
   * Sets the state of the canvas for drawing the shape.
   */
  const configureCanvas = (c, x, y, w, h) => {
    let dash = null;
    const style = getStyle();

    if (isSet(style)) {
      dash = style['dashPattern'];
    }

    c.setAlpha(getOpacity() / 100);
    c.setFillAlpha(getFillOpacity() / 100);
    c.setStrokeAlpha(getStrokeOpacity() / 100);

    // Sets alpha, colors and gradients
    if (isSet(isShadow())) {
      c.setShadow(isShadow());
    }

    // Dash pattern
    if (isSet(isDashed())) {
      c.setDashed(
        isDashed(),
        isSet(style) ? getValue(style, STYLE_FIX_DASH, false) === 1 : false
      );
    }

    if (isSet(dash)) {
      c.setDashPattern(dash);
    }

    const fill = getFill();
    const gradient = getGradient();

    if (isSet(fill) && fill !== NONE && isSet(gradient) && gradient !== NONE) {
      var b = getGradientBounds(c, x, y, w, h);
      c.setGradient(
        fill,
        gradient,
        b.getX(),
        b.getY(),
        b.getWidth(),
        b.getHeight(),
        getGradientDirection()
      );
    } else {
      c.setFillColor(fill);
    }

    c.setStrokeColor(stroke);
  };

  /**
   * Function: getGradientBounds
   *
   * Returns the bounding box for the gradient box for this shape.
   */
  const getGradientBounds = (c, x, y, w, h) => Rectangle(x, y, w, h);

  /**
   * Function: updateTransform
   *
   * Sets the scale and rotation on the given canvas.
   */
  const updateTransform = (c, x, y, w, h) => {
    // NOTE: Currently, scale is implemented in state and canvas. This will
    // move to canvas in a later version, so that the states are unscaled
    // and untranslated and do not need an update after zooming or panning.
    c.scale(getScale());
    c.rotate(getShapeRotation(), isFlipH(), isFlipV(), x + w / 2, y + h / 2);
  };

  /**
   * Function: paintVertexShape
   *
   * Paints the vertex shape.
   */
  const paintVertexShape = (c, x, y, w, h) => {
    paintBackground(c, x, y, w, h);

    if (
      !isOutline() ||
      isUnset(getStyle()) ||
      getValue(getStyle(), STYLE_BACKGROUND_OUTLINE, 0) === 0
    ) {
      c.setShadow(false);
      paintForeground(c, x, y, w, h);
    }
  };

  /**
   * Function: paintBackground
   *
   * Hook for subclassers. This implementation is empty.
   */
  const paintBackground = noop;

  /**
   * Function: paintForeground
   *
   * Hook for subclassers. This implementation is empty.
   */
  const paintForeground = noop;

  /**
   * Function: paintEdgeShape
   *
   * Hook for subclassers. This implementation is empty.
   */
  const paintEdgeShape = noop;

  /**
   * Function: getArcSize
   *
   * Returns the arc size for the given dimension.
   */
  const getArcSize = (w, h) => {
    let r = 0;

    if (getValue(getStyle(), STYLE_ABSOLUTE_ARCSIZE, 0) === '1') {
      r = Math.min(
        w / 2,
        Math.min(h / 2, getValue(getStyle(), STYLE_ARCSIZE, LINE_ARCSIZE) / 2)
      );
    } else {
      const f =
        getValue(getStyle(), STYLE_ARCSIZE, RECTANGLE_ROUNDING_FACTOR * 100) /
        100;
      r = Math.min(w * f, h * f);
    }

    return r;
  };

  /**
   * Function: paintGlassEffect
   *
   * Paints the glass gradient effect.
   */
  const paintGlassEffect = (c, x, y, w, h, arc) => {
    const sw = Math.ceil(getStrokewidth() / 2);
    const size = 0.4;

    c.setGradient('#ffffff', '#ffffff', x, y, w, h * 0.6, 'south', 0.9, 0.1);
    c.begin();
    arc += 2 * sw;

    if (isRounded()) {
      c.moveTo(x - sw + arc, y - sw);
      c.quadTo(x - sw, y - sw, x - sw, y - sw + arc);
      c.lineTo(x - sw, y + h * size);
      c.quadTo(x + w * 0.5, y + h * 0.7, x + w + sw, y + h * size);
      c.lineTo(x + w + sw, y - sw + arc);
      c.quadTo(x + w + sw, y - sw, x + w + sw - arc, y - sw);
    } else {
      c.moveTo(x - sw, y - sw);
      c.lineTo(x - sw, y + h * size);
      c.quadTo(x + w * 0.5, y + h * 0.7, x + w + sw, y + h * size);
      c.lineTo(x + w + sw, y - sw);
    }

    c.close();
    c.fill();
  };

  /**
   * Function: addPoints
   *
   * Paints the given points with rounded corners.
   */
  const addPoints = (
    c,
    pts,
    rounded,
    arcSize,
    close,
    exclude,
    initialMove = true
  ) => {
    if (isSet(pts) && pts.length > 0) {
      const pe = pts[pts.length - 1];

      // Adds virtual waypoint in the center between start and end point
      if (close && rounded) {
        pts = pts.slice();
        const p0 = pts[0];
        const wp = new mxPoint(
          pe.getX() + (p0.getX() - pe.getX()) / 2,
          pe.getY() + (p0.getY() - pe.getY()) / 2
        );
        pts.splice(0, 0, wp);
      }

      let pt = pts[0];
      let i = 1;

      // Draws the line segments
      if (initialMove) {
        c.moveTo(pt.getX(), pt.getY());
      } else {
        c.lineTo(pt.getX(), pt.getY());
      }

      while (i < (close ? pts.length : pts.length - 1)) {
        let tmp = pts[mxUtils.mod(i, pts.length)];
        let dx = pt.getX() - tmp.getX();
        let dy = pt.getY() - tmp.getY();

        if (
          rounded &&
          (dx !== 0 || dy !== 0) &&
          (isUnset(exclude) || exclude.indexOf(i - 1) < 0)
        ) {
          // Draws a line from the last point to the current
          // point with a spacing of size off the current point
          // into direction of the last point
          let dist = Math.sqrt(dx * dx + dy * dy);
          const nx1 = (dx * Math.min(arcSize, dist / 2)) / dist;
          const ny1 = (dy * Math.min(arcSize, dist / 2)) / dist;

          const x1 = tmp.getX() + nx1;
          const y1 = tmp.getY() + ny1;
          c.lineTo(x1, y1);

          // Draws a curve from the last point to the current
          // point with a spacing of size off the current point
          // into direction of the next point
          let next = pts[mod(i + 1, pts.length)];

          // Uses next non-overlapping point
          while (
            i < pts.length - 2 &&
            Math.round(next.getX() - tmp.getX()) === 0 &&
            Math.round(next.getY() - tmp.getY()) === 0
          ) {
            next = pts[mod(i + 2, pts.length)];
            i++;
          }

          dx = next.getX() - tmp.getX();
          dy = next.getY() - tmp.getY();

          dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const nx2 = (dx * Math.min(arcSize, dist / 2)) / dist;
          const ny2 = (dy * Math.min(arcSize, dist / 2)) / dist;

          const x2 = tmp.getX() + nx2;
          const y2 = tmp.getY() + ny2;

          c.quadTo(tmp.getX(), tmp.getY(), x2, y2);
          tmp = Point(x2, y2);
        } else {
          c.lineTo(tmp.getX(), tmp.getY());
        }

        pt = tmp;
        i++;
      }

      if (close) {
        c.close();
      } else {
        c.lineTo(pe.getX(), pe.getY());
      }
    }
  };

  /**
   * Function: resetStyles
   *
   * Resets all styles.
   */
  const resetStyles = () => {
    initStyles();

    setSpacing(0);
    setFill();
    setGradient();
    setGradientDirection();
    setStroke();
    setStartSize();
    setEndSize();
    setStartArrow();
    setEndArrow();
    setDirection();
    setShadow();
    setDashed();
    setGlass();
  };

  /**
   * Function: apply
   *
   * Applies the style of the given <mxCellState> to the shape. This
   * implementation assigns the following styles to local fields:
   *
   * - <mxConstants.STYLE_FILLCOLOR> => fill
   * - <mxConstants.STYLE_GRADIENTCOLOR> => gradient
   * - <mxConstants.STYLE_GRADIENT_DIRECTION> => gradientDirection
   * - <mxConstants.STYLE_OPACITY> => opacity
   * - <mxConstants.STYLE_FILL_OPACITY> => fillOpacity
   * - <mxConstants.STYLE_STROKE_OPACITY> => strokeOpacity
   * - <mxConstants.STYLE_STROKECOLOR> => stroke
   * - <mxConstants.STYLE_STROKEWIDTH> => strokewidth
   * - <mxConstants.STYLE_SHADOW> => isShadow
   * - <mxConstants.STYLE_DASHED> => isDashed
   * - <mxConstants.STYLE_SPACING> => spacing
   * - <mxConstants.STYLE_STARTSIZE> => startSize
   * - <mxConstants.STYLE_ENDSIZE> => endSize
   * - <mxConstants.STYLE_ROUNDED> => isRounded
   * - <mxConstants.STYLE_STARTARROW> => startArrow
   * - <mxConstants.STYLE_ENDARROW> => endArrow
   * - <mxConstants.STYLE_ROTATION> => rotation
   * - <mxConstants.STYLE_DIRECTION> => direction
   * - <mxConstants.STYLE_GLASS> => glass
   *
   * This keeps a reference to the <style>. If you need to keep a reference to
   * the cell, you can override this method and store a local reference to
   * state.cell or the <mxCellState> itself. If <outline> should be true, make
   * sure to set it before calling this method.
   *
   * Parameters:
   *
   * state - <mxCellState> of the corresponding cell.
   */
  const apply = (state) => {
    setState(state);

    const style = state.getStyle();
    setStyle(style);

    if (isSet(style)) {
      setFill(getValue(style, STYLE_FILLCOLOR, getFill()));
      setGradient(getValue(style, STYLE_GRADIENTCOLOR, getGradient()));
      setGradientDirection(
        getValue(style, STYLE_GRADIENT_DIRECTION, getGradientDirection())
      );
      setOpacity(getValue(style, STYLE_OPACITY, getOpacity()));
      setFillOpacity(getValue(style, STYLE_FILL_OPACITY, getFillOpacity()));
      setStrokeOpacity(
        getValue(style, STYLE_STROKE_OPACITY, getStrokeOpacity())
      );
      setStroke(getValue(style, STYLE_STROKECOLOR, getStroke()));
      setStrokeWidth(getValue(style, STYLE_STROKEWIDTH, getStrokeWidth()));
      setSpacing(getValue(style, STYLE_SPACING, getSpacing()));
      setStartSize(getValue(style, STYLE_STARTSIZE, getStartSize()));
      setEndSize(getValue(style, STYLE_ENDSIZE, getEndSize()));
      setStartArrow(getValue(style, STYLE_STARTARROW, getStartArrow()));
      setEndArrow(getValue(style, STYLE_ENDARROW, getEndArrow()));
      setRotation(getValue(style, STYLE_ROTATION, getRotation()));
      setDirection(getValue(style, STYLE_DIRECTION, getDirection()));
      setFlipH(getValue(style, STYLE_FLIPH, false));
      setFlipV(getValue(style, STYLE_FLIPV, false));

      if (
        getDirection() === DIRECTION_NORTH ||
        getDirection() === DIRECTION_SOUTH
      ) {
        const tmp = isFlipH();
        setFlipH(getFlipV());
        setFlipV(tmp);
      }

      setShadow(getValue(style, STYLE_SHADOW, isShadow()));
      setDashed(getValue(style, STYLE_DASHED, isDashed()));
      setRounded(getValue(style, STYLE_ROUNDED, isRounded()));
      setGlass(getValue(style, STYLE_GLASS, isGlass()));

      if (getFill() === NONE) setFill();
      if (getGradient() === NONE) setGradient();
      if (getStroke() === NONE) setStroke();
    }
  };

  /**
   * Function: setCursor
   *
   * Sets the cursor on the given shape.
   *
   * Parameters:
   *
   * cursor - The cursor to be used.
   */
  const setCursor = (cursor = '') => {
    _setCursor(cursor);

    if (isSet(getNode())) getNode().getStyle().cursor = cursor;
  };

  /**
   * Function: isRoundable
   *
   * Hook for subclassers.
   */
  const isRoundable = () => false;

  /**
   * Function: updateBoundingBox
   *
   * Updates the <boundingBox> for this shape using <createBoundingBox> and
   * <augmentBoundingBox> and stores the result in <boundingBox>.
   */
  const updateBoundingBox = () => {
    // Tries to get bounding box from SVG subsystem
    // LATER: Use getBoundingClientRect for fallback in VML
    if (
      isUseSvgBoundingBox() &&
      isSet(getNode()) &&
      isSet(getNode().ownerSVGElement)
    ) {
      try {
        const b = getNode().getBBox();

        if (b.getWidth() > 0 && b.getHeight() > 0) {
          setBoundingBox(
            Rectangle(b.getX(), b.getY(), b.getWidth(), b.getHeight())
          );

          // Adds strokeWidth
          getBoundingBox().grow((getStrokewidth() * getScale()) / 2);

          return;
        }
      } catch (e) {
        // fallback to code below
      }
    }

    if (isSet(getBounds())) {
      let bbox = createBoundingBox();

      if (isSet(bbox)) {
        augmentBoundingBox(bbox);
        const rot = getShapeRotation();

        if (rot !== 0) {
          bbox = getBoundingBox(bbox, rot);
        }
      }

      setBoundingBox(bbox);
    }
  };

  /**
   * Function: createBoundingBox
   *
   * Returns a new rectangle that represents the bounding box of the bare shape
   * with no shadows or strokewidths.
   */
  const createBoundingBox = () => {
    const bb = getBounds().clone();

    if (
      (isSet(getStencil()) &&
        (getDirection() === DIRECTION_NORTH ||
          getDirection() === DIRECTION_SOUTH)) ||
      isPaintBoundsInverted()
    ) {
      bb.rotate90();
    }

    return bb;
  };

  /**
   * Function: augmentBoundingBox
   *
   * Augments the bounding box with the strokewidth and shadow offsets.
   */
  const augmentBoundingBox = (bbox) => {
    if (isShadow()) {
      bbox.setWidth(bbox.getWidth() + Math.ceil(SHADOW_OFFSET_X * getScale()));
      bbox.setHeight(
        bbox.getHeight() + Math.ceil(SHADOW_OFFSET_Y * getScale())
      );
    }

    // Adds strokeWidth
    bbox.grow((getStrokeWidth() * getScale()) / 2);
  };

  /**
   * Function: isPaintBoundsInverted
   *
   * Returns true if the bounds should be inverted.
   */
  const isPaintBoundsInverted = () =>
    isUnset(getStencil()) &&
    (getDirection() === DIRECTION_NORTH || getDirection() === DIRECTION_SOUTH);

  /**
   * Function: getRotation
   *
   * Returns the rotation from the style.
   */
  const getRotation = () => (isSet(getRotation()) ? getRotation() : 0);

  /**
   * Function: getTextRotation
   *
   * Returns the rotation for the text label.
   */
  const getTextRotation = () => {
    let rot = getRotation();

    if (!getValue(getStyle(), STYLE_HORIZONTAL, true)) {
      rot += Text.verticalTextRotation;
    }

    return rot;
  };

  /**
   * Function: getShapeRotation
   *
   * Returns the actual rotation of the shape.
   */
  const getShapeRotation = () => {
    let rot = getRotation();
    const dir = getDirection();

    if (isSet(dir)) {
      if (dir === DIRECTION_NORTH) rot += 270;
      else if (dir === DIRECTION_WEST) rot += 180;
      else if (dir === DIRECTION_SOUTH) rot += 90;
    }

    return rot;
  };

  /**
   * Function: createTransparentSvgRectangle
   *
   * Adds a transparent rectangle that catches all events.
   */
  const createTransparentSvgRectangle = (x, y, w, h) => {
    const rect = document.createElementNS(NS_SVG, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', 'none');
    rect.setAttribute('pointer-events', 'all');

    return rect;
  };

  /**
   * Function: setTransparentBackgroundImage
   *
   * Sets a transparent background CSS style to catch all events.
   *
   * Paints the line shape.
   */
  const setTransparentBackgroundImage = (node) =>
    (node.style.backgroundImage =
      "url('" + Client.imageBasePath + "/transparent.gif')");

  /**
   * Function: releaseSvgGradients
   *
   * Paints the line shape.
   */
  const releaseSvgGradients = (grads) => {
    if (isSet(grads)) {
      for (const key in grads) {
        const gradient = grads[key];

        if (isSet(gradient)) {
          gradient.mxRefCount = (gradient.mxRefCount || 0) - 1;

          if (gradient.mxRefCount === 0 && isSet(gradient.parentNode)) {
            gradient.parentNode.removeChild(gradient);
          }
        }
      }
    }
  };

  /**
   * Function: destroy
   *
   * Destroys the shape by removing it from the DOM and releasing the DOM
   * node associated with the shape using <mxEvent.release>.
   */
  const destroy = () => {
    const node = getNode();

    if (isSet(node)) {
      Event.release(node);

      if (isSet(node.parentNode)) {
        node.parentNode.removeChild(node);
      }

      setNode();
    }

    // Decrements refCount and removes unused
    releaseSvgGradients(getOldGradients());
    setOldGradients();
  };

  const me = {
    init,
    initStyles,
    isHtmlAllowed,
    getSvgScreenOffset,
    create,
    createSvg,
    createHtml,
    reconfigure,
    redraw,
    clear,
    updateBoundsFromPoints,
    getLabelBounds,
    getLabelMargins,
    checkBounds,
    redrawShape,
    createCanvas,
    createSvgCanvas,
    redrawHtmlShape,
    updateHtmlFilters,
    updateHtmlColors,
    updateHtmlBounds,
    destroyCanvas,
    beforePaint,
    afterPaint,
    paint,
    configureCanvas,
    getGradientBounds,
    updateTransform,
    paintVertexShape,
    paintBackground,
    paintForeground,
    paintEdgeShape,
    getArcSize,
    paintGlassEffect,
    addPoints,
    resetStyles,
    apply,
    setCursor,

    /**
     * Function: getCursor
     *
     * Returns the current cursor.
     */
    getCursor,
    isRoundable,
    updateBoundingBox,
    createBoundingBox,
    augmentBoundingBox,
    isPaintBoundsInverted,
    getRotation,
    getTextRotation,
    getShapeRotation,
    createTransparentSvgRectangle,
    setTransparentBackgroundImage,
    releaseSvgGradients,
    destroy
  };

  initStyles();

  return me;
};

export default Shape;
