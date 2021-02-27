/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import Client from '../Client';
import { isAncestorNode } from './Utils';
import { addProp, isSet } from '../Helpers';

/**
 * Class: MouseEvent
 *
 * Base class for all mouse events in Graph. A listener for this event should
 * implement the following methods:
 *
 * (code)
 * graph.addMouseListener(
 * {
 *   mouseDown: function(sender, evt)
 *   {
 *     Log.debug('mouseDown');
 *   },
 *   mouseMove: function(sender, evt)
 *   {
 *     Log.debug('mouseMove');
 *   },
 *   mouseUp: function(sender, evt)
 *   {
 *     Log.debug('mouseUp');
 *   }
 * });
 * (end)
 *
 * Constructor: MouseEvent
 *
 * Constructs a new event object for the given arguments.
 *
 * Parameters:
 *
 * evt - Native mouse event.
 * state - Optional <CellState> under the mouse.
 *
 */
const MouseEvent = (evt, state) => {
  /**
   * Variable: event
   *
   * Holds the inner event object.
   */
  const [getEvent, setEvent] = addProp(evt);

  /**
   * Variable: state
   *
   * Holds the optional <CellState> associated with this event.
   */
  const [getState, setState] = addProp(state);

  /**
   * Variable: sourceState
   *
   * Holds the <CellState> that was passed to the constructor. This can be
   * different from <state> depending on the result of <Graph.getEventState>.
   */
  const [getSourceState, setSourceState] = addProp(state);

  /**
   * Variable: consumed
   *
   * Holds the consumed state of this event.
   */
  const [isConsumed, setConsumed] = addProp(false);

  /**
   * Variable: graphX
   *
   * Holds the x-coordinate of the event in the graph. This value is set in
   * <Graph.fireMouseEvent>.
   */
  const [getGraphX, setGraphX] = addProp();

  /**
   * Variable: graphY
   *
   * Holds the y-coordinate of the event in the graph. This value is set in
   * <Graph.fireMouseEvent>.
   */
  const [getGraphY, setGraphY] = addProp();

  /**
   * Function: getSource
   *
   * Returns the target DOM element using <Event.getSource> for <event>.
   */
  const getSource = () => Event.getSource(getEvent());

  /**
   * Function: isSource
   *
   * Returns true if the given <Shape> is the source of <event>.
   */
  const isSource = (shape) =>
    isSet(shape) ? isAncestorNode(shape.getNode(), getSource()) : false;

  /**
   * Function: getX
   *
   * Returns <event.clientX>.
   */
  const getX = () => Event.getClientX(getEvent());

  /**
   * Function: getY
   *
   * Returns <event.clientY>.
   */
  const getY = () => Event.getClientY(getEvent());

  /**
   * Function: getCell
   *
   * Returns the <Cell> in <state> is not null.
   */
  const getCell = () => (getState() ? getState().getCell() : null);

  /**
   * Function: isPopupTrigger
   *
   * Returns true if the event is a popup trigger.
   */
  const isPopupTrigger = () => Event.isPopupTrigger(getEvent());

  /**
   * Function: consume
   *
   * Sets <consumed> to true and invokes preventDefault on the native event
   * if such a method is defined. This is used mainly to avoid the cursor from
   * being changed to a text cursor in Webkit. You can use the preventDefault
   * flag to disable this functionality.
   *
   * Parameters:
   *
   * preventDefault - Specifies if the native event should be canceled. Default
   * is true.
   */
  const consume = (preventDefault) => {
    const evt = getEvent();
    const pd = isSet(preventDefault)
      ? preventDefault
      : isSet(evt.touches) || Event.isMouseEvent(evt);

    if (pd && evt.preventDefault) evt.preventDefault();

    // Workaround for images being dragged in IE
    // Does not change returnValue in Opera
    if (Client.IS_IE) evt.returnValue = true;

    // Sets local consumed state
    setConsumed(true);
  };

  const me = {
    /**
     * Function: getEvent
     *
     * Returns <event>.
     */
    getEvent,

    /**
     * Function: getState
     *
     * Returns <state>.
     */
    getState,
    getSourceState,

    /**
     * Function: isConsumed
     *
     * Returns <consumed>.
     */
    isConsumed,
    setConsumed,

    /**
     * Function: getGraphX
     *
     * Returns <graphX>.
     */
    getGraphX,

    /**
     * Function: getGraphY
     *
     * Returns <graphY>.
     */
    getGraphY,

    getSource,

    isSource,

    getX,
    getY,
    getCell,
    isPopupTrigger,
    consume
  };

  return me;
};

export default MouseEvent;
