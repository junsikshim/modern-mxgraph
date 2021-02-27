/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp } from '../Helpers';

/**
 * Class: EventObject
 *
 * The EventObject is a wrapper for all properties of a single event.
 * Additionally, it also offers functions to consume the event and check if it
 * was consumed as follows:
 *
 * (code)
 * evt.consume();
 * INV: evt.isConsumed() == true
 * (end)
 *
 * Constructor: EventObject
 *
 * Constructs a new event object with the specified name. An optional
 * sequence of key, value pairs can be appended to define properties.
 *
 * Example:
 *
 * (code)
 * EventObject("eventName", key1, val1, .., keyN, valN)
 * (end)
 */
const EventObject = (name, ...args) => {
  /**
   * Variable: name
   *
   * Holds the name.
   */
  const [getName, setName] = addProp(name);

  /**
   * Variable: properties
   *
   * Holds the properties as an associative array.
   */
  const [getProperties, setProperties] = addProp([]);

  /**
   * Variable: consumed
   *
   * Holds the consumed state. Default is false.
   */
  const [isConsumed, setIsConsumed] = addProp(false);

  const props = getProperties();

  for (let i = 0; i < args.length; i += 2) {
    if (args[i + 1] !== undefined) {
      props[args[i]] = args[i + 1];
    }
  }

  /**
   * Function: getProperty
   *
   * Returns the property for the given key.
   */
  const getProperty = (key) => getProperties()[key];

  /**
   * Function: consume
   *
   * Consumes the event.
   */
  const consume = () => setIsConsumed(true);

  const me = {
    /**
     * Function: getName
     *
     * Returns <name>.
     */
    getName,

    /**
     * Function: getProperties
     *
     * Returns <properties>.
     */
    getProperties,
    getProperty,

    /**
     * Function: isConsumed
     *
     * Returns true if the event has been consumed.
     */
    isConsumed,
    consume
  };

  return me;
};

export default EventObject;
