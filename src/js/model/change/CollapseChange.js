/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../../Helpers';

/**
 * Class: CollapseChange
 *
 * Action to change a cell's collapsed state in a model.
 *
 * Constructor: CollapseChange
 *
 * Constructs a change of a collapsed state in the
 * specified model.
 */
const CollapseChange = (model, cell, collapsed) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getCollapsed, setCollapsed] = addProp(collapsed);
  const [getPrevious, setPrevious] = addProp(collapsed);

  /**
   * Function: execute
   *
   * Changes the collapsed state of <cell> to <previous> using
   * <GraphModel.collapsedStateForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setCollapsed(getPrevious());
    setPrevious(
      getModel().collapsedStateForCellChanged(getCell(), getPrevious())
    );
  };

  const me = {
    execute,
    getCell
  };

  return me;
};

export default makeComponent(CollapseChange);
