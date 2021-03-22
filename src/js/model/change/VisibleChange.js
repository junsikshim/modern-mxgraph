/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../../Helpers';

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
const VisibleChange = (model, cell, visible) => {
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
    execute,
    getCell
  };

  return me;
};

export default makeComponent(VisibleChange);
