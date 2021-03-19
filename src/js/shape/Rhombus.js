/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { createWithOverrides, makeComponent } from '../Helpers';
import { LINE_ARCSIZE, STYLE_ARCSIZE } from '../util/Constants';
import Point from '../util/Point';
import { getValue } from '../util/Utils';

/**
 * Class: Rhombus
 *
 * Extends <mxShape> to implement a rhombus (aka diamond) shape.
 * This shape is registered under <mxConstants.SHAPE_RHOMBUS>
 * in <mxCellRenderer>.
 *
 * Constructor: Rhombus
 *
 * Constructs a new rhombus shape.
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
const Rhombus = (bounds, fill, stroke, strokewidth = 1) => {
  /**
   * Function: isRoundable
   *
   * Adds roundable support.
   */
  const isRoundable = () => true;

  /**
   * Function: paintVertexShape
   *
   * Generic painting implementation.
   */
  const paintVertexShape = (c, x, y, w, h) => {
    const hw = w / 2;
    const hh = h / 2;

    const arcSize = getValue(getStyle(), STYLE_ARCSIZE, LINE_ARCSIZE) / 2;
    c.begin();
    addPoints(
      c,
      [
        Point(x + hw, y),
        Point(x + w, y + hh),
        Point(x + hw, y + h),
        Point(x, y + hh)
      ],
      isRounded,
      arcSize,
      true
    );
    c.fillAndStroke();
  };

  const _shape = createWithOverrides({
    isRoundable,
    paintVertexShape,
    ...Rhombus.getOverrides()
  })(Shape)();

  _shape.setBounds(bounds);
  _shape.setFill(fill);
  _shape.setStroke(stroke);
  _shape.setStrokeWidth(strokewidth);

  const me = {
    ..._shape,
    isRoundable,
    paintVertexShape
  };

  return me;
};

export default makeComponent(Rhombus);
