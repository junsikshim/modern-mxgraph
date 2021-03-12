/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import Shape from './Shape';

/**
 * Class: Ellipse
 *
 * Extends <mxShape> to implement an ellipse shape.
 * This shape is registered under <mxConstants.SHAPE_ELLIPSE>
 * in <mxCellRenderer>.
 *
 * Constructor: Ellipse
 *
 * Constructs a new ellipse shape.
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
const Ellipse = (bounds, fill, stroke, strokewidth = 1, overrides = {}) => {
  /**
   * Function: paintVertexShape
   *
   * Paints the ellipse shape.
   */
  const paintVertexShape = (c, x, y, w, h) => {
    c.ellipse(x, y, w, h);
    c.fillAndStroke();
  };

  const _shape = Shape(undefined, {
    paintVertexShape,
    ...overrides
  });

  _shape.setBounds(bounds);
  _shape.setFill(fill);
  _shape.setStroke(stroke);
  _shape.setStrokeWidth(strokewidth);

  const me = {
    ..._shape,
    paintVertexShape
  };

  return me;
};

export default Ellipse;
