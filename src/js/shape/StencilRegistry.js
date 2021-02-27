/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 *
 * Code to add stencils.
 *
 * (code)
 * var req = mxUtils.load('test/stencils.xml');
 * var root = req.getDocumentElement();
 * var shape = root.firstChild;
 *
 * while (shape != null)
 * {
 * 	 if (shape.nodeType == mxConstants.NODETYPE_ELEMENT)
 *   {
 *     mxStencilRegistry.addStencil(shape.getAttribute('name'), new mxStencil(shape));
 *   }
 *
 *   shape = shape.nextSibling;
 * }
 * (end)
 */

const stencils = {};

/**
 * Class: StencilRegistry
 *
 * A singleton class that provides a registry for stencils and the methods
 * for painting those stencils onto a canvas or into a DOM.
 */
const StencilRegistry = {
  /**
   * Function: addStencil
   *
   * Adds the given <Stencil>.
   */
  addStencil: (name, stencil) => (stencils[name] = stencil),

  /**
   * Function: getStencil
   *
   * Returns the <Stencil> for the given name.
   */
  getStencil: (name) => stencils[name]
};

export default StencilRegistry;
