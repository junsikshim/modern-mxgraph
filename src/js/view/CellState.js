/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import Rectangle from '../util/Rectangle';
import { addProp, isSet, isUnset } from '../Helpers';
import Point from '../util/Point';

/**
 * Class: CellState
 *
 * Represents the current state of a cell in a given <mxGraphView>.
 *
 * For edges, the edge label position is stored in <absoluteOffset>.
 *
 * The size for oversize labels can be retrieved using the boundingBox property
 * of the <text> field as shown below.
 *
 * (code)
 * var bbox = (state.text != null) ? state.text.boundingBox : null;
 * (end)
 *
 * Constructor: CellState
 *
 * Constructs a new object that represents the current state of the given
 * cell in the specified view.
 *
 * Parameters:
 *
 * view - <mxGraphView> that contains the state.
 * cell - <mxCell> that this state represents.
 * style - Array of key, value pairs that constitute the style.
 */
const CellState = (view, cell, style = {}) => {
  /**
   * Variable: view
   *
   * Reference to the enclosing <mxGraphView>.
   */
  const [getView, setView] = addProp(view);

  /**
   * Variable: cell
   *
   * Reference to the <mxCell> that is represented by this state.
   */
  const [getCell, setCell] = addProp(cell);

  /**
   * Variable: style
   *
   * Contains an array of key, value pairs that represent the style of the
   * cell.
   */
  const [getStyle, setStyle] = addProp(style);

  /**
   * Variable: invalidStyle
   *
   * Specifies if the style is invalid. Default is false.
   */
  const [isInvalidStyle, setInvalidStyle] = addProp(false);

  /**
   * Variable: invalid
   *
   * Specifies if the state is invalid. Default is true.
   */
  const [isInvalid, setInvalid] = addProp(true);

  /**
   * Variable: origin
   *
   * <mxPoint> that holds the origin for all child cells. Default is a new
   * empty <mxPoint>.
   */
  const [getOrigin, setOrigin] = addProp(Point());

  /**
   * Variable: absolutePoints
   *
   * Holds an array of <mxPoints> that represent the absolute points of an
   * edge.
   */
  const [getAbsolutePoints, setAbsolutePoints] = addProp();

  /**
   * Variable: absoluteOffset
   *
   * <mxPoint> that holds the absolute offset. For edges, this is the
   * absolute coordinates of the label position. For vertices, this is the
   * offset of the label relative to the top, left corner of the vertex.
   */
  const [getAbsoluteOffset, setAbsoluteOffset] = addProp(Point());

  /**
   * Variable: visibleSourceState
   *
   * Caches the visible source terminal state.
   */
  const [getVisibleSourceState, setVisibleSourceState] = addProp();

  /**
   * Variable: visibleTargetState
   *
   * Caches the visible target terminal state.
   */
  const [getVisibleTargetState, setVisibleTargetState] = addProp();

  /**
   * Variable: terminalDistance
   *
   * Caches the distance between the end points for an edge.
   */
  const [getTerminalDistance, setTerminalDistance] = addProp(0);

  /**
   * Variable: length
   *
   * Caches the length of an edge.
   */
  const [getLength, setLength] = addProp(0);

  /**
   * Variable: segments
   *
   * Array of numbers that represent the cached length of each segment of the
   * edge.
   */
  const [getSegments, setSegments] = addProp();

  /**
   * Variable: shape
   *
   * Holds the <mxShape> that represents the cell graphically.
   */
  const [getShape, setShape] = addProp();

  /**
   * Variable: text
   *
   * Holds the <mxText> that represents the label of the cell. Thi smay be
   * null if the cell has no label.
   */
  const [getText, setText] = addProp();

  /**
   * Variable: unscaledWidth
   *
   * Holds the unscaled width of the state.
   */
  const [getUnscaledWidth, setUnscaledWidth] = addProp();

  /**
   * Variable: unscaledHeight
   *
   * Holds the unscaled height of the state.
   */
  const [getUnscaledHeight, setUnscaledHeight] = addProp();
  const [getCellBounds, setCellBounds] = addProp();
  const [getPaintBounds, setPaintBounds] = addProp();
  const [getOverlays, setOverlays] = addProp();
  const [getControl, setControl] = addProp();
  const [getBoundingBox, setBoundingBox] = addProp();

  /**
   * Function: getPerimeterBounds
   *
   * Returns the <mxRectangle> that should be used as the perimeter of the
   * cell.
   *
   * Parameters:
   *
   * border - Optional border to be added around the perimeter bounds.
   * bounds - Optional <mxRectangle> to be used as the initial bounds.
   */
  const getPerimeterBounds = (
    border = 0,
    bounds = Rectangle(getX(), getY(), getWidth(), getHeight())
  ) => {
    const shape = getShape();

    if (
      isSet(shape) &&
      isSet(shape.getStencil()) &&
      shape.getStencil().getAspect() === 'fixed'
    ) {
      const stencil = shape.getStencil();
      const aspect = stencil.computeAspect(
        getStyle(),
        bounds.getX(),
        bounds.getY(),
        bounds.getWidth(),
        bounds.getHeight()
      );

      bounds.setX(aspect.getX());
      bounds.setY(aspect.getY());
      bounds.setWidth(stencil.getW0() * aspect.getWidth());
      bounds.setHeight(stencil.getH0() * aspect.getHeight());
    }

    if (border !== 0) bounds.grow(border);

    return bounds;
  };

  /**
   * Function: setAbsoluteTerminalPoint
   *
   * Sets the first or last point in <absolutePoints> depending on isSource.
   *
   * Parameters:
   *
   * point - <mxPoint> that represents the terminal point.
   * isSource - Boolean that specifies if the first or last point should
   * be assigned.
   */
  const setAbsoluteTerminalPoint = (point, isSource) => {
    if (isSource) {
      if (isUnset(getAbsolutePoints())) setAbsolutePoints([]);

      const points = getAbsolutePoints();

      if (points.length === 0) points.push(point);
      else points[0] = point;
    } else {
      if (isUnset(getAbsolutePoints())) {
        setAbsolutePoints([]);

        const points = getAbsolutePoints();
        points.push(undefined);
        points.push(point);
      } else if (getAbsolutePoints().length === 1) {
        getAbsolutePoints().push(point);
      } else {
        getAbsolutePoints()[getAbsolutePoints().length - 1] = point;
      }
    }
  };

  /**
   * Function: setCursor
   *
   * Sets the given cursor on the shape and text shape.
   */
  const setCursor = (cursor) => {
    if (isSet(getShape())) getShape().setCursor(cursor);

    if (isSet(getText())) getText().setCursor(cursor);
  };

  /**
   * Function: getVisibleTerminal
   *
   * Returns the visible source or target terminal cell.
   *
   * Parameters:
   *
   * source - Boolean that specifies if the source or target cell should be
   * returned.
   */
  const getVisibleTerminal = (source) => {
    const tmp = getVisibleTerminalState(source);

    return isSet(tmp) ? tmp.getCell() : undefined;
  };

  /**
   * Function: getVisibleTerminalState
   *
   * Returns the visible source or target terminal state.
   *
   * Parameters:
   *
   * source - Boolean that specifies if the source or target state should be
   * returned.
   */
  const getVisibleTerminalState = (source) =>
    source ? getVisibleSourceState() : getVisibleTargetState();

  /**
   * Function: setVisibleTerminalState
   *
   * Sets the visible source or target terminal state.
   *
   * Parameters:
   *
   * terminalState - <mxCellState> that represents the terminal.
   * source - Boolean that specifies if the source or target state should be set.
   */
  const setVisibleTerminalState = (terminalState, source) => {
    if (source) setVisibleSourceState(terminalState);
    else setVisibleTargetState(terminalState);
  };

  /**
   * Function: updateCachedBounds
   *
   * Updates the cellBounds and paintBounds.
   */
  const updateCachedBounds = () => {
    const tr = getView().getTranslate();
    const s = getView().getScale();
    setCellBounds(
      Rectangle(
        getX() / s - tr.getX(),
        getY() / s - tr.getY(),
        getWidth() / s,
        getHeight() / s
      )
    );
    setPaintBounds(Rectangle.fromRectangle(getCellBounds()));

    if (isSet(getShape()) && getShape().isPaintBoundsInverted()) {
      getPaintBounds().rotate90();
    }
  };

  /**
   * Destructor: setState
   *
   * Copies all fields from the given state to this state.
   */
  const setState = (state) => {
    setView(state.getView());
    setCell(state.getCell());
    setStyle(state.getStyle());
    setAbsolutePoints(state.getAbsolutePoints());
    setOrigin(state.getOrigin());
    setAbsoluteOffset(state.getAbsoluteOffset());
    setBoundingBox(state.getBoundingBox());
    setTerminalDistance(state.getTerminalDistance());
    setSegments(state.getSegments());
    setLength(state.getLength());
    setX(state.getX());
    setY(state.getY());
    setWidth(state.getWidth());
    setHeight(state.getHeight());
    setUnscaledWidth(state.getUnscaledWidth());
    setUnscaledHeight(state.getUnscaledHeight());
  };

  /**
   * Function: clone
   *
   * Returns a clone of this <mxPoint>.
   */
  const clone = () => {
    const clone = CellState(getView(), getCell(), getStyle());

    // Clones the absolute points
    if (isSet(getAbsolutePoints())) {
      clone.setAbsolutePoints([]);

      const points = getAbsolutePoints();
      const clonePoints = clone.getAbsolutePoints();

      for (let i = 0; i < points.length; i++) {
        clonePoints[i] = points[i].clone();
      }
    }

    if (isSet(getOrigin())) {
      clone.setOrigin(getOrigin().clone());
    }

    if (isSet(getAbsoluteOffset())) {
      clone.setAbsoluteOffset(getAbsoluteOffset().clone());
    }

    if (isSet(getBoundingBox())) {
      clone.setBoundingBox(getBoundingBox().clone());
    }

    clone.setTerminalDistance(getTerminalDistance());
    clone.setSegments(getSegments());
    clone.setLength(getLength());
    clone.setX(getX());
    clone.setY(getY());
    clone.setWidth(getWidth());
    clone.setHeight(getHeight());
    clone.setUnscaledWidth(getUnscaledWidth());
    clone.setUnscaledHeight(getUnscaledHeight());

    return clone;
  };

  /**
   * Destructor: destroy
   *
   * Destroys the state and all associated resources.
   */
  const destroy = () => getView().getGraph().getCellRenderer().destroy(me);

  const toString = () => {
    const cell = getCell();

    if (isSet(cell)) {
      return `[CellState cell:${cell}]`;
    }

    return `[CellState]`;
  };

  const {
    getX,
    setX,
    getY,
    setY,
    getWidth,
    setWidth,
    getHeight,
    setHeight,
    getCenterX,
    getCenterY
  } = Rectangle();

  const me = {
    getPerimeterBounds,
    setAbsoluteTerminalPoint,
    setCursor,
    getVisibleTerminal,
    getVisibleTerminalState,
    setVisibleTerminalState,

    /**
     * Function: getCellBounds
     *
     * Returns the unscaled, untranslated bounds.
     */
    getCellBounds,

    /**
     * Function: getPaintBounds
     *
     * Returns the unscaled, untranslated paint bounds. This is the same as
     * <getCellBounds> but with a 90 degree rotation if the shape's
     * isPaintBoundsInverted returns true.
     */
    getPaintBounds,
    updateCachedBounds,
    setState,
    isInvalid,
    setInvalid,
    getStyle,
    setStyle,
    isInvalidStyle,
    setInvalidStyle,
    getAbsoluteOffset,
    setAbsoluteOffset,
    getAbsolutePoints,
    setAbsolutePoints,
    getOrigin,
    setOrigin,
    getLength,
    setLength,
    getCell,
    setCell,
    getView,
    setView,
    getShape,
    setShape,
    getText,
    setText,
    clone,
    getX,
    setX,
    getY,
    setY,
    getWidth,
    setWidth,
    getHeight,
    setHeight,
    getUnscaledWidth,
    setUnscaledWidth,
    getUnscaledHeight,
    setUnscaledHeight,
    getShape,
    setShape,
    getOverlays,
    setOverlays,
    getControl,
    setControl,
    getCenterX,
    getCenterY,
    getTerminalDistance,
    setTerminalDistance,
    getSegments,
    setSegments,
    destroy,
    toString
  };

  return me;
};

export default CellState;
