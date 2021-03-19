/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet } from '../Helpers';
import {
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  NODETYPE_ELEMENT,
  RECTANGLE_ROUNDING_FACTOR,
  STYLE_BACKGROUND_OUTLINE,
  STYLE_DIRECTION,
  STYLE_FLIPH,
  STYLE_FLIPV,
  STYLE_POINTER_EVENTS,
  STYLE_STROKEWIDTH
} from '../util/Constants';
import Point from '../util/Point';
import { getChildNodes } from '../util/Utils';
import StencilRegistry from './StencilRegistry';

/**
 * Class: Stencil
 *
 * Implements a generic shape which is based on a XML node as a description.
 *
 * shape:
 *
 * The outer element is *shape*, that has attributes:
 *
 * - "name", string, required. The stencil name that uniquely identifies the shape.
 * - "w" and "h" are optional decimal view bounds. This defines your co-ordinate
 * system for the graphics operations in the shape. The default is 100,100.
 * - "aspect", optional string. Either "variable", the default, or "fixed". Fixed
 * means always render the shape with the aspect ratio defined by the ratio w/h.
 * Variable causes the ratio to match that of the geometry of the current vertex.
 * - "strokewidth", optional string. Either an integer or the string "inherit".
 * "inherit" indicates that the strokeWidth of the cell is only changed on scaling,
 * not on resizing. Default is "1".
 * If numeric values are used, the strokeWidth of the cell is changed on both
 * scaling and resizing and the value defines the multiple that is applied to
 * the width.
 *
 * connections:
 *
 * If you want to define specific fixed connection points on the shape use the
 * *connections* element. Each *constraint* element within connections defines
 * a fixed connection point on the shape. Constraints have attributes:
 *
 * - "perimeter", required. 1 or 0. 0 sets the connection point where specified
 * by x,y. 1 Causes the position of the connection point to be extrapolated from
 * the center of the shape, through x,y to the point of intersection with the
 * perimeter of the shape.
 * - "x" and "y" are the position of the fixed point relative to the bounds of
 * the shape. They can be automatically adjusted if perimeter=1. So, (0,0) is top
 * left, (0.5,0.5) the center, (1,0.5) the center of the right hand edge of the
 * bounds, etc. Values may be less than 0 or greater than 1 to be positioned
 * outside of the shape.
 * - "name", optional string. A unique identifier for the port on the shape.
 *
 * background and foreground:
 *
 * The path of the graphics drawing is split into two elements, *foreground* and
 * *background*. The split is to define which part any shadow applied to the shape
 * is derived from (the background). This, generally, means the background is the
 * line tracing of the outside of the shape, but not always.
 *
 * Any stroke, fill or fillstroke of a background must be the first element of the
 * foreground element, they must not be used within *background*. If the background
 * is empty, this is not required.
 *
 * Because the background cannot have any fill or stroke, it can contain only one
 * *path*, *rect*, *roundrect* or *ellipse* element (or none). It can also not
 * include *image*, *text* or *include-shape*.
 *
 * Note that the state, styling and drawing in mxGraph stencils is very close in
 * design to that of HTML 5 canvas. Tutorials on this subject, if you're not
 * familiar with the topic, will give a good high-level introduction to the
 * concepts used.
 *
 * State:
 *
 * Rendering within the foreground and background elements has the concept of
 * state. There are two types of operations other than state save/load, styling
 * and drawing. The styling operations change the current state, so you can save
 * the current state with <save/> and pull the last saved state from the state
 * stack using <restore/>.
 *
 * Styling:
 *
 * The elements that change colors within the current state all take a hash
 * prefixed hex color code ("#FFEA80").
 *
 * - *strokecolor*, this sets the color that drawing paths will be rendered in
 * when a stroke or fillstroke command is issued.
 * - *fillcolor*, this sets the color that the inside of closed paths will be
 * rendered in when a fill or fillstroke command is issued.
 * - *fontcolor*, this sets the color that fonts are rendered in when text is drawn.
 *
 * *alpha* defines the degree of transparency used between 1.0 for fully opaque
 * and 0.0 for fully transparent.
 *
 * *fillalpha* defines the degree of fill transparency used between 1.0 for fully
 * opaque and 0.0 for fully transparent.
 *
 * *strokealpha* defines the degree of stroke transparency used between 1.0 for
 * fully opaque and 0.0 for fully transparent.
 *
 * *strokewidth* defines the integer thickness of drawing elements rendered by
 * stroking. Use fixed="1" to apply the value as-is, without scaling.
 *
 * *dashed* is "1" for dashing enabled and "0" for disabled.
 *
 * When *dashed* is enabled the current dash pattern, defined by *dashpattern*,
 * is used on strokes. dashpattern is a sequence of space separated "on, off"
 * lengths that define what distance to paint the stroke for, then what distance
 * to paint nothing for, repeat... The default is "3 3". You could define a more
 * complex pattern with "5 3 2 6", for example. Generally, it makes sense to have
 * an even number of elements in the dashpattern, but that's not required.
 *
 * *linejoin*, *linecap* and *miterlimit* are best explained by the Mozilla page
 * on Canvas styling (about halfway down). The values are all the same except we
 * use "flat" for linecap, instead of Canvas' "butt".
 *
 * For font styling there are.
 *
 * - *fontsize*, an integer,
 * - *fontstyle*, an ORed bit pattern of bold (1), italic (2) and underline (4),
 * i.e bold underline is "5".
 * - *fontfamily*, is a string defining the typeface to be used.
 *
 * Drawing:
 *
 * Most drawing is contained within a *path* element. Again, the graphic
 * primitives are very similar to that of HTML 5 canvas.
 *
 * - *move* to attributes required decimals (x,y).
 * - *line* to attributes required decimals (x,y).
 * - *quad* to required decimals (x2,y2) via control point required decimals
 * (x1,y1).
 * - *curve* to required decimals (x3,y3), via control points required decimals
 * (x1,y1) and (x2,y2).
 * - *arc*, this doesn't follow the HTML Canvas signatures, instead it's a copy
 * of the SVG arc command. The SVG specification documentation gives the best
 * description of its behaviors. The attributes are named identically, they are
 * decimals and all required.
 * - *close* ends the current subpath and causes an automatic straight line to
 * be drawn from the current point to the initial point of the current subpath.
 *
 * Complex drawing:
 *
 * In addition to the graphics primitive operations there are non-primitive
 * operations. These provide an easy method to draw some basic shapes.
 *
 * - *rect*, attributes "x", "y", "w", "h", all required decimals
 * - *roundrect*, attributes "x", "y", "w", "h", all required decimals. Also
 * "arcsize" an optional decimal attribute defining how large, the corner curves
 * are.
 * - *ellipse*, attributes "x", "y", "w", "h", all required decimals.
 *
 * Note that these 3 shapes and all paths must be followed by either a fill,
 * stroke, or fillstroke.
 *
 * Text:
 *
 * *text* elements have the following attributes.
 *
 * - "str", the text string to display, required.
 * - "x" and "y", the decimal location (x,y) of the text element, required.
 * - "align", the horizontal alignment of the text element, either "left",
 * "center" or "right". Optional, default is "left".
 * - "valign", the vertical alignment of the text element, either "top", "middle"
 * or "bottom". Optional, default is "top".
 * - "localized", 0 or 1, if 1 then the "str" actually contains a key to use to
 * fetch the value out of mxResources. Optional, default is
 * <mxStencil.defaultLocalized>.
 * - "vertical", 0 or 1, if 1 the label is rendered vertically (rotated by 90
 * degrees). Optional, default is 0.
 * - "rotation", angle in degrees (0 to 360). The angle to rotate the text by.
 * Optional, default is 0.
 * - "align-shape", 0 or 1, if 0 ignore the rotation of the shape when setting
 * the text rotation. Optional, default is 1.
 *
 * If <allowEval> is true, then the text content of the this element can define
 * a function which is invoked with the shape as the only argument and returns
 * the value for the text element (ignored if the str attribute is not null).
 *
 * Images:
 *
 * *image* elements can either be external URLs, or data URIs, where supported
 * (not in IE 7-). Attributes are:
 *
 * - "src", required string. Either a data URI or URL.
 * - "x", "y", required decimals. The (x,y) position of the image.
 * - "w", "h", required decimals. The width and height of the image.
 * - "flipH" and "flipV", optional 0 or 1. Whether to flip the image along the
 * horizontal/vertical axis. Default is 0 for both.
 *
 * If <allowEval> is true, then the text content of the this element can define
 * a function which is invoked with the shape as the only argument and returns
 * the value for the image source (ignored if the src attribute is not null).
 *
 * Sub-shapes:
 *
 * *include-shape* allow stencils to be rendered within the current stencil by
 * referencing the sub-stencil by name. Attributes are:
 *
 * - "name", required string. The unique shape name of the stencil.
 * - "x", "y", "w", "h", required decimals. The (x,y) position of the sub-shape
 * and its width and height.
 *
 * Constructor: mxStencil
 *
 * Constructs a new generic shape by setting <desc> to the given XML node and
 * invoking <parseDescription> and <parseConstraints>.
 *
 * Parameters:
 *
 * desc - XML node that contains the stencil description.
 */
const Stencil = (desc) => {
  /**
   * Variable: desc
   *
   * Holds the XML node with the stencil description.
   */
  const [getDesc, setDesc] = addProp(desc);

  /**
   * Variable: constraints
   *
   * Holds an array of <mxConnectionConstraints> as defined in the shape.
   */
  const [getConstraints, setConstraints] = addProp();

  /**
   * Variable: aspect
   *
   * Holds the aspect of the shape. Default is 'auto'.
   */
  const [getAspect, setAspect] = addProp('auto');

  /**
   * Variable: w0
   *
   * Holds the width of the shape. Default is 100.
   */
  const [getW0, setW0] = addProp(100);

  /**
   * Variable: h0
   *
   * Holds the height of the shape. Default is 100.
   */
  const [getH0, setH0] = addProp(100);

  /**
   * Variable: bgNodes
   *
   * Holds the XML node with the stencil description.
   */
  const [getBgNode, setBgNode] = addProp();

  /**
   * Variable: fgNodes
   *
   * Holds the XML node with the stencil description.
   */
  const [getFgNode, setFgNode] = addProp();

  /**
   * Variable: strokewidth
   *
   * Holds the strokewidth direction from the description.
   */
  const [getStrokeWidth, setStrokeWidth] = addProp();

  /**
   * Function: parseDescription
   *
   * Reads <w0>, <h0>, <aspect>, <bgNodes> and <fgNodes> from <desc>.
   */
  const parseDescription = () => {
    const desc = getDesc();
    // LATER: Preprocess nodes for faster painting
    setFgNode(desc.getElementsByTagName('foreground')[0]);
    setBgNode(desc.getElementsByTagName('background')[0]);
    setW0(Number(desc.getAttribute('w') || 100));
    setH0(Number(desc.getAttribute('h') || 100));

    // Possible values for aspect are: variable and fixed where
    // variable means fill the available space and fixed means
    // use w0 and h0 to compute the aspect.
    const aspect = desc.getAttribute('aspect');
    setAspect(isSet(aspect) ? aspect : 'variable');

    // Possible values for strokewidth are all numbers and "inherit"
    // where the inherit means take the value from the style (ie. the
    // user-defined stroke-width). Note that the strokewidth is scaled
    // by the minimum scaling that is used to draw the shape (sx, sy).
    const sw = desc.getAttribute('strokewidth');
    setStrokewidth(isSet(sw) ? sw : '1');
  };

  /**
   * Function: parseConstraints
   *
   * Reads the constraints from <desc> into <constraints> using
   * <parseConstraint>.
   */
  const parseConstraints = () => {
    const conns = getDesc().getElementsByTagName('connections')[0];

    if (isSet(conns)) {
      const tmp = getChildNodes(conns);

      if (isSet(tmp) && tmp.length > 0) {
        const constraints = [];

        for (let i = 0; i < tmp.length; i++) {
          constraints.push(parseConstraint(tmp[i]));
        }

        setConstraints(constraints);
      }
    }
  };

  /**
   * Function: parseConstraint
   *
   * Parses the given XML node and returns its <mxConnectionConstraint>.
   */
  const parseConstraint = (node) => {
    const x = Number(node.getAttribute('x'));
    const y = Number(node.getAttribute('y'));
    const perimeter = node.getAttribute('perimeter') === '1';
    const name = node.getAttribute('name');

    return ConnectionConstraint(Point(x, y), perimeter, name);
  };

  /**
   * Function: evaluateTextAttribute
   *
   * Gets the given attribute as a text. The return value from <evaluateAttribute>
   * is used as a key to <mxResources.get> if the localized attribute in the text
   * node is 1 or if <defaultLocalized> is true.
   */
  const evaluateTextAttribute = (node, attribute, shape) =>
    evaluateAttribute(node, attribute, shape);

  /**
   * Function: evaluateAttribute
   *
   * Gets the attribute for the given name from the given node. If the attribute
   * does not exist then the text content of the node is evaluated and if it is
   * a function it is invoked with <shape> as the only argument and the return
   * value is used as the attribute value to be returned.
   */
  const evaluateAttribute = (node, attribute, shape) =>
    node.getAttribute(attribute);

  /**
   * Function: drawShape
   *
   * Draws this stencil inside the given bounds.
   */
  const drawShape = (canvas, shape, x, y, w, h) => {
    const stack = canvas.getStates().slice();

    // TODO: Internal structure (array of special structs?), relative and absolute
    // coordinates (eg. note shape, process vs star, actor etc.), text rendering
    // and non-proportional scaling, how to implement pluggable edge shapes
    // (start, segment, end blocks), pluggable markers, how to implement
    // swimlanes (title area) with this API, add icon, horizontal/vertical
    // label, indicator for all shapes, rotation
    const direction = getValue(shape.getStyle(), STYLE_DIRECTION, undefined);
    const aspect = computeAspect(shape.getStyle(), x, y, w, h, direction);
    const minScale = Math.min(aspect.getWidth(), aspect.getHeight());
    const sw =
      getStrokeWidth() === 'inherit'
        ? Number(getNumber(shape.style, STYLE_STROKEWIDTH, 1))
        : Number(getStrokeWidth()) * minScale;
    canvas.setStrokeWidth(sw);

    // Draws a transparent rectangle for catching events
    if (
      isSet(shape.getStyle()) &&
      getValue(shape.getStyle(), STYLE_POINTER_EVENTS, '0') === '1'
    ) {
      canvas.setStrokeColor(mxConstants.NONE);
      canvas.rect(x, y, w, h);
      canvas.stroke();
      canvas.setStrokeColor(shape.getStroke());
    }

    drawChildren(canvas, shape, x, y, w, h, getBgNode(), aspect, false, true);
    drawChildren(
      canvas,
      shape,
      x,
      y,
      w,
      h,
      getFgNode(),
      aspect,
      true,
      !shape.getOutline() ||
        isUnset(shape.getStyle()) ||
        getValue(shape.getStyle(), STYLE_BACKGROUND_OUTLINE, 0) === 0
    );

    // Restores stack for unequal count of save/restore calls
    if (canvas.states.length !== stack.length) {
      canvas.setStates(stack);
    }
  };

  /**
   * Function: drawChildren
   *
   * Draws this stencil inside the given bounds.
   */
  const drawChildren = (
    canvas,
    shape,
    x,
    y,
    w,
    h,
    node,
    aspect,
    disableShadow,
    paint
  ) => {
    if (isSet(node) && w > 0 && h > 0) {
      let tmp = node.firstChild;

      while (isSet(tmp)) {
        if (tmp.nodeType === NODETYPE_ELEMENT) {
          drawNode(canvas, shape, tmp, aspect, disableShadow, paint);
        }

        tmp = tmp.nextSibling;
      }
    }
  };

  /**
   * Function: computeAspect
   *
   * Returns a rectangle that contains the offset in x and y and the horizontal
   * and vertical scale in width and height used to draw this shape inside the
   * given <mxRectangle>.
   *
   * Parameters:
   *
   * shape - <mxShape> to be drawn.
   * bounds - <mxRectangle> that should contain the stencil.
   * direction - Optional direction of the shape to be darwn.
   */
  const computeAspect = (shape, x, y, w, h, direction) => {
    let x0 = x;
    let y0 = y;
    let sx = w / getW0();
    let sy = h / getH0();

    const inverse =
      direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH;

    if (inverse) {
      sy = w / getH0();
      sx = h / getW0();

      const delta = (w - h) / 2;

      x0 += delta;
      y0 -= delta;
    }

    if (getAspect() === 'fixed') {
      sy = Math.min(sx, sy);
      sx = sy;

      // Centers the shape inside the available space
      if (inverse) {
        x0 += (h - getW0() * sx) / 2;
        y0 += (w - getH0() * sy) / 2;
      } else {
        x0 += (w - getW0() * sx) / 2;
        y0 += (h - getH0() * sy) / 2;
      }
    }

    return Rectangle(x0, y0, sx, sy);
  };

  /**
   * Function: drawNode
   *
   * Draws this stencil inside the given bounds.
   */
  const drawNode = (canvas, shape, node, aspect, disableShadow, paint) => {
    const name = node.getNodeName();
    const x0 = aspect.getX();
    const y0 = aspect.getY();
    const sx = aspect.getWidth();
    const sy = aspect.getHeight();
    const minScale = Math.min(sx, sy);

    if (name === 'save') {
      canvas.save();
    } else if (name == 'restore') {
      canvas.restore();
    } else if (paint) {
      if (name === 'path') {
        canvas.begin();

        let parseRegularly = true;

        if (node.getAttribute('rounded') === '1') {
          parseRegularly = false;

          const arcSize = Number(node.getAttribute('arcSize'));
          let pointCount = 0;
          const segs = [];

          // Renders the elements inside the given path
          const childNode = node.firstChild;

          while (isSet(childNode)) {
            if (childNode.nodeType === NODETYPE_ELEMENT) {
              const childName = childNode.nodeName;

              if (childName === 'move' || childName === 'line') {
                if (childName === 'move' || segs.length === 0) {
                  segs.push([]);
                }

                segs[segs.length - 1].push(
                  Point(
                    x0 + Number(childNode.getAttribute('x')) * sx,
                    y0 + Number(childNode.getAttribute('y')) * sy
                  )
                );
                pointCount++;
              } else {
                //We only support move and line for rounded corners
                parseRegularly = true;
                break;
              }
            }

            childNode = childNode.nextSibling;
          }

          if (!parseRegularly && pointCount > 0) {
            for (let i = 0; i < segs.length; i++) {
              let close = false;
              const ps = segs[i][0],
                pe = segs[i][segs[i].length - 1];

              if (ps.equals(pe)) {
                segs[i].pop();
                close = true;
              }

              addPoints(canvas, segs[i], true, arcSize, close);
            }
          } else {
            parseRegularly = true;
          }
        }

        if (parseRegularly) {
          // Renders the elements inside the given path
          let childNode = node.firstChild;

          while (isSet(childNode)) {
            if (childNode.nodeType === NODETYPE_ELEMENT) {
              drawNode(canvas, shape, childNode, aspect, disableShadow, paint);
            }

            childNode = childNode.nextSibling;
          }
        }
      } else if (name === 'close') {
        canvas.close();
      } else if (name === 'move') {
        canvas.moveTo(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy
        );
      } else if (name === 'line') {
        canvas.lineTo(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy
        );
      } else if (name === 'quad') {
        canvas.quadTo(
          x0 + Number(node.getAttribute('x1')) * sx,
          y0 + Number(node.getAttribute('y1')) * sy,
          x0 + Number(node.getAttribute('x2')) * sx,
          y0 + Number(node.getAttribute('y2')) * sy
        );
      } else if (name === 'curve') {
        canvas.curveTo(
          x0 + Number(node.getAttribute('x1')) * sx,
          y0 + Number(node.getAttribute('y1')) * sy,
          x0 + Number(node.getAttribute('x2')) * sx,
          y0 + Number(node.getAttribute('y2')) * sy,
          x0 + Number(node.getAttribute('x3')) * sx,
          y0 + Number(node.getAttribute('y3')) * sy
        );
      } else if (name === 'arc') {
        canvas.arcTo(
          Number(node.getAttribute('rx')) * sx,
          Number(node.getAttribute('ry')) * sy,
          Number(node.getAttribute('x-axis-rotation')),
          Number(node.getAttribute('large-arc-flag')),
          Number(node.getAttribute('sweep-flag')),
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy
        );
      } else if (name === 'rect') {
        canvas.rect(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          Number(node.getAttribute('w')) * sx,
          Number(node.getAttribute('h')) * sy
        );
      } else if (name === 'roundrect') {
        var arcsize = Number(node.getAttribute('arcsize'));

        if (arcsize === 0) {
          arcsize = RECTANGLE_ROUNDING_FACTOR * 100;
        }

        const w = Number(node.getAttribute('w')) * sx;
        const h = Number(node.getAttribute('h')) * sy;
        const factor = Number(arcsize) / 100;
        const r = Math.min(w * factor, h * factor);

        canvas.roundrect(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          w,
          h,
          r,
          r
        );
      } else if (name === 'ellipse') {
        canvas.ellipse(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          Number(node.getAttribute('w')) * sx,
          Number(node.getAttribute('h')) * sy
        );
      } else if (name === 'image') {
        if (!shape.isOutline()) {
          const src = evaluateAttribute(node, 'src', shape);

          canvas.image(
            x0 + Number(node.getAttribute('x')) * sx,
            y0 + Number(node.getAttribute('y')) * sy,
            Number(node.getAttribute('w')) * sx,
            Number(node.getAttribute('h')) * sy,
            src,
            false,
            node.getAttribute('flipH') === '1',
            node.getAttribute('flipV') === '1'
          );
        }
      } else if (name === 'text') {
        if (!shape.isOutline()) {
          const str = evaluateTextAttribute(node, 'str', shape);
          let rotation = node.getAttribute('vertical') === '1' ? -90 : 0;

          if (node.getAttribute('align-shape') === '0') {
            const dr = shape.rotation;

            // Depends on flipping
            const flipH = getValue(shape.style, STYLE_FLIPH, 0) === 1;
            const flipV = getValue(shape.style, STYLE_FLIPV, 0) === 1;

            if (flipH && flipV) {
              rotation -= dr;
            } else if (flipH || flipV) {
              rotation += dr;
            } else {
              rotation -= dr;
            }
          }

          rotation -= node.getAttribute('rotation');

          canvas.text(
            x0 + Number(node.getAttribute('x')) * sx,
            y0 + Number(node.getAttribute('y')) * sy,
            0,
            0,
            str,
            node.getAttribute('align') || 'left',
            node.getAttribute('valign') || 'top',
            false,
            '',
            undefined,
            false,
            rotation
          );
        }
      } else if (name === 'include-shape') {
        const stencil = StencilRegistry.getStencil(node.getAttribute('name'));

        if (isSet(stencil)) {
          const x = x0 + Number(node.getAttribute('x')) * sx;
          const y = y0 + Number(node.getAttribute('y')) * sy;
          const w = Number(node.getAttribute('w')) * sx;
          const h = Number(node.getAttribute('h')) * sy;

          stencil.drawShape(canvas, shape, x, y, w, h);
        }
      } else if (name === 'fillstroke') {
        canvas.fillAndStroke();
      } else if (name === 'fill') {
        canvas.fill();
      } else if (name === 'stroke') {
        canvas.stroke();
      } else if (name === 'strokewidth') {
        const s = node.getAttribute('fixed') === '1' ? 1 : minScale;
        canvas.setStrokeWidth(Number(node.getAttribute('width')) * s);
      } else if (name === 'dashed') {
        canvas.setDashed(node.getAttribute('dashed') === '1');
      } else if (name === 'dashpattern') {
        let value = node.getAttribute('pattern');

        if (isSet(value)) {
          const tmp = value.split(' ');
          const pat = [];

          for (let i = 0; i < tmp.length; i++) {
            if (tmp[i].length > 0) {
              pat.push(Number(tmp[i]) * minScale);
            }
          }

          value = pat.join(' ');
          canvas.setDashPattern(value);
        }
      } else if (name === 'strokecolor') {
        canvas.setStrokeColor(node.getAttribute('color'));
      } else if (name === 'linecap') {
        canvas.setLineCap(node.getAttribute('cap'));
      } else if (name === 'linejoin') {
        canvas.setLineJoin(node.getAttribute('join'));
      } else if (name === 'miterlimit') {
        canvas.setMiterLimit(Number(node.getAttribute('limit')));
      } else if (name === 'fillcolor') {
        canvas.setFillColor(node.getAttribute('color'));
      } else if (name === 'alpha') {
        canvas.setAlpha(node.getAttribute('alpha'));
      } else if (name === 'fillalpha') {
        canvas.setAlpha(node.getAttribute('alpha'));
      } else if (name === 'strokealpha') {
        canvas.setAlpha(node.getAttribute('alpha'));
      } else if (name === 'fontcolor') {
        canvas.setFontColor(node.getAttribute('color'));
      } else if (name === 'fontstyle') {
        canvas.setFontStyle(node.getAttribute('style'));
      } else if (name === 'fontfamily') {
        canvas.setFontFamily(node.getAttribute('family'));
      } else if (name === 'fontsize') {
        canvas.setFontSize(Number(node.getAttribute('size')) * minScale);
      }

      if (
        disableShadow &&
        (name === 'fillstroke' || name === 'fill' || name === 'stroke')
      ) {
        disableShadow = false;
        canvas.setShadow(false);
      }
    }
  };

  const me = {
    parseDescription,
    parseConstraints,
    parseConstraint,
    evaluateTextAttribute,
    evaluateAttribute,
    drawShape,
    drawChildren,
    computeAspect,
    drawNode
  };

  return me;
};

export default Stencil;
