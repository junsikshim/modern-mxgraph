/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet } from '../Helpers';
import {
  LINE_ARCSIZE,
  NONE,
  RECTANGLE_ROUNDING_FACTOR,
  STYLE_ABSOLUTE_ARCSIZE,
  STYLE_ARCSIZE,
  STYLE_POINTER_EVENTS
} from '../util/Constants';
import { getValue } from '../util/Utils';
import Shape from './Shape';

/**
 * Class: RectangleShape
 *
 * Extends <mxShape> to implement a rectangle shape.
 * This shape is registered under <mxConstants.SHAPE_RECTANGLE>
 * in <mxCellRenderer>.
 *
 * Constructor: mxRectangleShape
 *
 * Constructs a new rectangle shape.
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
const RectangleShape = (bounds, fill, stroke, strokewidth = 1) => {
  const _shape = Shape();

  const [getBounds, setBounds] = addProp(bounds);
  const [getFill, setFill] = addProp(fill);
  const [getStroke, setStroke] = addProp(stroke);
  const [getStrokeWidth, setStrokeWidth] = addProp(strokewidth);

  /**
   * Function: isHtmlAllowed
   *
   * Returns true for non-rounded, non-rotated shapes with no glass gradient.
   */
  const isHtmlAllowed = () => {
    let events = true;

    if (isSet(_shape.getStyle())) {
      events = getValue(_shape.getStyle(), STYLE_POINTER_EVENTS, true);
    }

    return (
      !_shape.isRounded() &&
      !_shape.isGlass() &&
      _shape.getRotation() === 0 &&
      (events || (isSet(getFill()) && getFill() !== NONE))
    );
  };

  /**
   * Function: paintBackground
   *
   * Generic background painting implementation.
   */
  _shape.paintBackground = (c, x, y, w, h) => {
    let events = true;

    if (isSet(_shape.getStyle())) {
      events = getValue(_shape.getStyle(), STYLE_POINTER_EVENTS, '1') === '1';
    }

    if (
      events ||
      (isSet(getFill()) && getFill() !== NONE) ||
      (isSet(getStroke()) && getStroke() !== NONE)
    ) {
      if (!events && (isUnset(getFill()) || getFill() === NONE)) {
        c.setPointerEvents(false);
      }

      if (_shape.isRounded()) {
        let r = 0;

        if (getValue(_shape.getStyle(), STYLE_ABSOLUTE_ARCSIZE, 0) === '1') {
          r = Math.min(
            w / 2,
            Math.min(
              h / 2,
              getValue(_shape.getStyle(), STYLE_ARCSIZE, LINE_ARCSIZE) / 2
            )
          );
        } else {
          const f =
            getValue(
              _shape.getStyle(),
              STYLE_ARCSIZE,
              RECTANGLE_ROUNDING_FACTOR * 100
            ) / 100;
          r = Math.min(w * f, h * f);
        }

        c.roundrect(x, y, w, h, r, r);
      } else {
        c.rect(x, y, w, h);
      }

      c.fillAndStroke();
    }
  };

  /**
   * Function: isRoundable
   *
   * Adds roundable support.
   */
  const isRoundable = (c, x, y, w, h) => true;

  /**
   * Function: paintForeground
   *
   * Generic background painting implementation.
   */
  _shape.paintForeground = (c, x, y, w, h) => {
    if (
      _shape.isGlass() &&
      !_shape.isOutline() &&
      isSet(getFill()) &&
      getFill() !== NONE
    ) {
      paintGlassEffect(
        c,
        x,
        y,
        w,
        h,
        getArcSize(w + getStrokeWidth(), h + getStrokeWidth())
      );
    }
  };

  const me = {
    ..._shape,
    isHtmlAllowed,
    isRoundable
  };

  return me;
};

export default RectangleShape;
