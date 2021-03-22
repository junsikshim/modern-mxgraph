/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import {
  addProp,
  createWithOverrides,
  extendFrom,
  isSet,
  makeComponent
} from '../Helpers';
import { STYLE_IMAGE_BACKGROUND, STYLE_IMAGE_BORDER } from '../util/Constants';
import { getNumber } from '../util/Utils';
import RectangleShape from './RectangleShape';
import Shape from './Shape';

/**
 * Class: ImageShape
 *
 * Extends <mxShape> to implement an image shape. This shape is registered
 * under <mxConstants.SHAPE_IMAGE> in <mxCellRenderer>.
 *
 * Constructor: mxImageShape
 *
 * Constructs a new image shape.
 *
 * Parameters:
 *
 * bounds - <mxRectangle> that defines the bounds. This is stored in
 * <mxShape.bounds>.
 * image - String that specifies the URL of the image. This is stored in
 * <image>.
 * fill - String that defines the fill color. This is stored in <fill>.
 * stroke - String that defines the stroke color. This is stored in <stroke>.
 * strokeWidth - Optional integer that defines the stroke width. Default is
 * 0. This is stored in <strokeWidth>.
 */
const ImageShape = (bounds, image, fill, stroke, strokeWidth) => {
  const [getImage, setImage] = addProp(image);

  /**
   * Variable: preserveImageAspect
   *
   * Switch to preserve image aspect. Default is true.
   */
  const [isPreserveImageAspect, setPreserveImageAspect] = addProp(true);

  /**
   * Function: getSvgScreenOffset
   *
   * Disables offset in IE9 for crisper image output.
   */
  const getSvgScreenOffset = () => 0;

  /**
   * Function: apply
   *
   * Overrides <mxShape.apply> to replace the fill and stroke colors with the
   * respective values from <mxConstants.STYLE_IMAGE_BACKGROUND> and
   * <mxConstants.STYLE_IMAGE_BORDER>.
   *
   * Applies the style of the given <mxCellState> to the shape. This
   * implementation assigns the following styles to local fields:
   *
   * - <mxConstants.STYLE_IMAGE_BACKGROUND> => fill
   * - <mxConstants.STYLE_IMAGE_BORDER> => stroke
   *
   * Parameters:
   *
   * state - <mxCellState> of the corresponding cell.
   */
  const apply = (state) => {
    shapeApply(state);

    setFill();
    setStroke();
    setGradient();

    const style = getStyle();

    if (isSet(style)) {
      setPreserveImageAspect(getNumber(style, STYLE_IMAGE_ASPECT, 1) === 1);
    }
  };

  /**
   * Function: isHtmlAllowed
   *
   * Returns true if HTML is allowed for this shape. This implementation always
   * returns false.
   */
  const isHtmlAllowed = () => !isPreserveImageAspect();

  /**
   * Function: createHtml
   *
   * Creates and returns the HTML DOM node(s) to represent
   * this shape. This implementation falls back to <createVml>
   * so that the HTML creation is optional.
   */
  const createHtml = () => {
    const node = document.createElement('div');
    node.style.position = 'absolute';

    return node;
  };

  /**
   * Function: isRoundable
   *
   * Disables inherited roundable support.
   */
  const isRoundable = (c, x, y, w, h) => false;

  /**
   * Function: paintVertexShape
   *
   * Generic background painting implementation.
   */
  const paintVertexShape = (c, x, y, w, h) => {
    if (isSet(getImage())) {
      const style = getStyle();
      const fill = getValue(style, STYLE_IMAGE_BACKGROUND, null);
      let stroke = getValue(style, STYLE_IMAGE_BORDER, null);

      if (isSet(fill)) {
        // Stroke rendering required for shadow
        c.setFillColor(fill);
        c.setStrokeColor(stroke);
        c.rect(x, y, w, h);
        c.fillAndStroke();
      }

      // FlipH/V are implicit via Shape.updateTransform
      c.image(x, y, w, h, getImage(), isPreserveImageAspect(), false, false);

      stroke = getValue(style, STYLE_IMAGE_BORDER, null);

      if (isSet(stroke)) {
        c.setShadow(false);
        c.setStrokeColor(stroke);
        c.rect(x, y, w, h);
        c.stroke();
      }
    } else {
      paintBackground(c, x, y, w, h);
    }
  };

  /**
   * Function: redrawHtmlShape
   *
   * Overrides <mxShape.redrawHtmlShape> to preserve the aspect ratio of images.
   */
  const redrawHtmlShape = () => {
    const node = getNode();
    const bounds = getBounds();
    const style = getStyle();

    node.style.left = Math.round(bounds.getX()) + 'px';
    node.style.top = Math.round(bounds.getY()) + 'px';
    node.style.width = Math.max(0, Math.round(bounds.getWidth())) + 'px';
    node.style.height = Math.max(0, Math.round(bounds.getHeight())) + 'px';
    node.innerHTML = '';

    if (isSet(getImage())) {
      const fill = getValue(style, STYLE_IMAGE_BACKGROUND, '');
      const stroke = getValue(style, STYLE_IMAGE_BORDER, '');
      node.style.backgroundColor = fill;
      node.style.borderColor = stroke;

      const img = document.createElement('img');
      img.setAttribute('border', '0');
      img.style.position = 'absolute';
      img.src = image;

      if (img.nodeName === 'image') {
        img.style.rotation = rotation;
      } else if (rotation !== 0) {
        // LATER: Add flipV/H support
        setPrefixedStyle(img.style, 'transform', 'rotate(' + rotation + 'deg)');
      } else {
        setPrefixedStyle(img.style, 'transform', '');
      }

      // Known problem: IE clips top line of image for certain angles
      img.style.width = node.style.width;
      img.style.height = node.style.height;

      node.style.backgroundImage = '';
      node.appendChild(img);
    } else {
      setTransparentBackgroundImage(node);
    }
  };

  const me = {
    getSvgScreenOffset,
    apply,
    isHtmlAllowed,
    createHtml,
    isRoundable,
    paintVertexShape,
    redrawHtmlShape
  };

  const { paintBackground } = RectangleShape();
  const _shape = Shape();

  extendFrom({
    paintBackground,
    ..._shape
  })(me);

  _shape.setBounds(bounds);
  _shape.setFill(fill);
  _shape.setStroke(stroke);
  _shape.setStrokeWidth(strokeWidth);
  _shape.setShadow(false);

  return me;
};

export default makeComponent(ImageShape);
