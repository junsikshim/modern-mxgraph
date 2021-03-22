/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, makeComponent } from '../../Helpers';

/**
 * Class: RootChange
 *
 * Action to change the root in a model.
 *
 * Constructor: RootChange
 *
 * Constructs a change of the root in the
 * specified model.
 */
const RootChange = (model, root) => {
  const [getModel, setModel] = addProp(model);
  const [getRoot, setRoot] = addProp(root);
  const [getPrevious, setPrevious] = addProp(root);

  /**
   * Function: execute
   *
   * Carries out a change of the root using
   * <GraphModel.rootChanged>.
   */
  const execute = () => {
    setRoot(getPrevious());
    setPrevious(getModel().rootChanged(getPrevious()));
  };

  const me = {
    execute
  };

  return me;
};

export default makeComponent(RootChange);
