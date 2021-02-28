/**
 * Copyright (c) 2006-2017, JGraph Ltd
 * Copyright (c) 2006-2017, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet, isUnset } from '../Helpers';

/**
 * Class: TemporaryCellStates
 *
 * Creates a temporary set of cell states.
 */
const TemporaryCellStates = (
  view,
  scale = 1,
  cells,
  isCellVisibleFn,
  getLinkForCellState
) => {
  /**
   * Variable: view
   */
  const [getView, setView] = addProp(view);

  // Stores the previous state
  const [getOldValidateCellState, setOldValidateCellState] = addProp(
    view.getValidateCellState()
  );

  /**
   * Variable: oldBounds
   */
  const [getOldBounds, setOldBounds] = addProp(view.getGraphBounds());

  /**
   * Variable: oldStates
   */
  const [getOldStates, setOldStates] = addProp(view.getStates());

  /**
   * Variable: oldScale
   */
  const [getOldScale, setOldScale] = addProp(view.getScale());
  const [getOldDoRedrawShape, setOldDoRedrawShape] = addProp(
    view.getGraph().getCellRenderer().doRedrawShape
  );

  /**
   * Function: destroy
   */
  const destroy = () => {
    const view = getView();
    view.setScale(getOldScale());
    view.setStates(getOldStates());
    view.setGraphBounds(getOldBounds());
    view.validateCellState = getOldValidateCellState();
    view.getGraph().getCellRenderer().doRedrawShape = getOldDoRedrawShape();
  };

  const me = {
    destroy
  };

  // Overrides doRedrawShape and paint shape to add links on shapes
  if (isSet(getLinkForCellState)) {
    view.getGraph().getCellRenderer().doRedrawShape = (state) => {
      const oldPaint = state.getShape().paint;

      state.getShape().paint = (c) => {
        const link = getLinkForCellState(state);

        if (isSet(link)) c.setLink(link);

        oldPaint();

        if (isSet(link)) c.setLink(null);
      };

      view.getGraph().getCellRenderer().getOldDoRedrawShape()(state);
      state.getShape().paint = oldPaint;
    };
  }

  // Overrides validateCellState to ignore invisible cells
  view.validateCellState = (cell, recurse) =>
    isUnset(cell) || isUnset(isCellVisibleFn) || isCellVisibleFn(cell)
      ? view.getOldValidateCellState(cell, recurse)
      : null;

  // Creates space for new states
  view.setStates(Dictionary());
  view.setScale(scale);

  if (isSet(cells)) {
    view.resetValidationState();
    let bbox = null;

    // Validates the vertices and edges without adding them to
    // the model so that the original cells are not modified
    for (let i = 0; i < cells.length; i++) {
      const bounds = view.getBoundingBox(
        view.validateCellState(view.validateCell(cells[i]))
      );

      if (isUnset(bbox)) {
        bbox = bounds;
      } else {
        bbox.add(bounds);
      }
    }

    view.setGraphBounds(bbox || Rectangle());
  }

  return me;
};

export default TemporaryCellStates;
