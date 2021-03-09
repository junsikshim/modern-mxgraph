/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import EventObject from './EventObject';
import { addProp } from '../Helpers';

/**
 * Class: EventSource
 *
 * Base class for objects that dispatch named events. To create a subclass that
 * inherits from EventSource, the following code is used.
 *
 * (code)
 * function MyClass() { };
 *
 * MyClass.prototype = EventSource();
 * MyClass.prototype.constructor = MyClass;
 * (end)
 *
 * Known Subclasses:
 *
 * <GraphModel>, <Graph>, <GraphView>, <Editor>, <CellOverlay>,
 * <Toolbar>, <Window>
 *
 * Constructor: EventSource
 *
 * Constructs a new event source.
 */
const EventSource = (eventSource) => {
  /**
   * Variable: eventSource
   *
   * Optional source for events. Default is null.
   */
  const [getEventSource, setEventSource] = addProp(eventSource);

  /**
   * Variable: eventListeners
   *
   * Holds the event names and associated listeners in an array. The array
   * contains the event name followed by the respective listener for each
   * registered listener.
   */
  const [getEventListeners, setEventListeners] = addProp([]);

  /**
   * Variable: eventsEnabled
   *
   * Specifies if events can be fired. Default is true.
   */
  const [isEventsEnabled, setEventsEnabled] = addProp(true);

  /**
   * Function: addListener
   *
   * Binds the specified function to the given event name. If no event name
   * is given, then the listener is registered for all events.
   *
   * The parameters of the listener are the sender and an <EventObject>.
   */
  const addListener = (name, f) => {
    const listeners = getEventListeners();

    listeners.push(name);
    listeners.push(f);
  };

  /**
   * Function: removeListener
   *
   * Removes all occurrences of the given listener from <eventListeners>.
   */
  const removeListener = (f) => {
    const listeners = getEventListeners();
    const i = listeners.indexOf(f);

    if (i > 0) listeners.splice(i - 1, 2);
  };

  /**
   * Function: fireEvent
   *
   * Dispatches the given event to the listeners which are registered for
   * the event. The sender argument is optional. The current execution scope
   * ("this") is used for the listener invocation (see <Utils.bind>).
   *
   * Example:
   *
   * (code)
   * fireEvent(new EventObject("eventName", key1, val1, .., keyN, valN))
   * (end)
   *
   * Parameters:
   *
   * evt - <EventObject> that represents the event.
   * sender - Optional sender to be passed to the listener. Default value is
   * the return value of <getEventSource>.
   */
  const fireEvent = (evt, sender) => {
    if (!isEventsEnabled()) return;

    const args = [
      sender ? sender : getEventSource() ? getEventSource() : me,
      evt ? evt : EventObject()
    ];

    const listeners = getEventListeners();
    const name = args[1].getName();

    listeners.forEach((listener, i) => {
      if (!listener || listener === name) listeners[i + 1].apply(me, args);
    });
  };

  const me = {
    /**
     * Function: isEventsEnabled
     *
     * Returns <eventsEnabled>.
     */
    isEventsEnabled,

    /**
     * Function: setEventsEnabled
     *
     * Sets <eventsEnabled>.
     */
    setEventsEnabled,

    /**
     * Function: getEventSource
     *
     * Returns <eventSource>.
     */
    getEventSource,

    /**
     * Function: setEventSource
     *
     * Sets <eventSource>.
     */
    setEventSource,
    addListener,
    removeListener,
    fireEvent
  };

  return me;
};

export default EventSource;
