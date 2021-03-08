/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { IS_GC, IS_IE, IS_MT, IS_OT, IS_SF } from '../Client';
import { isSet, isUnset } from '../Helpers';
import CellPath from '../model/CellPath';
import TemporaryCellStates from '../view/TemporaryCellStates';
import {
  ALIGN_BOTTOM,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  ALIGN_TOP,
  DEFAULT_FONTFAMILY,
  DIALECT_SVG,
  DIRECTION_EAST,
  DIRECTION_MASK_EAST,
  DIRECTION_MASK_NONE,
  DIRECTION_MASK_NORTH,
  DIRECTION_MASK_SOUTH,
  DIRECTION_MASK_WEST,
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  DIRECTION_WEST,
  FONT_ITALIC,
  FONT_STRIKETHROUGH,
  FONT_UNDERLINE,
  LINE_HEIGHT,
  NODETYPE_CDATA,
  NODETYPE_COMMENT,
  NODETYPE_DOCUMENT,
  NODETYPE_DOCUMENT_FRAGMENT,
  NODETYPE_ELEMENT,
  NODETYPE_TEXT,
  NS_SVG,
  STYLE_DIRECTION,
  STYLE_FLIPH,
  STYLE_FLIPV,
  STYLE_HORIZONTAL,
  STYLE_PORT_CONSTRAINT,
  STYLE_PORT_CONSTRAINT_ROTATION,
  STYLE_ROTATION,
  STYLE_SOURCE_PORT_CONSTRAINT,
  STYLE_STARTSIZE,
  STYLE_TARGET_PORT_CONSTRAINT,
  TOOLTIP_VERTICAL_OFFSET
} from './Constants';
import Event from './Event';
import ObjectIdentity from './ObjectIdentity';
import Point from './Point';
import Rectangle from './Rectangle';

/**
 * Class: Utils
 *
 * A singleton class that provides cross-browser helper methods.
 * This is a global functionality. To access the functions in this
 * class, use the global classname appended by the functionname.
 * You may have to load chrome://global/content/contentAreaUtils.js
 * to disable certain security restrictions in Mozilla for the <open>,
 * <save>, <saveAs> and <copy> function.
 *
 * For example, the following code displays an error message:
 *
 * (code)
 * mxUtils.error('Browser is not supported!', 200, false);
 * (end)
 */

/**
 * Function: removeCursors
 *
 * Removes the cursors from the style of the given DOM node and its
 * descendants.
 *
 * Parameters:
 *
 * element - DOM node to remove the cursor style from.
 */
export const removeCursors = (element) => {
  if (isSet(element.style)) {
    element.style.cursor = '';
  }

  const children = element.childNodes;

  if (isSet(children)) {
    const childCount = children.length;

    for (let i = 0; i < childCount; i++) {
      removeCursors(children[i]);
    }
  }
};

/**
 * Function: getCurrentStyle
 *
 * Returns the current style of the specified element.
 *
 * Parameters:
 *
 * element - DOM node whose current style should be returned.
 */
export const getCurrentStyle = (element) =>
  isSet(element) ? window.getComputedStyle(element, '') : null;

/**
 * Function: parseCssNumber
 *
 * Parses the given CSS numeric value adding handling for the values thin,
 * medium and thick (2, 4 and 6).
 */
export const parseCssNumber = (value) => {
  if (value === 'thin') {
    value = '2';
  } else if (value === 'medium') {
    value = '4';
  } else if (value === 'thick') {
    value = '6';
  }

  value = parseFloat(value);

  if (isNaN(value)) {
    value = 0;
  }

  return value;
};

/**
 * Function: setPrefixedStyle
 *
 * Adds the given style with the standard name and an optional vendor prefix for the current
 * browser.
 *
 * (code)
 * mxUtils.setPrefixedStyle(node.style, 'transformOrigin', '0% 0%');
 * (end)
 */
export const setPrefixedStyle = (() => {
  let prefix = null;

  if (IS_OT) {
    prefix = 'O';
  } else if (IS_SF || IS_GC) {
    prefix = 'Webkit';
  } else if (IS_MT) {
    prefix = 'Moz';
  } else if (
    IS_IE &&
    document.documentMode >= 9 &&
    document.documentMode < 10
  ) {
    prefix = 'ms';
  }

  return (style, name, value) => {
    style[name] = value;

    if (isSet(prefix) && name.length > 0) {
      name = prefix + name.substring(0, 1).toUpperCase() + name.substring(1);
      style[name] = value;
    }
  };
})();

/**
 * Function: hasScrollbars
 *
 * Returns true if the overflow CSS property of the given node is either
 * scroll or auto.
 *
 * Parameters:
 *
 * node - DOM node whose style should be checked for scrollbars.
 */
export const hasScrollbars = (node) => {
  const style = getCurrentStyle(node);

  return (
    isSet(style) && (style.overflow === 'scroll' || style.overflow === 'auto')
  );
};

/**
 * Function: findNode
 *
 * Returns the first node where attr equals value.
 * This implementation does not use XPath.
 */
export const findNode = (node, attr, value) => {
  if (node.nodeType === NODETYPE_ELEMENT) {
    const tmp = node.getAttribute(attr);

    if (isSet(tmp) && tmp === value) {
      return node;
    }
  }

  node = node.firstChild;

  while (isSet(node)) {
    var result = findNode(node, attr, value);

    if (isSet(result)) {
      return result;
    }

    node = node.nextSibling;
  }

  return null;
};

/**
 * Function: getFunctionName
 *
 * Returns the name for the given function.
 *
 * Parameters:
 *
 * f - JavaScript object that represents a function.
 */
export const getFunctionName = (f) => (f ? f.name : null);

/**
 * Function: remove
 *
 * Removes all occurrences of the given object in the given array or
 * object. If there are multiple occurrences of the object, be they
 * associative or as an array entry, all occurrences are removed from
 * the array or deleted from the object. By removing the object from
 * the array, all elements following the removed element are shifted
 * by one step towards the beginning of the array.
 *
 * The length of arrays is not modified inside this function.
 *
 * Parameters:
 *
 * obj - Object to find in the given array.
 * array - Array to check for the given obj.
 */
export const remove = (obj, array) => {
  let result = null;

  if (typeof array === 'object') {
    let index = array.indexOf(obj);

    while (index >= 0) {
      array.splice(index, 1);
      result = obj;
      index = array.indexOf(obj);
    }
  }

  for (var key in array) {
    if (array[key] == obj) {
      delete array[key];
      result = obj;
    }
  }

  return result;
};

/**
 * Function: isNode
 *
 * Returns true if the given value is an XML node with the node name
 * and if the optional attribute has the specified value.
 *
 * This implementation assumes that the given value is a DOM node if the
 * nodeType property is numeric, that is, if isNaN returns false for
 * value.nodeType.
 *
 * Parameters:
 *
 * value - Object that should be examined as a node.
 * nodeName - String that specifies the node name.
 * attributeName - Optional attribute name to check.
 * attributeValue - Optional attribute value to check.
 */
export const isNode = (value, nodeName, attributeName, attributeValue) => {
  if (
    isSet(value) &&
    !isNaN(value.nodeType) &&
    (isUnset(nodeName) ||
      value.nodeName.toLowerCase() === nodeName.toLowerCase())
  ) {
    return (
      isUnset(attributeName) ||
      value.getAttribute(attributeName) === attributeValue
    );
  }

  return false;
};

/**
 * Function: isAncestorNode
 *
 * Returns true if the given ancestor is an ancestor of the
 * given DOM node in the DOM. This also returns true if the
 * child is the ancestor.
 *
 * Parameters:
 *
 * ancestor - DOM node that represents the ancestor.
 * child - DOM node that represents the child.
 */
export const isAncestorNode = (ancestor, child) => {
  let parent = child;

  while (parent) {
    if (parent === ancestor) return true;

    parent = parent.parentNode;
  }

  return false;
};

/**
 * Function: getChildNodes
 *
 * Returns an array of child nodes that are of the given node type.
 *
 * Parameters:
 *
 * node - Parent DOM node to return the children from.
 * nodeType - Optional node type to return. Default is
 * <mxConstants.NODETYPE_ELEMENT>.
 */
export const getChildNodes = (node, nodeType) => {
  nodeType = nodeType || NODETYPE_ELEMENT;

  const children = [];
  let tmp = node.firstChild;

  while (isSet(tmp)) {
    if (tmp.nodeType === nodeType) {
      children.push(tmp);
    }

    tmp = tmp.nextSibling;
  }

  return children;
};

/**
 * Function: importNode
 *
 * Cross browser implementation for document.importNode. Uses document.importNode
 * in all browsers but IE, where the node is cloned by creating a new node and
 * copying all attributes and children into it using importNode, recursively.
 *
 * Parameters:
 *
 * doc - Document to import the node into.
 * node - Node to be imported.
 * allChildren - If all children should be imported.
 */
export const importNode = (doc, node, allChildren) => {
  if (IS_IE) {
    return importNodeImplementation(doc, node, allChildren);
  } else {
    return doc.importNode(node, allChildren);
  }
};

/**
 * Function: importNodeImplementation
 *
 * Full DOM API implementation for importNode without using importNode API call.
 *
 * Parameters:
 *
 * doc - Document to import the node into.
 * node - Node to be imported.
 * allChildren - If all children should be imported.
 */
export const importNodeImplementation = (doc, node, allChildren) => {
  switch (node.nodeType) {
    case 1 /* element */: {
      const newNode = doc.createElement(node.nodeName);

      if (node.attributes && node.attributes.length > 0) {
        for (let i = 0; i < node.attributes.length; i++) {
          newNode.setAttribute(
            node.attributes[i].nodeName,
            node.getAttribute(node.attributes[i].nodeName)
          );
        }
      }

      if (allChildren && node.childNodes && node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          newNode.appendChild(
            importNodeImplementation(doc, node.childNodes[i], allChildren)
          );
        }
      }

      return newNode;
    }
    case 3: /* text */
    case 4: /* cdata-section */
    case 8 /* comment */: {
      return doc.createTextNode(
        isSet(node.nodeValue) ? node.nodeValue : node.value
      );
    }
  }
};

/**
 * Function: createXmlDocument
 *
 * Returns a new, empty XML document.
 */
export const createXmlDocument = () => {
  let doc = null;

  if (document.implementation && document.implementation.createDocument) {
    doc = document.implementation.createDocument('', '', null);
  } else if ('ActiveXObject' in window) {
    doc = createMsXmlDocument();
  }

  return doc;
};

/**
 * Function: createMsXmlDocument
 *
 * Returns a new, empty Microsoft.XMLDOM document using ActiveXObject.
 */
export const createMsXmlDocument = () => {
  const doc = new ActiveXObject('Microsoft.XMLDOM');
  doc.async = false;

  // Workaround for parsing errors with SVG DTD
  doc.validateOnParse = false;
  doc.resolveExternals = false;

  return doc;
};

/**
 * Function: parseXml
 *
 * Parses the specified XML string into a new XML document and returns the
 * new document.
 *
 * Example:
 *
 * (code)
 * var doc = mxUtils.parseXml(
 *   '<mxGraphModel><root><MyDiagram id="0"><mxCell/></MyDiagram>'+
 *   '<MyLayer id="1"><mxCell parent="0" /></MyLayer><MyObject id="2">'+
 *   '<mxCell style="strokeColor=blue;fillColor=red" parent="1" vertex="1">'+
 *   '<mxGeometry x="10" y="10" width="80" height="30" as="geometry"/>'+
 *   '</mxCell></MyObject></root></mxGraphModel>');
 * (end)
 *
 * Parameters:
 *
 * xml - String that contains the XML data.
 */
export const parseXml = (() => {
  if (window.DOMParser) {
    return (xml) => {
      const parser = new DOMParser();

      return parser.parseFromString(xml, 'text/xml');
    };
  } else {
    // IE<=9
    return (xml) => {
      const doc = createMsXmlDocument();
      doc.loadXML(xml);

      return doc;
    };
  }
})();

/**
 * Function: clearSelection
 *
 * Clears the current selection in the page.
 */
export const clearSelection = () => {
  if (window.getSelection().empty) {
    window.getSelection().empty();
  } else if (window.getSelection().removeAllRanges) {
    window.getSelection().removeAllRanges();
  }
};

/**
 * Function: removeWhitespace
 *
 * Removes the sibling text nodes for the given node that only consists
 * of tabs, newlines and spaces.
 *
 * Parameters:
 *
 * node - DOM node whose siblings should be removed.
 * before - Optional boolean that specifies the direction of the traversal.
 */
export const removeWhitespace = (node, before) => {
  let tmp = before ? node.previousSibling : node.nextSibling;

  while (isSet(tmp) && tmp.nodeType === NODETYPE_TEXT) {
    const next = before ? tmp.previousSibling : tmp.nextSibling;
    const text = mxUtils.getTextContent(tmp);

    if (trim(text).length === 0) {
      tmp.parentNode.removeChild(tmp);
    }

    tmp = next;
  }
};

/**
 * Function: htmlEntities
 *
 * Replaces characters (less than, greater than, newlines and quotes) with
 * their HTML entities in the given string and returns the result.
 *
 * Parameters:
 *
 * s - String that contains the characters to be converted.
 * newline - If newlines should be replaced. Default is true.
 */
export const htmlEntities = (s, newline = true) => {
  s = String(s || '');

  s = s.replace(/&/g, '&amp;'); // 38 26
  s = s.replace(/"/g, '&quot;'); // 34 22
  s = s.replace(/\'/g, '&#39;'); // 39 27
  s = s.replace(/</g, '&lt;'); // 60 3C
  s = s.replace(/>/g, '&gt;'); // 62 3E

  if (newline) {
    s = s.replace(/\n/g, '&#xa;');
  }

  return s;
};

/**
 * Function: getXml
 *
 * Returns the XML content of the specified node. For Internet Explorer,
 * all \r\n\t[\t]* are removed from the XML string and the remaining \r\n
 * are replaced by \n. All \n are then replaced with linefeed, or &#xa; if
 * no linefeed is defined.
 *
 * Parameters:
 *
 * node - DOM node to return the XML for.
 * linefeed - Optional string that linefeeds are converted into. Default is
 * &#xa;
 */
export const getXml = (node, linefeed) => {
  let xml = '';

  if (isSet(window.XMLSerializer)) {
    var xmlSerializer = new XMLSerializer();
    xml = xmlSerializer.serializeToString(node);
  } else if (isSet(node.xml)) {
    xml = node.xml
      .replace(/\r\n\t[\t]*/g, '')
      .replace(/>\r\n/g, '>')
      .replace(/\r\n/g, '\n');
  }

  // Replaces linefeeds with HTML Entities.
  linefeed = linefeed || '&#xa;';
  xml = xml.replace(/\n/g, linefeed);

  return xml;
};

/**
 * Function: getPrettyXML
 *
 * Returns a pretty printed string that represents the XML tree for the
 * given node. This method should only be used to print XML for reading,
 * use <getXml> instead to obtain a string for processing.
 *
 * Parameters:
 *
 * node - DOM node to return the XML for.
 * tab - Optional string that specifies the indentation for one level.
 * Default is two spaces.
 * indent - Optional string that represents the current indentation.
 * Default is an empty string.
 * newline - Option string that represents a linefeed. Default is '\n'.
 */
export const getPrettyXml = (
  node,
  tab = '  ',
  indent = '',
  newline = '\n',
  ns
) => {
  const result = [];

  if (isSet(node)) {
    if (isSet(node.namespaceURI) && node.namespaceURI !== ns) {
      ns = node.namespaceURI;

      if (isUnset(node.getAttribute('xmlns'))) {
        node.setAttribute('xmlns', node.namespaceURI);
      }
    }

    if (node.nodeType === NODETYPE_DOCUMENT) {
      result.push(getPrettyXml(node.documentElement, tab, indent, newline, ns));
    } else if (node.nodeType === NODETYPE_DOCUMENT_FRAGMENT) {
      let tmp = node.firstChild;

      if (isSet(tmp)) {
        while (isSet(tmp)) {
          result.push(getPrettyXml(tmp, tab, indent, newline, ns));
          tmp = tmp.nextSibling;
        }
      }
    } else if (node.nodeType === NODETYPE_COMMENT) {
      const value = getTextContent(node);

      if (value.length > 0) {
        result.push(indent + '<!--' + value + '-->' + newline);
      }
    } else if (node.nodeType === NODETYPE_TEXT) {
      const value = trim(mxUtils.getTextContent(node));

      if (value.length > 0) {
        result.push(indent + htmlEntities(value, false) + newline);
      }
    } else if (node.nodeType === NODETYPE_CDATA) {
      const value = getTextContent(node);

      if (value.length > 0) {
        result.push(indent + '<![CDATA[' + value + ']]' + newline);
      }
    } else {
      result.push(indent + '<' + node.nodeName);

      // Creates the string with the node attributes
      // and converts all HTML entities in the values
      const attrs = node.attributes;

      if (isSet(attrs)) {
        for (let i = 0; i < attrs.length; i++) {
          const val = htmlEntities(attrs[i].value);
          result.push(' ' + attrs[i].nodeName + '="' + val + '"');
        }
      }

      // Recursively creates the XML string for each child
      // node and appends it here with an indentation
      let tmp = node.firstChild;

      if (isSet(tmp)) {
        result.push('>' + newline);

        while (tmp != null) {
          result.push(getPrettyXml(tmp, tab, indent + tab, newline, ns));
          tmp = tmp.nextSibling;
        }

        result.push(indent + '</' + node.nodeName + '>' + newline);
      } else {
        result.push(' />' + newline);
      }
    }
  }

  return result.join('');
};

/**
 * Function: extractTextWithWhitespace
 *
 * Returns the text content of the specified node.
 *
 * Parameters:
 *
 * elems - DOM nodes to return the text for.
 */
export const extractTextWithWhitespace = (elems) => {
  // Known block elements for handling linefeeds (list is not complete)
  const blocks = [
    'BLOCKQUOTE',
    'DIV',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'OL',
    'P',
    'PRE',
    'TABLE',
    'UL'
  ];
  const ret = [];

  const doExtract = (elts) => {
    // Single break should be ignored
    if (
      elts.length === 1 &&
      (elts[0].nodeName === 'BR' || elts[0].innerHTML === '\n')
    ) {
      return;
    }

    for (let i = 0; i < elts.length; i++) {
      const elem = elts[i];

      // DIV with a br or linefeed forces a linefeed
      if (
        elem.nodeName === 'BR' ||
        elem.innerHTML === '\n' ||
        ((elts.length === 1 || i === 0) &&
          elem.nodeName === 'DIV' &&
          elem.innerHTML.toLowerCase() === '<br>')
      ) {
        ret.push('\n');
      } else {
        if (elem.nodeType === 3 || elem.nodeType === 4) {
          if (elem.nodeValue.length > 0) {
            ret.push(elem.nodeValue);
          }
        } else if (elem.nodeType !== 8 && elem.childNodes.length > 0) {
          doExtract(elem.childNodes);
        }

        if (i < elts.length - 1 && blocks.indexOf(elts[i + 1].nodeName) >= 0) {
          ret.push('\n');
        }
      }
    }
  };

  doExtract(elems);

  return ret.join('');
};

/**
 * Function: replaceTrailingNewlines
 *
 * Replaces each trailing newline with the given pattern.
 */
export const replaceTrailingNewlines = (str, pattern) => {
  // LATER: Check is this can be done with a regular expression
  let postfix = '';

  while (str.length > 0 && str.charAt(str.length - 1) === '\n') {
    str = str.substring(0, str.length - 1);
    postfix += pattern;
  }

  return str + postfix;
};

/**
 * Function: getTextContent
 *
 * Returns the text content of the specified node.
 *
 * Parameters:
 *
 * node - DOM node to return the text content for.
 */
export const getTextContent = (node) =>
  isSet(node) ? node[isUnset(node.textContent) ? 'text' : 'textContent'] : '';

/**
 * Function: setTextContent
 *
 * Sets the text content of the specified node.
 *
 * Parameters:
 *
 * node - DOM node to set the text content for.
 * text - String that represents the text content.
 */
export const setTextContent = (node, text) => {
  if (isSet(node.innerText)) {
    node.innerText = text;
  } else {
    node[isUnset(node.textContent) ? 'text' : 'textContent'] = text;
  }
};

/**
 * Function: getInnerHtml
 *
 * Returns the inner HTML for the given node as a string or an empty string
 * if no node was specified. The inner HTML is the text representing all
 * children of the node, but not the node itself.
 *
 * Parameters:
 *
 * node - DOM node to return the inner HTML for.
 */
export const getInnerHtml = () => {
  if (isSet(node)) {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(node);
  }

  return '';
};

/**
 * Function: getOuterHtml
 *
 * Returns the outer HTML for the given node as a string or an empty
 * string if no node was specified. The outer HTML is the text representing
 * all children of the node including the node itself.
 *
 * Parameters:
 *
 * node - DOM node to return the outer HTML for.
 */
export const getOuterHtml = (node) => {
  if (isSet(node)) {
    var serializer = new XMLSerializer();
    return serializer.serializeToString(node);
  }

  return '';
};

/**
 * Function: write
 *
 * Creates a text node for the given string and appends it to the given
 * parent. Returns the text node.
 *
 * Parameters:
 *
 * parent - DOM node to append the text node to.
 * text - String representing the text to be added.
 */
export const write = (parent, text) => {
  const doc = parent.ownerDocument;
  const node = doc.createTextNode(text);

  if (isSet(parent)) parent.appendChild(node);

  return node;
};

/**
 * Function: writeln
 *
 * Creates a text node for the given string and appends it to the given
 * parent with an additional linefeed. Returns the text node.
 *
 * Parameters:
 *
 * parent - DOM node to append the text node to.
 * text - String representing the text to be added.
 */
export const writeln = (parent, text) => {
  const doc = parent.ownerDocument;
  const node = doc.createTextNode(text);

  if (isSet(parent)) {
    parent.appendChild(node);
    parent.appendChild(document.createElement('br'));
  }

  return node;
};

/**
 * Function: br
 *
 * Appends a linebreak to the given parent and returns the linebreak.
 *
 * Parameters:
 *
 * parent - DOM node to append the linebreak to.
 */
export const br = (parent, count) => {
  count = count || 1;
  let br = null;

  for (let i = 0; i < count; i++) {
    if (isSet(parent)) {
      br = parent.ownerDocument.createElement('br');
      parent.appendChild(br);
    }
  }

  return br;
};

/**
 * Function: button
 *
 * Returns a new button with the given level and function as an onclick
 * event handler.
 *
 * (code)
 * document.body.appendChild(mxUtils.button('Test', function(evt)
 * {
 *   alert('Hello, World!');
 * }));
 * (end)
 *
 * Parameters:
 *
 * label - String that represents the label of the button.
 * funct - Function to be called if the button is pressed.
 * doc - Optional document to be used for creating the button. Default is the
 * current document.
 */
export const button = (label, funct, doc = document) => {
  const button = doc.createElement('button');
  write(button, label);

  Event.addEventListener(button, 'click', (evt) => funct(evt));

  return button;
};

/**
 * Function: para
 *
 * Appends a new paragraph with the given text to the specified parent and
 * returns the paragraph.
 *
 * Parameters:
 *
 * parent - DOM node to append the text node to.
 * text - String representing the text for the new paragraph.
 */
export const para = (parent, text) => {
  const p = document.createElement('p');
  write(p, text);

  if (isSet(parent)) {
    parent.appendChild(p);
  }

  return p;
};

/**
 * Function: addTransparentBackgroundFilter
 *
 * Adds a transparent background to the filter of the given node. This
 * background can be used in IE8 standards mode (native IE8 only) to pass
 * events through the node.
 */
export const addTransparentBackgroundFilter = (node) => {
  node.style.filter +=
    "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" +
    mxClient.imageBasePath +
    "/transparent.gif', sizingMethod='scale')";
};

/**
 * Function: linkAction
 *
 * Adds a hyperlink to the specified parent that invokes action on the
 * specified editor.
 *
 * Parameters:
 *
 * parent - DOM node to contain the new link.
 * text - String that is used as the link label.
 * editor - <mxEditor> that will execute the action.
 * action - String that defines the name of the action to be executed.
 * pad - Optional left-padding for the link. Default is 0.
 */
export const linkAction = (parent, text, editor, action, pad) =>
  link(parent, text, () => editor.execute(action), pad);

/**
 * Function: linkInvoke
 *
 * Adds a hyperlink to the specified parent that invokes the specified
 * function on the editor passing along the specified argument. The
 * function name is the name of a function of the editor instance,
 * not an action name.
 *
 * Parameters:
 *
 * parent - DOM node to contain the new link.
 * text - String that is used as the link label.
 * editor - <mxEditor> instance to execute the function on.
 * functName - String that represents the name of the function.
 * arg - Object that represents the argument to the function.
 * pad - Optional left-padding for the link. Default is 0.
 */
export const linkInvoke = (parent, text, editor, functName, arg, pad) =>
  link(parent, text, () => editor[functName](arg), pad);

/**
 * Function: link
 *
 * Adds a hyperlink to the specified parent and invokes the given function
 * when the link is clicked.
 *
 * Parameters:
 *
 * parent - DOM node to contain the new link.
 * text - String that is used as the link label.
 * funct - Function to execute when the link is clicked.
 * pad - Optional left-padding for the link. Default is 0.
 */
export const link = (parent, text, funct, pad) => {
  const a = document.createElement('span');

  a.style.color = 'blue';
  a.style.textDecoration = 'underline';
  a.style.cursor = 'pointer';

  if (isSet(pad)) {
    a.style.paddingLeft = pad + 'px';
  }

  Event.addListener(a, 'click', funct);
  write(a, text);

  if (isSet(parent)) {
    parent.appendChild(a);
  }

  return a;
};

/**
 * Function: getDocumentSize
 *
 * Returns the client size for the current document as an <mxRectangle>.
 */
export const getDocumentSize = () => {
  const b = document.body;
  const d = document.documentElement;

  try {
    return Rectangle(
      0,
      0,
      b.clientWidth || d.clientWidth,
      Math.max(b.clientHeight || 0, d.clientHeight)
    );
  } catch (e) {
    return Rectangle();
  }
};

/**
 * Function: fit
 *
 * Makes sure the given node is inside the visible area of the window. This
 * is done by setting the left and top in the style.
 */
export const fit = (node) => {
  const ds = getDocumentSize();
  const left = parseInt(node.offsetLeft);
  const width = parseInt(node.offsetWidth);

  const offset = getDocumentScrollOrigin(node.ownerDocument);
  const sl = offset.getX();
  const st = offset.getY();
  const right = sl + ds.width;

  if (left + width > right) {
    node.style.left = Math.max(sl, right - width) + 'px';
  }

  const top = parseInt(node.offsetTop);
  const height = parseInt(node.offsetHeight);
  const bottom = st + ds.height;

  if (top + height > bottom) {
    node.style.top = Math.max(st, bottom - height) + 'px';
  }
};

/**
 * Function: getValue
 *
 * Returns the value for the given key in the given associative array or
 * the given default value if the value is null.
 *
 * Parameters:
 *
 * array - Associative array that contains the value for the key.
 * key - Key whose value should be returned.
 * defaultValue - Value to be returned if the value for the given
 * key is null.
 */
export const getValue = (array, key, defaultValue) => {
  let value = isSet(array) ? array[key] : null;

  if (value === null) value = defaultValue;

  return value;
};

/**
 * Function: getNumber
 *
 * Returns the numeric value for the given key in the given associative
 * array or the given default value (or 0) if the value is null. The value
 * is converted to a numeric value using the Number function.
 *
 * Parameters:
 *
 * array - Associative array that contains the value for the key.
 * key - Key whose value should be returned.
 * defaultValue - Value to be returned if the value for the given
 * key is null. Default is 0.
 */
export const getNumber = (array, key, defaultValue = 0) => {
  const value = isSet(array) ? array[key] : defaultValue;

  return Number(value);
};

/**
 * Function: getColor
 *
 * Returns the color value for the given key in the given associative
 * array or the given default value if the value is null. If the value
 * is <mxConstants.NONE> then null is returned.
 *
 * Parameters:
 *
 * array - Associative array that contains the value for the key.
 * key - Key whose value should be returned.
 * defaultValue - Value to be returned if the value for the given
 * key is null. Default is null.
 */
export const getColor = (array, key, defaultValue = null) =>
  isSet(array) ? array[key] : value === mxConstants.NONE ? null : defaultValue;

/**
 * Function: clone
 *
 * Recursively clones the specified object ignoring all fieldnames in the
 * given array of transient fields. <mxObjectIdentity.FIELD_NAME> is always
 * ignored by this function.
 *
 * Parameters:
 *
 * obj - Object to be cloned.
 * transients - Optional array of strings representing the fieldname to be
 * ignored.
 * shallow - Optional boolean argument to specify if a shallow clone should
 * be created, that is, one where all object references are not cloned or,
 * in other words, one where only atomic (strings, numbers) values are
 * cloned. Default is false.
 */
export const clone = (obj, transients, shallow) => {
  if (!obj) return null;
  if (typeof obj.constructor !== 'function') return null;

  const clone = obj.constructor();

  for (const key in obj) {
    if (
      key !== ObjectIdentity.FIELD_NAME &&
      (!transients || transients.indexOf(key) < 0)
    ) {
      if (!shallow && typeof obj[key] === 'object')
        clone[key] = clone(obj[key]);
      else clone[key] = obj[key];
    }
  }

  return clone;
};

/**
 * Function: equalPoints
 *
 * Compares all mxPoints in the given lists.
 *
 * Parameters:
 *
 * a - Array of <mxPoints> to be compared.
 * b - Array of <mxPoints> to be compared.
 */
export const equalPoints = (a, b) => {
  if ((!a && b) || (a && !b) || (a && b && a.length !== b.length)) return false;

  if (a && b) {
    for (let i = 0; i < a.length; i++) {
      const aa = a[i];
      const bb = b[i];

      if (
        (aa && !bb) ||
        (!aa && bb) ||
        (aa && bb && aa.getX() !== bb.getX()) ||
        aa.getY() !== bb.getY()
      )
        return false;
    }
  }

  return true;
};

/**
 * Function: equalEntries
 *
 * Returns true if all properties of the given objects are equal. Values
 * with NaN are equal to NaN and unequal to any other value.
 *
 * Parameters:
 *
 * a - First object to be compared.
 * b - Second object to be compared.
 */
export const equalEntries = (a, b) => {
  // Counts keys in b to check if all values have been compared
  let count = 0;

  if (
    (isUnset(a) && isSet(b)) ||
    (isSet(a) && isUnset(b)) ||
    (isSet(a) && isSet(b) && a.length !== b.length)
  ) {
    return false;
  } else if (isSet(a) && isSet(b)) {
    for (const key in b) {
      count++;
    }

    for (const key in a) {
      count--;

      if ((!isNaN(a[key]) || !isNaN(b[key])) && a[key] !== b[key]) {
        return false;
      }
    }
  }

  return count === 0;
};

/**
 * Function: removeDuplicates
 *
 * Removes all duplicates from the given array.
 */
export const removeDuplicates = (arr) => {
  const dict = Dictionary();
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    if (!dict.get(arr[i])) {
      result.push(arr[i]);
      dict.put(arr[i], true);
    }
  }

  return result;
};

/**
 * Function: toRadians
 *
 * Converts the given degree to radians.
 */
export const toRadians = (deg) => (Math.PI * deg) / 180;

/**
 * Function: toDegree
 *
 * Converts the given radians to degree.
 */
export const toDegree = (rad) => (rad * 180) / Math.PI;

/**
 * Function: arcToCurves
 *
 * Converts the given arc to a series of curves.
 */
export const arcToCurves = (
  x0,
  y0,
  r1,
  r2,
  angle,
  largeArcFlag,
  sweepFlag,
  x,
  y
) => {
  x -= x0;
  y -= y0;

  if (r1 === 0 || r2 === 0) {
    return result;
  }

  const fS = sweepFlag;
  const psai = angle;
  r1 = Math.abs(r1);
  r2 = Math.abs(r2);
  const ctx = -x / 2;
  const cty = -y / 2;
  const cpsi = Math.cos((psai * Math.PI) / 180);
  const spsi = Math.sin((psai * Math.PI) / 180);
  const rxd = cpsi * ctx + spsi * cty;
  const ryd = -1 * spsi * ctx + cpsi * cty;
  const rxdd = rxd * rxd;
  const rydd = ryd * ryd;
  const r1x = r1 * r1;
  const r2y = r2 * r2;
  const lamda = rxdd / r1x + rydd / r2y;
  let sds;

  if (lamda > 1) {
    r1 = Math.sqrt(lamda) * r1;
    r2 = Math.sqrt(lamda) * r2;
    sds = 0;
  } else {
    let seif = 1;

    if (largeArcFlag === fS) {
      seif = -1;
    }

    sds =
      seif *
      Math.sqrt(
        (r1x * r2y - r1x * rydd - r2y * rxdd) / (r1x * rydd + r2y * rxdd)
      );
  }

  const txd = (sds * r1 * ryd) / r2;
  const tyd = (-1 * sds * r2 * rxd) / r1;
  const tx = cpsi * txd - spsi * tyd + x / 2;
  const ty = spsi * txd + cpsi * tyd + y / 2;
  let rad = Math.atan2((ryd - tyd) / r2, (rxd - txd) / r1) - Math.atan2(0, 1);
  const s1 = rad >= 0 ? rad : 2 * Math.PI + rad;
  rad =
    Math.atan2((-ryd - tyd) / r2, (-rxd - txd) / r1) -
    Math.atan2((ryd - tyd) / r2, (rxd - txd) / r1);
  let dr = rad >= 0 ? rad : 2 * Math.PI + rad;

  if (fS == 0 && dr > 0) {
    dr -= 2 * Math.PI;
  } else if (fS != 0 && dr < 0) {
    dr += 2 * Math.PI;
  }

  const sse = (dr * 2) / Math.PI;
  const seg = Math.ceil(sse < 0 ? -1 * sse : sse);
  const segr = dr / seg;
  const t =
    ((8 / 3) * Math.sin(segr / 4) * Math.sin(segr / 4)) / Math.sin(segr / 2);
  const cpsir1 = cpsi * r1;
  const cpsir2 = cpsi * r2;
  const spsir1 = spsi * r1;
  const spsir2 = spsi * r2;
  const mc = Math.cos(s1);
  const ms = Math.sin(s1);
  let x2 = -t * (cpsir1 * ms + spsir2 * mc);
  let y2 = -t * (spsir1 * ms - cpsir2 * mc);
  let x3 = 0;
  let y3 = 0;

  const result = [];

  for (let n = 0; n < seg; ++n) {
    s1 += segr;
    mc = Math.cos(s1);
    ms = Math.sin(s1);

    x3 = cpsir1 * mc - spsir2 * ms + tx;
    y3 = spsir1 * mc + cpsir2 * ms + ty;
    const dx = -t * (cpsir1 * ms + spsir2 * mc);
    const dy = -t * (spsir1 * ms - cpsir2 * mc);

    // CurveTo updates x0, y0 so need to restore it
    const index = n * 6;
    result[index] = Number(x2 + x0);
    result[index + 1] = Number(y2 + y0);
    result[index + 2] = Number(x3 - dx + x0);
    result[index + 3] = Number(y3 - dy + y0);
    result[index + 4] = Number(x3 + x0);
    result[index + 5] = Number(y3 + y0);

    x2 = x3 + dx;
    y2 = y3 + dy;
  }

  return result;
};

/**
 * Function: getBoundingBox
 *
 * Returns the bounding box for the rotated rectangle.
 *
 * Parameters:
 *
 * rect - <mxRectangle> to be rotated.
 * angle - Number that represents the angle (in degrees).
 * cx - Optional <mxPoint> that represents the rotation center. If no
 * rotation center is given then the center of rect is used.
 */
export const getBoundingBox = (rect, rotation, cx) => {
  let result = null;

  if (isSet(rect) && isSet(rotation) && rotation !== 0) {
    const rad = toRadians(rotation);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    cx = isSet(cx)
      ? cx
      : Point(
          rect.getX() + rect.getWidth() / 2,
          rect.getY() + rect.getHeight() / 2
        );

    let p1 = Point(rect.getX(), rect.getY());
    let p2 = Point(rect.getX() + rect.getWidth(), rect.getY());
    let p3 = Point(p2.getX(), rect.getY() + rect.getHeight());
    let p4 = Point(rect.getX(), p3.getY());

    p1 = getRotatedPoint(p1, cos, sin, cx);
    p2 = getRotatedPoint(p2, cos, sin, cx);
    p3 = getRotatedPoint(p3, cos, sin, cx);
    p4 = getRotatedPoint(p4, cos, sin, cx);

    result = Rectangle(p1.getX(), p1.getY(), 0, 0);
    result.add(Rectangle(p2.getX(), p2.getY(), 0, 0));
    result.add(Rectangle(p3.getX(), p3.getY(), 0, 0));
    result.add(Rectangle(p4.getX(), p4.getY(), 0, 0));
  }

  return result;
};

/**
 * Function: getRotatedPoint
 *
 * Rotates the given point by the given cos and sin.
 */
export const getRotatedPoint = (pt, cos, sin, c) => {
  const p = c ? c : Point();
  const x = pt.getX() - p.getX();
  const y = pt.getY() - p.getY();

  const x1 = x * cos - y * sin;
  const y1 = y * cos + x * sin;

  return Point(x1 + p.getX(), y1 + p.getY());
};

/**
 * Returns an integer mask of the port constraints of the given map
 * @param dict the style map to determine the port constraints for
 * @param defaultValue Default value to return if the key is undefined.
 * @return the mask of port constraint directions
 *
 * Parameters:
 *
 * terminal - <mxCelState> that represents the terminal.
 * edge - <mxCellState> that represents the edge.
 * source - Boolean that specifies if the terminal is the source terminal.
 * defaultValue - Default value to be returned.
 */
export const getPortConstraints = (terminal, edge, source, defaultValue) => {
  const value = getValue(
    terminal.getStyle(),
    STYLE_PORT_CONSTRAINT,
    getValue(
      edge.getStyle(),
      source ? STYLE_SOURCE_PORT_CONSTRAINT : STYLE_TARGET_PORT_CONSTRAINT,
      null
    )
  );

  if (isUnset(value)) {
    return defaultValue;
  } else {
    const directions = value.toString();
    let returnValue = DIRECTION_MASK_NONE;
    const constraintRotationEnabled = getValue(
      terminal.getStyle(),
      STYLE_PORT_CONSTRAINT_ROTATION,
      0
    );
    let rotation = 0;

    if (constraintRotationEnabled === 1) {
      rotation = getValue(terminal.getStyle(), STYLE_ROTATION, 0);
    }

    let quad = 0;

    if (rotation > 45) {
      quad = 1;

      if (rotation >= 135) {
        quad = 2;
      }
    } else if (rotation < -45) {
      quad = 3;

      if (rotation <= -135) {
        quad = 2;
      }
    }

    if (directions.indexOf(DIRECTION_NORTH) >= 0) {
      switch (quad) {
        case 0:
          returnValue |= DIRECTION_MASK_NORTH;
          break;
        case 1:
          returnValue |= DIRECTION_MASK_EAST;
          break;
        case 2:
          returnValue |= DIRECTION_MASK_SOUTH;
          break;
        case 3:
          returnValue |= DIRECTION_MASK_WEST;
          break;
      }
    }
    if (directions.indexOf(DIRECTION_WEST) >= 0) {
      switch (quad) {
        case 0:
          returnValue |= DIRECTION_MASK_WEST;
          break;
        case 1:
          returnValue |= DIRECTION_MASK_NORTH;
          break;
        case 2:
          returnValue |= DIRECTION_MASK_EAST;
          break;
        case 3:
          returnValue |= DIRECTION_MASK_SOUTH;
          break;
      }
    }
    if (directions.indexOf(DIRECTION_SOUTH) >= 0) {
      switch (quad) {
        case 0:
          returnValue |= DIRECTION_MASK_SOUTH;
          break;
        case 1:
          returnValue |= DIRECTION_MASK_WEST;
          break;
        case 2:
          returnValue |= DIRECTION_MASK_NORTH;
          break;
        case 3:
          returnValue |= DIRECTION_MASK_EAST;
          break;
      }
    }
    if (directions.indexOf(DIRECTION_EAST) >= 0) {
      switch (quad) {
        case 0:
          returnValue |= DIRECTION_MASK_EAST;
          break;
        case 1:
          returnValue |= DIRECTION_MASK_SOUTH;
          break;
        case 2:
          returnValue |= DIRECTION_MASK_WEST;
          break;
        case 3:
          returnValue |= DIRECTION_MASK_NORTH;
          break;
      }
    }

    return returnValue;
  }
};

/**
 * Function: reversePortConstraints
 *
 * Reverse the port constraint bitmask. For example, north | east
 * becomes south | west
 */
export const reversePortConstraints = (constraint) => {
  let result = 0;

  result = (constraint & DIRECTION_MASK_WEST) << 3;
  result |= (constraint & DIRECTION_MASK_NORTH) << 1;
  result |= (constraint & DIRECTION_MASK_SOUTH) >> 1;
  result |= (constraint & DIRECTION_MASK_EAST) >> 3;

  return result;
};

/**
 * Function: findNearestSegment
 *
 * Finds the index of the nearest segment on the given cell state for
 * the specified coordinate pair.
 */
export const findNearestSegment = (state, x, y) => {
  let index = -1;

  if (state.getAbsolutePoints().length > 0) {
    const points = state.getAbsolutePoints();
    let last = points[0];
    let min = null;

    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const dist = ptSegDistSq(
        last.getX(),
        last.getY(),
        current.getX(),
        current.getY(),
        x,
        y
      );

      if (isUnset(min) || dist < min) {
        min = dist;
        index = i - 1;
      }

      last = current;
    }
  }

  return index;
};

/**
 * Function: getDirectedBounds
 *
 * Adds the given margins to the given rectangle and rotates and flips the
 * rectangle according to the respective styles in style.
 */
export const getDirectedBounds = (rect, m, style, flipH, flipV) => {
  const d = getValue(style, STYLE_DIRECTION, DIRECTION_EAST);
  const doFlipH = isSet(flipH) ? flipH : getValue(style, STYLE_FLIPH, false);
  const doFlipV = isSet(flipV) ? flipV : getValue(style, STYLE_FLIPV, false);

  m.setX(Math.round(Math.max(0, Math.min(rect.getWidth(), m.getX()))));
  m.setY(Math.round(Math.max(0, Math.min(rect.getHeight(), m.getY()))));
  m.setWidth(Math.round(Math.max(0, Math.min(rect.getWidth(), m.getWidth()))));
  m.setHeight(
    Math.round(Math.max(0, Math.min(rect.getHeight(), m.getHeight())))
  );

  if (
    (doFlipV && (d === DIRECTION_SOUTH || d === DIRECTION_NORTH)) ||
    (doFlipH && (d === DIRECTION_EAST || d === DIRECTION_WEST))
  ) {
    const tmp = m.getX();
    m.setX(m.getWidth());
    m.setWidth(tmp);
  }

  if (
    (doFlipH && (d === DIRECTION_SOUTH || d === DIRECTION_NORTH)) ||
    (doFlipV && (d === DIRECTION_EAST || d === DIRECTION_WEST))
  ) {
    const tmp = m.getY();
    m.setY(m.getHeight());
    m.setHeight(tmp);
  }

  const m2 = Rectangle.fromRectangle(m);

  if (d === DIRECTION_SOUTH) {
    m2.setY(m.getX());
    m2.setX(m.getHeight());
    m2.setWidth(m.getY());
    m2.setHeight(m.getWidth());
  } else if (d === DIRECTION_WEST) {
    m2.setY(m.getHeight());
    m2.setX(m.getWidth());
    m2.setWidth(m.getX());
    m2.setHeight(m.getY());
  } else if (d === DIRECTION_NORTH) {
    m2.setY(m.getWidth());
    m2.setX(m.getY());
    m2.setWidth(m.getHeight());
    m2.setHeight(m.getX());
  }

  return Rectangle(
    rect.getX() + m2.getX(),
    rect.getY() + m2.getY(),
    rect.getWidth() - m2.getWidth() - m2.getX(),
    rect.getHeight() - m2.getHeight() - m2.getY()
  );
};

/**
 * Function: getPerimeterPoint
 *
 * Returns the intersection between the polygon defined by the array of
 * points and the line between center and point.
 */
export const getPerimeterPoint = (pts, center, point) => {
  let min = null;

  for (let i = 0; i < pts.length - 1; i++) {
    const pt = intersection(
      pts[i].getX(),
      pts[i].getY(),
      pts[i + 1].getX(),
      pts[i + 1].getY(),
      center.getX(),
      center.getY(),
      point.getX(),
      point.getY()
    );

    if (isSet(pt)) {
      const dx = point.getX() - pt.getX();
      const dy = point.getY() - pt.getY();
      const ip = { p: pt, distSq: dy * dy + dx * dx };

      if (isSet(ip) && (isUnset(min) || min.distSq > ip.distSq)) {
        min = ip;
      }
    }
  }

  return isSet(min) ? min.p : null;
};

/**
 * Function: rectangleIntersectsSegment
 *
 * Returns true if the given rectangle intersects the given segment.
 *
 * Parameters:
 *
 * bounds - <mxRectangle> that represents the rectangle.
 * p1 - <mxPoint> that represents the first point of the segment.
 * p2 - <mxPoint> that represents the second point of the segment.
 */
export const rectangleIntersectsSegment = (bounds, p1, p2) => {
  const top = bounds.getY();
  const left = bounds.getX();
  const bottom = top + bounds.getHeight();
  const right = left + bounds.getWidth();

  // Find min and max X for the segment
  let minX = p1.getX();
  let maxX = p2.getX();

  if (p1.getX() > p2.getX()) {
    minX = p2.getX();
    maxX = p1.getX();
  }

  // Find the intersection of the segment's and rectangle's x-projections
  if (maxX > right) {
    maxX = right;
  }

  if (minX < left) {
    minX = left;
  }

  if (minX > maxX) {
    // If their projections do not intersect return false
    return false;
  }

  // Find corresponding min and max Y for min and max X we found before
  let minY = p1.getY();
  let maxY = p2.getY();
  const dx = p2.getX() - p1.getX();

  if (Math.abs(dx) > 0.0000001) {
    const a = (p2.getY() - p1.getY()) / dx;
    const b = p1.getY() - a * p1.getX();
    minY = a * minX + b;
    maxY = a * maxX + b;
  }

  if (minY > maxY) {
    const tmp = maxY;
    maxY = minY;
    minY = tmp;
  }

  // Find the intersection of the segment's and rectangle's y-projections
  if (maxY > bottom) {
    maxY = bottom;
  }

  if (minY < top) {
    minY = top;
  }

  if (minY > maxY) {
    // If Y-projections do not intersect return false
    return false;
  }

  return true;
};

/**
 * Function: contains
 *
 * Returns true if the specified point (x, y) is contained in the given rectangle.
 *
 * Parameters:
 *
 * bounds - <mxRectangle> that represents the area.
 * x - X-coordinate of the point.
 * y - Y-coordinate of the point.
 */
export const contains = (bounds, x, y) =>
  bounds.getX() <= x &&
  bounds.getX() + bounds.getWidth() >= x &&
  bounds.getY() <= y &&
  bounds.getY() + bounds.getHeight() >= y;

/**
 * Function: intersects
 *
 * Returns true if the two rectangles intersect.
 *
 * Parameters:
 *
 * a - <mxRectangle> to be checked for intersection.
 * b - <mxRectangle> to be checked for intersection.
 */
export const intersects = (a, b) => {
  let tw = a.width;
  let th = a.height;
  let rw = b.width;
  let rh = b.height;

  if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
    return false;
  }

  let tx = a.x;
  let ty = a.y;
  let rx = b.x;
  let ry = b.y;

  rw += rx;
  rh += ry;
  tw += tx;
  th += ty;

  return (
    (rw < rx || rw > tx) &&
    (rh < ry || rh > ty) &&
    (tw < tx || tw > rx) &&
    (th < ty || th > ry)
  );
};

/**
 * Function: intersectsHotspot
 *
 * Returns true if the state and the hotspot intersect.
 *
 * Parameters:
 *
 * state - <mxCellState>
 * x - X-coordinate.
 * y - Y-coordinate.
 * hotspot - Optional size of the hostpot.
 * min - Optional min size of the hostpot.
 * max - Optional max size of the hostpot.
 */
export const intersectsHotspot = (
  state,
  x,
  y,
  hotspot = 1,
  min = 0,
  max = 0
) => {
  if (hotspot > 0) {
    let cx = state.getCenterX();
    let cy = state.getCenterY();
    let w = state.getWidth();
    let h = state.getHeight();

    const start =
      getValue(state.getStyle(), STYLE_STARTSIZE) * state.getView().getScale();

    if (start > 0) {
      if (getValue(state.getStyle(), STYLE_HORIZONTAL, true)) {
        cy = state.getY() + start / 2;
        h = start;
      } else {
        cx = state.getX() + start / 2;
        w = start;
      }
    }

    w = Math.max(min, w * hotspot);
    h = Math.max(min, h * hotspot);

    if (max > 0) {
      w = Math.min(w, max);
      h = Math.min(h, max);
    }

    const rect = Rectangle(cx - w / 2, cy - h / 2, w, h);
    const alpha = toRadians(getValue(state.getStyle(), STYLE_ROTATION) || 0);

    if (alpha !== 0) {
      const cos = Math.cos(-alpha);
      const sin = Math.sin(-alpha);
      const cx = Point(state.getCenterX(), state.getCenterY());
      const pt = getRotatedPoint(Point(x, y), cos, sin, cx);
      x = pt.x;
      y = pt.y;
    }

    return contains(rect, x, y);
  }

  return true;
};

/**
 * Function: getOffset
 *
 * Returns the offset for the specified container as an <mxPoint>. The
 * offset is the distance from the top left corner of the container to the
 * top left corner of the document.
 *
 * Parameters:
 *
 * container - DOM node to return the offset for.
 * scollOffset - Optional boolean to add the scroll offset of the document.
 * Default is false.
 */
export const getOffset = (container, scrollOffset) => {
  let offsetLeft = 0;
  let offsetTop = 0;

  // Ignores document scroll origin for fixed elements
  let fixed = false;
  let node = container;
  const b = document.body;
  const d = document.documentElement;

  while (isSet(node) && node !== b && node !== d && !fixed) {
    const style = getCurrentStyle(node);

    if (isSet(style)) {
      fixed = fixed || style.position == 'fixed';
    }

    node = node.parentNode;
  }

  if (!scrollOffset && !fixed) {
    const offset = getDocumentScrollOrigin(container.ownerDocument);
    offsetLeft += offset.getX();
    offsetTop += offset.getX();
  }

  const r = container.getBoundingClientRect();

  if (isSet(r)) {
    offsetLeft += r.left;
    offsetTop += r.top;
  }

  return Point(offsetLeft, offsetTop);
};

/**
 * Function: getDocumentScrollOrigin
 *
 * Returns the scroll origin of the given document or the current document
 * if no document is given.
 */
export const getDocumentScrollOrigin = (doc) => {
  const wnd = doc.defaultView || doc.parentWindow;

  const x =
    isSet(wnd) && isSet(window.pageXOffset)
      ? window.pageXOffset
      : (document.documentElement || document.body.parentNode || document.body)
          .scrollLeft;
  const y =
    isSet(wnd) && isSet(window.pageYOffset)
      ? window.pageYOffset
      : (document.documentElement || document.body.parentNode || document.body)
          .scrollTop;

  return Point(x, y);
};

/**
 * Function: getScrollOrigin
 *
 * Returns the top, left corner of the viewrect as an <mxPoint>.
 *
 * Parameters:
 *
 * node - DOM node whose scroll origin should be returned.
 * includeAncestors - Whether the scroll origin of the ancestors should be
 * included. Default is false.
 * includeDocument - Whether the scroll origin of the document should be
 * included. Default is true.
 */
export const getScrollOrigin = (
  node,
  includeAncestors = false,
  includeDocument = true
) => {
  const doc = isSet(node) ? node.ownerDocument : document;
  const b = doc.body;
  const d = doc.documentElement;
  const result = new mxPoint();
  let fixed = false;

  while (isSe(node) && node !== b && node !== d) {
    if (!isNaN(node.scrollLeft) && !isNaN(node.scrollTop)) {
      result.setX(result.getX() + node.scrollLeft);
      result.setY(result.getY() + node.scrollTop);
    }

    var style = mxUtils.getCurrentStyle(node);

    if (isSet(style)) {
      fixed = fixed || style.position == 'fixed';
    }

    node = includeAncestors ? node.parentNode : null;
  }

  if (!fixed && includeDocument) {
    const origin = getDocumentScrollOrigin(doc);

    result.setX(result.getX() + origin.getX());
    result.setY(result.getY() + origin.getY());
  }

  return result;
};

/**
 * Function: convertPoint
 *
 * Converts the specified point (x, y) using the offset of the specified
 * container and returns a new <mxPoint> with the result.
 *
 * (code)
 * var pt = mxUtils.convertPoint(graph.container,
 *   mxEvent.getClientX(evt), mxEvent.getClientY(evt));
 * (end)
 *
 * Parameters:
 *
 * container - DOM node to use for the offset.
 * x - X-coordinate of the point to be converted.
 * y - Y-coordinate of the point to be converted.
 */
export const convertPoint = (container, x, y) => {
  const origin = getScrollOrigin(container, false);
  const offset = getOffset(container);

  offset.setX(offset.getX() - origin.getX());
  offset.setY(offset.getY() - origin.getY());

  return Point(x - offset.getX(), y - offset.getY());
};

/**
 * Function: isNumeric
 *
 * Returns true if the specified value is numeric, that is, if it is not
 * null, not an empty string, not a HEX number and isNaN returns false.
 *
 * Parameters:
 *
 * n - String representing the possibly numeric value.
 */
export const isNumeric = (n) =>
  !isNaN(parseFloat(n)) &&
  isFinite(n) &&
  (typeof n !== 'string' || n.toLowerCase().indexOf('0x') < 0);

/**
 * Function: isInteger
 *
 * Returns true if the given value is an valid integer number.
 *
 * Parameters:
 *
 * n - String representing the possibly numeric value.
 */
export const isInteger = (() => {
  if (Number.isInteger) return (n) => Number.isInteger(n);
  else return (n) => String(parseInt(n)) === String(n);
})();

/**
 * Function: mod
 *
 * Returns the remainder of division of n by m. You should use this instead
 * of the built-in operation as the built-in operation does not properly
 * handle negative numbers.
 */
export const mod = (n, m) => ((n % m) + m) % m;

/**
 * Function: intersection
 *
 * Returns the intersection of two lines as an <mxPoint>.
 *
 * Parameters:
 *
 * x0 - X-coordinate of the first line's startpoint.
 * y0 - X-coordinate of the first line's startpoint.
 * x1 - X-coordinate of the first line's endpoint.
 * y1 - Y-coordinate of the first line's endpoint.
 * x2 - X-coordinate of the second line's startpoint.
 * y2 - Y-coordinate of the second line's startpoint.
 * x3 - X-coordinate of the second line's endpoint.
 * y3 - Y-coordinate of the second line's endpoint.
 */
export const intersection = (x0, y0, x1, y1, x2, y2, x3, y3) => {
  const denom = (y3 - y2) * (x1 - x0) - (x3 - x2) * (y1 - y0);
  const nume_a = (x3 - x2) * (y0 - y2) - (y3 - y2) * (x0 - x2);
  const nume_b = (x1 - x0) * (y0 - y2) - (y1 - y0) * (x0 - x2);

  const ua = nume_a / denom;
  const ub = nume_b / denom;

  if (ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub <= 1.0) {
    // Get the intersection point
    const x = x0 + ua * (x1 - x0);
    const y = y0 + ua * (y1 - y0);

    return Point(x, y);
  }

  // No intersection
  return null;
};

/**
 * Function: ptSegDistSq
 *
 * Returns the square distance between a segment and a point. To get the
 * distance between a point and a line (with infinite length) use
 * <mxUtils.ptLineDist>.
 *
 * Parameters:
 *
 * x1 - X-coordinate of the startpoint of the segment.
 * y1 - Y-coordinate of the startpoint of the segment.
 * x2 - X-coordinate of the endpoint of the segment.
 * y2 - Y-coordinate of the endpoint of the segment.
 * px - X-coordinate of the point.
 * py - Y-coordinate of the point.
 */
export const ptSegDistSq = (x1, y1, x2, y2, px, py) => {
  x2 -= x1;
  y2 -= y1;

  px -= x1;
  py -= y1;

  let dotprod = px * x2 + py * y2;
  let projlenSq;

  if (dotprod <= 0.0) {
    projlenSq = 0.0;
  } else {
    px = x2 - px;
    py = y2 - py;
    dotprod = px * x2 + py * y2;

    if (dotprod <= 0.0) {
      projlenSq = 0.0;
    } else {
      projlenSq = (dotprod * dotprod) / (x2 * x2 + y2 * y2);
    }
  }

  let lenSq = px * px + py * py - projlenSq;

  if (lenSq < 0) {
    lenSq = 0;
  }

  return lenSq;
};

/**
 * Function: ptLineDist
 *
 * Returns the distance between a line defined by two points and a point.
 * To get the distance between a point and a segment (with a specific
 * length) use <mxUtils.ptSeqDistSq>.
 *
 * Parameters:
 *
 * x1 - X-coordinate of point 1 of the line.
 * y1 - Y-coordinate of point 1 of the line.
 * x2 - X-coordinate of point 1 of the line.
 * y2 - Y-coordinate of point 1 of the line.
 * px - X-coordinate of the point.
 * py - Y-coordinate of the point.
 */
export const ptLineDist = (x1, y1, x2, y2, px, py) =>
  Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) /
  Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));

/**
 * Function: relativeCcw
 *
 * Returns 1 if the given point on the right side of the segment, 0 if its
 * on the segment, and -1 if the point is on the left side of the segment.
 *
 * Parameters:
 *
 * x1 - X-coordinate of the startpoint of the segment.
 * y1 - Y-coordinate of the startpoint of the segment.
 * x2 - X-coordinate of the endpoint of the segment.
 * y2 - Y-coordinate of the endpoint of the segment.
 * px - X-coordinate of the point.
 * py - Y-coordinate of the point.
 */
export const relativeCcw = (x1, y1, x2, y2, px, py) => {
  x2 -= x1;
  y2 -= y1;
  px -= x1;
  py -= y1;
  let ccw = px * y2 - py * x2;

  if (ccw === 0.0) {
    ccw = px * x2 + py * y2;

    if (ccw > 0.0) {
      px -= x2;
      py -= y2;
      ccw = px * x2 + py * y2;

      if (ccw < 0.0) {
        ccw = 0.0;
      }
    }
  }

  return ccw < 0.0 ? -1 : ccw > 0.0 ? 1 : 0;
};

/**
 * Function: setOpacity
 *
 * Sets the opacity of the specified DOM node to the given value in %.
 *
 * Parameters:
 *
 * node - DOM node to set the opacity for.
 * value - Opacity in %. Possible values are between 0 and 100.
 */
export const setOpacity = (node, value) => (node.style.opacity = value / 100);

/**
 * Function: createImage
 *
 * Creates and returns an image (IMG node) or VML image (v:image) in IE6 in
 * quirks mode.
 *
 * Parameters:
 *
 * src - URL that points to the image to be displayed.
 */
export const createImage = (src) => {
  imageNode = document.createElement('img');
  imageNode.setAttribute('src', src);
  imageNode.setAttribute('border', '0');

  return imageNode;
};

/**
 * Function: sortCells
 *
 * Sorts the given cells according to the order in the cell hierarchy.
 * Ascending is optional and defaults to true.
 */
export const sortCells = (cells, ascending = true) => {
  const lookup = Dictionary();

  cells.sort((o1, o2) => {
    let p1 = lookup.get(o1);

    if (isUnset(p1)) {
      p1 = CellPath.create(o1).split(CellPath.PATH_SEPARATOR);
      lookup.put(o1, p1);
    }

    let p2 = lookup.get(o2);

    if (isUnset(p2)) {
      p2 = CellPath.create(o2).split(CellPath.PATH_SEPARATOR);
      lookup.put(o2, p2);
    }

    var comp = CellPath.compare(p1, p2);

    return comp === 0 ? 0 : comp > 0 == ascending ? 1 : -1;
  });

  return cells;
};

/**
 * Function: getStylename
 *
 * Returns the stylename in a style of the form [(stylename|key=value);] or
 * an empty string if the given style does not contain a stylename.
 *
 * Parameters:
 *
 * style - String of the form [(stylename|key=value);].
 */
export const getStylename = (style) => {
  if (isSet(style)) {
    const pairs = style.split(';');
    const stylename = pairs[0];

    if (stylename.indexOf('=') < 0) {
      return stylename;
    }
  }

  return '';
};

/**
 * Function: getStylenames
 *
 * Returns the stylenames in a style of the form [(stylename|key=value);]
 * or an empty array if the given style does not contain any stylenames.
 *
 * Parameters:
 *
 * style - String of the form [(stylename|key=value);].
 */
export const getStylenames = (style) => {
  const result = [];

  if (isSet(style)) {
    const pairs = style.split(';');

    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i].indexOf('=') < 0) {
        result.push(pairs[i]);
      }
    }
  }

  return result;
};

/**
 * Function: indexOfStylename
 *
 * Returns the index of the given stylename in the given style. This
 * returns -1 if the given stylename does not occur (as a stylename) in the
 * given style, otherwise it returns the index of the first character.
 */
export const indexOfStylename = (style, stylename) => {
  if (style != null && stylename != null) {
    const tokens = style.split(';');
    let pos = 0;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] == stylename) {
        return pos;
      }

      pos += tokens[i].length + 1;
    }
  }

  return -1;
};

/**
 * Function: addStylename
 *
 * Adds the specified stylename to the given style if it does not already
 * contain the stylename.
 */
export const addStylename = (style, stylename) => {
  if (indexOfStylename(style, stylename) < 0) {
    if (isUnset(style)) {
      style = '';
    } else if (style.length > 0 && style.charAt(style.length - 1) !== ';') {
      style += ';';
    }

    style += stylename;
  }

  return style;
};

/**
 * Function: removeStylename
 *
 * Removes all occurrences of the specified stylename in the given style
 * and returns the updated style. Trailing semicolons are not preserved.
 */
export const removeStylename = (style, stylename) => {
  const result = [];

  if (isSet(style)) {
    const tokens = style.split(';');

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] !== stylename) {
        result.push(tokens[i]);
      }
    }
  }

  return result.join(';');
};

/**
 * Function: removeAllStylenames
 *
 * Removes all stylenames from the given style and returns the updated
 * style.
 */
export const removeAllStylenames = (style) => {
  const result = [];

  if (isSet(style)) {
    const tokens = style.split(';');

    for (let i = 0; i < tokens.length; i++) {
      // Keeps the key, value assignments
      if (tokens[i].indexOf('=') >= 0) {
        result.push(tokens[i]);
      }
    }
  }

  return result.join(';');
};

/**
 * Function: setCellStyles
 *
 * Assigns the value for the given key in the styles of the given cells, or
 * removes the key from the styles if the value is null.
 *
 * Parameters:
 *
 * model - <mxGraphModel> to execute the transaction in.
 * cells - Array of <mxCells> to be updated.
 * key - Key of the style to be changed.
 * value - New value for the given key.
 */
export const setCellStyles = (model, cells, key, value) => {
  if (isSet(cells) && cells.length > 0) {
    model.beginUpdate();
    try {
      for (let i = 0; i < cells.length; i++) {
        if (isSet(cells[i])) {
          const style = setStyle(model.getStyle(cells[i]), key, value);
          model.setStyle(cells[i], style);
        }
      }
    } finally {
      model.endUpdate();
    }
  }
};

/**
 * Function: setStyle
 *
 * Adds or removes the given key, value pair to the style and returns the
 * new style. If value is null or zero length then the key is removed from
 * the style. This is for cell styles, not for CSS styles.
 *
 * Parameters:
 *
 * style - String of the form [(stylename|key=value);].
 * key - Key of the style to be changed.
 * value - New value for the given key.
 */
export const setStyle = (style, key, value) => {
  const isValue =
    isSet(value) && (typeof value.length === 'undefined' || value.length > 0);

  if (isUnset(style) || style.length === 0) {
    if (isValue) {
      style = key + '=' + value + ';';
    }
  } else {
    if (style.substring(0, key.length + 1) === key + '=') {
      const next = style.indexOf(';');

      if (isValue) {
        style = key + '=' + value + (next < 0 ? ';' : style.substring(next));
      } else {
        style =
          next < 0 || next === style.length - 1
            ? ''
            : style.substring(next + 1);
      }
    } else {
      const index = style.indexOf(';' + key + '=');

      if (index < 0) {
        if (isValue) {
          const sep = style.charAt(style.length - 1) === ';' ? '' : ';';
          style = style + sep + key + '=' + value + ';';
        }
      } else {
        const next = style.indexOf(';', index + 1);

        if (isValue) {
          style =
            style.substring(0, index + 1) +
            key +
            '=' +
            value +
            (next < 0 ? ';' : style.substring(next));
        } else {
          style =
            style.substring(0, index) +
            (next < 0 ? ';' : style.substring(next));
        }
      }
    }
  }

  return style;
};

/**
 * Function: setCellStyleFlags
 *
 * Sets or toggles the flag bit for the given key in the cell's styles.
 * If value is null then the flag is toggled.
 *
 * Example:
 *
 * (code)
 * var cells = graph.getSelectionCells();
 * mxUtils.setCellStyleFlags(graph.model,
 * 			cells,
 * 			mxConstants.STYLE_FONTSTYLE,
 * 			mxConstants.FONT_BOLD);
 * (end)
 *
 * Toggles the bold font style.
 *
 * Parameters:
 *
 * model - <mxGraphModel> that contains the cells.
 * cells - Array of <mxCells> to change the style for.
 * key - Key of the style to be changed.
 * flag - Integer for the bit to be changed.
 * value - Optional boolean value for the flag.
 */
export const setCellStyleFlags = (model, cells, key, flag, value) => {
  if (isSet(cells) && cells.length > 0) {
    model.beginUpdate();
    try {
      for (let i = 0; i < cells.length; i++) {
        if (isSet(cells[i])) {
          const style = setStyleFlag(
            model.getStyle(cells[i]),
            key,
            flag,
            value
          );
          model.setStyle(cells[i], style);
        }
      }
    } finally {
      model.endUpdate();
    }
  }
};

/**
 * Function: setStyleFlag
 *
 * Sets or removes the given key from the specified style and returns the
 * new style. If value is null then the flag is toggled.
 *
 * Parameters:
 *
 * style - String of the form [(stylename|key=value);].
 * key - Key of the style to be changed.
 * flag - Integer for the bit to be changed.
 * value - Optional boolean value for the given flag.
 */
export const setStyleFlag = (style, key, flag, value) => {
  if (isUnset(style) || style.length == 0) {
    if (value || value === null) {
      style = key + '=' + flag;
    } else {
      style = key + '=0';
    }
  } else {
    const index = style.indexOf(key + '=');

    if (index < 0) {
      var sep = style.charAt(style.length - 1) === ';' ? '' : ';';

      if (value || value === null) {
        style = style + sep + key + '=' + flag;
      } else {
        style = style + sep + key + '=0';
      }
    } else {
      const cont = style.indexOf(';', index);
      let tmp = '';

      if (cont < 0) {
        tmp = style.substring(index + key.length + 1);
      } else {
        tmp = style.substring(index + key.length + 1, cont);
      }

      if (value === null) {
        tmp = parseInt(tmp) ^ flag;
      } else if (value) {
        tmp = parseInt(tmp) | flag;
      } else {
        tmp = parseInt(tmp) & ~flag;
      }

      style =
        style.substring(0, index) +
        key +
        '=' +
        tmp +
        (cont >= 0 ? style.substring(cont) : '');
    }
  }

  return style;
};

/**
 * Function: getAlignmentAsPoint
 *
 * Returns an <mxPoint> that represents the horizontal and vertical alignment
 * for numeric computations. X is -0.5 for center, -1 for right and 0 for
 * left alignment. Y is -0.5 for middle, -1 for bottom and 0 for top
 * alignment. Default values for missing arguments is top, left.
 */
export const getAlignmentAsPoint = (align, valign) => {
  let dx = -0.5;
  let dy = -0.5;

  // Horizontal alignment
  if (align === ALIGN_LEFT) {
    dx = 0;
  } else if (align === ALIGN_RIGHT) {
    dx = -1;
  }

  // Vertical alignment
  if (valign === ALIGN_TOP) {
    dy = 0;
  } else if (valign === ALIGN_BOTTOM) {
    dy = -1;
  }

  return Point(dx, dy);
};

/**
 * Function: getSizeForString
 *
 * Returns an <mxRectangle> with the size (width and height in pixels) of
 * the given string. The string may contain HTML markup. Newlines should be
 * converted to <br> before calling this method. The caller is responsible
 * for sanitizing the HTML markup.
 *
 * Example:
 *
 * (code)
 * var label = graph.getLabel(cell).replace(/\n/g, "<br>");
 * var size = graph.getSizeForString(label);
 * (end)
 *
 * Parameters:
 *
 * text - String whose size should be returned.
 * fontSize - Integer that specifies the font size in pixels. Default is
 * <mxConstants.DEFAULT_FONTSIZE>.
 * fontFamily - String that specifies the name of the font family. Default
 * is <mxConstants.DEFAULT_FONTFAMILY>.
 * textWidth - Optional width for text wrapping.
 * fontStyle - Optional font style.
 */
export const getSizeForString = (
  text,
  fontSize = DEFAULT_FONTSIZE,
  fontFamily = DEFAULT_FONTFAMILY,
  textWidth,
  fontStyle
) => {
  const div = document.createElement('div');

  // Sets the font size and family
  div.style.fontFamily = fontFamily;
  div.style.fontSize = Math.round(fontSize) + 'px';
  div.style.lineHeight = Math.round(fontSize * LINE_HEIGHT) + 'px';

  // Sets the font style
  if (isSet(fontStyle)) {
    if ((fontStyle & FONT_BOLD) == FONT_BOLD) {
      div.style.fontWeight = 'bold';
    }

    if ((fontStyle & FONT_ITALIC) == FONT_ITALIC) {
      div.style.fontStyle = 'italic';
    }

    const txtDecor = [];

    if ((fontStyle & FONT_UNDERLINE) == FONT_UNDERLINE) {
      txtDecor.push('underline');
    }

    if ((fontStyle & FONT_STRIKETHROUGH) == FONT_STRIKETHROUGH) {
      txtDecor.push('line-through');
    }

    if (txtDecor.length > 0) {
      div.style.textDecoration = txtDecor.join(' ');
    }
  }

  // Disables block layout and outside wrapping and hides the div
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.display = 'inline-block';
  div.style.zoom = '1';

  if (isSet(textWidth)) {
    div.style.width = textWidth + 'px';
    div.style.whiteSpace = 'normal';
  } else {
    div.style.whiteSpace = 'nowrap';
  }

  // Adds the text and inserts into DOM for updating of size
  div.innerHTML = text;
  document.body.appendChild(div);

  // Gets the size and removes from DOM
  const size = Rectangle(0, 0, div.offsetWidth, div.offsetHeight);
  document.body.removeChild(div);

  return size;
};

/**
 * Function: getViewXml
 */
export const getViewXml = (graph, scale = 1, cells, x0 = 0, y0 = 0) => {
  if (isUnset(cells)) {
    const model = graph.getModel();
    cells = [model.getRoot()];
  }

  const view = graph.getView();
  let result = null;

  // Disables events on the view
  const eventsEnabled = view.isEventsEnabled();
  view.setEventsEnabled(false);

  // Workaround for label bounds not taken into account for image export.
  // Creates a temporary draw pane which is used for rendering the text.
  // Text rendering is required for finding the bounds of the labels.
  const drawPane = view.getDrawPane();
  const overlayPane = view.getOverlayPane();

  if (graph.getDialect() === DIALECT_SVG) {
    view.setDrawPane(document.createElementNS(NS_SVG, 'g'));
    view.getCanvas().appendChild(view.getDrawPane());

    // Redirects cell overlays into temporary container
    view.setOverlayPane(document.createElementNS(NS_SVG, 'g'));
    view.getCanvas().appendChild(view.getOverlayPane());
  } else {
    view.setDrawPane(view.getDrawPane().cloneNode(false));
    view.getCanvas().appendChild(view.getDrawPane());

    // Redirects cell overlays into temporary container
    view.setOverlayPane(view.getOverlayPane().cloneNode(false));
    view.getCanvas().appendChild(view.getOverlayPane());
  }

  // Resets the translation
  const translate = view.getTranslate();
  view.translate = Point(x0, y0);

  // Creates the temporary cell states in the view
  const temp = TemporaryCellStates(graph.getView(), scale, cells);

  try {
    const enc = new mxCodec();
    result = enc.encode(graph.getView());
  } finally {
    temp.destroy();
    view.setTranslate(translate);
    view.getCanvas().removeChild(view.getDrawPane());
    view.getCanvas().removeChild(view.getOverlayPane());
    view.setDrawPane(drawPane);
    view.setOverlayPane(overlayPane);
    view.setEventsEnabled(eventsEnabled);
  }

  return result;
};

/**
 * Function: getScaleForPageCount
 *
 * Returns the scale to be used for printing the graph with the given
 * bounds across the specifies number of pages with the given format. The
 * scale is always computed such that it given the given amount or fewer
 * pages in the print output. See <mxPrintPreview> for an example.
 *
 * Parameters:
 *
 * pageCount - Specifies the number of pages in the print output.
 * graph - <mxGraph> that should be printed.
 * pageFormat - Optional <mxRectangle> that specifies the page format.
 * Default is <mxConstants.PAGE_FORMAT_A4_PORTRAIT>.
 * border - The border along each side of every page.
 */
export const getScaleForPageCount = (
  pageCount,
  graph,
  pageFormat = PAGE_FORMAT_A4_PORTRAIT,
  border = 0
) => {
  if (pageCount < 1) {
    // We can't work with less than 1 page, return no scale
    // change
    return 1;
  }

  const availablePageWidth = pageFormat.getWidth() - border * 2;
  const availablePageHeight = pageFormat.getHeight() - border * 2;

  // Work out the number of pages required if the
  // graph is not scaled.
  const graphBounds = graph.getGraphBounds().clone();
  const sc = graph.getView().getScale();
  graphBounds.setWidth(graphBounds.getWidth() / sc);
  graphBounds.setHeight(graphBounds.getHeight() / sc);
  const graphWidth = graphBounds.getWidth;
  const graphHeight = graphBounds.getHeight;

  let scale = 1;

  // The ratio of the width/height for each printer page
  const pageFormatAspectRatio = availablePageWidth / availablePageHeight;
  // The ratio of the width/height for the graph to be printer
  const graphAspectRatio = graphWidth / graphHeight;

  // The ratio of horizontal pages / vertical pages for this
  // graph to maintain its aspect ratio on this page format
  const pagesAspectRatio = graphAspectRatio / pageFormatAspectRatio;

  // Factor the square root of the page count up and down
  // by the pages aspect ratio to obtain a horizontal and
  // vertical page count that adds up to the page count
  // and has the correct aspect ratio
  const pageRoot = Math.sqrt(pageCount);
  const pagesAspectRatioSqrt = Math.sqrt(pagesAspectRatio);
  let numRowPages = pageRoot * pagesAspectRatioSqrt;
  let numColumnPages = pageRoot / pagesAspectRatioSqrt;

  // These value are rarely more than 2 rounding downs away from
  // a total that meets the page count. In cases of one being less
  // than 1 page, the other value can be too high and take more iterations
  // In this case, just change that value to be the page count, since
  // we know the other value is 1
  if (numRowPages < 1 && numColumnPages > pageCount) {
    const scaleChange = numColumnPages / pageCount;
    numColumnPages = pageCount;
    numRowPages /= scaleChange;
  }

  if (numColumnPages < 1 && numRowPages > pageCount) {
    const scaleChange = numRowPages / pageCount;
    numRowPages = pageCount;
    numColumnPages /= scaleChange;
  }

  const currentTotalPages = Math.ceil(numRowPages) * Math.ceil(numColumnPages);

  let numLoops = 0;

  // Iterate through while the rounded up number of pages comes to
  // a total greater than the required number
  while (currentTotalPages > pageCount) {
    // Round down the page count (rows or columns) that is
    // closest to its next integer down in percentage terms.
    // i.e. Reduce the page total by reducing the total
    // page area by the least possible amount

    let roundRowDownProportion = Math.floor(numRowPages) / numRowPages;
    let roundColumnDownProportion = Math.floor(numColumnPages) / numColumnPages;

    // If the round down proportion is, work out the proportion to
    // round down to 1 page less
    if (roundRowDownProportion == 1) {
      roundRowDownProportion = Math.floor(numRowPages - 1) / numRowPages;
    }
    if (roundColumnDownProportion == 1) {
      roundColumnDownProportion =
        Math.floor(numColumnPages - 1) / numColumnPages;
    }

    // Check which rounding down is smaller, but in the case of very small roundings
    // try the other dimension instead
    let scaleChange = 1;

    // Use the higher of the two values
    if (roundRowDownProportion > roundColumnDownProportion) {
      scaleChange = roundRowDownProportion;
    } else {
      scaleChange = roundColumnDownProportion;
    }

    numRowPages = numRowPages * scaleChange;
    numColumnPages = numColumnPages * scaleChange;
    currentTotalPages = Math.ceil(numRowPages) * Math.ceil(numColumnPages);

    numLoops++;

    if (numLoops > 10) {
      break;
    }
  }

  // Work out the scale from the number of row pages required
  // The column pages will give the same value
  const posterWidth = availablePageWidth * numRowPages;
  scale = posterWidth / graphWidth;

  // Allow for rounding errors
  return scale * 0.99999;
};

/**
 * Function: show
 *
 * Copies the styles and the markup from the graph's container into the
 * given document and removes all cursor styles. The document is returned.
 *
 * This function should be called from within the document with the graph.
 * If you experience problems with missing stylesheets in IE then try adding
 * the domain to the trusted sites.
 *
 * Parameters:
 *
 * graph - <mxGraph> to be copied.
 * doc - Document where the new graph is created.
 * x0 - X-coordinate of the graph view origin. Default is 0.
 * y0 - Y-coordinate of the graph view origin. Default is 0.
 * w - Optional width of the graph view.
 * h - Optional height of the graph view.
 */
export const show = (graph, doc, x0 = 0, y0 = 0, w, h) => {
  if (isUnset(doc)) {
    const wnd = window.open();
    doc = wnd.document;
  } else {
    doc.open();
  }

  const bounds = graph.getGraphBounds();
  const dx = Math.ceil(x0 - bounds.getX());
  const dy = Math.ceil(y0 - bounds.getY());

  if (isUnset(w)) {
    w =
      Math.ceil(bounds.getWidth() + x0) +
      Math.ceil(Math.ceil(bounds.getX()) - bounds.getX());
  }

  if (isUnset(h)) {
    h =
      Math.ceil(bounds.getHeight() + y0) +
      Math.ceil(Math.ceil(bounds.getY()) - bounds.getY());
  }

  doc.writeln('<html><head>');

  const base = document.getElementsByTagName('base');

  for (let i = 0; i < base.length; i++) {
    doc.writeln(mxUtils.getOuterHtml(base[i]));
  }

  const links = document.getElementsByTagName('link');

  for (let i = 0; i < links.length; i++) {
    doc.writeln(mxUtils.getOuterHtml(links[i]));
  }

  const styles = document.getElementsByTagName('style');

  for (let i = 0; i < styles.length; i++) {
    doc.writeln(mxUtils.getOuterHtml(styles[i]));
  }

  doc.writeln('</head><body style="margin:0px;"></body></html>');
  doc.close();

  const outer = doc.createElement('div');
  outer.position = 'absolute';
  outer.overflow = 'hidden';
  outer.style.width = w + 'px';
  outer.style.height = h + 'px';

  // Required for HTML labels if foreignObjects are disabled
  const div = doc.createElement('div');
  div.style.position = 'absolute';
  div.style.left = dx + 'px';
  div.style.top = dy + 'px';

  const node = graph.getContainer().firstChild;
  let svg = null;

  while (isSet(node)) {
    const clone = node.cloneNode(true);

    if (node === graph.getView().getDrawPane().getOwnerSVGElement()) {
      outer.appendChild(clone);
      svg = clone;
    } else {
      div.appendChild(clone);
    }

    node = node.nextSibling;
  }

  doc.body.appendChild(outer);

  if (isSet(div.firstChild)) {
    doc.body.appendChild(div);
  }

  if (isSet(svg)) {
    svg.style.minWidth = '';
    svg.style.minHeight = '';
    svg.firstChild.setAttribute(
      'transform',
      'translate(' + dx + ',' + dy + ')'
    );
  }

  removeCursors(doc.body);

  return doc;
};

/**
 * Function: printScreen
 *
 * Prints the specified graph using a new window and the built-in print
 * dialog.
 *
 * This function should be called from within the document with the graph.
 *
 * Parameters:
 *
 * graph - <mxGraph> to be printed.
 */
export const printScreen = (graph) => {
  const wnd = window.open();

  show(graph, wnd.document);

  const print = function () {
    wnd.focus();
    wnd.print();
    wnd.close();
  };

  // Workaround for Google Chrome which needs a bit of a
  // delay in order to render the SVG contents
  if (IS_GC) {
    wnd.setTimeout(print, 500);
  } else {
    print();
  }
};

/**
 * Function: popup
 *
 * Shows the specified text content in a new <mxWindow> or a new browser
 * window if isInternalWindow is false.
 *
 * Parameters:
 *
 * content - String that specifies the text to be displayed.
 * isInternalWindow - Optional boolean indicating if an mxWindow should be
 * used instead of a new browser window. Default is false.
 */
export const popup = (content, isInternalWindow) => {
  if (isInternalWindow) {
    const div = document.createElement('div');

    div.style.overflow = 'scroll';
    div.style.width = '636px';
    div.style.height = '460px';

    const pre = document.createElement('pre');
    pre.innerHTML = htmlEntities(content, false)
      .replace(/\n/g, '<br>')
      .replace(/ /g, '&nbsp;');

    div.appendChild(pre);

    const w = document.body.clientWidth;
    const h = Math.max(
      document.body.clientHeight || 0,
      document.documentElement.clientHeight
    );
    const wnd = Window(
      'Popup Window',
      div,
      w / 2 - 320,
      h / 2 - 240,
      640,
      480,
      false,
      true
    );

    wnd.setClosable(true);
    wnd.setVisible(true);
  } else {
    // Wraps up the XML content in a textarea
    if (mxClient.IS_NS) {
      const wnd = window.open();
      wnd.document.writeln('<pre>' + mxUtils.htmlEntities(content) + '</pre>');
      wnd.document.close();
    } else {
      const wnd = window.open();
      const pre = wnd.document.createElement('pre');
      pre.innerHTML = mxUtils
        .htmlEntities(content, false)
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
      wnd.document.body.appendChild(pre);
    }
  }
};

/**
 * Function: error
 *
 * Displays the given error message in a new <mxWindow> of the given width.
 * If close is true then an additional close button is added to the window.
 * The optional icon specifies the icon to be used for the window. Default
 * is <mxUtils.errorImage>.
 *
 * Parameters:
 *
 * message - String specifying the message to be displayed.
 * width - Integer specifying the width of the window.
 * close - Optional boolean indicating whether to add a close button.
 * icon - Optional icon for the window decoration.
 */
export const error = (message, width, close, icon) => {
  const div = document.createElement('div');
  div.style.padding = '20px';

  const img = document.createElement('img');
  img.setAttribute('src', icon || imageBasePath + '/error.gif');
  img.setAttribute('valign', 'bottom');
  img.style.verticalAlign = 'middle';
  div.appendChild(img);

  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  write(div, message);

  const w = document.body.clientWidth;
  const h = document.body.clientHeight || document.documentElement.clientHeight;
  const warn = Window(
    'error',
    div,
    (w - width) / 2,
    h / 4,
    width,
    null,
    false,
    true
  );

  if (close) {
    br(div);

    const tmp = document.createElement('p');
    const button = document.createElement('button');

    button.setAttribute('style', 'float:right');

    Event.addListener(button, 'click', (evt) => warn.destroy());

    write(button, 'close');

    tmp.appendChild(button);
    div.appendChild(tmp);

    br(div);

    warn.setClosable(true);
  }

  warn.setVisible(true);

  return warn;
};

/**
 * Function: makeDraggable
 *
 * Configures the given DOM element to act as a drag source for the
 * specified graph. Returns a a new <mxDragSource>. If
 * <mxDragSource.guideEnabled> is enabled then the x and y arguments must
 * be used in funct to match the preview location.
 *
 * Example:
 *
 * (code)
 * var funct = function(graph, evt, cell, x, y)
 * {
 *   if (graph.canImportCell(cell))
 *   {
 *     var parent = graph.getDefaultParent();
 *     var vertex = null;
 *
 *     graph.getModel().beginUpdate();
 *     try
 *     {
 * 	     vertex = graph.insertVertex(parent, null, 'Hello', x, y, 80, 30);
 *     }
 *     finally
 *     {
 *       graph.getModel().endUpdate();
 *     }
 *
 *     graph.setSelectionCell(vertex);
 *   }
 * }
 *
 * var img = document.createElement('img');
 * img.setAttribute('src', 'editors/images/rectangle.gif');
 * img.style.position = 'absolute';
 * img.style.left = '0px';
 * img.style.top = '0px';
 * img.style.width = '16px';
 * img.style.height = '16px';
 *
 * var dragImage = img.cloneNode(true);
 * dragImage.style.width = '32px';
 * dragImage.style.height = '32px';
 * mxUtils.makeDraggable(img, graph, funct, dragImage);
 * document.body.appendChild(img);
 * (end)
 *
 * Parameters:
 *
 * element - DOM element to make draggable.
 * graphF - <mxGraph> that acts as the drop target or a function that takes a
 * mouse event and returns the current <mxGraph>.
 * funct - Function to execute on a successful drop.
 * dragElement - Optional DOM node to be used for the drag preview.
 * dx - Optional horizontal offset between the cursor and the drag
 * preview.
 * dy - Optional vertical offset between the cursor and the drag
 * preview.
 * autoscroll - Optional boolean that specifies if autoscroll should be
 * used. Default is mxGraph.autoscroll.
 * scalePreview - Optional boolean that specifies if the preview element
 * should be scaled according to the graph scale. If this is true, then
 * the offsets will also be scaled. Default is false.
 * highlightDropTargets - Optional boolean that specifies if dropTargets
 * should be highlighted. Default is true.
 * getDropTarget - Optional function to return the drop target for a given
 * location (x, y). Default is mxGraph.getCellAt.
 */
export const makeDraggable = (
  element,
  graphF,
  funct,
  dragElement,
  dx,
  dy,
  autoscroll,
  scalePreview,
  highlightDropTargets,
  getDropTarget
) => {
  const dragSource = DragSource(element, funct);
  dragSource.setDragOffset(
    Point(isSet(dx) ? dx : 0, isSet(dy) ? dy : TOOLTIP_VERTICAL_OFFSET)
  );
  dragSource.setAutoscroll(autoscroll);

  // Cannot enable this by default. This needs to be enabled in the caller
  // if the funct argument uses the new x- and y-arguments.
  dragSource.setGuidesEnabled(false);

  if (isSet(highlightDropTargets)) {
    dragSource.setHighlightDropTargets(highlightDropTargets);
  }

  // Overrides function to find drop target cell
  if (isSet(getDropTarget)) {
    dragSource.getDropTarget = getDropTarget;
  }

  // Overrides function to get current graph
  dragSource.getGraphForEvent = (evt) =>
    typeof graphF == 'function' ? graphF(evt) : graphF;

  // Translates switches into dragSource customizations
  if (isSet(dragElement)) {
    dragSource.createDragElement = () => dragElement.cloneNode(true);

    if (scalePreview) {
      dragSource.createPreviewElement = (graph) => {
        const elt = dragElement.cloneNode(true);

        const w = parseInt(elt.style.width);
        const h = parseInt(elt.style.height);
        elt.style.width = Math.round(w * graph.getView().getScale()) + 'px';
        elt.style.height = Math.round(h * graph.getView().getScale()) + 'px';

        return elt;
      };
    }
  }

  return dragSource;
};
