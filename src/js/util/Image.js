/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp } from '../Helpers';

/**
 * Class: Image
 *
 * Encapsulates the URL, width and height of an image.
 *
 * Constructor: Image
 *
 * Constructs a new image.
 */
const Image = (src, width, height) => {
  /**
   * Variable: src
   *
   * String that specifies the URL of the image.
   */
  const [getSrc, setSrc] = addProp(src);

  /**
   * Variable: width
   *
   * Integer that specifies the width of the image.
   */
  const [getWidth, setWidth] = addProp(width);

  /**
   * Variable: height
   *
   * Integer that specifies the height of the image.
   */
  const [getHeight, setHeight] = addProp(height);

  const me = {
    getSrc,
    setSrc,
    getWidth,
    setWidth,
    getHeight,
    setHeight
  };

  return me;
};

export default Image;
