/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { createWithOverrides, isUnset, makeComponent } from '../Helpers';
import { LINE_ARCSIZE, STYLE_ARCSIZE, STYLE_CURVED } from '../util/Constants';
import { getValue } from '../util/Utils';
import Shape from './Shape';

/**
 * Class: Polyline
 *
 * Extends <mxShape> to implement a polyline (a line with multiple points).
 * This shape is registered under <mxConstants.SHAPE_POLYLINE> in
 * <mxCellRenderer>.
 *
 * Constructor: Polyline
 *
 * Constructs a new polyline shape.
 *
 * Parameters:
 *
 * points - Array of <mxPoints> that define the points. This is stored in
 * <mxShape.points>.
 * stroke - String that defines the stroke color. Default is 'black'. This is
 * stored in <stroke>.
 * strokewidth - Optional integer that defines the stroke width. Default is
 * 1. This is stored in <strokewidth>.
 */
const Polyline = (points, stroke, strokewidth = 1) => {
  /**
   * Function: getRotation
   *
   * Returns 0.
   */
  const getRotation = () => 0;

  /**
   * Function: getShapeRotation
   *
   * Returns 0.
   */
  const getShapeRotation = () => 0;

  /**
   * Function: isPaintBoundsInverted
   *
   * Returns false.
   */
  const isPaintBoundsInverted = () => false;

  /**
   * Function: paintEdgeShape
   *
   * Paints the line shape.
   */
  const paintEdgeShape = (c, pts) => {
    const prev = c.getPointerEventsValue();
    c.setPointerEventsValue('stroke');

    if (isUnset(_shape.getStyle()) || _shape.getStyle()[STYLE_CURVED] !== 1) {
      paintLine(c, pts, _shape.isRounded());
    } else {
      paintCurvedLine(c, pts);
    }

    c.setPointerEventsValue(prev);
  };

  /**
   * Function: paintLine
   *
   * Paints the line shape.
   */
  const paintLine = (c, pts, rounded) => {
    const arcSize =
      getValue(_shape.getStyle(), STYLE_ARCSIZE, LINE_ARCSIZE) / 2;
    c.begin();
    _shape.addPoints(c, pts, rounded, arcSize, false);
    c.stroke();
  };

  /**
   * Function: paintCurvedLine
   *
   * Paints a curved line.
   */
  const paintCurvedLine = (c, pts) => {
    c.begin();

    const pt = pts[0];
    const n = pts.length;

    c.moveTo(pt.getX(), pt.getY());

    for (let i = 1; i < n - 2; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const ix = (p0.getX() + p1.getX()) / 2;
      const iy = (p0.getY() + p1.getY()) / 2;

      c.quadTo(p0.getX(), p0.getY(), ix, iy);
    }

    const p0 = pts[n - 2];
    const p1 = pts[n - 1];

    c.quadTo(p0.getX(), p0.getY(), p1.getX(), p1.getY());
    c.stroke();
  };

  const _shape = createWithOverrides({
    paintEdgeShape,
    ...Polyline.getOverrides()
  })(Shape)();

  _shape.setPoints(points);
  _shape.setStroke(stroke);
  _shape.setStrokeWidth(strokewidth);

  const me = {
    ..._shape,
    getRotation,
    getShapeRotation,
    isPaintBoundsInverted,
    paintLine,
    paintCurvedLine,
    paintEdgeShape
  };

  return me;
};

export default makeComponent(Polyline);
