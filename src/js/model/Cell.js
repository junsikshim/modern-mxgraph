/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isUnset, withConstructor } from '../Helpers';

/**
 * Class: Cell
 *
 * Cells are the elements of the graph model. They represent the state
 * of the groups, vertices and edges in a graph.
 *
 * Custom attributes:
 *
 * For custom attributes we recommend using an XML node as the value of a cell.
 * The following code can be used to create a cell with an XML node as the
 * value:
 *
 * (code)
 * var doc = Utils.createXmlDocument();
 * var node = doc.createElement('MyNode')
 * node.setAttribute('label', 'MyLabel');
 * node.setAttribute('attribute1', 'value1');
 * graph.insertVertex(graph.getDefaultParent(), null, node, 40, 40, 80, 30);
 * (end)
 *
 * For the label to work, <Graph.convertValueToString> and
 * <Graph.cellLabelChanged> should be overridden as follows:
 *
 * (code)
 * graph.convertValueToString = function(cell)
 * {
 *   if (Utils.isNode(cell.value))
 *   {
 *     return cell.getAttribute('label', '')
 *   }
 * };
 *
 * var cellLabelChanged = graph.cellLabelChanged;
 * graph.cellLabelChanged = function(cell, newValue, autoSize)
 * {
 *   if (Utils.isNode(cell.value))
 *   {
 *     // Clones the value for correct undo/redo
 *     var elt = cell.value.cloneNode(true);
 *     elt.setAttribute('label', newValue);
 *     newValue = elt;
 *   }
 *
 *   cellLabelChanged.apply(this, arguments);
 * };
 * (end)
 *
 * Callback: onInit
 *
 * Called from within the constructor.
 *
 * Constructor: Cell
 *
 * Constructs a new cell to be used in a graph model.
 * This method invokes <onInit> upon completion.
 *
 * Parameters:
 *
 * value - Optional object that represents the cell value.
 * geometry - Optional <Geometry> that specifies the geometry.
 * style - Optional formatted string that defines the style.
 */
const Cell = (value, geometry, style) => {
  /**
   * Variable: value
   *
   * Holds the user object. Default is null.
   */
  const [getValue, setValue] = addProp(value);

  /**
   * Variable: geometry
   *
   * Holds the <Geometry>. Default is null.
   */
  const [getGeometry, setGeometry] = addProp(geometry);

  /**
   * Variable: style
   *
   * Holds the style as a string of the form [(stylename|key=value);]. Default is
   * null.
   */
  const [getStyle, setStyle] = addProp(style);

  /**
   * Variable: id
   *
   * Holds the Id. Default is null.
   */
  const [getId, setId] = addProp();

  /**
   * Variable: vertex
   *
   * Specifies whether the cell is a vertex. Default is false.
   */
  const [isVertex, setVertex] = addProp(false);

  /**
   * Variable: edge
   *
   * Specifies whether the cell is an edge. Default is false.
   */
  const [isEdge, setEdge] = addProp(false);

  /**
   * Variable: connectable
   *
   * Specifies whether the cell is connectable. Default is true.
   */
  const [isConnectable, setConnectable] = addProp(true);

  /**
   * Variable: visible
   *
   * Specifies whether the cell is visible. Default is true.
   */
  const [isVisible, setVisible] = addProp(true);

  /**
   * Variable: collapsed
   *
   * Specifies whether the cell is collapsed. Default is false.
   */
  const [isCollapsed, setCollapsed] = addProp(false);

  /**
   * Variable: parent
   *
   * Reference to the parent cell.
   */
  const [getParent, setParent] = addProp();

  /**
   * Variable: source
   *
   * Reference to the source terminal.
   */
  const [getSource, setSource] = addProp();

  /**
   * Variable: target
   *
   * Reference to the target terminal.
   */
  const [getTarget, setTarget] = addProp();

  /**
   * Variable: children
   *
   * Holds the child cells.
   */
  const [getChildren, setChildren] = addProp([]);

  /**
   * Variable: edges
   *
   * Holds the edges.
   */
  const [getEdges, setEdges] = addProp([]);

  const [getOverlays, setOverlays] = addProp();

  /**
   * Function: valueChanged
   *
   * Changes the user object after an in-place edit
   * and returns the previous value. This implementation
   * replaces the user object with the given value and
   * returns the old user object.
   */
  const valueChanged = (newValue) => {
    const previous = getValue();
    setValue(newValue);

    return previous;
  };

  /**
   * Function: getTerminal
   *
   * Returns the source or target terminal.
   *
   * Parameters:
   *
   * source - Boolean that specifies if the source terminal should be
   * returned.
   */
  const getTerminal = (s) => (s ? getSource() : getTarget());

  /**
   * Function: setTerminal
   *
   * Sets the source or target terminal and returns the new terminal.
   *
   * Parameters:
   *
   * terminal - <Cell> that represents the new source or target terminal.
   * isSource - Boolean that specifies if the source or target terminal
   * should be set.
   */
  const setTerminal = (terminal, isSource) => {
    if (isSource) setSource(terminal);
    else setTarget(terminal);

    return terminal;
  };

  /**
   * Function: getChildCount
   *
   * Returns the number of child cells.
   */
  const getChildCount = () => getChildren().length;

  /**
   * Function: getIndex
   *
   * Returns the index of the specified child in the child array.
   *
   * Parameters:
   *
   * child - Child whose index should be returned.
   */
  const getIndex = (child) => getChildren().indexOf(child);

  /**
   * Function: getChildAt
   *
   * Returns the child at the specified index.
   *
   * Parameters:
   *
   * index - Integer that specifies the child to be returned.
   */
  const getChildAt = (index) => getChildren()[index];

  /**
   * Function: insert
   *
   * Inserts the specified child into the child array at the specified index
   * and updates the parent reference of the child. If not childIndex is
   * specified then the child is appended to the child array. Returns the
   * inserted child.
   *
   * Parameters:
   *
   * child - <Cell> to be inserted or appended to the child array.
   * index - Optional integer that specifies the index at which the child
   * should be inserted into the child array.
   */
  const insert = (child, index) => {
    if (!child) return;

    let i = index;

    if (isUnset(index)) {
      i = getChildCount();

      if (child.getParent() === me) i--;
    }

    child.removeFromParent();
    child.setParent(me);

    const children = getChildren();

    children.splice(i, 0, child);

    return child;
  };

  /**
   * Function: remove
   *
   * Removes the child at the specified index from the child array and
   * returns the child that was removed. Will remove the parent reference of
   * the child.
   *
   * Parameters:
   *
   * index - Integer that specifies the index of the child to be
   * removed.
   */
  const remove = (index) => {
    let child;
    const children = getChildren();

    if (children && index >= 0) {
      child = getChildAt(index);

      if (child) {
        children.splice(index, 1);
        child.setParent();
      }
    }

    return child;
  };

  /**
   * Function: removeFromParent
   *
   * Removes the cell from its parent.
   */
  const removeFromParent = () => {
    const parent = getParent();

    if (parent) {
      const index = parent.getIndex(me);
      parent.remove(index);
    }
  };

  /**
   * Function: getEdgeCount
   *
   * Returns the number of edges in the edge array.
   */
  const getEdgeCount = () => getEdges().length;

  /**
   * Function: getEdgeIndex
   *
   * Returns the index of the specified edge in <edges>.
   *
   * Parameters:
   *
   * edge - <Cell> whose index in <edges> should be returned.
   */
  const getEdgeIndex = (edge) => getEdges().indexOf(edge);

  /**
   * Function: getEdgeAt
   *
   * Returns the edge at the specified index in <edges>.
   *
   * Parameters:
   *
   * index - Integer that specifies the index of the edge to be returned.
   */
  const getEdgeAt = (index) => getEdges[index];

  /**
   * Function: insertEdge
   *
   * Inserts the specified edge into the edge array and returns the edge.
   * Will update the respective terminal reference of the edge.
   *
   * Parameters:
   *
   * edge - <Cell> to be inserted into the edge array.
   * isOutgoing - Boolean that specifies if the edge is outgoing.
   */
  const insertEdge = (edge, isOutgoing) => {
    if (edge) {
      edge.removeFromTerminal(isOutgoing);
      edge.setTerminal(me, isOutgoing);

      const edges = getEdges();

      if (edge.getTerminal(!isOutgoing) !== me || !edges.includes(edge) < 0) {
        edges.push(edge);
      }
    }

    return edge;
  };

  /**
   * Function: removeEdge
   *
   * Removes the specified edge from the edge array and returns the edge.
   * Will remove the respective terminal reference from the edge.
   *
   * Parameters:
   *
   * edge - <Cell> to be removed from the edge array.
   * isOutgoing - Boolean that specifies if the edge is outgoing.
   */
  const removeEdge = (edge, isOutgoing) => {
    const edges = getEdges();

    if (edge) {
      if (edge.getTerminal(!isOutgoing) !== me) {
        const index = getEdgeIndex(edge);

        if (index >= 0) edges.splice(index, 1);
      }

      edge.setTerminal(undefined, isOutgoing);
    }

    return edge;
  };

  /**
   * Function: removeFromTerminal
   *
   * Removes the edge from its source or target terminal.
   *
   * Parameters:
   *
   * isSource - Boolean that specifies if the edge should be removed from its
   * source or target terminal.
   */
  const removeFromTerminal = (isSource) => {
    const terminal = getTerminal(isSource);

    if (terminal) terminal.removeEdge(me, isSource);
  };

  /**
   * Function: hasAttribute
   *
   * Returns true if the user object is an XML node that contains the given
   * attribute.
   *
   * Parameters:
   *
   * name - Name of the attribute.
   */
  const hasAttribute = (name) => {
    const obj = getValue();

    return obj &&
      obj.nodeType === Constants.NODETYPE_ELEMENT &&
      obj.hasAttribute
      ? obj.hasAttribute(name)
      : obj.getAttribute(name) !== undefined;
  };

  /**
   * Function: getAttribute
   *
   * Returns the specified attribute from the user object if it is an XML
   * node.
   *
   * Parameters:
   *
   * name - Name of the attribute whose value should be returned.
   * defaultValue - Optional default value to use if the attribute has no
   * value.
   */
  const getAttribute = (name, defaultValue) => {
    const obj = getValue();
    const val =
      obj && obj.nodeType === Constants.NODETYPE_ELEMENT
        ? obj.getAttribute(name)
        : undefined;

    return val !== undefined ? val : defaultValue;
  };

  /**
   * Function: setAttribute
   *
   * Sets the specified attribute on the user object if it is an XML node.
   *
   * Parameters:
   *
   * name - Name of the attribute whose value should be set.
   * value - New value of the attribute.
   */
  const setAttribute = (name, value) => {
    const obj = getValue();

    if (obj && obj.nodeType === Constants.NODETYPE_ELEMENT) {
      obj.setAttribute(name, value);
    }
  };

  /**
   * Function: clone
   *
   * Returns a clone of the cell. Uses <cloneValue> to clone
   * the user object. All fields in <transient> are ignored
   * during the cloning.
   *
   * 'id',
   * 'value',
   * 'parent',
   * 'source',
   * 'target',
   * 'children',
   * 'edges'
   */
  const clone = () => {
    const c = Cell(cloneValue(), getGeometry(), getStyle());
    c.setVertex(isVertex());
    c.setEdge(isEdge());
    c.setConnectable(isConnectable());
    c.setVisible(isVisible());
    c.setCollapsed(isCollapsed());
    c.setOverlays(getOverlays());

    return c;
  };

  /**
   * Function: cloneValue
   *
   * Returns a clone of the cell's user object.
   */
  const cloneValue = () => {
    const v = getValue();

    if (!v) return;

    if (typeof v.clone === 'function') return v.clone();
    // changing to Number.isNaN breaks the logic
    else if (!isNaN(v.nodeType)) return v.cloneNode(true);
  };

  const toString = () => {
    if (isVertex()) return `[Vertex id:${getId()}]`;
    else if (isEdge())
      return `[Edge id:${getId()} source:${getSource()} target:${getTarget()}]`;
    else return `[Cell id:${getId()}]`;
  };

  const me = {
    /**
     * Function: getGeometry
     *
     * Returns the <Geometry> that describes the <geometry>.
     */
    getGeometry,

    /**
     * Function: setGeometry
     *
     * Sets the <Geometry> to be used as the <geometry>.
     */
    setGeometry,

    /**
     * Function: getValue
     *
     * Returns the user object of the cell. The user
     * object is stored in <value>.
     */
    getValue,

    /**
     * Function: setValue
     *
     * Sets the user object of the cell. The user object
     * is stored in <value>.
     */
    setValue,
    valueChanged,

    /**
     * Function: getStyle
     *
     * Returns a string that describes the <style>.
     */
    getStyle,

    /**
     * Function: setStyle
     *
     * Sets the string to be used as the <style>.
     */
    setStyle,

    /**
     * Function: getId
     *
     * Returns the Id of the cell as a string.
     */
    getId,

    /**
     * Function: setId
     *
     * Sets the Id of the cell to the given string.
     */
    setId,

    /**
     * Function: isVertex
     *
     * Returns true if the cell is a vertex.
     */
    isVertex,

    /**
     * Function: setVertex
     *
     * Specifies if the cell is a vertex. This should only be assigned at
     * construction of the cell and not be changed during its lifecycle.
     *
     * Parameters:
     *
     * vertex - Boolean that specifies if the cell is a vertex.
     */
    setVertex,

    /**
     * Function: isEdge
     *
     * Returns true if the cell is an edge.
     */
    isEdge,

    /**
     * Function: setEdge
     *
     * Specifies if the cell is an edge. This should only be assigned at
     * construction of the cell and not be changed during its lifecycle.
     *
     * Parameters:
     *
     * edge - Boolean that specifies if the cell is an edge.
     */
    setEdge,

    /**
     * Function: isConnectable
     *
     * Returns true if the cell is connectable.
     */
    isConnectable,

    /**
     * Function: setConnectable
     *
     * Sets the connectable state.
     *
     * Parameters:
     *
     * connectable - Boolean that specifies the new connectable state.
     */
    setConnectable,

    /**
     * Function: isVisible
     *
     * Returns true if the cell is visibile.
     */
    isVisible,

    /**
     * Function: setVisible
     *
     * Specifies if the cell is visible.
     *
     * Parameters:
     *
     * visible - Boolean that specifies the new visible state.
     */
    setVisible,

    /**
     * Function: isCollapsed
     *
     * Returns true if the cell is collapsed.
     */
    isCollapsed,

    /**
     * Function: setCollapsed
     *
     * Sets the collapsed state.
     *
     * Parameters:
     *
     * collapsed - Boolean that specifies the new collapsed state.
     */
    setCollapsed,

    /**
     * Function: getParent
     *
     * Returns the cell's parent.
     */
    getParent,

    /**
     * Function: setParent
     *
     * Sets the parent cell.
     *
     * Parameters:
     *
     * parent - <Cell> that represents the new parent.
     */
    setParent,
    getTerminal,
    setTerminal,
    getChildCount,
    getIndex,
    getChildAt,
    insert,
    remove,
    removeFromParent,
    getEdgeCount,
    getEdgeIndex,
    getEdgeAt,
    insertEdge,
    removeEdge,
    removeFromTerminal,
    hasAttribute,
    getAttribute,
    setAttribute,
    clone,
    cloneValue,
    getOverlays,
    setOverlays,
    toString
  };

  return withConstructor(me, Cell);
};

export default Cell;
