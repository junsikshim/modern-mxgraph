/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp } from '../Helpers';
import Point from './Point';

/**
 * Class: Rectangle
 *
 * Extends <Point> to implement a 2-dimensional rectangle with double
 * precision coordinates.
 *
 * Constructor: Rectangle
 *
 * Constructs a new rectangle for the optional parameters. If no parameters
 * are given then the respective default values are used.
 */
const Rectangle = (x, y, width = 0, height = 0) => {
  // Extends Point.
  const { getX, setX, getY, setY } = Point(x, y);

  /**
   * Variable: width
   *
   * Holds the width of the rectangle. Default is 0.
   */
  const [getWidth, setWidth] = addProp(width);

  /**
   * Variable: height
   *
   * Holds the height of the rectangle. Default is 0.
   */
  const [getHeight, setHeight] = addProp(height);

  /**
   * Function: setRect
   *
   * Sets this rectangle to the specified values
   */
  const setRect = (x, y, w, h) => {
    setX(x);
    setY(y);
    setWidth(w);
    setHeight(h);
  };

  /**
   * Function: getCenterX
   *
   * Returns the x-coordinate of the center point.
   */
  const getCenterX = () => getX() + getWidth() / 2;

  /**
   * Function: getCenterY
   *
   * Returns the y-coordinate of the center point.
   */
  const getCenterY = () => getY() + getHeight() / 2;

  /**
   * Function: add
   *
   * Adds the given rectangle to this rectangle.
   */
  const add = (rect) => {
    if (rect) {
      const minX = Math.min(getX(), rect.getX());
      const minY = Math.min(getY(), rect.getY());
      const maxX = Math.max(getX() + getWidth(), rect.getX() + rect.getWidth());
      const maxY = Math.max(
        getY() + getHeight(),
        rect.getY() + rect.getHeight()
      );

      setX(minX);
      setY(minY);
      setWidth(maxX - minX);
      setHeight(maxY - minY);
    }
  };

  /**
   * Function: intersect
   *
   * Changes this rectangle to where it overlaps with the given rectangle.
   */
  const intersect = (rect) => {
    if (rect) {
      const r1 = getX() + getWidth();
      const r2 = rect.getX() + rect.getWidth();

      const b1 = getY() + getHeight();
      const b2 = rect.getY() + rect.getHeight();

      setX(Math.max(getX(), rect.getX()));
      setY(Math.max(getY(), rect.getY()));
      setWidth(Math.min(r1, r2) - getX());
      setHeight(Math.min(b1, b2) - getY());
    }
  };

  /**
   * Function: grow
   *
   * Grows the rectangle by the given amount, that is, this method subtracts
   * the given amount from the x- and y-coordinates and adds twice the amount
   * to the width and height.
   */
  const grow = (amount) => {
    setX(getX() - amount);
    setY(getY() - amount);
    setWidth(getWidth() + 2 * amount);
    setHeight(getHeight() + 2 * amount);

    return me;
  };

  /**
   * Function: getPoint
   *
   * Returns the top, left corner as a new <Point>.
   */
  const getPoint = () => Point(getX(), getY());

  /**
   * Function: rotate90
   *
   * Rotates this rectangle by 90 degree around its center point.
   */
  const rotate90 = () => {
    const t = (getWidth() - getHeight()) / 2;
    setX(getX() + t);
    setY(getY() - t);
    const tmp = getWidth();
    setWidth(getHeight());
    setHeight(tmp);
  };

  /**
   * Function: equals
   *
   * Returns true if the given object equals this rectangle.
   */
  const equals = (obj) =>
    obj &&
    obj.getX() === getX() &&
    obj.getY() === getY() &&
    obj.getWidth() === getWidth() &&
    obj.getHeight() === getHeight();

  const me = {
    getX,
    getY,
    getWidth,
    getHeight,
    setRect,
    getCenterX,
    getCenterY,
    add,
    intersect,
    grow,
    getPoint,
    rotate90,
    equals
  };

  return me;
};

/**
 * Function: fromRectangle
 *
 * Returns a new <Rectangle> which is a copy of the given rectangle.
 */
Rectangle.fromRectangle = (rect) =>
  Rectangle(rect.getX(), rect.getY(), rect.getWidth(), rect.getHeight());

export default Rectangle;
