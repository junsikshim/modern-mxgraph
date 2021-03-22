/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../../Helpers';

/**
 * Class: ChildChange
 *
 * Action to add or remove a child in a model.
 *
 * Constructor: ChildChange
 *
 * Constructs a change of a child in the
 * specified model.
 */
const ChildChange = (model, parent, child, index) => {
  const [getModel, setModel] = addProp(model);
  const [getParent, setParent] = addProp(parent);
  const [getPrevious, setPrevious] = addProp(parent);
  const [getChild, setChild] = addProp(child);
  const [getIndex, setIndex] = addProp(index);
  const [getPreviousIndex, setPreviousIndex] = addProp(index);

  /**
   * Function: execute
   *
   * Changes the parent of <child> using
   * <GraphModel.parentForCellChanged> and
   * removes or restores the cell's
   * connections.
   */
  const execute = () => {
    const child = getChild();
    const previous = getPrevious();
    const previousIndex = getPreviousIndex();

    if (!child) return;

    let tmp = getModel().getParent(child);
    const tmp2 = tmp ? tmp.getIndex(child) : 0;

    if (!previous) {
      connect(child, false);
    }

    tmp = getModel().parentForCellChanged(child, previous, previousIndex);

    if (previousIndex) {
      connect(child, true);
    }

    setParent(previous);
    setPrevious(tmp);
    setIndex(previousIndex);
    setPreviousIndex(tmp2);
  };

  /**
   * Function: connect
   *
   * Connects/disconnects the given cell recursively from its
   * terminals and stores the previous terminal in the
   * cell's terminals.
   */
  const connect = (cell, isConnect = true) => {
    const source = cell.getTerminal(true);
    const target = cell.getTerminal(false);

    if (source) {
      if (isConnect) getModel().terminalForCellChanged(cell, source, true);
      else getModel().terminalForCellChanged(cell, undefined, true);
    }

    if (target) {
      if (isConnect) getModel().terminalForCellChanged(cell, target, false);
      else getModel().terminalForCellChanged(cell, undefined, false);
    }

    cell.setTerminal(source, true);
    cell.setTerminal(target, false);

    const childCount = getModel().getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      connect(getModel().getChildAt(cell, i), isConnect);
    }
  };

  const me = {
    execute,
    getChild,
    getPrevious
  };

  return me;
};

export default makeComponent(ChildChange);
