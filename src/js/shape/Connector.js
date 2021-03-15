/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { isSet, withConstructor } from '../Helpers';
import {
  DEFAULT_MARKERSIZE,
  STYLE_CURVED,
  STYLE_ENDARROW,
  STYLE_ENDFILL,
  STYLE_ENDSIZE,
  STYLE_STARTARROW,
  STYLE_STARTFILL,
  STYLE_STARTSIZE
} from '../util/Constants';
import { getNumber, getValue } from '../util/Utils';
import Marker from './Marker';
import Polyline from './Polyline';

/**
 * Class: Connector
 *
 * Extends <mxShape> to implement a connector shape. The connector
 * shape allows for arrow heads on either side.
 *
 * This shape is registered under <mxConstants.SHAPE_CONNECTOR> in
 * <mxCellRenderer>.
 *
 * Constructor: Connector
 *
 * Constructs a new connector shape.
 *
 * Parameters:
 *
 * points - Array of <mxPoints> that define the points. This is stored in
 * <mxShape.points>.
 * stroke - String that defines the stroke color. This is stored in <stroke>.
 * Default is 'black'.
 * strokeWidth - Optional integer that defines the stroke width. Default is
 * 1. This is stored in <strokeWidth>.
 */
const Connector = (points, stroke, strokeWidth, overrides = {}) => {
  /**
   * Function: updateBoundingBox
   *
   * Updates the <boundingBox> for this shape using <createBoundingBox> and
   * <augmentBoundingBox> and stores the result in <boundingBox>.
   */
  const updateBoundingBox = () => {
    _polyline.setUseSvgBoundingBox(
      isSet(getStyle()) && getStyle()[STYLE_CURVED] === 1
    );
    _updateBoundingBox();
  };

  /**
   * Function: paintEdgeShape
   *
   * Paints the line shape.
   */
  const paintEdgeShape = (c, pts) => {
    // The indirection via functions for markers is needed in
    // order to apply the offsets before painting the line and
    // paint the markers after painting the line.
    const sourceMarker = createMarker(c, pts, true);
    const targetMarker = createMarker(c, pts, false);

    _polyline.paintEdgeShape(c, pts);

    // Disables shadows, dashed styles and fixes fill color for markers
    c.setFillColor(_polyline.getStroke());
    c.setShadow(false);
    c.setDashed(false);

    if (isSet(sourceMarker)) {
      sourceMarker();
    }

    if (isSet(targetMarker)) {
      targetMarker();
    }
  };

  /**
   * Function: createMarker
   *
   * Prepares the marker by adding offsets in pts and returning a function to
   * paint the marker.
   */
  const createMarker = (c, pts, source) => {
    let result;
    const n = pts.length;
    const type = getValue(
      _polyline.getStyle(),
      source ? STYLE_STARTARROW : STYLE_ENDARROW
    );
    let p0 = source ? pts[1] : pts[n - 2];
    const pe = source ? pts[0] : pts[n - 1];

    if (isSet(type) && isSet(p0) && isSet(pe)) {
      let count = 1;

      // Uses next non-overlapping point
      while (
        count < n - 1 &&
        Math.round(p0.getX() - pe.getX()) === 0 &&
        Math.round(p0.getY() - pe.getY()) === 0
      ) {
        p0 = source ? pts[1 + count] : pts[n - 2 - count];
        count++;
      }

      // Computes the norm and the inverse norm
      const dx = pe.getX() - p0.getX();
      const dy = pe.getY() - p0.getY();

      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

      const unitX = dx / dist;
      const unitY = dy / dist;

      const size = getNumber(
        _polyline.getStyle(),
        source ? STYLE_STARTSIZE : STYLE_ENDSIZE,
        DEFAULT_MARKERSIZE
      );

      // Allow for stroke width in the end point used and the
      // orthogonal vectors describing the direction of the marker
      const filled =
        _polyline.getStyle()[source ? STYLE_STARTFILL : STYLE_ENDFILL] !== 0;

      result = Marker.createMarker(
        c,
        me,
        type,
        pe,
        unitX,
        unitY,
        size,
        source,
        _polyline.getStrokeWidth(),
        filled
      );
    }

    return result;
  };

  /**
   * Function: augmentBoundingBox
   *
   * Augments the bounding box with the strokeWidth and shadow offsets.
   */
  const augmentBoundingBox = (bbox) => {
    _polyline.augmentBoundingBox(bbox);

    // Adds marker sizes
    let size = 0;
    const style = getStyle();

    if (getValue(style, STYLE_STARTARROW, NONE) !== NONE) {
      size = getNumber(style, STYLE_STARTSIZE, DEFAULT_MARKERSIZE) + 1;
    }

    if (getValue(style, STYLE_ENDARROW, NONE) !== NONE) {
      size =
        Math.max(size, getNumber(style, STYLE_ENDSIZE, DEFAULT_MARKERSIZE)) + 1;
    }

    bbox.grow(size * _polyline.getScale());
  };

  const _polyline = Polyline(points, stroke, strokeWidth, {
    paintEdgeShape,
    ...overrides
  });

  const me = {
    ..._polyline,
    updateBoundingBox,
    createMarker,
    augmentBoundingBox
  };

  return withConstructor(me, Connector);
};

export default Connector;
