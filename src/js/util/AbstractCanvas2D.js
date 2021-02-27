/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import {
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  NONE,
  SHADOWCOLOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  SHADOW_OPACITY
} from './Constants';
import UrlConverter from './UrlConverter';
import { arcToCurves, clone, getRotatedPoint } from './Utils';
import { addProp, isSet } from '../Helpers';

/**
 * Class: AbstractCanvas2D
 *
 * Base class for all canvases. A description of the public API is available in <XmlCanvas2D>.
 * All color values of <Constants.NONE> will be converted to null in the state.
 *
 * Constructor: AbstractCanvas2D
 *
 * Constructs a new abstract canvas.
 */
const AbstractCanvas2D = () => {
  /**
   * Variable: state
   *
   * Holds the current state.
   */
  const [getState, setState] = addProp();

  /**
   * Variable: states
   *
   * Stack of states.
   */
  const [getStates, setStates] = addProp();

  /**
   * Variable: path
   *
   * Holds the current path as an array.
   */
  const [getPath, setPath] = addProp();

  /**
   * Variable: rotateHtml
   *
   * Switch for rotation of HTML. Default is false.
   */
  const [isRotateHtml, setRotateHtml] = addProp(true);

  /**
   * Variable: lastX
   *
   * Holds the last x coordinate.
   */
  const [getLastX, setLastX] = addProp(0);

  /**
   * Variable: lastY
   *
   * Holds the last y coordinate.
   */
  const [getLastY, setLastY] = addProp(0);

  /**
   * Variable: moveOp
   *
   * Contains the string used for moving in paths. Default is 'M'.
   */
  const [getMoveOp, setMoveOp] = addProp('M');

  /**
   * Variable: lineOp
   *
   * Contains the string used for moving in paths. Default is 'L'.
   */
  const [getLineOp, setLineOp] = addProp('L');

  /**
   * Variable: quadOp
   *
   * Contains the string used for quadratic paths. Default is 'Q'.
   */
  const [getQuadOp, setQuadOp] = addProp('Q');

  /**
   * Variable: curveOp
   *
   * Contains the string used for bezier curves. Default is 'C'.
   */
  const [getCurveOp, setCurveOp] = addProp('C');

  /**
   * Variable: closeOp
   *
   * Holds the operator for closing curves. Default is 'Z'.
   */
  const [getCloseOp, setCloseOp] = addProp('Z');

  /**
   * Variable: pointerEvents
   *
   * Boolean value that specifies if events should be handled. Default is false.
   */
  const [isPointerEvents, setPointerEvents] = addProp(false);

  /**
   * Variable: converter
   *
   * Holds the <UrlConverter> to convert image URLs.
   */
  const [getConverter, setConverter] = addProp();

  /**
   * Function: createUrlConverter
   *
   * Create a new <mxUrlConverter> and returns it.
   */
  const createUrlConverter = () => UrlConverter();

  /**
   * Function: reset
   *
   * Resets the state of this canvas.
   */
  const reset = () => {
    setState(createState());
    setStates([]);
  };

  /**
   * Function: createState
   *
   * Creates the state of the this canvas.
   */
  const createState = () => ({
    dx: 0,
    dy: 0,
    scale: 1,
    alpha: 1,
    fillAlpha: 1,
    strokeAlpha: 1,
    fillColor: null,
    gradientFillAlpha: 1,
    gradientColor: null,
    gradientAlpha: 1,
    gradientDirection: null,
    strokeColor: null,
    strokeWidth: 1,
    dashed: false,
    dashPattern: '3 3',
    fixDash: false,
    lineCap: 'flat',
    lineJoin: 'miter',
    miterLimit: 10,
    fontColor: '#000000',
    fontBackgroundColor: null,
    fontBorderColor: null,
    fontSize: DEFAULT_FONTSIZE,
    fontFamily: DEFAULT_FONTFAMILY,
    fontStyle: 0,
    shadow: false,
    shadowColor: SHADOWCOLOR,
    shadowAlpha: SHADOW_OPACITY,
    shadowDx: SHADOW_OFFSET_X,
    shadowDy: SHADOW_OFFSET_Y,
    rotation: 0,
    rotationCx: 0,
    rotationCy: 0
  });

  /**
   * Function: format
   *
   * Rounds all numbers to integers.
   */
  const format = (value) => Math.round(parseFloat(value));

  /**
   * Function: addOp
   *
   * Adds the given operation to the path.
   */
  const addOp = (...args) => {
    const path = getPath();

    if (isSet(path)) {
      path.push(args[0]);

      if (args.length > 2) {
        const s = getState();

        for (let i = 2; i < args.length; i += 2) {
          setLastX(args[i - 1]);
          setLastY(args[i]);

          path.push(format((getLastX() + s.dx) * s.scale));
          path.push(format((getLastY() + s.dy) * s.scale));
        }
      }
    }
  };

  /**
   * Function: rotatePoint
   *
   * Rotates the given point and returns the result as an <mxPoint>.
   */
  const rotatePoint = (x, y, theta, cx, cy) => {
    const rad = theta * (Math.PI / 180);

    return getRotatedPoint(
      Point(x, y),
      Math.cos(rad),
      Math.sin(rad),
      Point(cx, cy)
    );
  };

  /**
   * Function: save
   *
   * Saves the current state.
   */
  const save = () => {
    getStates().push(getState());
    setState(clone(getState()));
  };

  /**
   * Function: restore
   *
   * Restores the current state.
   */
  const restore = () => {
    const states = getStates();

    if (isSet(states) && states.length > 0) {
      setState(states.pop());
    }
  };

  /**
   * Function: setLink
   *
   * Sets the current link. Hook for subclassers.
   */
  const setLink = (link) => {
    // noop
  };

  /**
   * Function: scale
   *
   * Scales the current state.
   */
  const scale = (value) => {
    const state = getState();
    state.scale *= value;
    state.strokeWidth *= value;
  };

  /**
   * Function: translate
   *
   * Translates the current state.
   */
  const translate = (dx, dy) => {
    const state = getState();
    state.dx += dx;
    state.dy += dy;
  };

  /**
   * Function: rotate
   *
   * Rotates the current state.
   */
  const rotate = (theta, flipH, flipV, cx, cv) => {
    // noop
  };

  /**
   * Function: setAlpha
   *
   * Sets the current alpha.
   */
  const setAlpha = (value) => (getState().alpha = value);

  /**
   * Function: setFillAlpha
   *
   * Sets the current solid fill alpha.
   */
  const setFillAlpha = (value) => (getState().fillAlpha = value);

  /**
   * Function: setStrokeAlpha
   *
   * Sets the current stroke alpha.
   */
  const setStrokeAlpha = (value) => getState().setStrokeAlpha(value);

  /**
   * Function: setFillColor
   *
   * Sets the current fill color.
   */
  const setFillColor = (value) => {
    const state = getState();
    state.fillColor = value === NONE ? null : value;
    state.gradientColor = null;
  };

  /**
   * Function: setGradient
   *
   * Sets the current gradient.
   */
  const setGradient = (
    color1,
    color2,
    x,
    y,
    w,
    h,
    direction,
    alpha1,
    alpha2
  ) => {
    const state = getState();
    state.fillColor = color1;
    state.gradientFillAlpha = alpha1 != null ? alpha1 : 1;
    state.gradientColor = color2;
    state.gradientAlpha = alpha2 != null ? alpha2 : 1;
    state.gradientDirection = direction;
  };

  /**
   * Function: setStrokeColor
   *
   * Sets the current stroke color.
   */
  const setStrokeColor = (value) =>
    (getState().strokeColor = value === NONE ? null : value);

  /**
   * Function: setStrokeWidth
   *
   * Sets the current stroke width.
   */
  const setStrokeWidth = (value) => (getState().strokeWidth = value);

  /**
   * Function: setDashed
   *
   * Enables or disables dashed lines.
   */
  const setDashed = (value, fixDash) => {
    const state = getState();
    state.dashed = value;
    state.fixDash = fixDash;
  };

  /**
   * Function: setDashPattern
   *
   * Sets the current dash pattern.
   */
  const setDashPattern = (value) => (getState().dashPattern = value);

  /**
   * Function: setLineCap
   *
   * Sets the current line cap.
   */
  const setLineCap = (value) => (getState().lineCap = value);

  /**
   * Function: setLineJoin
   *
   * Sets the current line join.
   */
  const setLineJoin = (value) => (getState().lineJoin = value);

  /**
   * Function: setMiterLimit
   *
   * Sets the current miter limit.
   */
  const setMiterLimit = (value) => (getState().miterLimit = value);

  /**
   * Function: setFontColor
   *
   * Sets the current font color.
   */
  const setFontColor = (value) =>
    (getState().fontColor = value === NONE ? null : value);

  /**
   * Function: setFontBackgroundColor
   *
   * Sets the current font background color.
   */
  const setFontBackgroundColor = (value) =>
    (getState().fontBackgroundColor = value === NONE ? null : value);

  /**
   * Function: setFontBorderColor
   *
   * Sets the current font border color.
   */
  const setFontBorderColor = (value) =>
    (getState().fontBorderColor = value === NONE ? null : value);

  /**
   * Function: setFontSize
   *
   * Sets the current font size.
   */
  const setFontSize = (value) => (getState().fontSize = parseFloat(value));

  /**
   * Function: setFontFamily
   *
   * Sets the current font family.
   */
  const setFontFamily = (value) => (getState().fontFamily = value);

  /**
   * Function: setFontStyle
   *
   * Sets the current font style.
   */
  const setFontStyle = (value) =>
    (getState().fontStyle = value === null ? 0 : value);

  /**
   * Function: setShadow
   *
   * Enables or disables and configures the current shadow.
   */
  const setShadow = (enabled) => (getState().shadow = enabled);

  /**
   * Function: setShadowColor
   *
   * Enables or disables and configures the current shadow.
   */
  const setShadowColor = (value) =>
    (getState().shadowColor = value === NONE ? null : value);

  /**
   * Function: setShadowAlpha
   *
   * Enables or disables and configures the current shadow.
   */
  const setShadowAlpha = (value) => (getState().shadowAlpha = value);

  /**
   * Function: setShadowOffset
   *
   * Enables or disables and configures the current shadow.
   */
  const setShadowOffset = (dx, dy) => {
    const state = getState();
    state.shadowDx = dx;
    state.shadowDy = dy;
  };

  /**
   * Function: begin
   *
   * Starts a new path.
   */
  const begin = () => {
    setLastX(0);
    setLastY(0);
    setPath([]);
  };

  /**
   * Function: moveTo
   *
   *  Moves the current path the given coordinates.
   */
  const moveTo = (x, y) => addOp(getMoveOp(), x, y);

  /**
   * Function: lineTo
   *
   * Draws a line to the given coordinates. Uses moveTo with the op argument.
   */
  const lineTo = (x, y) => addOp(getLineOp(), x, y);

  /**
   * Function: quadTo
   *
   * Adds a quadratic curve to the current path.
   */
  const quadTo = (x1, y1, x2, y2) => addOp(getQuadOp(), x1, y1, x2, y2);

  /**
   * Function: curveTo
   *
   * Adds a bezier curve to the current path.
   */
  const curveTo = (x1, y1, x2, y2, x3, y3) =>
    addOp(getCurveOp(), x1, y1, x2, y2, x3, y3);

  /**
   * Function: arcTo
   *
   * Adds the given arc to the current path. This is a synthetic operation that
   * is broken down into curves.
   */
  const arcTo = (rx, ry, angle, largeArcFlag, sweepFlag, x, y) => {
    const curves = arcToCurves(
      getLastX(),
      getLastY(),
      rx,
      ry,
      angle,
      largeArcFlag,
      sweepFlag,
      x,
      y
    );

    if (isSet(curves)) {
      for (let i = 0; i < curves.length; i += 6) {
        curveTo(
          curves[i],
          curves[i + 1],
          curves[i + 2],
          curves[i + 3],
          curves[i + 4],
          curves[i + 5]
        );
      }
    }
  };

  /**
   * Function: close
   *
   * Closes the current path.
   */
  const close = (x1, y1, x2, y2, x3, y3) => addOp(getCloseOp());

  /**
   * Function: end
   *
   * Empty implementation for backwards compatibility. This will be removed.
   */
  const end = () => {};

  const me = {
    createUrlConverter,
    reset,
    createState,
    format,
    addOp,
    rotatePoint,
    save,
    restore,
    setLink,
    scale,
    translate,
    rotate,
    setAlpha,
    setFillAlpha,
    setStrokeAlpha,
    setFillColor,
    setGradient,
    setStrokeColor,
    setStrokeWidth,
    setDashed,
    setDashPattern,
    setLineCap,
    setLineJoin,
    setMiterLimit,
    setFontColor,
    setFontBackgroundColor,
    setFontBorderColor,
    setFontSize,
    setFontFamily,
    setFontStyle,
    setShadow,
    setShadowColor,
    setShadowAlpha,
    setShadowOffset,
    begin,
    moveTo,
    lineTo,
    quadTo,
    curveTo,
    arcTo,
    close,
    end
  };

  return me;
};

export default AbstractCanvas2D;
