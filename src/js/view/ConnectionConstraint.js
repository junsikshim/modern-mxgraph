/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../Helpers';

/**
 * Class: mxConnectionConstraint
 *
 * Defines an object that contains the constraints about how to connect one
 * side of an edge to its terminal.
 *
 * Constructor: mxConnectionConstraint
 *
 * Constructs a new connection constraint for the given point and boolean
 * arguments.
 *
 * Parameters:
 *
 * point - Optional <mxPoint> that specifies the fixed location of the point
 * in relative coordinates. Default is null.
 * perimeter - Optional boolean that specifies if the fixed point should be
 * projected onto the perimeter of the terminal. Default is true.
 */
const ConnectionConstraint = (point, perimeter = true, name, dx, dy) => {
  /**
   * Variable: point
   *
   * <mxPoint> that specifies the fixed location of the connection point.
   */
  const [getPoint, setPoint] = addProp(point);

  /**
   * Variable: perimeter
   *
   * Boolean that specifies if the point should be projected onto the perimeter
   * of the terminal.
   */
  const [getPerimeter, setPerimeter] = addProp(perimeter);

  /**
   * Variable: name
   *
   * Optional string that specifies the name of the constraint.
   */
  const [getName, setName] = addProp(name);

  /**
   * Variable: dx
   *
   * Optional float that specifies the horizontal offset of the constraint.
   */
  const [getDx, setDx] = addProp(dx);

  /**
   * Variable: dy
   *
   * Optional float that specifies the vertical offset of the constraint.
   */
  const [getDy, setDy] = addProp(dy);

  const me = {
    getPoint,
    setPoint,
    getPerimeter,
    setPerimeter,
    getName,
    setName,
    getDx,
    setDx,
    getDy,
    setDy
  };

  return me;
};

export default makeComponent(ConnectionConstraint);
