/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp } from '../Helpers';
import { clone as clonePoint } from './Utils';

/**
 * Class: Point
 *
 * Implements a 2-dimensional vector with double precision coordinates.
 *
 * Constructor: Point
 *
 * Constructs a new point for the optional x and y coordinates. If no
 * coordinates are given, then the default values for <x> and <y> are used.
 */
const Point = (x = 0, y = 0) => {
  /**
   * Variable: x
   *
   * Holds the x-coordinate of the point. Default is 0.
   */
  const [getX, setX] = addProp(x);

  /**
   * Variable: y
   *
   * Holds the y-coordinate of the point. Default is 0.
   */
  const [getY, setY] = addProp(y);

  /**
   * Function: equals
   *
   * Returns true if the given object equals this point.
   */
  const equals = (obj) => obj && obj.getX() === getX() && obj.getY() === getY();

  /**
   * Function: clone
   *
   * Returns a clone of this <Point>.
   */
  const clone = () => clonePoint(me);

  const me = {
    getX,
    setX,
    getY,
    setY,
    equals,
    clone
  };

  return me;
};

export default Point;
