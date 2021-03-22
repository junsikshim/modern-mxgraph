/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../../Helpers';

/**
 * Class: GeometryChange
 *
 * Action to change a cell's geometry in a model.
 *
 * Constructor: GeometryChange
 *
 * Constructs a change of a geometry in the
 * specified model.
 */
const GeometryChange = (model, cell, geometry) => {
  const [getModel, setModel] = addProp(model);
  const [getCell, setCell] = addProp(cell);
  const [getGeometry, setGeometry] = addProp(geometry);
  const [getPrevious, setPrevious] = addProp(geometry);

  /**
   * Function: execute
   *
   * Changes the geometry of <cell> ro <previous> using
   * <GraphModel.geometryForCellChanged>.
   */
  const execute = () => {
    if (!getCell()) return;

    setGeometry(getPrevious());
    setPrevious(getModel().geometryForCellChanged(getCell(), getPrevious()));
  };

  const me = {
    execute,
    getCell,
    getPrevious,
    getGeometry
  };

  return me;
};

export default makeComponent(GeometryChange);
