/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet } from '../Helpers';
import Dictionary from '../util/Dictionary';
import Event from '../util/Event';
import EventObject from '../util/EventObject';
import EventSource from '../util/EventSource';
import { sortCells } from '../util/Utils';

/**
 * Class: SelectionCellsHandler
 *
 * An event handler that manages cell handlers and invokes their mouse event
 * processing functions.
 *
 * Group: Events
 *
 * Event: Event.ADD
 *
 * Fires if a cell has been added to the selection. The <code>state</code>
 * property contains the <mxCellState> that has been added.
 *
 * Event: Event.REMOVE
 *
 * Fires if a cell has been remove from the selection. The <code>state</code>
 * property contains the <mxCellState> that has been removed.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
const SelectionCellsHandler = (graph) => {
  const { fireEvent } = EventSource();

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: refreshHandler
   *
   * Keeps a reference to an event listener for later removal.
   */
  const [getRefreshHandler, setRefreshHandler] = addProp();

  /**
   * Variable: maxHandlers
   *
   * Defines the maximum number of handlers to paint individually. Default is 100.
   */
  const [getMaxHandlers, setMaxHandlers] = addProp(100);

  /**
   * Variable: handlers
   *
   * <mxDictionary> that maps from cells to handlers.
   */
  const [getHandlers, setHandlers] = addProp(Dictionary());

  const getHandler = (cell) => getHandlers().get(cell);

  const isHandled = (cell) => isSet(getHandler(cell));

  /**
   * Function: reset
   *
   * Resets all handlers.
   */
  const reset = () => getHandlers.visit((key, handler) => handler.reset());

  /**
   * Function: getHandledSelectionCells
   *
   * Reloads or updates all handlers.
   */
  const getHandledSelectionCells = () => getGraph().getSelectionCells();

  /**
   * Function: refresh
   *
   * Reloads or updates all handlers.
   */
  const refresh = () => {
    // Removes all existing handlers
    const oldHandlers = getHandlers();
    setHandlers(Dictionary());

    // Creates handles for all selection cells
    const tmp = sortCells(getHandledSelectionCells(), false);

    // Destroys or updates old handlers
    for (let i = 0; i < tmp.length; i++) {
      const state = getGraph().getView().getState(tmp[i]);

      if (isSet(state)) {
        let handler = oldHandlers.remove(tmp[i]);

        if (isSet(handler)) {
          if (handler.getState() !== state) {
            handler.destroy();
            handler = null;
          } else if (!isHandlerActive(handler)) {
            if (isSet(handler.refresh)) {
              handler.refresh();
            }

            handler.redraw();
          }
        }

        if (isSet(handler)) {
          getHandlers().put(tmp[i], handler);
        }
      }
    }

    // Destroys unused handlers
    oldHandlers.visit((key, handler) => {
      fireEvent(EventObject(Event.REMOVE, 'state', handler.getState()));
      handler.destroy();
    });

    // Creates new handlers and updates parent highlight on existing handlers
    for (let i = 0; i < tmp.length; i++) {
      const state = getGraph().getView().getState(tmp[i]);

      if (isSet(state)) {
        const handler = getHandlers().get(tmp[i]);

        if (isUnset(handler)) {
          handler = getGraph().createHandler(state);
          fireEvent(EventObject(Event.ADD, 'state', state));
          getHandlers().put(tmp[i], handler);
        } else {
          handler.updateParentHighlight();
        }
      }
    }
  };

  /**
   * Function: isHandlerActive
   *
   * Returns true if the given handler is active and should not be redrawn.
   */
  const isHandlerActive = (handler) => isSet(handler.getIndex());

  /**
   * Function: updateHandler
   *
   * Updates the handler for the given shape if one exists.
   */
  const updateHandler = (state) => {
    let handler = getHandlers().remove(state.getCell());

    if (isSet(handler)) {
      // Transfers the current state to the new handler
      const index = handler.getIndex();
      const x = handler.getStartX();
      const y = handler.getStartY();

      handler.destroy();
      handler = getGraph().createHandler(state);

      if (isSet(handler)) {
        getHandlers().put(state.getCell(), handler);

        if (isSet(index) && isSet(x) && isSet(y)) {
          handler.start(x, y, index);
        }
      }
    }
  };

  /**
   * Function: mouseDown
   *
   * Redirects the given event to the handlers.
   */
  const mouseDown = (sender, mE) => {
    if (getGraph().isEnabled() && isEnabled()) {
      const args = [sender, mE];

      getHandlers().visit((key, handler) => handler.mouseDown(args));
    }
  };

  /**
   * Function: mouseMove
   *
   * Redirects the given event to the handlers.
   */
  const mouseMove = (sender, mE) => {
    if (getGraph().isEnabled() && isEnabled()) {
      const args = [sender, mE];

      getHandlers().visit((key, handler) => handler.mouseMove(args));
    }
  };

  /**
   * Function: mouseUp
   *
   * Redirects the given event to the handlers.
   */
  const mouseUp = (sender, mE) => {
    if (getGraph().isEnabled() && isEnabled()) {
      const args = [sender, mE];

      getHandlers().visit((key, handler) => handler.mouseUp(args));
    }
  };

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  const destroy = () => {
    const graph = getGraph();
    graph.removeMouseListener(this);

    const handler = getRefreshHandler();

    if (isSet(handler)) {
      graph.getSelectionModel().removeListener(handler);
      graph.getModel().removeListener(handler);
      graph.getView().removeListener(handler);
      setRefreshHandler();
    }
  };

  const me = {
    /**
     * Function: isEnabled
     *
     * Returns <enabled>.
     */
    isEnabled,

    /**
     * Function: setEnabled
     *
     * Sets <enabled>.
     */
    setEnabled,

    /**
     * Function: getHandler
     *
     * Returns the handler for the given cell.
     */
    getHandler,

    /**
     * Function: isHandled
     *
     * Returns true if the given cell has a handler.
     */
    isHandled,
    reset,
    getHandledSelectionCells,
    refresh,
    isHandlerActive,
    updateHandler,
    mouseDown,
    mouseMove,
    mouseUp,
    destroy
  };

  return me;
};

export default SelectionCellsHandler;
