/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet, makeComponent } from '../Helpers';
import Event from '../util/Event';
import EventObject from '../util/EventObject';
import EventSource from '../util/EventSource';
import UndoableEdit from '../util/UndoableEdit';

/**
 * Class: GraphSelectionModel
 *
 * Implements the selection model for a graph. Here is a listener that handles
 * all removed selection cells.
 *
 * (code)
 * graph.getSelectionModel().addListener(mxEvent.CHANGE, function(sender, evt)
 * {
 *   var cells = evt.getProperty('added');
 *
 *   for (var i = 0; i < cells.length; i++)
 *   {
 *     // Handle cells[i]...
 *   }
 * });
 * (end)
 *
 * Event: Event.UNDO
 *
 * Fires after the selection was changed in <changeSelection>. The
 * <code>edit</code> property contains the <mxUndoableEdit> which contains the
 * <mxSelectionChange>.
 *
 * Event: Event.CHANGE
 *
 * Fires after the selection changes by executing an <mxSelectionChange>. The
 * <code>added</code> and <code>removed</code> properties contain arrays of
 * cells that have been added to or removed from the selection, respectively.
 * The names are inverted due to historic reasons. This cannot be changed.
 *
 * Constructor: GraphSelectionModel
 *
 * Constructs a new graph selection model for the given <mxGraph>.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
const GraphSelectionModel = (graph) => {
  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);
  const [getCells, _setCells] = addProp([]);

  /**
   * Variable: singleSelection
   *
   * Specifies if only one selected item at a time is allowed.
   * Default is false.
   */
  const [isSingleSelection, setSingleSelection] = addProp(false);

  /**
   * Function: isSelected
   *
   * Returns true if the given <mxCell> is selected.
   */
  const isSelected = (cell) => {
    if (isSet(cell)) {
      return getCells().indexOf(cell) >= 0;
    }

    return false;
  };

  /**
   * Function: isEmpty
   *
   * Returns true if no cells are currently selected.
   */
  const isEmpty = () => getCells().length === 0;

  /**
   * Function: clear
   *
   * Clears the selection and fires a <change> event if the selection was not
   * empty.
   */
  const clear = () => changeSelection(undefined, getCells());

  /**
   * Function: setCell
   *
   * Selects the specified <mxCell> using <setCells>.
   *
   * Parameters:
   *
   * cell - <mxCell> to be selected.
   */
  const setCell = (cell) => {
    if (isSet(cell)) setCells([cell]);
  };

  /**
   * Function: setCells
   *
   * Selects the given array of <mxCells> and fires a <change> event.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be selected.
   */
  const setCells = (cells) => {
    if (isSet(cells)) {
      if (isSingleSelection()) {
        cells = [getFirstSelectableCell(cells)];
      }

      const tmp = [];

      for (let i = 0; i < cells.length; i++) {
        if (getGraph().isCellSelectable(cells[i])) {
          tmp.push(cells[i]);
        }
      }

      changeSelection(tmp, getCells());
    }
  };

  /**
   * Function: getFirstSelectableCell
   *
   * Returns the first selectable cell in the given array of cells.
   */
  const getFirstSelectableCell = (cells) => {
    if (isSet(cells)) {
      for (let i = 0; i < cells.length; i++) {
        if (getGraph().isCellSelectable(cells[i])) {
          return cells[i];
        }
      }
    }

    return;
  };

  /**
   * Function: addCell
   *
   * Adds the given <mxCell> to the selection and fires a <select> event.
   *
   * Parameters:
   *
   * cell - <mxCell> to add to the selection.
   */
  const addCell = (cell) => {
    if (isSet(cell)) addCells([cell]);
  };

  /**
   * Function: addCells
   *
   * Adds the given array of <mxCells> to the selection and fires a <select>
   * event.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to add to the selection.
   */
  const addCells = (cells) => {
    if (isSet(cells)) {
      let remove;

      if (isSingleSelection()) {
        remove = getCells();
        cells = [getFirstSelectableCell(cells)];
      }

      const tmp = [];

      for (let i = 0; i < cells.length; i++) {
        if (!isSelected(cells[i]) && getGraph().isCellSelectable(cells[i])) {
          tmp.push(cells[i]);
        }
      }

      changeSelection(tmp, remove);
    }
  };

  /**
   * Function: removeCell
   *
   * Removes the specified <mxCell> from the selection and fires a <select>
   * event for the remaining cells.
   *
   * Parameters:
   *
   * cell - <mxCell> to remove from the selection.
   */
  const removeCell = (cell) => {
    if (isSet(cell)) removeCells([cell]);
  };

  /**
   * Function: removeCells
   */
  const removeCells = (cells) => {
    if (isSet(cells)) {
      const tmp = [];

      for (let i = 0; i < cells.length; i++) {
        if (isSelected(cells[i])) {
          tmp.push(cells[i]);
        }
      }

      changeSelection(undefined, tmp);
    }
  };

  /**
   * Function: changeSelection
   *
   * Adds/removes the specified arrays of <mxCell> to/from the selection.
   *
   * Parameters:
   *
   * added - Array of <mxCell> to add to the selection.
   * remove - Array of <mxCell> to remove from the selection.
   */
  const changeSelection = (added = [], removed = []) => {
    if (
      (added.length > 0 && isSet(added[0])) ||
      (removed.length > 0 && isSet(removed[0]))
    ) {
      const change = SelectionChange(me, added, removed);
      change.execute();
      const edit = UndoableEdit(me, false);
      edit.add(change);
      fireEvent(EventObject(Event.UNDO, 'edit', edit));
    }
  };

  /**
   * Function: cellAdded
   *
   * Inner callback to add the specified <mxCell> to the selection. No event
   * is fired in this implementation.
   *
   * Paramters:
   *
   * cell - <mxCell> to add to the selection.
   */
  const cellAdded = (cell) => {
    if (isSet(cell) && !isSelected(cell)) {
      getCells().push(cell);
    }
  };

  /**
   * Function: cellRemoved
   *
   * Inner callback to remove the specified <mxCell> from the selection. No
   * event is fired in this implementation.
   *
   * Parameters:
   *
   * cell - <mxCell> to remove from the selection.
   */
  const cellRemoved = (cell) => {
    if (isSet(cell)) {
      const index = getCells().indexOf(cell);

      if (index >= 0) {
        getCells().splice(index, 1);
      }
    }
  };

  const { fireEvent, addListener } = EventSource();

  const me = {
    fireEvent,
    addListener,

    /**
     * Function: isSingleSelection
     *
     * Returns <singleSelection> as a boolean.
     */
    isSingleSelection,

    /**
     * Function: setSingleSelection
     *
     * Sets the <singleSelection> flag.
     *
     * Parameters:
     *
     * singleSelection - Boolean that specifies the new value for
     * <singleSelection>.
     */
    setSingleSelection,
    isSelected,
    isEmpty,
    clear,
    setCell,
    setCells,
    getFirstSelectableCell,
    addCell,
    addCells,
    removeCell,
    removeCells,
    changeSelection,
    cellAdded,
    cellRemoved,
    getCells
  };

  return me;
};

/**
 * Class: SelectionChange
 *
 * Action to change the current root in a view.
 *
 * Constructor: SelectionChange
 *
 * Constructs a change of the current root in the given view.
 */
const SelectionChange = (selectionModel, added = [], removed = []) => {
  const [getSelectionModel, setSelectionModel] = addProp(selectionModel);
  const [getAdded, setAdded] = addProp(added.slice());
  const [getRemoved, setRemoved] = addProp(removed.slice());

  /**
   * Function: execute
   *
   * Changes the current root of the view.
   */
  const execute = () => {
    for (let i = 0; i < getRemoved().length; i++) {
      getSelectionModel().cellRemoved(getRemoved()[i]);
    }

    for (let i = 0; i < getAdded().length; i++) {
      getSelectionModel().cellAdded(getAdded()[i]);
    }

    const tmp = getAdded();
    setAdded(getRemoved());
    setRemoved(tmp);

    getSelectionModel().fireEvent(
      EventObject(Event.CHANGE, 'added', getAdded(), 'removed', getRemoved())
    );
  };

  return {
    execute
  };
};

export default makeComponent(GraphSelectionModel);
