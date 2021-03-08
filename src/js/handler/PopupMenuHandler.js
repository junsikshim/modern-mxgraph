/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet } from '../Helpers';
import PopupMenu from '../util/PopupMenu';
import { getScrollOrigin } from '../util/Utils';

/**
 * Class: PopupMenuHandler
 *
 * Event handler that creates popupmenus.
 *
 * Constructor: mxPopupMenuHandler
 *
 * Constructs an event handler that creates a <mxPopupMenu>.
 */
const PopupMenuHandler = (graph, factoryMethod) => {
  // Extends PopupMenu.
  const { init: _init, destroy: _destroy, getDiv } = PopupMenu(factoryMethod);

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: selectOnPopup
   *
   * Specifies if cells should be selected if a popupmenu is displayed for
   * them. Default is true.
   */
  const [isSelectOnPopup, setSelectOnPopup] = addProp(true);

  /**
   * Variable: clearSelectionOnBackground
   *
   * Specifies if cells should be deselected if a popupmenu is displayed for
   * the diagram background. Default is true.
   */
  const [isClearSelectionOnBackground, setClearSelectionOnBackground] = addProp(
    true
  );

  /**
   * Variable: triggerX
   *
   * X-coordinate of the mouse down event.
   */
  const [getTriggerX, setTriggerX] = addProp();

  /**
   * Variable: triggerY
   *
   * Y-coordinate of the mouse down event.
   */
  const [getTriggerY, setTriggerY] = addProp();

  /**
   * Variable: screenX
   *
   * Screen X-coordinate of the mouse down event.
   */
  const [getScreenX, setScreenX] = addProp();

  /**
   * Variable: screenY
   *
   * Screen Y-coordinate of the mouse down event.
   */
  const [getScreenY, setScreenY] = addProp();
  const [isInTolerance, setInTolerance] = addProp(false);

  // Does not show menu if any touch gestures take place after the trigger
  const [getGestureHandler, setGestureHandler] = addProp((sender, eo) =>
    setInTolerance(false)
  );

  /**
   * Function: init
   *
   * Initializes the shapes required for this vertex handler.
   */
  const init = () => {
    // Supercall
    _init();

    // Hides the tooltip if the mouse is over
    // the context menu
    Event.addGestureListeners(getDiv(), (evt) =>
      getGraph().getTooltipHandler().hide()
    );
  };

  /**
   * Function: mouseDown
   *
   * Handles the event by initiating the panning. By consuming the event all
   * subsequent events of the gesture are redirected to this handler.
   */
  const mouseDown = (sender, mE) => {
    if (isEnabled() && !Event.isMultiTouchEvent(mE.getEvent())) {
      // Hides the popupmenu if is is being displayed
      hideMenu();
      setTriggerX(mE.getGraphX());
      setTriggerY(mE.getGraphY());
      setScreenX(Event.getMainEvent(mE.getEvent()).screenX);
      setScreenY(Event.getMainEvent(mE.getEvent()).screenY);
      setPopupTrigger(isPopupTrigger(mE));
      setInTolerance(true);
    }
  };

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the panning on the graph.
   */
  const mouseMove = (sender, mE) => {
    const tolerance = getGraph().getTolerance();

    // Popup trigger may change on mouseUp so ignore it
    if (isInTolerance() && isSet(getScreenX()) && isSet(getScreenY())) {
      if (
        Math.abs(Event.getMainEvent(mE.getEvent()).screenX - getScreenX()) >
          tolerance ||
        Math.abs(Event.getMainEvent(mE.getEvent()).screenY - getScreenY()) >
          tolerance
      ) {
        setInTolerance(false);
      }
    }
  };

  /**
   * Function: mouseUp
   *
   * Handles the event by setting the translation on the view or showing the
   * popupmenu.
   */
  const mouseUp = (sender, mE) => {
    const graph = getGraph();

    if (
      isPopupTrigger() &&
      isInTolerance() &&
      isSet(getTriggerX()) &&
      isSet(getTriggerY())
    ) {
      const cell = getCellForPopupEvent(mE);

      // Selects the cell for which the context menu is being displayed
      if (
        graph.isEnabled() &&
        isSelectOnPopup(mE) &&
        isSet(cell) &&
        !graph.isCellSelected(cell)
      ) {
        graph.setSelectionCell(cell);
      } else if (isClearSelectionOnBackground() && isUnset(cell)) {
        graph.clearSelection();
      }

      // Hides the tooltip if there is one
      graph.tooltipHandler.hide();

      // Menu is shifted by 1 pixel so that the mouse up event
      // is routed via the underlying shape instead of the DIV
      const origin = getScrollOrigin();
      popup(
        mE.getX() + origin.getX() + 1,
        mE.getY() + origin.getY() + 1,
        cell,
        mE.getEvent()
      );
      mE.consume();
    }

    setPopupTrigger(false);
    setInTolerance(false);
  };

  /**
   * Function: getCellForPopupEvent
   *
   * Hook to return the cell for the mouse up popup trigger handling.
   */
  const getCellForPopupEvent = (mE) => mE.getCell();

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  const destroy = () => {
    getGraph().removeMouseListener(me);
    getGraph().removeListener(getGestureHandler());

    // Supercall
    _destroy();
  };

  const me = {
    init,

    /**
     * Function: isSelectOnPopup
     *
     * Hook for returning if a cell should be selected for a given <mxMouseEvent>.
     * This implementation returns <selectOnPopup>.
     */
    isSelectOnPopup,
    mouseDown,
    mouseMove,
    mouseUp,
    getCellForPopupEvent,
    destroy
  };

  graph.addMouseListener(me);
  graph.addListener(Event.GESTURE, getGestureHandler);

  init();

  return me;
};

export default PopupMenuHandler;
