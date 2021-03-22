/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../../Helpers';

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
const ValueChange = (model, cell, value) => {
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
    execute,
    getCell
  };

  return me;
};

export default makeComponent(ValueChange);
