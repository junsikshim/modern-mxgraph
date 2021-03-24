/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import AbstractCanvas2D from './AbstractCanvas2D';
import {
  ABSOLUTE_LINE_HEIGHT,
  ALIGN_BOTTOM,
  ALIGN_CENTER,
  ALIGN_LEFT,
  ALIGN_MIDDLE,
  ALIGN_RIGHT,
  ALIGN_TOP,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DIRECTION_EAST,
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  DIRECTION_WEST,
  FONT_BOLD,
  FONT_ITALIC,
  FONT_STRIKETHROUGH,
  FONT_UNDERLINE,
  LINE_HEIGHT,
  NS_SVG,
  NS_XLINK,
  WORD_WRAP
} from './Constants';
import { write } from './Utils';
import { addProp, isSet, isUnset, makeComponent } from '../Helpers';
import { IS_CHROMEAPP, IS_EDGE, IS_FF, IS_IE, IS_IE11, IS_OT } from '../Client';

/**
 * Class: SvgCanvas2D
 *
 * Extends <mxAbstractCanvas2D> to implement a canvas for SVG. This canvas writes all
 * calls as SVG output to the given SVG root node.
 *
 * (code)
 * var svgDoc = mxUtils.createXmlDocument();
 * var root = (svgDoc.createElementNS != null) ?
 * 		svgDoc.createElementNS(mxConstants.NS_SVG, 'svg') : svgDoc.createElement('svg');
 *
 * if (svgDoc.createElementNS == null)
 * {
 *   root.setAttribute('xmlns', mxConstants.NS_SVG);
 *   root.setAttribute('xmlns:xlink', mxConstants.NS_XLINK);
 * }
 * else
 * {
 *   root.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', mxConstants.NS_XLINK);
 * }
 *
 * var bounds = graph.getGraphBounds();
 * root.setAttribute('width', (bounds.x + bounds.width + 4) + 'px');
 * root.setAttribute('height', (bounds.y + bounds.height + 4) + 'px');
 * root.setAttribute('version', '1.1');
 *
 * svgDoc.appendChild(root);
 *
 * var svgCanvas = new mxSvgCanvas2D(root);
 * (end)
 *
 * A description of the public API is available in <mxXmlCanvas2D>.
 *
 * To disable anti-aliasing in the output, use the following code.
 *
 * (code)
 * graph.view.canvas.ownerSVGElement.setAttribute('shape-rendering', 'crispEdges');
 * (end)
 *
 * Or set the respective attribute in the SVG element directly.
 *
 * Constructor: SvgCanvas2D
 *
 * Constructs a new SVG canvas.
 *
 * Parameters:
 *
 * root - SVG container for the output.
 * styleEnabled - Optional boolean that specifies if a style section should be
 * added. The style section sets the default font-size, font-family and
 * stroke-miterlimit globally. Default is false.
 */
const SvgCanvas2D = (root, styleEnabled = false) => {
  /**
   * Variable: root
   *
   * Reference to the container for the SVG content.
   */
  const [getRoot, setRoot] = addProp(root);
  const [getOriginalRoot, setOriginalRoot] = addProp();

  /**
   * Variable: gradients
   *
   * Local cache of gradients for quick lookups.
   */
  const [getGradients, setGradients] = addProp([]);

  /**
   * Variable: defs
   *
   * Reference to the defs section of the SVG document. Only for export.
   */
  const [getDefs, setDefs] = addProp();

  /**
   * Variable: styleEnabled
   *
   * Stores the value of styleEnabled passed to the constructor.
   */
  const [isStyleEnabled, setStyleEnabled] = addProp(styleEnabled);
  const [getNode, setNode] = addProp();
  const [isMatchHtmlAlignment, setMatchHtmlAlignent] = addProp(true);
  const [isTextEnabled, setTextEnabled] = addProp(true);
  const [isFoEnabled, setFoEnabled] = addProp(true);
  const [getFoAltText, setFoAltText] = addProp('[Object]');
  const [getFoOffset, setFoOffset] = addProp(0);
  const [getTextOffset, setTextOffset] = addProp(0);
  const [getImageOffset, setImageOffset] = addProp(0);
  const [getStrokeTolerance, setStrokeTolerance] = addProp(0);
  const [getMinStrokeWidth, setMinStrokeWidth] = addProp(1);
  const [getRefCount, setRefCount] = addProp(0);
  const [getLineHeightCorrection, setLineHeightCorrection] = addProp(1);
  const [getPointerEventsValue, setPointerEventsValue] = addProp('all');
  const [getFontMetricsPadding, setFontMetricsPadding] = addProp(10);
  const [isCacheOffsetSize, setCacheOffsetSize] = addProp(true);
  const [useDomParser, setUseDomParser] = addProp(true);
  const [useAbsoluteIds, setUseAbsoluteIds] = addProp(
    !IS_CHROMEAPP &&
      !IS_IE &&
      !IS_IE11 &&
      !IS_EDGE &&
      document.getElementsByTagName('base').length > 0
  );

  const format = (value) => parseFloat(parseFloat(value).toFixed(2));

  const getBaseUrl = () => {
    let href = location.href;
    const hash = href.lastIndexOf('#');

    if (hash > 0) href = href.substring(0, hash);

    return href;
  };

  const reset = () => {
    _canvas.Reset();
    setGradients([]);
  };

  const createStyle = (x) => {
    const style = createElement('style');
    style.setAttribute('type', 'text/css');
    write(
      style,
      'svg{font-family:' +
        DEFAULT_FONTFAMILY +
        ';font-size:' +
        DEFAULT_FONTSIZE +
        ';fill:none;stroke-miterlimit:10}'
    );

    return style;
  };

  const createElement = (tagName, namespace) => {
    const root = getRoot();

    if (isSet(root.ownerDocument.createElementNS))
      return root.ownerDocument.createElementNS(namespace || NS_SVG, tagName);
    else {
      const elt = root.ownerDocument.createElement(tagName);

      if (isSet(namespace)) elt.setAttribute('xmlns', namespace);

      return elt;
    }
  };

  const getAlternateText = (
    fo,
    x,
    y,
    w,
    h,
    str,
    align,
    valign,
    wrap,
    format,
    overflow,
    clip,
    rotation
  ) => (isSet(str) ? getFoAltText() : undefined);

  const createAlternateContent = (
    fo,
    x,
    y,
    w,
    h,
    str,
    align,
    valign,
    wrap,
    format,
    overflow,
    clip,
    rotation
  ) => {
    const text = getAlternateText(
      fo,
      x,
      y,
      w,
      h,
      str,
      align,
      valign,
      wrap,
      format,
      overflow,
      clip,
      rotation
    );
    const s = _canvas.getState();

    if (isSet(text) && s.fontSize > 0) {
      const dy = valign === ALIGN_TOP ? 1 : valign === ALIGN_BOTTOM ? 0 : 0.3;
      const anchor =
        align === ALIGN_RIGHT
          ? 'end'
          : align === ALIGN_LEFT
          ? 'start'
          : 'middle';

      const alt = createElement('text');
      alt.setAttribute('x', Math.round(x + s.dx));
      alt.setAttribute('y', Math.round(y + s.dy + dy * s.fontSize));
      alt.setAttribute('fill', s.fontColor || 'black');
      alt.setAttribute('font-family', s.fontFamily);
      alt.setAttribute('font-size', Math.round(s.fontSize) + 'px');

      // Text-anchor start is default in SVG
      if (anchor !== 'start') alt.setAttribute('text-anchor', anchor);

      if ((s.fontStyle & FONT_BOLD) === FONT_BOLD)
        alt.setAttribute('font-weight', 'bold');

      if ((s.fontStyle & FONT_ITALIC) === FONT_ITALIC)
        alt.setAttribute('font-style', 'italic');

      const txtDecor = [];

      if ((s.fontStyle & FONT_UNDERLINE) === FONT_UNDERLINE)
        txtDecor.push('underline');

      if ((s.fontStyle & FONT_STRIKETHROUGH) === FONT_STRIKETHROUGH)
        txtDecor.push('line-through');

      if (txtDecor.length > 0)
        alt.setAttribute('text-decoration', txtDecor.join(' '));

      write(alt, text);

      return alt;
    } else {
      return;
    }
  };

  const createGradientId = (start, end, alpha1, alpha2, direction) => {
    let s = start;
    let e = end;

    // Removes illegal characters from gradient ID
    if (s.charAt(0) === '#') {
      s = s.substring(1);
    }

    if (e.charAt(0) === '#') {
      e = e.substring(1);
    }

    // Workaround for gradient IDs not working in Safari 5 / Chrome 6
    // if they contain uppercase characters
    s = s.toLowerCase() + '-' + alpha1;
    e = e.toLowerCase() + '-' + alpha2;

    // Wrong gradient directions possible?
    let dir;

    if (isUnset(direction) || direction === DIRECTION_SOUTH) {
      dir = 's';
    } else if (direction === DIRECTION_EAST) {
      dir = 'e';
    } else {
      const tmp = s;
      s = e;
      e = tmp;

      if (direction === DIRECTION_NORTH) {
        dir = 's';
      } else if (direction === DIRECTION_WEST) {
        dir = 'e';
      }
    }

    return 'mx-gradient-' + s + '-' + e + '-' + dir;
  };

  const getSvgGradient = (start, end, alpha1, alpha2, direction) => {
    const id = createGradientId(start, end, alpha1, alpha2, direction);
    let gradient = getGradients()[id];

    if (isUnset(gradient)) {
      const svg = getRoot().ownerSVGElement;

      let counter = 0;
      let tmpId = id + '-' + counter;

      if (isSet(svg)) {
        gradient = svg.ownerDocument.getElementById(tmpId);

        while (isSet(gradient) && gradient.ownerSVGElement !== svg) {
          tmpId = id + '-' + counter++;
          gradient = svg.ownerDocument.getElementById(tmpId);
        }
      } else {
        const c = getRefCount() + 1;
        setRefCount(c);

        // Uses shorter IDs for export
        tmpId = 'id' + c;
      }

      if (isUnset(gradient)) {
        gradient = createSvgGradient(start, end, alpha1, alpha2, direction);
        gradient.setAttribute('id', tmpId);

        if (isSet(getDefs())) {
          getDefs().appendChild(gradient);
        } else {
          svg.appendChild(gradient);
        }
      }

      getGradients()[id] = gradient;
    }

    return gradient.getAttribute('id');
  };

  const createSvgGradient = (start, end, alpha1, alpha2, direction) => {
    const gradient = createElement('linearGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '0%');

    if (isUnset(direction) || direction === DIRECTION_SOUTH) {
      gradient.setAttribute('y2', '100%');
    } else if (direction === DIRECTION_EAST) {
      gradient.setAttribute('x2', '100%');
    } else if (direction === DIRECTION_NORTH) {
      gradient.setAttribute('y1', '100%');
    } else if (direction === DIRECTION_WEST) {
      gradient.setAttribute('x1', '100%');
    }

    let op = alpha1 < 1 ? ';stop-opacity:' + alpha1 : '';

    let stop = createElement('stop');
    stop.setAttribute('offset', '0%');
    stop.setAttribute('style', 'stop-color:' + start + op);
    gradient.appendChild(stop);

    op = alpha2 < 1 ? ';stop-opacity:' + alpha2 : '';

    stop = createElement('stop');
    stop.setAttribute('offset', '100%');
    stop.setAttribute('style', 'stop-color:' + end + op);
    gradient.appendChild(stop);

    return gradient;
  };

  const addNode = (filled, stroked) => {
    const node = getNode();
    const s = _canvas.getState();

    if (isSet(node)) {
      if (node.nodeName === 'path') {
        // Checks if the path is not empty
        if (isSet(_canvas.getPath()) && _canvas.getPath().length > 0) {
          node.setAttribute('d', _canvas.getPath().join(' '));
        } else {
          return;
        }
      }

      if (filled && isSet(s.fillColor)) {
        updateFill();
      } else if (!isStyleEnabled()) {
        // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=814952
        if (node.nodeName === 'ellipse' && IS_FF) {
          node.setAttribute('fill', 'transparent');
        } else {
          node.setAttribute('fill', 'none');
        }

        // Sets the actual filled state for stroke tolerance
        filled = false;
      }

      if (stroked && isSet(s.strokeColor)) {
        updateStroke();
      } else if (!isStyleEnabled()) {
        node.setAttribute('stroke', 'none');
      }

      if (isSet(s.transform) && s.transform.length > 0) {
        node.setAttribute('transform', s.transform);
      }

      if (s.shadow) {
        getRoot().appendChild(createShadow(node));
      }

      // Adds stroke tolerance
      if (getStrokeTolerance() > 0 && !filled) {
        getRoot().appendChild(createTolerance(node));
      }

      // Adds pointer events
      if (_canvas.isPointerEvents()) {
        node.setAttribute('pointer-events', getPointerEventsValue());
      }
      // Enables clicks for nodes inside a link element
      else if (!_canvas.isPointerEvents() && isUnset(getOriginalRoot())) {
        node.setAttribute('pointer-events', 'none');
      }

      // Removes invisible nodes from output if they don't handle events
      if (
        (node.nodeName !== 'rect' &&
          node.nodeName !== 'path' &&
          node.nodeName !== 'ellipse') ||
        (node.getAttribute('fill') !== 'none' &&
          node.getAttribute('fill') !== 'transparent') ||
        node.getAttribute('stroke') !== 'none' ||
        node.getAttribute('pointer-events') !== 'none'
      ) {
        // LATER: Update existing DOM for performance
        getRoot().appendChild(node);
      }

      setNode();
    }
  };

  const updateFill = () => {
    const node = getNode();
    const s = _canvas.getState();

    if (s.alpha < 1 || s.fillAlpha < 1) {
      node.setAttribute('fill-opacity', s.alpha * s.fillAlpha);
    }

    if (isSet(s.fillColor)) {
      if (isSet(s.gradientColor)) {
        const id = getSvgGradient(
          String(s.fillColor),
          String(s.gradientColor),
          s.gradientFillAlpha,
          s.gradientAlpha,
          s.gradientDirection
        );

        if (getRoot().ownerDocument == document && useAbsoluteIds()) {
          // Workaround for no fill with base tag in page (escape brackets)
          const base = getBaseUrl().replace(/([\(\)])/g, '\\$1');
          node.setAttribute('fill', 'url(' + base + '#' + id + ')');
        } else {
          node.setAttribute('fill', 'url(#' + id + ')');
        }
      } else {
        node.setAttribute('fill', String(s.fillColor).toLowerCase());
      }
    }
  };

  const getCurrentStrokeWidth = () =>
    Math.max(
      getMinStrokeWidth(),
      Math.max(
        0.01,
        format(_canvas.getState().strokeWidth * _canvas.getState().scale)
      )
    );

  const updateStroke = () => {
    const node = getNode();
    const s = _canvas.getState();

    node.setAttribute('stroke', String(s.strokeColor).toLowerCase());

    if (s.alpha < 1 || s.strokeAlpha < 1) {
      node.setAttribute('stroke-opacity', s.alpha * s.strokeAlpha);
    }

    const sw = getCurrentStrokeWidth();

    if (sw !== 1) {
      node.setAttribute('stroke-width', sw);
    }

    if (node.nodeName === 'path') {
      updateStrokeAttributes();
    }

    if (s.dashed) {
      node.setAttribute(
        'stroke-dasharray',
        createDashPattern((s.fixDash ? 1 : s.strokeWidth) * s.scale)
      );
    }
  };

  const updateStrokeAttributes = () => {
    const node = getNode();
    const s = _canvas.getState();

    // Linejoin miter is default in SVG
    if (isSet(s.lineJoin) && s.lineJoin !== 'miter') {
      node.setAttribute('stroke-linejoin', s.lineJoin);
    }

    if (isSet(s.lineCap)) {
      // flat is called butt in SVG
      let value = s.lineCap;

      if (value === 'flat') {
        value = 'butt';
      }

      // Linecap butt is default in SVG
      if (value !== 'butt') {
        node.setAttribute('stroke-linecap', value);
      }
    }

    // Miterlimit 10 is default in our document
    if (isSet(s.miterLimit) && (!isStyleEnabled() || s.miterLimit !== 10)) {
      node.setAttribute('stroke-miterlimit', s.miterLimit);
    }
  };

  const createDashPattern = (scale) => {
    const pat = [];

    if (typeof _canvas.getState().dashPattern === 'string') {
      const dash = _canvas.getState().dashPattern.split(' ');

      if (dash.length > 0) {
        for (let i = 0; i < dash.length; i++) {
          pat[i] = Number(dash[i]) * scale;
        }
      }
    }

    return pat.join(' ');
  };

  const createTolerance = (node) => {
    const tol = node.cloneNode(true);
    const sw =
      parseFloat(tol.getAttribute('stroke-width') || 1) + getStrokeTolerance();
    tol.setAttribute('pointer-events', 'stroke');
    tol.setAttribute('visibility', 'hidden');
    tol.removeAttribute('stroke-dasharray');
    tol.setAttribute('stroke-width', sw);
    tol.setAttribute('fill', 'none');

    // Workaround for Opera ignoring the visiblity attribute above while
    // other browsers need a stroke color to perform the hit-detection but
    // do not ignore the visibility attribute. Side-effect is that Opera's
    // hit detection for horizontal/vertical edges seems to ignore the tol.
    tol.setAttribute('stroke', IS_OT ? 'none' : 'white');

    return tol;
  };

  const createShadow = (node) => {
    const shadow = node.cloneNode(true);
    const s = _canvas.getState();

    // Firefox uses transparent for no fill in ellipses
    if (
      shadow.getAttribute('fill') !== 'none' &&
      (!IS_FF || shadow.getAttribute('fill') !== 'transparent')
    ) {
      shadow.setAttribute('fill', s.shadowColor);
    }

    if (shadow.getAttribute('stroke') !== 'none') {
      shadow.setAttribute('stroke', s.shadowColor);
    }

    shadow.setAttribute(
      'transform',
      'translate(' +
        format(s.shadowDx * s.scale) +
        ',' +
        format(s.shadowDy * s.scale) +
        ')' +
        (s.transform || '')
    );
    shadow.setAttribute('opacity', s.shadowAlpha);

    return shadow;
  };

  const setLink = (link) => {
    if (isUnset(link)) {
      setRoot(getOriginalRoot());
    } else {
      setOriginalRoot(getRoot());

      const node = createElement('a');

      // Workaround for implicit namespace handling in HTML5 export, IE adds NS1 namespace so use code below
      // in all IE versions except quirks mode. KNOWN: Adds xlink namespace to each image tag in output.
      if (
        isUnset(node.setAttributeNS) ||
        (getRoot().ownerDocument !== document && isUnset(document.documentMode))
      ) {
        node.setAttribute('xlink:href', link);
      } else {
        node.setAttributeNS(NS_XLINK, 'xlink:href', link);
      }

      getRoot().appendChild(node);
      setRoot(node);
    }
  };

  const rotate = (theta, flipH, flipV, cx, cy) => {
    if (theta !== 0 || flipH || flipV) {
      const s = _canvas.getState();
      cx += s.dx;
      cy += s.dy;

      cx *= s.scale;
      cy *= s.scale;

      s.transform = s.transform || '';

      // This implementation uses custom scale/translate and built-in rotation
      // Rotation state is part of the AffineTransform in state.transform
      if (flipH && flipV) {
        theta += 180;
      } else if (flipH !== flipV) {
        const tx = flipH ? cx : 0;
        const sx = flipH ? -1 : 1;

        const ty = flipV ? cy : 0;
        const sy = flipV ? -1 : 1;

        s.transform +=
          'translate(' +
          format(tx) +
          ',' +
          format(ty) +
          ')' +
          'scale(' +
          format(sx) +
          ',' +
          format(sy) +
          ')' +
          'translate(' +
          format(-tx) +
          ',' +
          format(-ty) +
          ')';
      }

      if (flipH ? !flipV : flipV) {
        theta *= -1;
      }

      if (theta !== 0) {
        s.transform +=
          'rotate(' + format(theta) + ',' + format(cx) + ',' + format(cy) + ')';
      }

      s.rotation = s.rotation + theta;
      s.rotationCx = cx;
      s.rotationCy = cy;
    }
  };

  const begin = () => {
    _canvas.begin();
    setNode(createElement('path'));
  };

  const rect = (x, y, w, h) => {
    const s = _canvas.getState();
    const n = createElement('rect');
    n.setAttribute('x', format((x + s.dx) * s.scale));
    n.setAttribute('y', format((y + s.dy) * s.scale));
    n.setAttribute('width', format(w * s.scale));
    n.setAttribute('height', format(h * s.scale));

    setNode(n);
  };

  const roundrect = (x, y, w, h, dx, dy) => {
    rect(x, y, w, h);

    if (dx > 0) {
      getNode().setAttribute('rx', format(dx * _canvas.getState().scale));
    }

    if (dy > 0) {
      getNode().setAttribute('ry', format(dy * _canvas.getState().scale));
    }
  };

  const ellipse = (x, y, w, h) => {
    const s = _canvas.getState();
    const n = createElement('ellipse');
    // No rounding for consistent output with 1.x
    n.setAttribute('cx', format((x + w / 2 + s.dx) * s.scale));
    n.setAttribute('cy', format((y + h / 2 + s.dy) * s.scale));
    n.setAttribute('rx', (w / 2) * s.scale);
    n.setAttribute('ry', (h / 2) * s.scale);
    setNode(n);
  };

  const image = (
    x,
    y,
    w,
    h,
    src,
    aspect = true,
    flipH = false,
    flipV = false
  ) => {
    const source = _canvas.getConverter().convert(src);

    // LATER: Add option for embedding images as base64.

    const s = _canvas.getState();
    x += s.dx;
    y += s.dy;

    const node = createElement('image');
    node.setAttribute('x', format(x * s.scale) + getImageOffset());
    node.setAttribute('y', format(y * s.scale) + getImageOffset());
    node.setAttribute('width', format(w * s.scale));
    node.setAttribute('height', format(h * s.scale));

    // Workaround for missing namespace support
    if (isUnset(node.setAttributeNS)) {
      node.setAttribute('xlink:href', source);
    } else {
      node.setAttributeNS(NS_XLINK, 'xlink:href', source);
    }

    if (!aspect) {
      node.setAttribute('preserveAspectRatio', 'none');
    }

    if (s.alpha < 1 || s.fillAlpha < 1) {
      node.setAttribute('opacity', s.alpha * s.fillAlpha);
    }

    let tr = s.transform || '';

    if (flipH || flipV) {
      let sx = 1;
      let sy = 1;
      let dx = 0;
      let dy = 0;

      if (flipH) {
        sx = -1;
        dx = -w - 2 * x;
      }

      if (flipV) {
        sy = -1;
        dy = -h - 2 * y;
      }

      // Adds image tansformation to existing transform
      tr +=
        'scale(' +
        sx +
        ',' +
        sy +
        ')translate(' +
        dx * s.scale +
        ',' +
        dy * s.scale +
        ')';
    }

    if (tr.length > 0) {
      node.setAttribute('transform', tr);
    }

    if (!_canvas.isPointerEvents()) {
      node.setAttribute('pointer-events', 'none');
    }

    getRoot().appendChild(node);
  };

  const convertHtml = (val) => {
    let v = val.slice();

    if (useDomParser()) {
      const doc = new DOMParser().parseFromString(val, 'text/html');

      if (isSet(doc)) {
        v = new XMLSerializer().serializeToString(doc.body);

        // Extracts body content from DOM
        if (v.substring(0, 5) == '<body') {
          v = v.substring(v.indexOf('>', 5) + 1);
        }

        if (v.substring(v.length - 7, v.length) == '</body>') {
          v = v.substring(0, v.length - 7);
        }
      }
    } else if (
      isSet(document.implementation) &&
      isSet(document.implementation.createDocument)
    ) {
      const xd = document.implementation.createDocument(
        'http://www.w3.org/1999/xhtml',
        'html',
        undefined
      );
      const xb = xd.createElement('body');
      xd.documentElement.appendChild(xb);

      const div = document.createElement('div');
      div.innerHTML = val;
      let child = div.firstChild;

      while (isSet(child)) {
        const next = child.nextSibling;
        xb.appendChild(xd.adoptNode(child));
        child = next;
      }

      return xb.innerHTML;
    } else {
      const ta = document.createElement('textarea');

      // Handles special HTML entities < and > and double escaping
      // and converts unclosed br, hr and img tags to XHTML
      // LATER: Convert all unclosed tags
      ta.innerHTML = v
        .replace(/&amp;/g, '&amp;amp;')
        .replace(/&#60;/g, '&amp;lt;')
        .replace(/&#62;/g, '&amp;gt;')
        .replace(/&lt;/g, '&amp;lt;')
        .replace(/&gt;/g, '&amp;gt;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      v = ta.value
        .replace(/&/g, '&amp;')
        .replace(/&amp;lt;/g, '&lt;')
        .replace(/&amp;gt;/g, '&gt;')
        .replace(/&amp;amp;/g, '&amp;')
        .replace(/<br>/g, '<br />')
        .replace(/<hr>/g, '<hr />')
        .replace(/(<img[^>]+)>/gm, '$1 />');
    }

    return v;
  };

  const createDiv = (str) => {
    let val = str.slice();

    if (!isNode(val)) {
      val = '<div><div>' + convertHtml(val) + '</div></div>';
    }

    // IE uses this code for export as it cannot render foreignObjects
    if (!IS_IE && !IS_IE11 && document.createElementNS) {
      const div = document.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'div'
      );

      if (isNode(val)) {
        const div2 = document.createElement('div');
        const div3 = div2.cloneNode(false);

        // Creates a copy for export
        if (getRoot().ownerDocument !== document) {
          div2.appendChild(val.cloneNode(true));
        } else {
          div2.appendChild(val);
        }

        div3.appendChild(div2);
        div.appendChild(div3);
      } else {
        div.innerHTML = val;
      }

      return div;
    } else {
      if (isNode(val)) {
        val = '<div><div>' + getXml(val) + '</div></div>';
      }

      val = '<div xmlns="http://www.w3.org/1999/xhtml">' + val + '</div>';

      // NOTE: FF 3.6 crashes if content CSS contains "height:100%"
      return parseXml(val).documentElement;
    }
  };

  const updateText = (
    x,
    y,
    w,
    h,
    align,
    valign,
    wrap,
    overflow,
    clip,
    rotation,
    node
  ) => {
    if (
      isSet(node) &&
      isSet(node.firstChild) &&
      isSet(node.firstChild.firstChild)
    ) {
      updateTextNodes(
        x,
        y,
        w,
        h,
        align,
        valign,
        wrap,
        overflow,
        clip,
        rotation,
        node.firstChild
      );
    }
  };

  const addForeignObject = (
    x,
    y,
    w,
    h,
    str,
    align,
    valign,
    wrap,
    format,
    overflow,
    clip,
    rotation,
    dir,
    div,
    root
  ) => {
    const group = createElement('g');
    const fo = createElement('foreignObject');

    // Workarounds for print clipping and static position in Safari
    fo.setAttribute('style', 'overflow: visible; text-align: left;');
    fo.setAttribute('pointer-events', 'none');

    // Import needed for older versions of IE
    if (div.ownerDocument !== document) {
      div = importNodeImplementation(fo.ownerDocument, div, true);
    }

    fo.appendChild(div);
    group.appendChild(fo);

    updateTextNodes(
      x,
      y,
      w,
      h,
      align,
      valign,
      wrap,
      overflow,
      clip,
      rotation,
      group
    );

    // Alternate content if foreignObject not supported
    if (getRoot().ownerDocument !== document) {
      const alt = createAlternateContent(
        fo,
        x,
        y,
        w,
        h,
        str,
        align,
        valign,
        wrap,
        format,
        overflow,
        clip,
        rotation
      );

      if (isSet(alt)) {
        fo.setAttribute(
          'requiredFeatures',
          'http://www.w3.org/TR/SVG11/feature#Extensibility'
        );
        const sw = createElement('switch');
        sw.appendChild(fo);
        sw.appendChild(alt);
        group.appendChild(sw);
      }
    }

    root.appendChild(group);
  };

  const updateTextNodes = (
    x,
    y,
    w,
    h,
    align,
    valign,
    wrap,
    overflow,
    clip,
    rotation,
    g
  ) => {
    const state = _canvas.getState();
    const s = state.scale;

    createCss(
      w + 2,
      h,
      align,
      valign,
      wrap,
      overflow,
      clip,
      isSet(state.fontBackgroundColor) ? state.fontBackgroundColor : undefined,
      isSet(state.fontBorderColor) ? state.fontBorderColor : undefined,
      'display: flex; align-items: unsafe ' +
        (valign === ALIGN_TOP
          ? 'flex-start'
          : valign === ALIGN_BOTTOM
          ? 'flex-end'
          : 'center') +
        '; ' +
        'justify-content: unsafe ' +
        (align === ALIGN_LEFT
          ? 'flex-start'
          : align === ALIGN_RIGHT
          ? 'flex-end'
          : 'center') +
        '; ',
      getTextCss(),
      s,
      (dx, dy, flex, item, block) => {
        x += state.dx;
        y += state.dy;

        const fo = g.firstChild;
        const div = fo.firstChild;
        const box = div.firstChild;
        const text = box.firstChild;
        const r =
          (_canvas.isRotateHtml() ? state.rotation : 0) +
          (isSet(rotation) ? rotation : 0);
        let t =
          (getFoOffset() !== 0
            ? 'translate(' + getFoOffset() + ' ' + getFoOffset() + ')'
            : '') + (s !== 1 ? 'scale(' + s + ')' : '');

        text.setAttribute('style', block);
        box.setAttribute('style', item);

        // Workaround for clipping in Webkit with scrolling and zoom
        fo.setAttribute('width', Math.ceil((1 / Math.min(1, s)) * 100) + '%');
        fo.setAttribute('height', Math.ceil((1 / Math.min(1, s)) * 100) + '%');
        const yp = Math.round(y + dy);

        // Allows for negative values which are causing problems with
        // transformed content where the top edge of the foreignObject
        // limits the text box being moved further up in the diagram.
        // KNOWN: Possible clipping problems with zoom and scrolling
        // but this is normally not used with scrollbars as the
        // coordinates are always positive with scrollbars.
        // Margin-top is ignored in Safari and no negative values allowed
        // for padding.
        if (yp < 0) {
          fo.setAttribute('y', yp);
        } else {
          fo.removeAttribute('y');
          flex += 'padding-top: ' + yp + 'px; ';
        }

        div.setAttribute(
          'style',
          flex + 'margin-left: ' + Math.round(x + dx) + 'px;'
        );
        t += r !== 0 ? 'rotate(' + r + ' ' + x + ' ' + y + ')' : '';

        // Output allows for reflow but Safari cannot use absolute position,
        // transforms or opacity. https://bugs.webkit.org/show_bug.cgi?id=23113
        if (t !== '') {
          g.setAttribute('transform', t);
        } else {
          g.removeAttribute('transform');
        }

        if (state.alpha !== 1) {
          g.setAttribute('opacity', state.alpha);
        } else {
          g.removeAttribute('opacity');
        }
      }
    );
  };

  const getTextCss = () => {
    const s = _canvas.getState();
    const lh = ABSOLUTE_LINE_HEIGHT
      ? s.fontSize * LINE_HEIGHT + 'px'
      : LINE_HEIGHT * getLineHeightCorrection();
    let css =
      'display: inline-block; font-size: ' +
      s.fontSize +
      'px; ' +
      'font-family: ' +
      s.fontFamily +
      '; color: ' +
      s.fontColor +
      '; line-height: ' +
      lh +
      '; pointer-events: ' +
      (_canvas.isPointerEvents() ? getPointerEventsValue() : 'none') +
      '; ';

    if ((s.fontStyle & FONT_BOLD) === FONT_BOLD) {
      css += 'font-weight: bold; ';
    }

    if ((s.fontStyle & FONT_ITALIC) === FONT_ITALIC) {
      css += 'font-style: italic; ';
    }

    const deco = [];

    if ((s.fontStyle & FONT_UNDERLINE) === FONT_UNDERLINE) {
      deco.push('underline');
    }

    if ((s.fontStyle & FONT_STRIKETHROUGH) === FONT_STRIKETHROUGH) {
      deco.push('line-through');
    }

    if (deco.length > 0) {
      css += 'text-decoration: ' + deco.join(' ') + '; ';
    }

    return css;
  };

  const text = (
    x,
    y,
    w,
    h,
    str,
    align,
    valign,
    wrap,
    format,
    overflow,
    clip,
    rotation,
    dir
  ) => {
    if (isTextEnabled() && isSet(str)) {
      rotation = isSet(rotation) ? rotation : 0;

      if (isFoEnabled() && format === 'html') {
        const div = createDiv(str);

        // Ignores invalid XHTML labels
        if (isSet(div)) {
          if (isSet(dir)) {
            div.setAttribute('dir', dir);
          }

          addForeignObject(
            x,
            y,
            w,
            h,
            str,
            align,
            valign,
            wrap,
            format,
            overflow,
            clip,
            rotation,
            dir,
            div,
            getRoot()
          );
        }
      } else {
        plainText(
          x + _canvas.getState().dx,
          y + _canvas.getState().dy,
          w,
          h,
          str,
          align,
          valign,
          wrap,
          overflow,
          clip,
          rotation,
          dir
        );
      }
    }
  };

  const createClip = (x, y, w, h) => {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);

    const id = 'mx-clip-' + x + '-' + y + '-' + w + '-' + h;

    let counter = 0;
    let tmp = id + '-' + counter;

    // Resolves ID conflicts
    while (isSet(document.getElementById(tmp))) {
      tmp = id + '-' + ++counter;
    }

    clip = createElement('clipPath');
    clip.setAttribute('id', tmp);

    const rect = createElement('rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);

    clip.appendChild(rect);

    return clip;
  };

  const plainText = (
    x,
    y,
    w,
    h,
    str,
    align,
    valign,
    wrap,
    overflow,
    clip,
    rotation = 0,
    dir
  ) => {
    const s = _canvas.getState();
    const size = s.fontSize;
    const node = createElement('g');
    let tr = s.transform || '';
    updateFont(node);

    // Ignores pointer events
    if (!_canvas.isPointerEvents() && isUnset(getOriginalRoot())) {
      node.setAttribute('pointer-events', 'none');
    }

    // Non-rotated text
    if (rotation !== 0) {
      tr +=
        'rotate(' +
        rotation +
        ',' +
        format(x * s.scale) +
        ',' +
        format(y * s.scale) +
        ')';
    }

    if (isSet(dir)) {
      node.setAttribute('direction', dir);
    }

    if (clip && w > 0 && h > 0) {
      let cx = x;
      let cy = y;

      if (align === ALIGN_CENTER) {
        cx -= w / 2;
      } else if (align === ALIGN_RIGHT) {
        cx -= w;
      }

      if (overflow !== 'fill') {
        if (valign === ALIGN_MIDDLE) {
          cy -= h / 2;
        } else if (valign === ALIGN_BOTTOM) {
          cy -= h;
        }
      }

      // LATER: Remove spacing from clip rectangle
      const c = createClip(
        cx * s.scale - 2,
        cy * s.scale - 2,
        w * s.scale + 4,
        h * s.scale + 4
      );

      if (isSet(getDefs())) {
        getDefs().appendChild(c);
      } else {
        // Makes sure clip is removed with referencing node
        getRoot().appendChild(c);
      }

      if (
        !IS_CHROMEAPP &&
        !IS_IE &&
        !IS_IE11 &&
        !IS_EDGE &&
        getRoot().ownerDocument === document
      ) {
        // Workaround for potential base tag
        const base = getBaseUrl().replace(/([\(\)])/g, '\\$1');
        node.setAttribute(
          'clip-path',
          'url(' + base + '#' + c.getAttribute('id') + ')'
        );
      } else {
        node.setAttribute('clip-path', 'url(#' + c.getAttribute('id') + ')');
      }
    }

    // Default is left
    const anchor =
      align === ALIGN_RIGHT
        ? 'end'
        : align === ALIGN_CENTER
        ? 'middle'
        : 'start';

    // Text-anchor start is default in SVG
    if (anchor !== 'start') {
      node.setAttribute('text-anchor', anchor);
    }

    if (!isStyleEnabled() || size !== DEFAULT_FONTSIZE) {
      node.setAttribute('font-size', size * s.scale + 'px');
    }

    if (tr.length > 0) {
      node.setAttribute('transform', tr);
    }

    if (s.alpha < 1) {
      node.setAttribute('opacity', s.alpha);
    }

    const lines = str.split('\n');
    const lh = Math.round(size * LINE_HEIGHT);
    const textHeight = size + (lines.length - 1) * lh;

    let cy = y + size - 1;

    if (valign === ALIGN_MIDDLE) {
      if (overflow === 'fill') {
        cy -= h / 2;
      } else {
        const dy =
          (isMatchHtmlAlignment() && clip && h > 0
            ? Math.min(textHeight, h)
            : textHeight) / 2;
        cy -= dy;
      }
    } else if (valign === ALIGN_BOTTOM) {
      if (overflow === 'fill') {
        cy -= h;
      } else {
        const dy =
          isMatchHtmlAlignment() && clip && h > 0
            ? Math.min(textHeight, h)
            : textHeight;
        cy -= dy + 1;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      // Workaround for bounding box of empty lines and spaces
      if (lines[i].length > 0 && lines[i].trim().length > 0) {
        const text = createElement('text');
        // LATER: Match horizontal HTML alignment
        text.setAttribute('x', format(x * s.scale) + getTextOffset());
        text.setAttribute('y', format(cy * s.scale) + getTextOffset());

        write(text, lines[i]);
        node.appendChild(text);
      }

      cy += lh;
    }

    getRoot().appendChild(node);
    addTextBackground(
      node,
      str,
      x,
      y,
      w,
      overflow === 'fill' ? h : textHeight,
      align,
      valign,
      overflow
    );
  };

  const updateFont = (node) => {
    const s = _canvas.getState();

    node.setAttribute('fill', s.fontColor);

    if (!isStyleEnabled() || s.fontFamily !== DEFAULT_FONTFAMILY) {
      node.setAttribute('font-family', s.fontFamily);
    }

    if ((s.fontStyle & FONT_BOLD) === FONT_BOLD) {
      node.setAttribute('font-weight', 'bold');
    }

    if ((s.fontStyle & FONT_ITALIC) === FONT_ITALIC) {
      node.setAttribute('font-style', 'italic');
    }

    const txtDecor = [];

    if ((s.fontStyle & FONT_UNDERLINE) === FONT_UNDERLINE) {
      txtDecor.push('underline');
    }

    if ((s.fontStyle & FONT_STRIKETHROUGH) === FONT_STRIKETHROUGH) {
      txtDecor.push('line-through');
    }

    if (txtDecor.length > 0) {
      node.setAttribute('text-decoration', txtDecor.join(' '));
    }
  };

  const addTextBackground = (
    node,
    str,
    x,
    y,
    w,
    h,
    align,
    valign,
    overflow
  ) => {
    const s = _canvas.getState();

    if (isSet(s.fontBackgroundColor) || isSet(s.fontBorderColor)) {
      let bbox;

      if (overflow === 'fill' || overflow === 'width') {
        if (align === ALIGN_CENTER) {
          x -= w / 2;
        } else if (align === ALIGN_RIGHT) {
          x -= w;
        }

        if (valign === ALIGN_MIDDLE) {
          y -= h / 2;
        } else if (valign === ALIGN_BOTTOM) {
          y -= h;
        }

        bbox = Rectangle(
          (x + 1) * s.scale,
          y * s.scale,
          (w - 2) * s.scale,
          (h + 2) * s.scale
        );
      } else if (isSet(node.getBBox) && getRoot().ownerDocument === document) {
        // Uses getBBox only if inside document for correct size
        try {
          bbox = node.getBBox();
          const ie = IS_IE && IS_SVG;
          bbox = Rectangle(
            bbox.getX(),
            bbox.getY() + (ie ? 0 : 1),
            bbox.getWidth(),
            bbox.getHeight() + (ie ? 1 : 0)
          );
        } catch (e) {
          throw e;
          // Ignores NS_ERROR_FAILURE in FF if container display is none.
        }
      }

      if (isUnset(bbox) || bbox.getWidth() === 0 || bbox.getHeight() === 0) {
        // Computes size if not in document or no getBBox available
        const div = document.createElement('div');

        // Wrapping and clipping can be ignored here
        div.style.lineHeight = ABSOLUTE_LINE_HEIGHT
          ? s.fontSize * LINE_HEIGHT + 'px'
          : LINE_HEIGHT;
        div.style.fontSize = s.fontSize + 'px';
        div.style.fontFamily = s.fontFamily;
        div.style.whiteSpace = 'nowrap';
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.display = 'inline-block';
        div.style.zoom = '1';

        if ((s.fontStyle & FONT_BOLD) === FONT_BOLD) {
          div.style.fontWeight = 'bold';
        }

        if ((s.fontStyle & FONT_ITALIC) === FONT_ITALIC) {
          div.style.fontStyle = 'italic';
        }

        str = htmlEntities(str, false);
        div.innerHTML = str.replace(/\n/g, '<br/>');

        document.body.appendChild(div);
        const w = div.offsetWidth;
        const h = div.offsetHeight;
        div.parentNode.removeChild(div);

        if (align === ALIGN_CENTER) {
          x -= w / 2;
        } else if (align === ALIGN_RIGHT) {
          x -= w;
        }

        if (valign === ALIGN_MIDDLE) {
          y -= h / 2;
        } else if (valign === ALIGN_BOTTOM) {
          y -= h;
        }

        bbox = Rectangle(
          (x + 1) * s.scale,
          (y + 2) * s.scale,
          w * s.scale,
          (h + 1) * s.scale
        );
      }

      if (isSet(bbox)) {
        const n = createElement('rect');
        n.setAttribute('fill', s.fontBackgroundColor || 'none');
        n.setAttribute('stroke', s.fontBorderColor || 'none');
        n.setAttribute('x', Math.floor(bbox.getX() - 1));
        n.setAttribute('y', Math.floor(bbox.getY() - 1));
        n.setAttribute('width', Math.ceil(bbox.getWidth() + 2));
        n.setAttribute('height', Math.ceil(bbox.getHeight()));

        const sw = isSet(s.fontBorderColor) ? Math.max(1, format(s.scale)) : 0;
        n.setAttribute('stroke-width', sw);

        // Workaround for crisp rendering - only required if not exporting
        if (getRoot().ownerDocument === document && mod(sw, 2) === 1) {
          n.setAttribute('transform', 'translate(0.5, 0.5)');
        }

        node.insertBefore(n, node.firstChild);
      }
    }
  };

  const stroke = () => addNode(false, true);

  const fill = () => addNode(true, false);

  const fillAndStroke = () => addNode(true, true);

  const me = {
    getRoot,
    format,
    getBaseUrl,
    reset,
    createStyle,
    createElement,
    getAlternateText,
    createAlternateContent,
    createGradientId,
    getSvgGradient,
    createSvgGradient,
    getCurrentStrokeWidth,
    createDashPattern,
    createTolerance,
    createShadow,
    setLink,
    rotate,
    begin,
    convertHtml,
    addForeignObject,
    createCss,
    text,
    createClip,
    plainText,
    addTextBackground,
    stroke,
    fill,
    fillAndStroke,
    rect,
    roundrect,
    getStrokeTolerance,
    setStrokeTolerance,
    getPointerEventsValue,
    setPointerEventsValue,
    getMinStrokeWidth,
    setMinStrokeWidth,
    getGradients,
    setGradients,
    image
  };

  const _canvas = AbstractCanvas2D();
  Object.setPrototypeOf(me, _canvas);

  let svg;

  // Adds optional defs section for export
  if (getRoot().ownerDocument !== document) {
    let node = getRoot();

    // Finds owner SVG element in XML DOM
    while (isSet(node) && node.nodeName !== 'svg') {
      node = node.parentNode;
    }

    svg = node;
  }

  if (isSet(svg)) {
    // Tries to get existing defs section
    const tmp = svg.getElementsByTagName('defs');

    if (tmp.length > 0) {
      setDefs(svg.getElementsByTagName('defs')[0]);
    }

    // Adds defs section if none exists
    if (isUnset(getDefs())) {
      setDefs(createElement('defs'));

      if (isSet(svg.firstChild)) {
        svg.insertBefore(getDefs(), svg.firstChild);
      } else {
        svg.appendChild(getDefs());
      }
    }

    // Adds stylesheet
    if (isStyleEnabled()) {
      getDefs().appendChild(createStyle());
    }
  }

  return me;
};

const createCss = (
  w,
  h,
  align,
  valign,
  wrap,
  overflow,
  clip,
  bg,
  border,
  flex,
  block,
  s,
  callback
) => {
  const item =
    'box-sizing: border-box; font-size: 0; text-align: ' +
    (align === ALIGN_LEFT
      ? 'left'
      : align == ALIGN_RIGHT
      ? 'right'
      : 'center') +
    '; ';
  const pt = getAlignmentAsPoint(align, valign);
  let ofl = 'overflow: hidden; ';
  let fw = 'width: 1px; ';
  let fh = 'height: 1px; ';
  let dx = pt.getX() * w;
  let dy = pt.getY() * h;

  if (clip) {
    fw = 'width: ' + Math.round(w) + 'px; ';
    item += 'max-height: ' + Math.round(h) + 'px; ';
    dy = 0;
  } else if (overflow === 'fill') {
    fw = 'width: ' + Math.round(w) + 'px; ';
    fh = 'height: ' + Math.round(h) + 'px; ';
    block += 'width: 100%; height: 100%; ';
    item += fw + fh;
  } else if (overflow === 'width') {
    fw = 'width: ' + Math.round(w) + 'px; ';
    block += 'width: 100%; ';
    item += fw;
    dy = 0;

    if (h > 0) {
      item += 'max-height: ' + Math.round(h) + 'px; ';
    }
  } else {
    ofl = '';
    dy = 0;
  }

  let bgc = '';

  if (isSet(bg)) {
    bgc += 'background-color: ' + bg + '; ';
  }

  if (isSet(border)) {
    bgc += 'border: 1px solid ' + border + '; ';
  }

  if (ofl === '' || clip) {
    block += bgc;
  } else {
    item += bgc;
  }

  if (wrap && w > 0) {
    block += 'white-space: normal; word-wrap: ' + WORD_WRAP + '; ';
    fw = 'width: ' + Math.round(w) + 'px; ';

    if (ofl !== '' && overflow !== 'fill') {
      dy = 0;
    }
  } else {
    block += 'white-space: nowrap; ';

    if (ofl === '') {
      dx = 0;
    }
  }

  callback(dx, dy, flex + fw + fh, item + ofl, block, ofl);
};

export default makeComponent(SvgCanvas2D);
