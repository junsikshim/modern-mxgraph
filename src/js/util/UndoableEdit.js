/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import Event from './Event';
import EventObject from './EventObject';
import { addProp } from '../Helpers';

/**
 * Class: UndoableEdit
 *
 * Implements a composite undoable edit. Here is an example for a custom change
 * which gets executed via the model:
 *
 * (code)
 * function CustomChange(model, name)
 * {
 *   this.model = model;
 *   this.name = name;
 *   this.previous = name;
 * };
 *
 * CustomChange.prototype.execute = function()
 * {
 *   var tmp = this.model.name;
 *   this.model.name = this.previous;
 *   this.previous = tmp;
 * };
 *
 * var name = prompt('Enter name');
 * graph.model.execute(new CustomChange(graph.model, name));
 * (end)
 *
 * Event: Event.EXECUTED
 *
 * Fires between START_EDIT and END_EDIT after an atomic change was executed.
 * The <code>change</code> property contains the change that was executed.
 *
 * Event: Event.START_EDIT
 *
 * Fires before a set of changes will be executed in <undo> or <redo>.
 * This event contains no properties.
 *
 * Event: Event.END_EDIT
 *
 * Fires after a set of changeswas executed in <undo> or <redo>.
 * This event contains no properties.
 *
 * Constructor: UndoableEdit
 *
 * Constructs a new undoable edit for the given source.
 */
const UndoableEdit = (source = null, significant = true) => {
  /**
   * Variable: source
   *
   * Specifies the source of the edit.
   */
  const [getSource, setSource] = addProp(source);

  /**
   * Variable: changes
   *
   * Array that contains the changes that make up this edit. The changes are
   * expected to either have an undo and redo function, or an execute
   * function. Default is an empty array.
   */
  const [getChanges, setChanges] = addProp([]);

  /**
   * Variable: significant
   *
   * Specifies if the undoable change is significant.
   * Default is true.
   */
  const [isSignificant, setSignificant] = addProp(significant);

  /**
   * Variable: undone
   *
   * Specifies if this edit has been undone. Default is false.
   */
  const [isUndone, setUndone] = addProp(false);

  /**
   * Variable: redone
   *
   * Specifies if this edit has been redone. Default is false.
   */
  const [isRedone, setRedone] = addProp(false);

  /**
   * Function: isEmpty
   *
   * Returns true if the this edit contains no changes.
   */
  const isEmpty = getChanges().length === 0;

  /**
   * Function: add
   *
   * Adds the specified change to this edit. The change is an object that is
   * expected to either have an undo and redo, or an execute function.
   */
  const add = (change) => getChanges().push(change);

  /**
   * Function: notify
   *
   * Hook to notify any listeners of the changes after an <undo> or <redo>
   * has been carried out. This implementation is empty.
   */
  const notify = () => {};

  /**
   * Function: die
   *
   * Hook to free resources after the edit has been removed from the command
   * history. This implementation is empty.
   */
  const die = () => {};

  /**
   * Function: undo
   *
   * Undoes all changes in this edit.
   */
  const undo = () => {
    if (!isUndone()) {
      const source = getSource();
      source.fireEvent(EventObject(Event.START_EDIT));

      for (const change of getChanges()) {
        if (change.execute) change.execute();
        else if (change.undo) change.undo();

        // New global executed event
        source.fireEvent(EventObject(Event.EXECUTED, 'change', change));
      }

      setUndone(true);
      setRedone(false);
      source.fireEvent(EventObject(Event.END_EDIT));
    }

    me.notify();
  };

  /**
   * Function: redo
   *
   * Redoes all changes in this edit.
   */
  const redo = () => {
    if (!isRedone()) {
      const source = getSource();
      source.fireEvent(EventObject(Event.START_EDIT));

      for (const change of getChanges()) {
        if (change.execute) change.execute();
        else if (change.redo) change.redo();

        // New global executed event
        source.fireEvent(EventObject(Event.EXECUTED, 'change', change));
      }

      setUndone(false);
      setRedone(true);
      source.fireEvent(EventObject(Event.END_EDIT));
    }

    me.notify();
  };

  const me = {
    isEmpty,
    getSource,
    getChanges,

    /**
     * Function: isSignificant
     *
     * Returns <significant>.
     */
    isSignificant,
    add,
    notify,
    die,
    undo,
    redo
  };

  return me;
};

export default UndoableEdit;
