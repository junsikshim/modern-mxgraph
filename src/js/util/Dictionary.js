/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import ObjectIdentity from './ObjectIdentity';
import { addProp } from '../Helpers';

/**
 * Class: Dictionary
 *
 * A wrapper class for an associative array with object keys. Note: This
 * implementation uses <ObjectIdentitiy> to turn object keys into strings.
 *
 * Constructs a new dictionary which allows object to be used as keys.
 */
const Dictionary = () => {
  /**
   * Value: map
   *
   * Stores the (key, value) pairs in this dictionary.
   */
  const [getMap, setMap] = addProp({});

  /**
   * Function: clear
   *
   * Clears the dictionary.
   */
  const clear = () => setMap({});

  /**
   * Function: get
   *
   * Returns the value for the given key.
   */
  const get = (key) => {
    const id = ObjectIdentity.get(key);
    return getMap()[id];
  };

  /**
   * Function: put
   *
   * Stores the value under the given key and returns the previous
   * value for that key.
   */
  const put = (key, value) => {
    const id = ObjectIdentity.get(key);
    const previous = getMap()[id];
    getMap()[id] = value;

    return previous;
  };

  /**
   * Function: remove
   *
   * Removes the value for the given key and returns the value that
   * has been removed.
   */
  const remove = (key) => {
    const id = ObjectIdentity.get(key);
    const previous = getMap()[id];
    delete getMap()[id];

    return previous;
  };

  /**
   * Function: getKeys
   *
   * Returns all keys as an array.
   */
  const getKeys = () => Object.keys(getMap());

  /**
   * Function: getValues
   *
   * Returns all values as an array.
   */
  const getValues = () => Object.values(getMap());

  /**
   * Function: visit
   *
   * Visits all entries in the dictionary using the given function with the
   * following signature: function(key, value) where key is a string and
   * value is an object.
   *
   * Parameters:
   *
   * visitor - A function that takes the key and value as arguments.
   */
  const visit = (visitor) => {
    const map = getMap();

    for (const key in map) {
      visitor(key, map[key]);
    }
  };

  const me = {
    clear,
    get,
    put,
    remove,
    getKeys,
    getValues,
    visit
  };

  return me;
};

export default Dictionary;
