/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import { equalPoints, getRotatedPoint, toRadians } from '../util/Utils';
import { addProp } from '../Helpers';

/**
 * Class: Geometry
 *
 * Extends <Rectangle> to represent the geometry of a cell.
 *
 * For vertices, the geometry consists of the x- and y-location, and the width
 * and height. For edges, the geometry consists of the optional terminal- and
 * control points. The terminal points are only required if an edge is
 * unconnected, and are stored in the <sourcePoint> and <targetPoint>
 * variables, respectively.
 *
 * Example:
 *
 * If an edge is unconnected, that is, it has no source or target terminal,
 * then a geometry with terminal points for a new edge can be defined as
 * follows.
 *
 * (code)
 * geometry.setTerminalPoint(Point(x1, y1), true);
 * geometry.points = [Point(x2, y2)];
 * geometry.setTerminalPoint(Point(x3, y3), false);
 * (end)
 *
 * Control points are used regardless of the connected state of an edge and may
 * be ignored or interpreted differently depending on the edge's <EdgeStyle>.
 *
 * To disable automatic reset of control points after a cell has been moved or
 * resized, the the <Graph.resizeEdgesOnMove> and
 * <Graph.resetEdgesOnResize> may be used.
 *
 * Edge Labels:
 *
 * Using the x- and y-coordinates of a cell's geometry, it is possible to
 * position the label on edges on a specific location on the actual edge shape
 * as it appears on the screen. The x-coordinate of an edge's geometry is used
 * to describe the distance from the center of the edge from -1 to 1 with 0
 * being the center of the edge and the default value. The y-coordinate of an
 * edge's geometry is used to describe the absolute, orthogonal distance in
 * pixels from that point. In addition, the <Geometry.offset> is used as an
 * absolute offset vector from the resulting point.
 *
 * This coordinate system is applied if <relative> is true, otherwise the
 * offset defines the absolute vector from the edge's center point to the
 * label and the values for <x> and <y> are ignored.
 *
 * The width and height parameter for edge geometries can be used to set the
 * label width and height (eg. for word wrapping).
 *
 * Ports:
 *
 * The term "port" refers to a relatively positioned, connectable child cell,
 * which is used to specify the connection between the parent and another cell
 * in the graph. Ports are typically modeled as vertices with relative
 * geometries.
 *
 * Offsets:
 *
 * The <offset> field is interpreted in 3 different ways, depending on the cell
 * and the geometry. For edges, the offset defines the absolute offset for the
 * edge label. For relative geometries, the offset defines the absolute offset
 * for the origin (top, left corner) of the vertex, otherwise the offset
 * defines the absolute offset for the label inside the vertex or group.
 *
 * Constructor: Geometry
 *
 * Constructs a new object to describe the size and location of a vertex or
 * the control points of an edge.
 */
const Geometry = (x, y, width, height) => {
  // Extends Rectangle.
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
    getCenterY,
    equals: rectEquals
  } = Rectangle(x, y, width, height);

  /**
   * Variable: alternateBounds
   *
   * Stores alternate values for x, y, width and height in a rectangle. See
   * <swap> to exchange the values. Default is null.
   */
  const [getAlternateBounds, setAlternateBounds] = addProp(null);

  /**
   * Variable: sourcePoint
   *
   * Defines the source <Point> of the edge. This is used if the
   * corresponding edge does not have a source vertex. Otherwise it is
   * ignored. Default is  null.
   */
  const [getSourcePoint, setSourcePoint] = addProp(null);

  /**
   * Variable: targetPoint
   *
   * Defines the target <Point> of the edge. This is used if the
   * corresponding edge does not have a target vertex. Otherwise it is
   * ignored. Default is null.
   */
  const [getTargetPoint, setTargetPoint] = addProp(null);

  /**
   * Variable: points
   *
   * Array of <Points> which specifies the control points along the edge.
   * These points are the intermediate points on the edge, for the endpoints
   * use <targetPoint> and <sourcePoint> or set the terminals of the edge to
   * a non-null value. Default is null.
   */
  const [getPoints, setPoints] = addProp(null);

  /**
   * Variable: offset
   *
   * For edges, this holds the offset (in pixels) from the position defined
   * by <x> and <y> on the edge. For relative geometries (for vertices), this
   * defines the absolute offset from the point defined by the relative
   * coordinates. For absolute geometries (for vertices), this defines the
   * offset for the label. Default is null.
   */
  const [getOffset, setOffset] = addProp(null);

  /**
   * Variable: relative
   *
   * Specifies if the coordinates in the geometry are to be interpreted as
   * relative coordinates. For edges, this is used to define the location of
   * the edge label relative to the edge as rendered on the display. For
   * vertices, this specifies the relative location inside the bounds of the
   * parent cell.
   *
   * If this is false, then the coordinates are relative to the origin of the
   * parent cell or, for edges, the edge label position is relative to the
   * center of the edge as rendered on screen.
   *
   * Default is false.
   */
  const [getRelative, setRelative] = addProp(false);

  /**
   * Function: swap
   *
   * Swaps the x, y, width and height with the values stored in
   * <alternateBounds> and puts the previous values into <alternateBounds> as
   * a rectangle. This operation is carried-out in-place, that is, using the
   * existing geometry instance. If this operation is called during a graph
   * model transactional change, then the geometry should be cloned before
   * calling this method and setting the geometry of the cell using
   * <GraphModel.setGeometry>.
   */
  const swap = () => {
    const bounds = getAlternateBounds();

    if (bounds) {
      const old = Rectangle(getX(), getY(), getWidth(), getHeight());

      setX(bounds.getX());
      setY(bounds.getY());
      setWidth(bounds.getWidth());
      setHeight(bounds.getHeight());

      setAlternateBounds(old);
    }
  };

  /**
   * Function: getTerminalPoint
   *
   * Returns the <Point> representing the source or target point of this
   * edge. This is only used if the edge has no source or target vertex.
   *
   * Parameters:
   *
   * isSource - Boolean that specifies if the source or target point
   * should be returned.
   */
  const getTerminalPoint = (isSource) =>
    isSource ? getSourcePoint() : getTargetPoint();

  /**
   * Function: setTerminalPoint
   *
   * Sets the <sourcePoint> or <targetPoint> to the given <Point> and
   * returns the new point.
   *
   * Parameters:
   *
   * point - Point to be used as the new source or target point.
   * isSource - Boolean that specifies if the source or target point
   * should be set.
   */
  const setTerminalPoint = (point, isSource) => {
    if (isSource) setSourcePoint(point);
    else setTargetPoint(point);

    return point;
  };

  /**
   * Function: rotate
   *
   * Rotates the geometry by the given angle around the given center. That is,
   * <x> and <y> of the geometry, the <sourcePoint>, <targetPoint> and all
   * <points> are translated by the given amount. <x> and <y> are only
   * translated if <relative> is false.
   *
   * Parameters:
   *
   * angle - Number that specifies the rotation angle in degrees.
   * cx - <Point> that specifies the center of the rotation.
   */
  const rotate = (angle, cx) => {
    const rad = toRadians(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Rotates the geometry
    if (!getRelative()) {
      const ct = Point(getCenterX(), getCenterY());
      const pt = getRotatedPoint(ct, cos, sin, cx);

      setX(Math.round(pt.getX() - getWidth() / 2));
      setY(Math.round(pt.getY() - getHeight() / 2));
    }

    const sourcePoint = getSourcePoint();

    // Rotates the source point
    if (sourcePoint) {
      const pt = getRotatedPoint(sourcePoint, cos, sin, cx);
      sourcePoint.setX(Math.round(pt.getX()));
      sourcePoint.setY(Math.round(pt.getY()));
    }

    const targetPoint = getTargetPoint();

    // Translates the target point
    if (targetPoint) {
      const pt = getRotatedPoint(targetPoint, cos, sin, cx);
      targetPoint.setX(Math.round(pt.getX()));
      targetPoint.setY(Math.round(pt.getY()));
    }

    const points = getPoints();

    // Translate the control points
    if (points) {
      for (const p of points) {
        if (p) {
          const pt = getRotatedPoint(p, cos, sin, cx);
          p.setX(Math.round(pt.getX()));
          p.setY(Math.round(pt.getY()));
        }
      }
    }
  };

  /**
   * Function: translate
   *
   * Translates the geometry by the specified amount. That is, <x> and <y> of the
   * geometry, the <sourcePoint>, <targetPoint> and all <points> are translated
   * by the given amount. <x> and <y> are only translated if <relative> is false.
   * If <TRANSLATE_CONTROL_POINTS> is false, then <points> are not modified by
   * this function.
   *
   * Parameters:
   *
   * dx - Number that specifies the x-coordinate of the translation.
   * dy - Number that specifies the y-coordinate of the translation.
   */
  const translate = (dx, dy) => {
    const tx = parseFloat(dx);
    const ty = parseFloat(dy);

    // Translates the geometry
    if (!getRelative()) {
      setX(parseFloat(getX()) + tx);
      setY(parseFloat(getY()) + ty);
    }

    const sourcePoint = getSourcePoint();

    // Translates the source point
    if (sourcePoint) {
      sourcePoint.setX(parseFloat(sourcePoint.getX()) + tx);
      sourcePoint.setY(parseFloat(sourcePoint.getY()) + ty);
    }

    const targetPoint = getTargetPoint();

    // Translates the target point
    if (targetPoint) {
      targetPoint.setX(parseFloat(targetPoint.getX()) + tx);
      targetPoint.setY(parseFloat(targetPoint.getY()) + ty);
    }

    const points = getPoints();

    // Translate the control points
    if (Geometry.TRANSLATE_CONTROL_POINTS && points) {
      for (const p of points) {
        if (p) {
          p.setX(parseFloat(p.getX()) + tx);
          p.setY(parseFloat(p.getY()) + ty);
        }
      }
    }
  };

  /**
   * Function: scale
   *
   * Scales the geometry by the given amount. That is, <x> and <y> of the
   * geometry, the <sourcePoint>, <targetPoint> and all <points> are scaled
   * by the given amount. <x>, <y>, <width> and <height> are only scaled if
   * <relative> is false. If <fixedAspect> is true, then the smaller value
   * is used to scale the width and the height.
   *
   * Parameters:
   *
   * sx - Number that specifies the horizontal scale factor.
   * sy - Number that specifies the vertical scale factor.
   * fixedAspect - Optional boolean to keep the aspect ratio fixed.
   */
  const scale = (sx, sy, fixedAspect) => {
    const tx = parseFloat(sx);
    const ty = parseFloat(sy);

    const sourcePoint = getSourcePoint();

    // Translates the source point
    if (sourcePoint) {
      sourcePoint.setX(parseFloat(sourcePoint.getX()) * tx);
      sourcePoint.setY(parseFloat(sourcePoint.getY()) * ty);
    }

    const targetPoint = getTargetPoint();

    // Translates the target point
    if (targetPoint) {
      targetPoint.setX(parseFloat(targetPoint.getX()) * tx);
      targetPoint.setY(parseFloat(targetPoint.getY()) * ty);
    }

    const points = getPoints();

    // Translate the control points
    if (points) {
      for (const p of points) {
        if (p) {
          p.setX(parseFloat(p.getX()) * tx);
          p.setY(parseFloat(p.getY()) * ty);
        }
      }
    }

    // Translates the geometry
    if (!getRelative()) {
      setX(parseFloat(getX()) * tx);
      setY(parseFloat(getY()) * ty);

      if (fixedAspect) {
        const min = Math.min(tx, ty);

        setWidth(parseFloat(getWidth()) * min);
        setHeight(parseFloat(getHeight()) * min);
      } else {
        setWidth(parseFloat(getWidth()) * tx);
        setHeight(parseFloat(getHeight()) * ty);
      }
    }
  };

  /**
   * Function: equals
   *
   * Returns true if the given object equals this geometry.
   */
  const equals = (obj) =>
    rectEquals(obj) &&
    getRelative() === obj.getRelative() &&
    ((!getSourcePoint() && !obj.getSourcePoint()) ||
      (getSourcePoint() && getSourcePoint().equals(obj.getSourcePoint()))) &&
    ((!getTargetPoint() && !obj.getTargetPoint()) ||
      (getTargetPoint() && getTargetPoint().equals(obj.getTargetPoint()))) &&
    ((!getPoints() && !obj.getPoints()) ||
      (getPoints() && equalPoints(getPoints(), obj.getPoints()))) &&
    ((!getAlternateBounds() && !obj.getAlternateBounds()) ||
      (getAlternateBounds() &&
        getAlternateBounds().equals(obj.getAlternateBounds()))) &&
    ((!getOffset() && !obj.getOffset()) ||
      (getOffset() && getOffset().equals(obj.getOffset())));

  const me = {
    getX,
    getY,
    getWidth,
    getHeight,
    getAlternateBounds,
    getSourcePoint,
    getTargetPoint,
    getPoints,
    getOffset,
    getRelative,
    swap,
    getTerminalPoint,
    setTerminalPoint,
    rotate,
    translate,
    scale,
    equals
  };

  return me;
};

/**
 * Variable: TRANSLATE_CONTROL_POINTS
 *
 * Global switch to translate the points in translate. Default is true.
 */
Geometry.TRANSLATE_CONTROL_POINTS = true;

export default Geometry;
