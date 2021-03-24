/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from "../../Helpers";

/**
 * Class: StyleChange
 *
 * Action to change a cell's style in a model.
 *
 * Constructor: StyleChange
 *
 * Constructs a change of a style in the
 * specified model.
 */
const StyleChange = (model, cell, style) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getStyle, setStyle] = addProp(style);
  const [getPrevious, setPrevious] = addProp(style);

  /**
   * Function: execute
   *
   * Changes the style of <cell> to <previous> using
   * <GraphModel.styleForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setStyle(getPrevious());
    setPrevious(getModel().styleForCellChanged(getCell(), getPrevious()));
  };

  const me = {
    execute,
    getCell,
  };

  return me;
};

export default makeComponent(StyleChange);
