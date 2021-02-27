/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import Dictionary from '../util/Dictionary';
import Event from '../util/Event';
import EventObject from '../util/EventObject';
import EventSource from '../util/EventSource';
import ObjectIdentity from '../util/ObjectIdentity';
import Point from '../util/Point';
import UndoableEdit from '../util/UndoableEdit';
import { isNumeric } from '../util/Utils';
import { addProp } from '../Helpers';
import CellPath from './CellPath';
import Cell from './Cell';

/**
 * Class: GraphModel
 *
 * Extends <EventSource> to implement a graph model. The graph model acts as
 * a wrapper around the cells which are in charge of storing the actual graph
 * datastructure. The model acts as a transactional wrapper with event
 * notification for all changes, whereas the cells contain the atomic
 * operations for updating the actual datastructure.
 *
 * Layers:
 *
 * The cell hierarchy in the model must have a top-level root cell which
 * contains the layers (typically one default layer), which in turn contain the
 * top-level cells of the layers. This means each cell is contained in a layer.
 * If no layers are required, then all new cells should be added to the default
 * layer.
 *
 * Layers are useful for hiding and showing groups of cells, or for placing
 * groups of cells on top of other cells in the display. To identify a layer,
 * the <isLayer> function is used. It returns true if the parent of the given
 * cell is the root of the model.
 *
 * Events:
 *
 * See events section for more details. There is a new set of events for
 * tracking transactional changes as they happen. The events are called
 * startEdit for the initial beginUpdate, executed for each executed change
 * and endEdit for the terminal endUpdate. The executed event contains a
 * property called change which represents the change after execution.
 *
 * Encoding the model:
 *
 * To encode a graph model, use the following code:
 *
 * (code)
 * var enc = Codec();
 * var node = enc.encode(graph.getModel());
 * (end)
 *
 * This will create an XML node that contains all the model information.
 *
 * Encoding and decoding changes:
 *
 * For the encoding of changes, a graph model listener is required that encodes
 * each change from the given array of changes.
 *
 * (code)
 * model.addListener(Event.CHANGE, function(sender, evt)
 * {
 *   var changes = evt.getProperty('edit').changes;
 *   var nodes = [];
 *   var codec = Codec();
 *
 *   for (var i = 0; i < changes.length; i++)
 *   {
 *     nodes.push(codec.encode(changes[i]));
 *   }
 *   // do something with the nodes
 * });
 * (end)
 *
 * For the decoding and execution of changes, the codec needs a lookup function
 * that allows it to resolve cell IDs as follows:
 *
 * (code)
 * var codec = Codec();
 * codec.lookup = function(id)
 * {
 *   return model.getCell(id);
 * }
 * (end)
 *
 * For each encoded change (represented by a node), the following code can be
 * used to carry out the decoding and create a change object.
 *
 * (code)
 * var changes = [];
 * var change = codec.decode(node);
 * change.model = model;
 * change.execute();
 * changes.push(change);
 * (end)
 *
 * The changes can then be dispatched using the model as follows.
 *
 * (code)
 * var edit = UndoableEdit(model, false);
 * edit.changes = changes;
 *
 * edit.notify = function()
 * {
 *   edit.source.fireEvent(EventObject(Event.CHANGE,
 *   	'edit', edit, 'changes', edit.changes));
 *   edit.source.fireEvent(EventObject(Event.NOTIFY,
 *   	'edit', edit, 'changes', edit.changes));
 * }
 *
 * model.fireEvent(EventObject(Event.UNDO, 'edit', edit));
 * model.fireEvent(EventObject(Event.CHANGE,
 * 		'edit', edit, 'changes', changes));
 * (end)
 *
 * Event: Event.CHANGE
 *
 * Fires when an undoable edit is dispatched. The <code>edit</code> property
 * contains the <UndoableEdit>. The <code>changes</code> property contains
 * the array of atomic changes inside the undoable edit. The changes property
 * is <strong>deprecated</strong>, please use edit.changes instead.
 *
 * Example:
 *
 * For finding newly inserted cells, the following code can be used:
 *
 * (code)
 * graph.model.addListener(Event.CHANGE, function(sender, evt)
 * {
 *   var changes = evt.getProperty('edit').changes;
 *
 *   for (var i = 0; i < changes.length; i++)
 *   {
 *     var change = changes[i];
 *
 *     if (change instanceof ChildChange &&
 *       change.change.previous == null)
 *     {
 *       graph.startEditingAtCell(change.child);
 *       break;
 *     }
 *   }
 * });
 * (end)
 *
 *
 * Event: Event.NOTIFY
 *
 * Same as <Event.CHANGE>, this event can be used for classes that need to
 * implement a sync mechanism between this model and, say, a remote model. In
 * such a setup, only local changes should trigger a notify event and all
 * changes should trigger a change event.
 *
 * Event: Event.EXECUTE
 *
 * Fires between begin- and endUpdate and after an atomic change was executed
 * in the model. The <code>change</code> property contains the atomic change
 * that was executed.
 *
 * Event: Event.EXECUTED
 *
 * Fires between START_EDIT and END_EDIT after an atomic change was executed.
 * The <code>change</code> property contains the change that was executed.
 *
 * Event: Event.BEGIN_UPDATE
 *
 * Fires after the <updateLevel> was incremented in <beginUpdate>. This event
 * contains no properties.
 *
 * Event: Event.START_EDIT
 *
 * Fires after the <updateLevel> was changed from 0 to 1. This event
 * contains no properties.
 *
 * Event: Event.END_UPDATE
 *
 * Fires after the <updateLevel> was decreased in <endUpdate> but before any
 * notification or change dispatching. The <code>edit</code> property contains
 * the <currentEdit>.
 *
 * Event: Event.END_EDIT
 *
 * Fires after the <updateLevel> was changed from 1 to 0. This event
 * contains no properties.
 *
 * Event: Event.BEFORE_UNDO
 *
 * Fires before the change is dispatched after the update level has reached 0
 * in <endUpdate>. The <code>edit</code> property contains the <curreneEdit>.
 *
 * Event: Event.UNDO
 *
 * Fires after the change was dispatched in <endUpdate>. The <code>edit</code>
 * property contains the <currentEdit>.
 *
 * Constructor: GraphModel
 *
 * Constructs a new graph model. If no root is specified then a new root
 * <Cell> with a default layer is created.
 *
 * Parameters:
 *
 * root - <Cell> that represents the root cell.
 */
const GraphModel = (root) => {
  // Extends mxEventSource.
  const { addListener, removeListener, fireEvent } = EventSource();

  /**
   * Variable: root
   *
   * Holds the root cell, which in turn contains the cells that represent the
   * layers of the diagram as child cells. That is, the actual elements of the
   * diagram are supposed to live in the third generation of cells and below.
   */
  const [getModelRoot, setModelRoot] = addProp(null);

  /**
   * Variable: cells
   *
   * Maps from Ids to cells.
   */
  const [getCells, setCells] = addProp(null);

  /**
   * Variable: maintainEdgeParent
   *
   * Specifies if edges should automatically be moved into the nearest common
   * ancestor of their terminals. Default is true.
   */
  const [isMaintainEdgeParent, setIsMaintainEdgeParent] = addProp(true);

  /**
   * Variable: ignoreRelativeEdgeParent
   *
   * Specifies if relative edge parents should be ignored for finding the nearest
   * common ancestors of an edge's terminals. Default is true.
   */
  const [isIgnoreRelativeEdgeParent, setIsIgnoreRelativeEdgeParent] = addProp(
    true
  );

  /**
   * Variable: createIds
   *
   * Specifies if the model should automatically create Ids for new cells.
   * Default is true.
   */
  const [isCreateIds, setCreateIds] = addProp(true);

  /**
   * Variable: prefix
   *
   * Defines the prefix of new Ids. Default is an empty string.
   */
  const [getPrefix, setPrefix] = addProp('');

  /**
   * Variable: postfix
   *
   * Defines the postfix of new Ids. Default is an empty string.
   */
  const [getPostfix, setPostfix] = addProp('');

  /**
   * Variable: nextId
   *
   * Specifies the next Id to be created. Initial value is 0.
   */
  const [getNextId, setNextId] = addProp(0);

  /**
   * Variable: currentEdit
   *
   * Holds the changes for the current transaction. If the transaction is
   * closed then a new object is created for this variable using
   * <createUndoableEdit>.
   */
  const [getCurrentEdit, setCurrentEdit] = addProp(null);

  /**
   * Variable: updateLevel
   *
   * Counter for the depth of nested transactions. Each call to <beginUpdate>
   * will increment this number and each call to <endUpdate> will decrement
   * it. When the counter reaches 0, the transaction is closed and the
   * respective events are fired. Initial value is 0.
   */
  const [getUpdateLevel, setUpdateLevel] = addProp(0);

  /**
   * Variable: endingUpdate
   *
   * True if the program flow is currently inside endUpdate.
   */
  const [getEndingUpdate, setEndingUpdate] = addProp(false);

  /**
   * Function: clear
   *
   * Sets a new root using <createRoot>.
   */
  const clear = () => setRoot(createRoot());

  /**
   * Function: createRoot
   *
   * Creates a new root cell with a default layer (child 0).
   */
  const createRoot = () => {
    const c = Cell();
    c.insert(Cell());

    return c;
  };

  /**
   * Function: getCell
   *
   * Returns the <mxCell> for the specified Id or null if no cell can be
   * found for the given Id.
   *
   * Parameters:
   *
   * id - A string representing the Id of the cell.
   */
  const getCell = (id) => (getCells() ? getCells()[id] : null);

  /**
   * Function: filterCells
   *
   * Returns the cells from the given array where the given filter function
   * returns true.
   */
  const filterCells = (cells, filter) => (cells ? cells.filter(filter) : null);

  /**
   * Function: getDescendants
   *
   * Returns all descendants of the given cell and the cell itself in an array.
   *
   * Parameters:
   *
   * parent - <mxCell> whose descendants should be returned.
   */
  const getDescendants = (parent) => filterDescendants(null, parent);

  /**
   * Function: filterDescendants
   *
   * Visits all cells recursively and applies the specified filter function
   * to each cell. If the function returns true then the cell is added
   * to the resulting array. The parent and result paramters are optional.
   * If parent is not specified then the recursion starts at <root>.
   *
   * Example:
   * The following example extracts all vertices from a given model:
   * (code)
   * var filter = function(cell)
   * {
   * 	return model.isVertex(cell);
   * }
   * var vertices = model.filterDescendants(filter);
   * (end)
   *
   * Parameters:
   *
   * filter - JavaScript function that takes an <mxCell> as an argument
   * and returns a boolean.
   * parent - Optional <mxCell> that is used as the root of the recursion.
   */
  const filterDescendants = (filter, parent) => {
    // Creates a new array for storing the result
    const result = [];

    // Recursion starts at the root of the model
    const p = parent || getRoot();

    // Checks if the filter returns true for the cell
    // and adds it to the result array
    if (!filter || filter(parent)) {
      result.push(parent);
    }

    // Visits the children of the cell
    const childCount = getChildCount(parent);

    for (let i = 0; i < childCount; i++) {
      const child = getChildAt(parent, i);
      result.push(...filterDescendants(filter, child));
    }

    return result;
  };

  /**
   * Function: getRoot
   *
   * Returns the root of the model or the topmost parent of the given cell.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> that specifies the child.
   */
  const getRoot = (cell) => {
    let root = cell || getModelRoot();

    if (cell) {
      let c = cell;

      while (c) {
        root = c;
        c = getParent(c);
      }
    }

    return root;
  };

  /**
   * Function: setRoot
   *
   * Sets the <root> of the model using <mxRootChange> and adds the change to
   * the current transaction. This resets all datastructures in the model and
   * is the preferred way of clearing an existing model. Returns the new
   * root.
   *
   * Example:
   *
   * (code)
   * var root = new mxCell();
   * root.insert(new mxCell());
   * model.setRoot(root);
   * (end)
   *
   * Parameters:
   *
   * root - <mxCell> that specifies the new root.
   */
  const setRoot = (root) => {
    execute(RootChange(me, root));

    return root;
  };

  /**
   * Function: rootChanged
   *
   * Inner callback to change the root of the model and update the internal
   * datastructures, such as <cells> and <nextId>. Returns the previous root.
   *
   * Parameters:
   *
   * root - <mxCell> that specifies the new root.
   */
  const rootChanged = (root) => {
    const oldRoot = getModelRoot();
    setModelRoot(root);

    // Resets counters and datastructures
    setNextId(0);
    setCells(null);
    me.cellAdded(root);

    return oldRoot;
  };

  /**
   * Function: isRoot
   *
   * Returns true if the given cell is the root of the model and a non-null
   * value.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the possible root.
   */
  const isRoot = (cell) => cell && getModelRoot() === cell;

  /**
   * Function: isLayer
   *
   * Returns true if <isRoot> returns true for the parent of the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the possible layer.
   */
  const isLayer = (cell) => isRoot(getParent(cell));

  /**
   * Function: isAncestor
   *
   * Returns true if the given parent is an ancestor of the given child. Note
   * returns true if child == parent.
   *
   * Parameters:
   *
   * parent - <mxCell> that specifies the parent.
   * child - <mxCell> that specifies the child.
   */
  const isAncestor = (parent, child) => {
    let c = child;

    while (c && c !== parent) {
      c = getParent(c);
    }

    return c === parent;
  };

  /**
   * Function: contains
   *
   * Returns true if the model contains the given <mxCell>.
   *
   * Parameters:
   *
   * cell - <mxCell> that specifies the cell.
   */
  const contains = (cell) => isAncestor(getModelRoot(), cell);

  /**
   * Function: getParent
   *
   * Returns the parent of the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> whose parent should be returned.
   */
  const getParent = (cell) => (cell ? cell.getParent() : null);

  /**
   * Function: add
   *
   * Adds the specified child to the parent at the given index using
   * <mxChildChange> and adds the change to the current transaction. If no
   * index is specified then the child is appended to the parent's array of
   * children. Returns the inserted child.
   *
   * Parameters:
   *
   * parent - <mxCell> that specifies the parent to contain the child.
   * child - <mxCell> that specifies the child to be inserted.
   * index - Optional integer that specifies the index of the child.
   */
  const add = (parent, child, index = null) => {
    if (child !== parent && parent && child) {
      // Appends the child if no index was specified
      const i = index !== null ? index : getChildCount(parent);
      const parentChanged = parent !== getParent(child);

      execute(ChildChange(me, parent, child, i));

      // Maintains the edges parents by moving the edges
      // into the nearest common ancestor of its terminals
      if (isMaintainEdgeParent && parentChanged) {
        updateEdgeParents(child);
      }
    }

    return child;
  };

  /**
   * Function: cellAdded
   *
   * Inner callback to update <cells> when a cell has been added. This
   * implementation resolves collisions by creating new Ids. To change the
   * ID of a cell after it was inserted into the model, use the following
   * code:
   *
   * (code
   * delete model.cells[cell.getId()];
   * cell.setId(newId);
   * model.cells[cell.getId()] = cell;
   * (end)
   *
   * If the change of the ID should be part of the command history, then the
   * cell should be removed from the model and a clone with the new ID should
   * be reinserted into the model instead.
   *
   * Parameters:
   *
   * cell - <mxCell> that specifies the cell that has been added.
   */
  const cellAdded = (cell) => {
    if (!cell) return;

    // Creates an Id for the cell if not Id exists
    if (!cell.getId() && isCreateIds()) {
      cell.setId(createId(cell));
    }

    if (cell.getId()) {
      let collision = getCell(cell.getId());

      if (collision !== cell) {
        while (collision) {
          cell.setId(createId(cell));
          collision = getCell(cell.getId());
        }

        // Lazily creates the cells dictionary
        if (!getCells()) setCells({});

        getCells()[cell.getId()] = cell;
      }
    }

    // Makes sure IDs of deleted cells are not reused
    if (isNumeric(cell.getId())) {
      setNextId(Math.max(getNextId(), cell.getId()));
    }

    // Recursively processes child cells
    const childCount = getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      me.cellAdded(getChildAt(cell, i));
    }
  };

  /**
   * Function: createId
   *
   * Hook method to create an Id for the specified cell. This implementation
   * concatenates <prefix>, id and <postfix> to create the Id and increments
   * <nextId>. The cell is ignored by this implementation, but can be used in
   * overridden methods to prefix the Ids with eg. the cell type.
   *
   * Parameters:
   *
   * cell - <mxCell> to create the Id for.
   */
  const createId = (cell) => {
    const id = getNextId();
    setNextId(id + 1);

    return getPrefix() + id + getPostfix();
  };

  /**
   * Function: updateEdgeParents
   *
   * Updates the parent for all edges that are connected to cell or one of
   * its descendants using <updateEdgeParent>.
   */
  const updateEdgeParents = (cell, root) => {
    // Gets the topmost node of the hierarchy
    const topMost = root || getRoot(cell);

    // Updates edges on children first
    const childCount = getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      const child = getChildAt(cell, i);
      updateEdgeParents(child, topMost);
    }

    // Updates the parents of all connected edges
    const edgeCount = getEdgeCount(cell);
    const edges = [];

    for (let i = 0; i < edgeCount; i++) {
      edges.push(getEdgeAt(cell, i));
    }

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];

      // Updates edge parent if edge and child have
      // a common root node (does not need to be the
      // model root node)
      if (isAncestor(topMost, edge)) {
        updateEdgeParents(edge, topMost);
      }
    }
  };

  /**
   * Function: updateEdgeParent
   *
   * Inner callback to update the parent of the specified <mxCell> to the
   * nearest-common-ancestor of its two terminals.
   *
   * Parameters:
   *
   * edge - <mxCell> that specifies the edge.
   * root - <mxCell> that represents the current root of the model.
   */
  const updateEdgeParent = (edge, root) => {
    let source = getTerminal(edge, true);
    let target = getTerminal(edge, false);
    let cell = null;

    // Uses the first non-relative descendants of the source terminal
    while (
      source &&
      !isEdge(source) &&
      source.getGeometry() &&
      source.getGeometry().isRelative()
    ) {
      source = getParent(source);
    }

    // Uses the first non-relative descendants of the target terminal
    while (
      target &&
      isIgnoreRelativeEdgeParent() &&
      !isEdge(target) &&
      target.getGeometry() &&
      target.getGeometry().isRelative()
    ) {
      target = getParent(target);
    }

    if (isAncestor(root, source) && isAncestor(root, target)) {
      if (source === target) cell = getParent(source);
      else cell = getNearestCommonAncestor(source, target);

      if (
        cell &&
        (getParent(cell) !== getModelRoot() || isAncestor(cell, edge)) &&
        getParent(edge) !== cell
      ) {
        const geo = getGeometry(edge);

        if (geo) {
          const origin1 = getOrigin(getParent(edge));
          const origin2 = getOrigin(cell);

          const dx = origin2.x - origin1.x;
          const dy = origin2.y - origin1.y;

          const g = geo.clone();
          g.translate(-dx, -dy);
          setGeometry(edge, g);
        }

        add(cell, edge, getChildCount(cell));
      }
    }
  };

  /**
   * Function: getOrigin
   *
   * Returns the absolute, accumulated origin for the children inside the
   * given parent as an <mxPoint>.
   */
  const getOrigin = (cell) => {
    if (!cell) return Point();

    const result = getOrigin(getParent(cell));

    if (!isEdge(cell)) {
      const geo = getGeometry(cell);

      if (geo) {
        result.setX(result.getX() + geo.getX());
        result.setY(result.getY() + geo.getY());
      }
    }

    return result;
  };

  /**
   * Function: getNearestCommonAncestor
   *
   * Returns the nearest common ancestor for the specified cells.
   *
   * Parameters:
   *
   * cell1 - <mxCell> that specifies the first cell in the tree.
   * cell2 - <mxCell> that specifies the second cell in the tree.
   */
  const getNearestCommonAncestor = (cell1, cell2) => {
    if (!cell1 || !cell2) return null;

    // Creates the cell path for the second cell
    let path = CellPath.create(cell2);

    if (path && path.length > 0) {
      // Bubbles through the ancestors of the first
      // cell to find the nearest common ancestor.
      let cell = cell1;
      let current = CellPath.create(cell);

      // Inverts arguments
      if (path.length < current.length) {
        cell = cell2;
        const tmp = current;
        current = path;
        path = tmp;
      }

      while (cell) {
        const parent = getParent(cell);

        // Checks if the cell path is equal to the beginning of the given cell path
        if (path.indexOf(current + CellPath.PATH_SEPARATOR) === 0 && parent) {
          return cell;
        }

        current = CellPath.getParentPath(current);
        cell = parent;
      }
    }

    return null;
  };

  /**
   * Function: remove
   *
   * Removes the specified cell from the model using <mxChildChange> and adds
   * the change to the current transaction. This operation will remove the
   * cell and all of its children from the model. Returns the removed cell.
   *
   * Parameters:
   *
   * cell - <mxCell> that should be removed.
   */
  const remove = (cell) => {
    if (cell === getModelRoot()) setRoot(null);
    else if (getParent(cell)) execute(ChildChange(me, null, cell));

    return cell;
  };

  /**
   * Function: cellRemoved
   *
   * Inner callback to update <cells> when a cell has been removed.
   *
   * Parameters:
   *
   * cell - <mxCell> that specifies the cell that has been removed.
   */
  const cellRemoved = (cell) => {
    if (!cell || !getCells()) return;

    // Recursively processes child cells
    const childCount = getChildCount(cell);

    for (let i = childCount - 1; i >= 0; i--) {
      me.cellRemoved(getChildAt(cell, i));
    }

    // Removes the dictionary entry for the cell
    if (getCells() && cell.getId()) {
      delete getCells()[cell.getId()];
    }
  };

  /**
   * Function: parentForCellChanged
   *
   * Inner callback to update the parent of a cell using <mxCell.insert>
   * on the parent and return the previous parent.
   *
   * Parameters:
   *
   * cell - <mxCell> to update the parent for.
   * parent - <mxCell> that specifies the new parent of the cell.
   * index - Optional integer that defines the index of the child
   * in the parent's child array.
   */
  const parentForCellChanged = (cell, parent, index) => {
    const previous = getParent(cell);

    if (parent) {
      if (parent !== previous || previous.getIndex(cell) !== index) {
        parent.insert(cell, index);
      }
    } else if (previous) {
      const oldIndex = previous.getIndex(cell);
      previous.remove(oldIndex);
    }

    // Adds or removes the cell from the model
    const par = contains(parent);
    const pre = contains(previous);

    if (par && !pre) me.cellAdded(cell);
    else if (pre && !par) me.cellRemoved(cell);

    return previous;
  };

  /**
   * Function: getChildCount
   *
   * Returns the number of children in the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> whose number of children should be returned.
   */
  const getChildCount = (cell) => (cell ? cell.getChildCount() : 0);

  /**
   * Function: getChildAt
   *
   * Returns the child of the given <mxCell> at the given index.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the parent.
   * index - Integer that specifies the index of the child to be returned.
   */
  const getChildAt = (cell, index) => (cell ? cell.getChildAt(index) : null);

  /**
   * Function: getChildren
   *
   * Returns all children of the given <mxCell> as an array of <mxCells>. The
   * return value should be only be read.
   *
   * Parameters:
   *
   * cell - <mxCell> the represents the parent.
   */
  const getChildren = (cell) => (cell ? cell.getChildren() : null);

  /**
   * Function: getChildVertices
   *
   * Returns the child vertices of the given parent.
   *
   * Parameters:
   *
   * cell - <mxCell> whose child vertices should be returned.
   */
  const getChildVertices = (parent) => getChildCells(parent, true, false);

  /**
   * Function: getChildEdges
   *
   * Returns the child edges of the given parent.
   *
   * Parameters:
   *
   * cell - <mxCell> whose child edges should be returned.
   */
  const getChildEdges = (parent) => getChildCells(parent, false, true);

  /**
   * Function: getChildCells
   *
   * Returns the children of the given cell that are vertices and/or edges
   * depending on the arguments.
   *
   * Parameters:
   *
   * cell - <mxCell> the represents the parent.
   * vertices - Boolean indicating if child vertices should be returned.
   * Default is false.
   * edges - Boolean indicating if child edges should be returned.
   * Default is false.
   */
  const getChildCells = (parent, vertices = false, edges = false) => {
    const childCount = getChildCount(parent);
    const result = [];

    for (let i = 0; i < childCount; i++) {
      const child = getChildAt(parent, i);

      if (
        (!edges && !vertices) ||
        (edges && isEdge(child)) ||
        (vertices && isVertex(child))
      ) {
        result.push(child);
      }
    }

    return result;
  };

  /**
   * Function: getTerminal
   *
   * Returns the source or target <mxCell> of the given edge depending on the
   * value of the boolean parameter.
   *
   * Parameters:
   *
   * edge - <mxCell> that specifies the edge.
   * isSource - Boolean indicating which end of the edge should be returned.
   */
  const getTerminal = (edge, isSource) =>
    edge ? edge.getTerminal(isSource) : null;

  /**
   * Function: setTerminal
   *
   * Sets the source or target terminal of the given <mxCell> using
   * <mxTerminalChange> and adds the change to the current transaction.
   * This implementation updates the parent of the edge using <updateEdgeParent>
   * if required.
   *
   * Parameters:
   *
   * edge - <mxCell> that specifies the edge.
   * terminal - <mxCell> that specifies the new terminal.
   * isSource - Boolean indicating if the terminal is the new source or
   * target terminal of the edge.
   */
  const setTerminal = (edge, terminal, isSource) => {
    const terminalChanged = terminal !== getTerminal(edge, isSource);
    execute(TerminalChange(me, edge, terminal, isSource));

    if (isMaintainEdgeParent() && terminalChanged) {
      updateEdgeParent(edge, getRoot());
    }

    return terminal;
  };

  /**
   * Function: setTerminals
   *
   * Sets the source and target <mxCell> of the given <mxCell> in a single
   * transaction using <setTerminal> for each end of the edge.
   *
   * Parameters:
   *
   * edge - <mxCell> that specifies the edge.
   * source - <mxCell> that specifies the new source terminal.
   * target - <mxCell> that specifies the new target terminal.
   */
  const setTerminals = (edge, source, target) => {
    beginUpdate();

    try {
      setTerminal(edge, source, true);
      setTerminal(edge, target, false);
    } finally {
      endUpdate();
    }
  };

  /**
   * Function: terminalForCellChanged
   *
   * Inner helper function to update the terminal of the edge using
   * <mxCell.insertEdge> and return the previous terminal.
   *
   * Parameters:
   *
   * edge - <mxCell> that specifies the edge to be updated.
   * terminal - <mxCell> that specifies the new terminal.
   * isSource - Boolean indicating if the terminal is the new source or
   * target terminal of the edge.
   */
  const terminalForCellChanged = (edge, terminal, isSource) => {
    const previous = getTerminal(edge, isSource);

    if (terminal) terminal.insertEdge(edge, isSource);
    else if (previous) previous.removeEdge(edge, isSource);

    return previous;
  };

  /**
   * Function: getEdgeCount
   *
   * Returns the number of distinct edges connected to the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the vertex.
   */
  const getEdgeCount = (cell) => (cell ? cell.getEdgeCount() : 0);

  /**
   * Function: getEdgeAt
   *
   * Returns the edge of cell at the given index.
   *
   * Parameters:
   *
   * cell - <mxCell> that specifies the vertex.
   * index - Integer that specifies the index of the edge
   * to return.
   */
  const getEdgeAt = (cell, index) => (cell ? cell.getEdgeAt(index) : null);

  /**
   * Function: getDirectedEdgeCount
   *
   * Returns the number of incoming or outgoing edges, ignoring the given
   * edge.
   *
   * Parameters:
   *
   * cell - <mxCell> whose edge count should be returned.
   * outgoing - Boolean that specifies if the number of outgoing or
   * incoming edges should be returned.
   * ignoredEdge - <mxCell> that represents an edge to be ignored.
   */
  const getDirectedEdgeCount = (cell, outgoing, ignoredEdge) => {
    let count = 0;
    const edgeCount = getEdgeCount(cell);

    for (let i = 0; i < edgeCount; i++) {
      const edge = getEdgeAt(cell, i);

      if (edge !== ignoredEdge && getTerminal(edge, outgoing) === cell) {
        count++;
      }
    }

    return count;
  };

  /**
   * Function: getConnections
   *
   * Returns all edges of the given cell without loops.
   *
   * Parameters:
   *
   * cell - <mxCell> whose edges should be returned.
   *
   */
  const getConnections = (cell) => getEdges(cell, true, true, false);

  /**
   * Function: getIncomingEdges
   *
   * Returns the incoming edges of the given cell without loops.
   *
   * Parameters:
   *
   * cell - <mxCell> whose incoming edges should be returned.
   *
   */
  const getIncomingEdges = (cell) => getEdges(cell, true, false, false);

  /**
   * Function: getOutgoingEdges
   *
   * Returns the outgoing edges of the given cell without loops.
   *
   * Parameters:
   *
   * cell - <mxCell> whose outgoing edges should be returned.
   *
   */
  const getOutgoingEdges = (cell) => getEdges(cell, false, true, false);

  /**
   * Function: getEdges
   *
   * Returns all distinct edges connected to this cell as a new array of
   * <mxCells>. If at least one of incoming or outgoing is true, then loops
   * are ignored, otherwise if both are false, then all edges connected to
   * the given cell are returned including loops.
   *
   * Parameters:
   *
   * cell - <mxCell> that specifies the cell.
   * incoming - Optional boolean that specifies if incoming edges should be
   * returned. Default is true.
   * outgoing - Optional boolean that specifies if outgoing edges should be
   * returned. Default is true.
   * includeLoops - Optional boolean that specifies if loops should be returned.
   * Default is true.
   */
  const getEdges = (
    cell,
    incoming = true,
    outgoing = true,
    includeLoops = true
  ) => {
    const edgeCount = getEdgeCount(cell);
    const result = [];

    for (let i = 0; i < edgeCount; i++) {
      const edge = getEdgeAt(cell, i);
      const source = getTerminal(edge, true);
      const target = getTerminal(edge, false);

      if (
        (includeLoops && source === target) ||
        (source !== target &&
          ((incoming && target === cell) || (outgoing && source === cell)))
      ) {
        result.push(edge);
      }
    }

    return result;
  };

  /**
   * Function: getEdgesBetween
   *
   * Returns all edges between the given source and target pair. If directed
   * is true, then only edges from the source to the target are returned,
   * otherwise, all edges between the two cells are returned.
   *
   * Parameters:
   *
   * source - <mxCell> that defines the source terminal of the edge to be
   * returned.
   * target - <mxCell> that defines the target terminal of the edge to be
   * returned.
   * directed - Optional boolean that specifies if the direction of the
   * edge should be taken into account. Default is false.
   */
  const getEdgesBetween = (source, target, directed = false) => {
    const tmp1 = getEdgeCount(source);
    const tmp2 = getEdgeCount(target);

    // Assumes the source has less connected edges
    let terminal = source;
    let edgeCount = tmp1;

    // Uses the smaller array of connected edges
    // for searching the edge
    if (tmp2 < tmp1) {
      edgeCount = tmp2;
      terminal = target;
    }

    const result = [];

    // Checks if the edge is connected to the correct
    // cell and returns the first match
    for (let i = 0; i < edgeCount; i++) {
      const edge = getEdgeAt(terminal, i);
      const src = getTerminal(edge, true);
      const trg = getTerminal(edge, false);
      const directedMatch = src === source && trg === target;
      const oppositeMatch = trg === source && src === target;

      if (directedMatch || (!directed && oppositeMatch)) {
        result.push(edge);
      }
    }

    return result;
  };

  /**
   * Function: getOpposites
   *
   * Returns all opposite vertices wrt terminal for the given edges, only
   * returning sources and/or targets as specified. The result is returned
   * as an array of <mxCells>.
   *
   * Parameters:
   *
   * edges - Array of <mxCells> that contain the edges to be examined.
   * terminal - <mxCell> that specifies the known end of the edges.
   * sources - Boolean that specifies if source terminals should be contained
   * in the result. Default is true.
   * targets - Boolean that specifies if target terminals should be contained
   * in the result. Default is true.
   */
  const getOpposites = (edges, terminal, source = true, targets = true) => {
    const terminals = [];

    if (edges) {
      for (const edge of edges) {
        const source = getTerminal(edge, true);
        const target = getTerminal(edge, false);

        // Checks if the terminal is the source of
        // the edge and if the target should be
        // stored in the result
        if (source === terminal && target && target !== terminal && targets) {
          terminals.push(target);
        }

        // Checks if the terminal is the taget of
        // the edge and if the source should be
        // stored in the result
        else if (
          target === terminal &&
          source &&
          source !== terminal &&
          sources
        ) {
          terminals.push(source);
        }
      }
    }

    return terminals;
  };

  /**
   * Function: getTopmostCells
   *
   * Returns the topmost cells of the hierarchy in an array that contains no
   * descendants for each <mxCell> that it contains. Duplicates should be
   * removed in the cells array to improve performance.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose topmost ancestors should be returned.
   */
  const getTopmostCells = (cells) => {
    const dict = Dictionary();
    const tmp = [];

    for (const cell of cells) {
      dict.put(cell, true);
    }

    for (const cell of cells) {
      let topmost = true;
      let parent = getParent(cell);

      while (parent) {
        if (dict.get(parent)) {
          topmost = false;
          break;
        }

        parent = getParent(parent);
      }

      if (topmost) {
        tmp.push(cell);
      }
    }

    return tmp;
  };

  /**
   * Function: isVertex
   *
   * Returns true if the given cell is a vertex.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the possible vertex.
   */
  const isVertex = (cell) => (cell ? cell.isVertex() : false);

  /**
   * Function: isEdge
   *
   * Returns true if the given cell is an edge.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the possible edge.
   */
  const isEdge = (cell) => (cell ? cell.isEdge() : false);

  /**
   * Function: isConnectable
   *
   * Returns true if the given <mxCell> is connectable. If <edgesConnectable>
   * is false, then this function returns false for all edges else it returns
   * the return value of <mxCell.isConnectable>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose connectable state should be returned.
   */
  const isConnectable = (cell) => (cell ? cell.isConnectable() : false);

  /**
   * Function: getValue
   *
   * Returns the user object of the given <mxCell> using <mxCell.getValue>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose user object should be returned.
   */
  const getValue = (cell) => (cell ? cell.getValue() : null);

  /**
   * Function: setValue
   *
   * Sets the user object of then given <mxCell> using <mxValueChange>
   * and adds the change to the current transaction.
   *
   * Parameters:
   *
   * cell - <mxCell> whose user object should be changed.
   * value - Object that defines the new user object.
   */
  const setValue = (cell, value) => {
    execute(ValueChange(me, cell, value));

    return value;
  };

  /**
   * Function: valueForCellChanged
   *
   * Inner callback to update the user object of the given <mxCell>
   * using <mxCell.valueChanged> and return the previous value,
   * that is, the return value of <mxCell.valueChanged>.
   *
   * To change a specific attribute in an XML node, the following code can be
   * used.
   *
   * (code)
   * graph.getModel().valueForCellChanged = function(cell, value)
   * {
   *   var previous = cell.value.getAttribute('label');
   *   cell.value.setAttribute('label', value);
   *
   *   return previous;
   * };
   * (end)
   */
  const valueForCellChanged = (cell, value) => cell.valueChanged(value);

  /**
   * Function: getGeometry
   *
   * Returns the <mxGeometry> of the given <mxCell>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose geometry should be returned.
   */
  const getGeometry = (cell) => (cell ? cell.getGeometry() : null);

  /**
   * Function: setGeometry
   *
   * Sets the <mxGeometry> of the given <mxCell>. The actual update
   * of the cell is carried out in <geometryForCellChanged>. The
   * <mxGeometryChange> action is used to encapsulate the change.
   *
   * Parameters:
   *
   * cell - <mxCell> whose geometry should be changed.
   * geometry - <mxGeometry> that defines the new geometry.
   */
  const setGeometry = (cell, geometry) => {
    if (geometry !== getGeometry(cell)) {
      execute(GeometryChange(me, cell, geometry));
    }

    return geometry;
  };

  /**
   * Function: geometryForCellChanged
   *
   * Inner callback to update the <mxGeometry> of the given <mxCell> using
   * <mxCell.setGeometry> and return the previous <mxGeometry>.
   */
  const geometryForCellChanged = (cell, geometry) => {
    const previous = getGeometry(cell);
    cell.setGeometry(geometry);

    return previous;
  };

  /**
   * Function: getStyle
   *
   * Returns the style of the given <mxCell>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose style should be returned.
   */
  const getStyle = (cell) => (cell ? cell.getStyle() : null);

  /**
   * Function: setStyle
   *
   * Sets the style of the given <mxCell> using <mxStyleChange> and
   * adds the change to the current transaction.
   *
   * Parameters:
   *
   * cell - <mxCell> whose style should be changed.
   * style - String of the form [stylename;|key=value;] to specify
   * the new cell style.
   */
  const setStyle = (cell, style) => {
    if (style !== getStyle(cell)) {
      execute(StyleChange(me, cell, style));
    }

    return style;
  };

  /**
   * Function: styleForCellChanged
   *
   * Inner callback to update the style of the given <mxCell>
   * using <mxCell.setStyle> and return the previous style.
   *
   * Parameters:
   *
   * cell - <mxCell> that specifies the cell to be updated.
   * style - String of the form [stylename;|key=value;] to specify
   * the new cell style.
   */
  const styleForCellChanged = (cell, style) => {
    const previous = getStyle(cell);
    cell.setStyle(style);

    return previous;
  };

  /**
   * Function: isCollapsed
   *
   * Returns true if the given <mxCell> is collapsed.
   *
   * Parameters:
   *
   * cell - <mxCell> whose collapsed state should be returned.
   */
  const isCollapsed = (cell) => (cell ? cell.isCollapsed() : false);

  /**
   * Function: setCollapsed
   *
   * Sets the collapsed state of the given <mxCell> using <mxCollapseChange>
   * and adds the change to the current transaction.
   *
   * Parameters:
   *
   * cell - <mxCell> whose collapsed state should be changed.
   * collapsed - Boolean that specifies the new collpased state.
   */
  const setCollapsed = (cell, collapsed) => {
    if (collapsed !== isCollapsed(cell)) {
      execute(CollapseChange(me, cell, collapsed));
    }

    return collapsed;
  };

  /**
   * Function: collapsedStateForCellChanged
   *
   * Inner callback to update the collapsed state of the
   * given <mxCell> using <mxCell.setCollapsed> and return
   * the previous collapsed state.
   *
   * Parameters:
   *
   * cell - <mxCell> that specifies the cell to be updated.
   * collapsed - Boolean that specifies the new collpased state.
   */
  const collapsedStateForCellChanged = (cell, collapsed) => {
    const previous = isCollapsed(cell);
    cell.setCollapsed(collapsed);

    return previous;
  };

  /**
   * Function: isVisible
   *
   * Returns true if the given <mxCell> is visible.
   *
   * Parameters:
   *
   * cell - <mxCell> whose visible state should be returned.
   */
  const isVisible = (cell) => (cell ? cell.isVisible() : false);

  /**
   * Function: setVisible
   *
   * Sets the visible state of the given <mxCell> using <mxVisibleChange> and
   * adds the change to the current transaction.
   *
   * Parameters:
   *
   * cell - <mxCell> whose visible state should be changed.
   * visible - Boolean that specifies the new visible state.
   */
  const setVisible = (cell, visible) => {
    if (visible !== isVisible(cell)) {
      execute(VisibleChange(me, cell, visible));
    }

    return visible;
  };

  /**
   * Function: visibleStateForCellChanged
   *
   * Inner callback to update the visible state of the
   * given <mxCell> using <mxCell.setCollapsed> and return
   * the previous visible state.
   *
   * Parameters:
   *
   * cell - <mxCell> that specifies the cell to be updated.
   * visible - Boolean that specifies the new visible state.
   */
  const visibleStateForCellChanged = (cell, visible) => {
    const previous = isVisible(cell);
    cell.setVisible(visible);

    return previous;
  };

  /**
   * Function: execute
   *
   * Executes the given edit and fires events if required. The edit object
   * requires an execute function which is invoked. The edit is added to the
   * <currentEdit> between <beginUpdate> and <endUpdate> calls, so that
   * events will be fired if this execute is an individual transaction, that
   * is, if no previous <beginUpdate> calls have been made without calling
   * <endUpdate>. This implementation fires an <execute> event before
   * executing the given change.
   *
   * Parameters:
   *
   * change - Object that described the change.
   */
  const execute = (change) => {
    change.execute();
    beginUpdate();
    getCurrentEdit().add(change);
    fireEvent(EventObject(Event.EXECUTE, 'change', change));
    // New global executed event
    fireEvent(EventObject(Event.EXECUTED, 'change', change));
    endUpdate();
  };

  /**
   * Function: beginUpdate
   *
   * Increments the <updateLevel> by one. The event notification
   * is queued until <updateLevel> reaches 0 by use of
   * <endUpdate>.
   *
   * All changes on <mxGraphModel> are transactional,
   * that is, they are executed in a single undoable change
   * on the model (without transaction isolation).
   * Therefore, if you want to combine any
   * number of changes into a single undoable change,
   * you should group any two or more API calls that
   * modify the graph model between <beginUpdate>
   * and <endUpdate> calls as shown here:
   *
   * (code)
   * var model = graph.getModel();
   * var parent = graph.getDefaultParent();
   * var index = model.getChildCount(parent);
   * model.beginUpdate();
   * try
   * {
   *   model.add(parent, v1, index);
   *   model.add(parent, v2, index+1);
   * }
   * finally
   * {
   *   model.endUpdate();
   * }
   * (end)
   *
   * Of course there is a shortcut for appending a
   * sequence of cells into the default parent:
   *
   * (code)
   * graph.addCells([v1, v2]).
   * (end)
   */
  const beginUpdate = () => {
    setUpdateLevel(getUpdateLevel() + 1);
    fireEvent(EventObject(Event.BEGIN_UPDATE));

    if (getUpdateLevel() === 1) {
      fireEvent(EventObject(Event.START_EDIT));
    }
  };

  /**
   * Function: endUpdate
   *
   * Decrements the <updateLevel> by one and fires an <undo>
   * event if the <updateLevel> reaches 0. This function
   * indirectly fires a <change> event by invoking the notify
   * function on the <currentEdit> und then creates a new
   * <currentEdit> using <createUndoableEdit>.
   *
   * The <undo> event is fired only once per edit, whereas
   * the <change> event is fired whenever the notify
   * function is invoked, that is, on undo and redo of
   * the edit.
   */
  const endUpdate = () => {
    setUpdateLevel(getUpdateLevel() - 1);

    if (getUpdateLevel() === 0) {
      fireEvent(EventObject(Event.END_EDIT));
    }

    if (!getEndingUpdate()) {
      setUpdateLevel(0);
      setEndingUpdate(false);
      fireEvent(EventObject(Event.END_UPDATE, 'edit', getCurrentEdit()));

      try {
        if (getEndingUpdate() && !getCurrentEdit().isEmpty()) {
          fireEvent(EventObject(Event.BEFORE_UNDO, 'edit', getCurrentEdit()));
          const tmp = getCurrentEdit();
          setCurrentEdit(createUndoableEdit());
          tmp.notify();
          fireEvent(EventObject(Event.UNDO, 'edit', tmp));
        }
      } finally {
        setEndingUpdate(false);
      }
    }
  };

  /**
   * Function: createUndoableEdit
   *
   * Creates a new <mxUndoableEdit> that implements the
   * notify function to fire a <change> and <notify> event
   * through the <mxUndoableEdit>'s source.
   *
   * Parameters:
   *
   * significant - Optional boolean that specifies if the edit to be created is
   * significant. Default is true.
   */
  const createUndoableEdit = (significant = true) => {
    const edit = UndoableEdit(me, significant);

    edit.notify = () => {
      // LATER: Remove changes property (deprecated)
      edit
        .getSource()
        .fireEvent(
          EventObject(Event.CHANGE, 'edit', edit, 'changes', edit.getChanges())
        );
      edit
        .getSource()
        .fireEvent(
          EventObject(Event.NOTIFY, 'edit', edit, 'changes', edit.getChanges())
        );
    };

    return edit;
  };

  /**
   * Function: mergeChildren
   *
   * Merges the children of the given cell into the given target cell inside
   * this model. All cells are cloned unless there is a corresponding cell in
   * the model with the same id, in which case the source cell is ignored and
   * all edges are connected to the corresponding cell in this model. Edges
   * are considered to have no identity and are always cloned unless the
   * cloneAllEdges flag is set to false, in which case edges with the same
   * id in the target model are reconnected to reflect the terminals of the
   * source edges.
   */
  const mergeChildren = (from, to, cloneAllEdges = true) => {
    beginUpdate();

    try {
      const mapping = {};
      mergeChildrenImpl(from, to, cloneAllEdges, mapping);

      // Post-processes all edges in the mapping and
      // reconnects the terminals to the corresponding
      // cells in the target model
      for (const key in mapping) {
        const cell = mapping[key];
        let terminal = getTerminal(cell, true);

        if (terminal) {
          terminal = mapping[CellPath.create(terminal)];
          setTerminal(cell, terminal, true);
        }

        terminal = getTerminal(cell, false);

        if (terminal) {
          terminal = mapping[CellPath.create(terminal)];
          setTerminal(cell, terminal, false);
        }
      }
    } finally {
      endUpdate();
    }
  };

  /**
   * Function: mergeChildrenImpl
   *
   * Clones the children of the source cell into the given target cell in
   * this model and adds an entry to the mapping that maps from the source
   * cell to the target cell with the same id or the clone of the source cell
   * that was inserted into this model.
   */
  const mergeChildrenImpl = (from, to, cloneAllEdges, mapping) => {
    beginUpdate();

    try {
      const childCount = from.getChildCount();

      for (let i = 0; i < childCount; i++) {
        const cell = from.getChildAt(i);

        if (typeof cell.getId === 'function') {
          const id = cell.getId();
          let target =
            id && (!isEdge(cell) || !cloneAllEdges) ? getCell(id) : null;

          // Clones and adds the child if no cell exists for the id
          if (!target) {
            const clone = cell.clone();
            clone.setId(id);

            // Sets the terminals from the original cell to the clone
            // because the lookup uses strings not cells in JS
            clone.setTerminal(cell.getTerminal(true), true);
            clone.setTerminal(cell.getTerminal(false), false);

            // Do *NOT* use model.add as this will move the edge away
            // from the parent in updateEdgeParent if maintainEdgeParent
            // is enabled in the target model
            target = to.insert(clone);
            me.cellAdded(target);
          }

          // Stores the mapping for later reconnecting edges
          mapping[CellPath.create(cell)] = target;

          // Recurses
          mergeChildrenImpl(cell, target, cloneAllEdges, mapping);
        }
      }
    } finally {
      endUpdate();
    }
  };

  /**
   * Function: getParents
   *
   * Returns an array that represents the set (no duplicates) of all parents
   * for the given array of cells.
   *
   * Parameters:
   *
   * cells - Array of cells whose parents should be returned.
   */
  const getParents = (cells) => {
    const parents = [];

    if (cells) {
      const dict = Dictionary();

      for (const cell of cells) {
        const parent = getParent(cell);

        if (parent && !dict.get(parent)) {
          dict.put(parent, true);
          parents.push(parent);
        }
      }
    }

    return parents;
  };

  //
  // Cell Cloning
  //

  /**
   * Function: cloneCell
   *
   * Returns a deep clone of the given <mxCell> (including
   * the children) which is created using <cloneCells>.
   *
   * Parameters:
   *
   * cell - <mxCell> to be cloned.
   * includeChildren - Optional boolean indicating if the cells should be cloned
   * with all descendants. Default is true.
   */
  const cloneCell = (cell, includeChildren) =>
    cell ? cloneCells([cell], includeChildren)[0] : null;

  /**
   * Function: cloneCells
   *
   * Returns an array of clones for the given array of <mxCells>.
   * Depending on the value of includeChildren, a deep clone is created for
   * each cell. Connections are restored based if the corresponding
   * cell is contained in the passed in array.
   *
   * Parameters:
   *
   * cells - Array of <mxCell> to be cloned.
   * includeChildren - Optional boolean indicating if the cells should be cloned
   * with all descendants. Default is true.
   * mapping - Optional mapping for existing clones.
   */
  const cloneCells = (cells, includeChildren = true, mapping = {}) => {
    const clones = [];

    for (const cell of cells) {
      if (cell) clones.push(cloneCellImpl(cell, mapping, includeChildren));
      else clones.push(null);
    }

    for (let i = 0; i < clones.length; i++) {
      if (clones[i]) restoreClone(clones[i], cells[i], mapping);
    }

    return clones;
  };

  /**
   * Function: cloneCellImpl
   *
   * Inner helper method for cloning cells recursively.
   */
  const cloneCellImpl = (cell, mapping, includeChildren) => {
    const ident = ObjectIdentity.get(cell);
    let clone = mapping[ident];

    if (!clone) {
      clone = me.cellCloned(cell);
      mapping[ident] = clone;

      if (includeChildren) {
        const childCount = getChildCount(cell);

        for (let i = 0; i < childCount; i++) {
          const cloneChild = cloneCellImpl(getChildAt(cell, i), mapping, true);
          clone.insert(cloneChild);
        }
      }
    }

    return clone;
  };

  /**
   * Function: cellCloned
   *
   * Hook for cloning the cell. This returns cell.clone() or
   * any possible exceptions.
   */
  const cellCloned = (cell) => cell.clone();

  /**
   * Function: restoreClone
   *
   * Inner helper method for restoring the connections in
   * a network of cloned cells.
   */
  const restoreClone = (clone, cell, mapping) => {
    const source = getTerminal(cell, true);

    if (source) {
      const tmp = mapping[ObjectIdentity.get(source)];

      if (tmp) tmp.insertEdge(clone, true);
    }

    const target = getTerminal(cell, false);

    if (target) {
      const tmp = mapping[ObjectIdentity.get(target)];

      if (tmp) tmp.insertEdge(clone, false);
    }

    const childCount = getChildCount(clone);

    for (let i = 0; i < childCount; i++) {
      restoreClone(getChildAt(clone, i), getChildAt(cell, i), mapping);
    }
  };

  const me = {
    addListener,
    removeListener,
    clear,

    /**
     * Function: isCreateIds
     *
     * Returns <createIds>.
     */
    isCreateIds,

    /**
     * Function: setCreateIds
     *
     * Sets <createIds>.
     */
    setCreateIds,
    getCell,
    filterCells,
    getDescendants,
    filterDescendants,
    getRoot,
    setRoot,
    rootChanged,
    isRoot,
    isLayer,
    isAncestor,
    contains,
    getParent,
    add,
    cellAdded,
    createId,
    updateEdgeParents,
    getOrigin,
    getNearestCommonAncestor,
    remove,
    cellRemoved,
    parentForCellChanged,
    getChildCount,
    getChildAt,
    getChildren,
    getChildVertices,
    getChildEdges,
    getChildCells,
    getTerminal,
    setTerminal,
    setTerminals,
    terminalForCellChanged,
    getEdgeCount,
    getEdgeAt,
    getDirectedEdgeCount,
    getConnections,
    getIncomingEdges,
    getOutgoingEdges,
    getEdges,
    getEdgesBetween,
    getOpposites,
    getTopmostCells,
    isVertex,
    isEdge,
    isConnectable,
    getValue,
    setValue,
    valueForCellChanged,
    getGeometry,
    setGeometry,
    geometryForCellChanged,
    getStyle,
    setStyle,
    styleForCellChanged,
    isCollapsed,
    setCollapsed,
    collapsedStateForCellChanged,
    isVisible,
    setVisible,
    visibleStateForCellChanged,
    execute,
    beginUpdate,
    endUpdate,
    mergeChildren,
    getParents,
    cloneCell,
    cloneCells,
    cellCloned
  };

  setCurrentEdit(createUndoableEdit());

  if (root) setRoot(root);
  else clear();

  return me;
};

//
// Atomic changes
//

/**
 * Class: RootChange
 *
 * Action to change the root in a model.
 *
 * Constructor: RootChange
 *
 * Constructs a change of the root in the
 * specified model.
 */
export const RootChange = (model, root) => {
  const [getModel, setModel] = addProp(model);
  const [getRoot, setRoot] = addProp(root);
  const [getPrevious, setPrevious] = addProp(root);

  /**
   * Function: execute
   *
   * Carries out a change of the root using
   * <GraphModel.rootChanged>.
   */
  const execute = () => {
    setRoot(getPrevious());
    setPrevious(getModel().rootChanged(getPrevious()));
  };

  const me = {
    execute
  };

  return me;
};

/**
 * Class: ChildChange
 *
 * Action to add or remove a child in a model.
 *
 * Constructor: ChildChange
 *
 * Constructs a change of a child in the
 * specified model.
 */
export const ChildChange = (model, parent, child, index) => {
  const [getModel, setModel] = addProp(model);
  const [getParent, setParent] = addProp(parent);
  const [getPrevious, setPrevious] = addProp(parent);
  const [getChild, setChild] = addProp(child);
  const [getIndex, setIndex] = addProp(index);
  const [getPreviousIndex, setPreviousIndex] = addProp(index);

  /**
   * Function: execute
   *
   * Changes the parent of <child> using
   * <GraphModel.parentForCellChanged> and
   * removes or restores the cell's
   * connections.
   */
  const execute = () => {
    const child = getChild();
    const previous = getPrevious();
    const previousIndex = getPreviousIndex();

    if (!child) return;

    let tmp = getModel().getParent(child);
    const tmp2 = tmp ? tmp.getIndex(child) : 0;

    if (!previous) {
      connect(child, false);
    }

    tmp = getModel().parentForCellChanged(child, previous, previousIndex);

    if (previousIndex) {
      connect(child, true);
    }

    setParent(previous);
    setPrevious(tmp);
    setIndex(previousIndex);
    setPreviousIndex(tmp2);
  };

  /**
   * Function: connect
   *
   * Connects/disconnects the given cell recursively from its
   * terminals and stores the previous terminal in the
   * cell's terminals.
   */
  const connect = (cell, isConnect = true) => {
    const source = cell.getTerminal(true);
    const target = cell.getTerminal(false);

    if (source) {
      if (isConnect) getModel().terminalForCellChanged(cell, source, true);
      else getModel().terminalForCellChanged(cell, null, true);
    }

    if (target) {
      if (isConnect) getModel().terminalForCellChanged(cell, target, false);
      else getModel().terminalForCellChanged(cell, null, false);
    }

    cell.setTerminal(source, true);
    cell.setTerminal(target, false);

    const childCount = getModel().getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      connect(getModel().getChildAt(cell, i), isConnect);
    }
  };

  const me = {
    execute
  };

  return me;
};

/**
 * Class: TerminalChange
 *
 * Action to change a terminal in a model.
 *
 * Constructor: TerminalChange
 *
 * Constructs a change of a terminal in the
 * specified model.
 */
export const TerminalChange = (model, cell, terminal, source) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getTerminal, setTerminal] = addProp(terminal);
  const [getPrevious, setPrevious] = addProp(terminal);
  const [getSource, setSource] = addProp(source);

  /**
   * Function: execute
   *
   * Changes the terminal of <cell> to <previous> using
   * <GraphModel.terminalForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setTerminal(getPrevious());
    setPrevious(
      getModel().terminalForCellChanged(getCell(), getPrevious(), getSource())
    );
  };

  const me = {
    execute
  };

  return me;
};

/**
 * Class: ValueChange
 *
 * Action to change a user object in a model.
 *
 * Constructor: ValueChange
 *
 * Constructs a change of a user object in the
 * specified model.
 */
export const ValueChange = (model, cell, value) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getValue, setValue] = addProp(value);
  const [getPrevious, setPrevious] = addProp(value);

  /**
   * Function: execute
   *
   * Changes the value of <cell> to <previous> using
   * <GraphModel.valueForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setValue(getPrevious());
    setPrevious(getModel().valueForCellChanged(getCell(), getPrevious()));
  };

  const me = {
    execute
  };

  return me;
};

/**
 * Class: StyleChange
 *
 * Action to change a cell's style in a model.
 *
 * Constructor: StyleChange
 *
 * Constructs a change of a style in the
 * specified model.
 */
export const StyleChange = (model, cell, style) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getStyle, setStyle] = addProp(style);
  const [getPrevious, setPrevious] = addProp(style);

  /**
   * Function: execute
   *
   * Changes the style of <cell> to <previous> using
   * <GraphModel.styleForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setStyle(getPrevious());
    setPrevious(getModel().styleForCellChanged(getCell(), getPrevious()));
  };

  const me = {
    execute
  };

  return me;
};

/**
 * Class: GeometryChange
 *
 * Action to change a cell's geometry in a model.
 *
 * Constructor: GeometryChange
 *
 * Constructs a change of a geometry in the
 * specified model.
 */
export const GeometryChange = (model, cell, geometry) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getGeometry, setGeometry] = addProp(geometry);
  const [getPrevious, setPrevious] = addProp(geometry);

  /**
   * Function: execute
   *
   * Changes the geometry of <cell> ro <previous> using
   * <GraphModel.geometryForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setGeometry(getPrevious());
    setPrevious(getModel().geometryForCellChanged(getCell(), getPrevious()));
  };

  const me = {
    execute
  };

  return me;
};

/**
 * Class: CollapseChange
 *
 * Action to change a cell's collapsed state in a model.
 *
 * Constructor: CollapseChange
 *
 * Constructs a change of a collapsed state in the
 * specified model.
 */
export const CollapseChange = (model, cell, collapsed) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getCollapsed, setCollapsed] = addProp(collapsed);
  const [getPrevious, setPrevious] = addProp(collapsed);

  /**
   * Function: execute
   *
   * Changes the collapsed state of <cell> to <previous> using
   * <GraphModel.collapsedStateForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setCollapsed(getPrevious());
    setPrevious(
      getModel().collapsedStateForCellChanged(getCell(), getPrevious())
    );
  };

  const me = {
    execute
  };

  return me;
};

/**
 * Class: VisibleChange
 *
 * Action to change a cell's visible state in a model.
 *
 * Constructor: VisibleChange
 *
 * Constructs a change of a visible state in the
 * specified model.
 */
export const VisibleChange = (model, cell, visible) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getVisible, setVisible] = addProp(visible);
  const [getPrevious, setPrevious] = addProp(visible);

  /**
   * Function: execute
   *
   * Changes the visible state of <cell> to <previous> using
   * <GraphModel.visibleStateForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setVisible(getPrevious());
    setPrevious(
      getModel().visibleStateForCellChanged(getCell(), getPrevious())
    );
  };

  const me = {
    execute
  };

  return me;
};

/**
 * Class: CellAttributeChange
 *
 * Action to change the attribute of a cell's user object.
 * There is no method on the graph model that uses this
 * action. To use the action, you can use the code shown
 * in the example below.
 *
 * Example:
 *
 * To change the attributeName in the cell's user object
 * to attributeValue, use the following code:
 *
 * (code)
 * model.beginUpdate();
 * try
 * {
 *   var edit = new CellAttributeChange(
 *     cell, attributeName, attributeValue);
 *   model.execute(edit);
 * }
 * finally
 * {
 *   model.endUpdate();
 * }
 * (end)
 *
 * Constructor: CellAttributeChange
 *
 * Constructs a change of a attribute of the DOM node
 * stored as the value of the given <Cell>.
 */
export const CellAttributeChange = (cell, attribute, value) => {
  const [getCell, setCell] = addProp(cell);
  const [getAttribute, setAttribute] = addProp(attribute);
  const [getValue, setValue] = addProp(value);
  const [getPrevious, setPrevious] = addProp(value);

  /**
   * Function: execute
   *
   * Changes the attribute of the cell's user object by
   * using <Cell.setAttribute>.
   */
  const execute = () => {
    const cell = getCell();

    if (!cell) return;

    const tmp = cell.getAttribute(getAttribute());

    if (!getPrevious()) cell.getValue.removeAttribute(getAttribute());
    else cell.setAttribute(getAttribute(), getPrevious());

    setPrevious(tmp);
  };

  const me = {
    execute
  };

  return me;
};

export default GraphModel;
