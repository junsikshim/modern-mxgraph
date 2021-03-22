/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../../Helpers';

/**
 * Class: CellAttributeChange
 *
 * Action to change the attribute of a cell's user object.
 * There is no method on the graph model that uses this
 * action. To use the action, you can use the code shown
 * in the example below.
 *
 * Example:
 *
 * To change the attributeName in the cell's user object
 * to attributeValue, use the following code:
 *
 * (code)
 * model.beginUpdate();
 * try
 * {
 *   var edit = new CellAttributeChange(
 *     cell, attributeName, attributeValue);
 *   model.execute(edit);
 * }
 * finally
 * {
 *   model.endUpdate();
 * }
 * (end)
 *
 * Constructor: CellAttributeChange
 *
 * Constructs a change of a attribute of the DOM node
 * stored as the value of the given <Cell>.
 */
const CellAttributeChange = (cell, attribute, value) => {
  const [getCell, setCell] = addProp(cell);
  const [getAttribute, setAttribute] = addProp(attribute);
  const [getValue, setValue] = addProp(value);
  const [getPrevious, setPrevious] = addProp(value);

  /**
   * Function: execute
   *
   * Changes the attribute of the cell's user object by
   * using <Cell.setAttribute>.
   */
  const execute = () => {
    const cell = getCell();

    if (!cell) return;

    const tmp = cell.getAttribute(getAttribute());

    if (!getPrevious()) cell.getValue.removeAttribute(getAttribute());
    else cell.setAttribute(getAttribute(), getPrevious());

    setPrevious(tmp);
  };

  const me = {
    execute,
    getCell
  };

  return me;
};

export default makeComponent(CellAttributeChange);
