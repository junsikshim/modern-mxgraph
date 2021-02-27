/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { getFunctionName } from './Utils';

/**
 * Variable: counter
 *
 * Current counter.
 */
let counter = 0;

/**
 * Class: ObjectIdentity
 *
 * Identity for JavaScript objects and functions. This is implemented using
 * a simple incrementing counter which is stored in each object under
 * <FIELD_NAME>.
 *
 * The identity for an object does not change during its lifecycle.
 *
 * Variable: FIELD_NAME
 *
 * Name of the field to be used to store the object ID. Default is
 * <code>mxObjectId</code>.
 */
const ObjectIdentity = {
  FIELD_NAME: 'mxObjectId',

  /**
   * Function: get
   *
   * Returns the ID for the given object or function or null if no object
   * is specified.
   */
  get: (obj) => {
    if (!obj) return null;

    if (obj[ObjectIdentity.FIELD_NAME] === null) {
      if (typeof obj === 'object') {
        const ctor = getFunctionName(obj);
        obj[ObjectIdentity.FIELD_NAME] = `${ctor}#${counter++}`;
      } else if (typeof obj === 'function') {
        obj[ObjectIdentity.FIELD_NAME] = `Function#${counter++}`;
      }
    }

    return obj[ObjectIdentity.FIELD_NAME];
  },

  /**
   * Function: clear
   *
   * Deletes the ID from the given object or function.
   */
  clear: (obj) => {
    if (typeof obj === 'object' || typeof obj === 'function')
      delete obj[ObjectIdentity.FIELD_NAME];
  }
};

export default ObjectIdentity;
