/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet } from '../Helpers';
import {
  DEFAULT_HOTSPOT,
  MAX_HOTSPOT_SIZE,
  MIN_HOTSPOT_SIZE
} from '../util/Constants';
import Event from '../util/Event';
import EventObject from '../util/EventObject';
import EventSource from '../util/EventSource';
import CellHighlight from './CellHighlight';

/**
 * Class: CellMarker
 *
 * A helper class to process mouse locations and highlight cells.
 *
 * Helper class to highlight cells. To add a cell marker to an existing graph
 * for highlighting all cells, the following code is used:
 *
 * (code)
 * var marker = new mxCellMarker(graph);
 * graph.addMouseListener({
 *   mouseDown: function() {},
 *   mouseMove: function(sender, me)
 *   {
 *     marker.process(me);
 *   },
 *   mouseUp: function() {}
 * });
 * (end)
 *
 * Event: mxEvent.MARK
 *
 * Fires after a cell has been marked or unmarked. The <code>state</code>
 * property contains the marked <mxCellState> or null if no state is marked.
 *
 * Constructor: mxCellMarker
 *
 * Constructs a new cell marker.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * validColor - Optional marker color for valid states. Default is
 * <mxConstants.DEFAULT_VALID_COLOR>.
 * invalidColor - Optional marker color for invalid states. Default is
 * <mxConstants.DEFAULT_INVALID_COLOR>.
 * hotspot - Portion of the width and hight where a state intersects a
 * given coordinate pair. A value of 0 means always highlight. Default is
 * <mxConstants.DEFAULT_HOTSPOT>.
 */
const CellMarker = (
  graph,
  validColor,
  invalidColor,
  hotspot = DEFAULT_HOTSPOT
) => {
  const { fireEvent } = EventSource();

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: enabled
   *
   * Specifies if the marker is enabled. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: hotspot
   *
   * Specifies the portion of the width and height that should trigger
   * a highlight. The area around the center of the cell to be marked is used
   * as the hotspot. Possible values are between 0 and 1. Default is
   * mxConstants.DEFAULT_HOTSPOT.
   */
  const [getHotspot, setHotspot] = addProp(hotspot);

  /**
   * Variable: hotspotEnabled
   *
   * Specifies if the hotspot is enabled. Default is false.
   */
  const [isHotspotEnabled, setHotspotEnabled] = addProp(false);

  /**
   * Variable: validColor
   *
   * Holds the valid marker color.
   */
  const [getValidColor, setValidColor] = addProp(validColor);

  /**
   * Variable: invalidColor
   *
   * Holds the invalid marker color.
   */
  const [getInvalidColor, setInvalidColor] = addProp(invalidColor);

  /**
   * Variable: currentColor
   *
   * Holds the current marker color.
   */
  const [getCurrentColor, setCurrentColor] = addProp();

  /**
   * Variable: validState
   *
   * Holds the marked <mxCellState> if it is valid.
   */
  const [getValidState, setValidState] = addProp();

  /**
   * Variable: markedState
   *
   * Holds the marked <mxCellState>.
   */
  const [getMarkedState, setMarkedState] = addProp();
  const [getHighlight, setHighlight] = addProp(CellHighlight(graph));

  /**
   * Function: hasValidState
   *
   * Returns true if <validState> is not null.
   */
  const hasValidState = () => isSet(getValidState());

  /**
   * Function: reset
   *
   * Resets the state of the cell marker.
   */
  const reset = () => {
    setValidState();

    if (isSet(getMarkedState())) {
      setMarkedState();
      unmark();
    }
  };

  /**
   * Function: process
   *
   * Processes the given event and cell and marks the state returned by
   * <getState> with the color returned by <getMarkerColor>. If the
   * markerColor is not null, then the state is stored in <markedState>. If
   * <isValidState> returns true, then the state is stored in <validState>
   * regardless of the marker color. The state is returned regardless of the
   * marker color and valid state.
   */
  const process = (mE) => {
    let state;

    if (isEnabled()) {
      state = getState(mE);
      setCurrentState(state, mE);
    }

    return state;
  };

  /**
   * Function: setCurrentState
   *
   * Sets and marks the current valid state.
   */
  const setCurrentState = (state, mE, color) => {
    const isValid = isSet(state) ? isValidState(state) : false;
    color = isSet(color)
      ? color
      : getMarkerColor(mE.getEvent(), state, isValid);

    if (isValid) {
      setValidState(state);
    } else {
      setValidState();
    }

    if (state !== getMarkedState() || color !== getCurrentColor()) {
      setCurrentColor(color);

      if (isSet(state) && isSet(setCurrentColor())) {
        setMarkedState(state);
        mark();
      } else if (isSet(getMarkedState())) {
        setMarkedState();
        unmark();
      }
    }
  };

  /**
   * Function: markCell
   *
   * Marks the given cell using the given color, or <validColor> if no color is specified.
   */
  const markCell = (cell, color) => {
    const state = getGraph().getView().getState(cell);

    if (isSet(state)) {
      setCurrentColor(isSet(color) ? color : getValidColor());
      setMarkedState(state);
      mark();
    }
  };

  /**
   * Function: mark
   *
   * Marks the <markedState> and fires a <mark> event.
   */
  const mark = () => {
    getHighlight().setHighlightColor(getCurrentColor());
    getHighlight().highlight(getMarkedState());
    fireEvent(EventObject(Event.MARK, 'state', getMarkedState()));
  };

  /**
   * Function: unmark
   *
   * Hides the marker and fires a <mark> event.
   */
  const unmark = () => mark();

  /**
   * Function: isValidState
   *
   * Returns true if the given <mxCellState> is a valid state. If this
   * returns true, then the state is stored in <validState>. The return value
   * of this method is used as the argument for <getMarkerColor>.
   */
  const isValidState = (state) => true;

  /**
   * Function: getMarkerColor
   *
   * Returns the valid- or invalidColor depending on the value of isValid.
   * The given <mxCellState> is ignored by this implementation.
   */
  const getMarkerColor = (evt, state, isValid) =>
    isValid ? getValidColor() : getInvalidColor();

  /**
   * Function: getState
   *
   * Uses <getCell>, <getStateToMark> and <intersects> to return the
   * <mxCellState> for the given <mxMouseEvent>.
   */
  const getState = (mE) => {
    const view = getGraph().getView();
    const cell = getCell(mE);
    const state = getStateToMark(view.getState(cell));

    return isSet(state) && intersects(state, me) ? state : undefined;
  };

  /**
   * Function: getCell
   *
   * Returns the <mxCell> for the given event and cell. This returns the
   * given cell.
   */
  const getCell = (mE) => mE.getCell();

  /**
   * Function: getStateToMark
   *
   * Returns the <mxCellState> to be marked for the given <mxCellState> under
   * the mouse. This returns the given state.
   */
  const getStateToMark = (state) => state;

  /**
   * Function: intersects
   *
   * Returns true if the given coordinate pair intersects the given state.
   * This returns true if the <hotspot> is 0 or the coordinates are inside
   * the hotspot for the given cell state.
   */
  const intersects = (state, mE) => {
    if (isHotspotEnabled()) {
      return intersectsHotspot(
        state,
        mE.getGraphX(),
        mE.getGraphY(),
        getHotspot(),
        MIN_HOTSPOT_SIZE,
        MAX_HOTSPOT_SIZE
      );
    }

    return true;
  };

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  const destroy = () => {
    getGraph().getView().removeListener(getResetHandler());
    getGraph().getModel().removeListener(getResetHandler());
    getHighlight().destroy();
  };

  const me = {
    /**
     * Function: setEnabled
     *
     * Enables or disables event handling. This implementation
     * updates <enabled>.
     *
     * Parameters:
     *
     * enabled - Boolean that specifies the new enabled state.
     */
    setEnabled,

    /**
     * Function: isEnabled
     *
     * Returns true if events are handled. This implementation
     * returns <enabled>.
     */
    isEnabled,

    /**
     * Function: setHotspot
     *
     * Sets the <hotspot>.
     */
    setHotspot,

    /**
     * Function: getHotspot
     *
     * Returns the <hotspot>.
     */
    getHotspot,

    /**
     * Function: setHotspotEnabled
     *
     * Specifies whether the hotspot should be used in <intersects>.
     */
    setHotspotEnabled,

    /**
     * Function: isHotspotEnabled
     *
     * Returns true if hotspot is used in <intersects>.
     */
    isHotspotEnabled,
    hasValidState,

    /**
     * Function: getValidState
     *
     * Returns the <validState>.
     */
    getValidState,

    /**
     * Function: getMarkedState
     *
     * Returns the <markedState>.
     */
    getMarkedState,
    reset,
    process,
    setCurrentState,
    markCell,
    mark,
    unmark,
    isValidState,
    getMarkerColor,
    getState,
    getCell,
    getStateToMark,
    intersects,
    destroy
  };

  return me;
};

export default CellMarker;
