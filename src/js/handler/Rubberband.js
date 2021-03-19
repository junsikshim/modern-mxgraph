/**
 * Copyright (c) 2006-2016, JGraph Ltd
 * Copyright (c) 2006-2016, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { IS_FF } from '../Client';
import { addProp, isSet, isUnset, makeComponent } from '../Helpers';
import Event from '../util/Event';
import MouseEvent from '../util/MouseEvent';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import {
  clearSelection,
  convertPoint,
  getOffset,
  getScrollOrigin,
  setOpacity
} from '../util/Utils';

/**
 * Class: Rubberband
 *
 * Event handler that selects rectangular regions. This is not built-into
 * <mxGraph>. To enable rubberband selection in a graph, use the following code.
 *
 * Example:
 *
 * (code)
 * var rubberband = new mxRubberband(graph);
 * (end)
 *
 * Constructor: mxRubberband
 *
 * Constructs an event handler that selects rectangular regions in the graph
 * using rubberband selection.
 */
const Rubberband = (graph) => {
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: defaultOpacity
   *
   * Specifies the default opacity to be used for the rubberband div. Default
   * is 20.
   */
  const [getDefaultOpacity, setDefaultOpacity] = addProp(20);

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: div
   *
   * Holds the DIV element which is currently visible.
   */
  const [getDiv, setDiv] = addProp();

  /**
   * Variable: sharedDiv
   *
   * Holds the DIV element which is used to display the rubberband.
   */
  const [getSharedDiv, setSharedDiv] = addProp();

  /**
   * Variable: currentX
   *
   * Holds the value of the x argument in the last call to <update>.
   */
  const [getCurrentX, setCurrentX] = addProp(0);

  /**
   * Variable: currentY
   *
   * Holds the value of the y argument in the last call to <update>.
   */
  const [getCurrentY, setCurrentY] = addProp(0);

  /**
   * Variable: fadeOut
   *
   * Optional fade out effect. Default is false.
   */
  const [isFadeOut, setFadeOut] = addProp(false);

  // Handles force rubberband event
  const [getForceRubberbandHandler, setForceRubberbandHandler] = addProp(
    (sender, evt) => {
      const evtName = evt.getProperty('eventName');
      const mE = evt.getProperty('event');

      if (evtName === Event.MOUSE_DOWN && isForceRubberbandEvent(mE)) {
        const offset = getOffset(getGraph().getContainer());
        const origin = getScrollOrigin(getGraph().getContainer());
        origin.setX(origin.getX() - offset.getX());
        origin.setY(origin.getY() - offset.getY());
        start(mE.getX() + origin.getX(), mE.getY() + origin.getY());
        mE.consume(false);
      }
    }
  );

  // Repaints the marquee after autoscroll
  const [getPanHandler, setPanHandler] = addProp(() => repaint());

  // Does not show menu if any touch gestures take place after the trigger
  const [getGestureHandler, setGestureHandler] = addProp((sender, eo) => {
    if (isSet(getFirst())) {
      reset();
    }
  });

  const [getFirst, setFirst] = addProp();

  const [getDragHandler, setDragHandler] = addProp();
  const [getDropHandler, setDropHandler] = addProp();
  const [getX, setX] = addProp();
  const [getY, setY] = addProp();
  const [getWidth, setWidth] = addProp();
  const [getHeight, setHeight] = addProp();
  const [isDestroyed, setDestroyed] = addProp(false);

  /**
   * Function: isForceRubberbandEvent
   *
   * Returns true if the given <mxMouseEvent> should start rubberband selection.
   * This implementation returns true if the alt key is pressed.
   */
  const isForceRubberbandEvent = (mE) => Event.isAltDown(mE.getEvent());

  /**
   * Function: mouseDown
   *
   * Handles the event by initiating a rubberband selection. By consuming the
   * event all subsequent events of the gesture are redirected to this
   * handler.
   */
  const mouseDown = (sender, mE) => {
    const graph = getGraph();

    if (
      !mE.isConsumed() &&
      isEnabled() &&
      graph.isEnabled() &&
      isUnset(mE.getState()) &&
      !Event.isMultiTouchEvent(mE.getEvent())
    ) {
      const offset = getOffset(graph.getContainer());
      const origin = getScrollOrigin(graph.getContainer());
      origin.setX(origin.getX() - offset.getX());
      origin.setY(origin.getY() - offset.getY());
      start(mE.getX() + origin.getX(), mE.getY() + origin.getY());

      // Does not prevent the default for this event so that the
      // event processing chain is still executed even if we start
      // rubberbanding. This is required eg. in ExtJs to hide the
      // current context menu. In mouseMove we'll make sure we're
      // not selecting anything while we're rubberbanding.
      mE.consume(false);
    }
  };

  /**
   * Function: start
   *
   * Sets the start point for the rubberband selection.
   */
  const start = (x, y) => {
    const graph = getGraph();

    setFirst(Point(x, y));

    const container = graph.getContainer();

    const createMouseEvent = (evt) => {
      const mE = MouseEvent(evt);
      const pt = convertPoint(container, mE.getX(), mE.getY());

      mE.setGraphX(pt.getX());
      mE.setGraphY(pt.getY());

      return mE;
    };

    setDragHandler((evt) => mouseMove(graph, createMouseEvent(evt)));

    setDropHandler((evt) => mouseUp(graph, createMouseEvent(evt)));

    // Workaround for rubberband stopping if the mouse leaves the container in Firefox
    if (IS_FF) {
      Event.addGestureListeners(
        document,
        undefined,
        getDragHandler(),
        getDropHandler()
      );
    }
  };

  /**
   * Function: mouseMove
   *
   * Handles the event by updating therubberband selection.
   */
  const mouseMove = (sender, mE) => {
    const graph = getGraph();

    if (!mE.isConsumed() && isSet(getFirst())) {
      const origin = getScrollOrigin(graph.getContainer());
      const offset = getOffset(graph.getContainer());
      origin.setX(origin.getX() - offset.getX());
      origin.setY(origin.getY() - offset.getY());
      const x = mE.getX() + origin.getX();
      const y = mE.getY() + origin.getY();
      const dx = getFirst().getX() - x;
      const dy = getFirst().getY() - y;
      const tol = graph.getTolerance();

      if (isSet(getDiv()) || Math.abs(dx) > tol || Math.abs(dy) > tol) {
        if (isUnset(getDiv())) {
          setDiv(createShape());
        }

        // Clears selection while rubberbanding. This is required because
        // the event is not consumed in mouseDown.
        clearSelection();

        update(x, y);
        mE.consume();
      }
    }
  };

  /**
   * Function: createShape
   *
   * Creates the rubberband selection shape.
   */
  const createShape = () => {
    let sharedDiv = getSharedDiv();

    if (isUnset(sharedDiv)) {
      sharedDiv = setSharedDiv(document.createElement('div'));
      sharedDiv.className = 'mxRubberband';
      setOpacity(sharedDiv, getDefaultOpacity());
    }

    getGraph().getContainer().appendChild(sharedDiv);
    const result = sharedDiv;

    if (isFadeOut()) {
      setSharedDiv();
    }

    return result;
  };

  /**
   * Function: isActive
   *
   * Returns true if this handler is active.
   */
  const isActive = (sender, mE) =>
    isSet(getDiv()) && getDiv().style.display !== 'none';

  /**
   * Function: mouseUp
   *
   * Handles the event by selecting the region of the rubberband using
   * <mxGraph.selectRegion>.
   */
  const mouseUp = (sender, mE) => {
    const active = isActive();
    reset();

    if (active) {
      execute(mE.getEvent());
      mE.consume();
    }
  };

  /**
   * Function: execute
   *
   * Resets the state of this handler and selects the current region
   * for the given event.
   */
  const execute = (evt) => {
    const rect = Rectangle(getX(), getY(), getWidth(), getHeight());
    getGraph().selectRegion(rect, evt);
  };

  /**
   * Function: reset
   *
   * Resets the state of the rubberband selection.
   */
  const reset = () => {
    if (isSet(getDiv())) {
      if (isFadeOut()) {
        const temp = getDiv();
        setPrefixedStyle(temp.style, 'transition', 'all 0.2s linear');
        temp.style.pointerEvents = 'none';
        temp.style.opacity = 0;

        window.setTimeout(function () {
          temp.parentNode.removeChild(temp);
        }, 200);
      } else {
        getDiv().parentNode.removeChild(getDiv());
      }
    }

    Event.removeGestureListeners(
      document,
      undefined,
      getDragHandler(),
      getDropHandler()
    );
    setDragHandler();
    setDropHandler();

    setCurrentX(0);
    setCurrentY(0);
    setFirst();
    setDiv();
  };

  /**
   * Function: update
   *
   * Sets <currentX> and <currentY> and calls <repaint>.
   */
  const update = (x, y) => {
    setCurrentX(x);
    setCurrentY(y);

    repaint();
  };

  /**
   * Function: repaint
   *
   * Computes the bounding box and updates the style of the <div>.
   */
  const repaint = () => {
    const div = getDiv();

    if (isSet(div)) {
      const first = getFirst();
      const x = getCurrentX() - getGraph().getPanDx();
      const y = getCurrentY() - getGraph().getPanDy();

      setX(Math.min(first.getX(), x));
      setY(Math.min(first.getY(), y));
      setWidth(Math.max(first.getX(), x) - getX());
      setHeight(Math.max(first.getY(), y) - getY());

      div.style.left = getX() + 'px';
      div.style.top = getY() + 'px';
      div.style.width = Math.max(1, getWidth()) + 'px';
      div.style.height = Math.max(1, getHeight()) + 'px';
    }
  };

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes. This does
   * normally not need to be called, it is called automatically when the
   * window unloads.
   */
  const destroy = () => {
    const graph = getGraph();

    if (!isDestroyed()) {
      setDestroyed(true);
      graph.removeMouseListener(me);
      graph.removeListener(getForceRubberbandHandler());
      graph.removeListener(getPanHandler());
      reset();

      if (isSet(getSharedDiv())) {
        setSharedDiv();
      }
    }
  };

  const me = {
    /**
     * Function: isEnabled
     *
     * Returns true if events are handled. This implementation returns
     * <enabled>.
     */
    isEnabled,

    /**
     * Function: setEnabled
     *
     * Enables or disables event handling. This implementation updates
     * <enabled>.
     */
    setEnabled,
    isForceRubberbandEvent,
    mouseDown,
    start,
    mouseMove,
    createShape,
    isActive,
    mouseUp,
    execute,
    reset,
    update,
    repaint,
    destroy
  };

  graph.addMouseListener(me);
  graph.addListener(Event.FIRE_MOUSE_EVENT, getForceRubberbandHandler());
  graph.addListener(Event.PAN, getPanHandler());
  graph.addListener(Event.GESTURE, getGestureHandler());

  return me;
};

export default makeComponent(Rubberband);
