/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../../Helpers';

/**
 * Class: TerminalChange
 *
 * Action to change a terminal in a model.
 *
 * Constructor: TerminalChange
 *
 * Constructs a change of a terminal in the
 * specified model.
 */
const TerminalChange = (model, cell, terminal, source) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getTerminal, setTerminal] = addProp(terminal);
  const [getPrevious, setPrevious] = addProp(terminal);
  const [getSource, setSource] = addProp(source);

  /**
   * Function: execute
   *
   * Changes the terminal of <cell> to <previous> using
   * <GraphModel.terminalForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setTerminal(getPrevious());
    setPrevious(
      getModel().terminalForCellChanged(getCell(), getPrevious(), getSource())
    );
  };

  const me = {
    execute,
    getCell,
    getPrevious
  };

  return me;
};

export default makeComponent(TerminalChange);
