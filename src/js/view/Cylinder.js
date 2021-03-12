/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp } from '../Helpers';

/**
 * Class: Cylinder
 *
 * Extends <mxShape> to implement an cylinder shape. If a
 * custom shape with one filled area and an overlay path is
 * needed, then this shape's <redrawPath> should be overridden.
 * This shape is registered under <mxConstants.SHAPE_CYLINDER>
 * in <mxCellRenderer>.
 *
 * Constructor: Cylinder
 *
 * Constructs a new cylinder shape.
 *
 * Parameters:
 *
 * bounds - <mxRectangle> that defines the bounds. This is stored in
 * <mxShape.bounds>.
 * fill - String that defines the fill color. This is stored in <fill>.
 * stroke - String that defines the stroke color. This is stored in <stroke>.
 * strokewidth - Optional integer that defines the stroke width. Default is
 * 1. This is stored in <strokewidth>.
 */
const Cylinder = (bounds, fill, stroke, strokewidth = 1) => {
  /**
   * Variable: maxHeight
   *
   * Defines the maximum height of the top and bottom part
   * of the cylinder shape.
   */
  const [getMaxHeight, setMaxHeight] = addProp(40);

  /**
   * Variable: svgStrokeTolerance
   *
   * Sets stroke tolerance to 0 for SVG.
   */
  const [getSvgStrokeTolerance, setSvgStrokeTolerance] = addProp(0);

  setBounds(bounds);
  setFill(fill);
  setStroke(stroke);
  setStrokeWidth(strokewidth);

  /**
   * Function: paintVertexShape
   *
   * Redirects to redrawPath for subclasses to work.
   */
  const paintVertexShape = (c, x, y, w, h) => {
    c.translate(x, y);
    c.begin();
    redrawPath(c, x, y, w, h, false);
    c.fillAndStroke();

    if (
      !isOutline() ||
      isUnset(getStyle()) ||
      getValue(getStyle(), STYLE_BACKGROUND_OUTLINE, 0) === 0
    ) {
      c.setShadow(false);
      c.begin();
      redrawPath(c, x, y, w, h, true);
      c.stroke();
    }
  };

  /**
   * Function: getCylinderSize
   *
   * Returns the cylinder size.
   */
  const getCylinderSize = (x, y, w, h) =>
    Math.min(getMaxHeight(), Math.round(h / 5));

  /**
   * Function: redrawPath
   *
   * Draws the path for this shape.
   */
  const redrawPath = (c, x, y, w, h, isForeground) => {
    const dy = getCylinderSize(x, y, w, h);

    if (
      (isForeground && isSet(getFill())) ||
      (!isForeground && isUnset(getFill()))
    ) {
      c.moveTo(0, dy);
      c.curveTo(0, 2 * dy, w, 2 * dy, w, dy);

      // Needs separate shapes for correct hit-detection
      if (!isForeground) {
        c.stroke();
        c.begin();
      }
    }

    if (!isForeground) {
      c.moveTo(0, dy);
      c.curveTo(0, -dy / 3, w, -dy / 3, w, dy);
      c.lineTo(w, h - dy);
      c.curveTo(w, h + dy / 3, 0, h + dy / 3, 0, h - dy);
      c.close();
    }
  };

  const {
    getBounds,
    setBounds,
    getFill,
    setFill,
    getStroke,
    setStroke,
    getStrokeWidth,
    setStrokeWidth
  } = Shape();

  const me = {
    paintVertexShape,
    getCylinderSize
  };

  return me;
};

export default Cylinder;
