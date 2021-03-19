/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet, makeComponent } from '../Helpers';
import EventSource from '../util/EventSource';
import { hasScrollbars } from '../util/Utils';

/**
 * Class: PanningHandler
 *
 * Event handler that pans and creates popupmenus. To use the left
 * mousebutton for panning without interfering with cell moving and
 * resizing, use <isUseLeftButton> and <isIgnoreCell>. For grid size
 * steps while panning, use <useGrid>. This handler is built-into
 * <mxGraph.panningHandler> and enabled using <mxGraph.setPanning>.
 *
 * Constructor: PanningHandler
 *
 * Constructs an event handler that creates a <mxPopupMenu>
 * and pans the graph.
 *
 * Event: mxEvent.PAN_START
 *
 * Fires when the panning handler changes its <active> state to true. The
 * <code>event</code> property contains the corresponding <mxMouseEvent>.
 *
 * Event: mxEvent.PAN
 *
 * Fires while handle is processing events. The <code>event</code> property contains
 * the corresponding <mxMouseEvent>.
 *
 * Event: mxEvent.PAN_END
 *
 * Fires when the panning handler changes its <active> state to false. The
 * <code>event</code> property contains the corresponding <mxMouseEvent>.
 */
const PanningHandler = (graph) => {
  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: useLeftButtonForPanning
   *
   * Specifies if panning should be active for the left mouse button.
   * Setting this to true may conflict with <mxRubberband>. Default is false.
   */
  const [isUseLeftButtonForPanning, setUseLeftButtonForPanning] = addProp(
    false
  );

  /**
   * Variable: usePopupTrigger
   *
   * Specifies if <mxEvent.isPopupTrigger> should also be used for panning.
   */
  const [isUsePopupTrigger, setUsePopupTrigger] = addProp(true);

  /**
   * Variable: ignoreCell
   *
   * Specifies if panning should be active even if there is a cell under the
   * mousepointer. Default is false.
   */
  const [isIgnoreCell, setIgnoreCell] = addProp(false);

  /**
   * Variable: previewEnabled
   *
   * Specifies if the panning should be previewed. Default is true.
   */
  const [isPreviewEnabled, setPreviewEnabled] = addProp(true);

  /**
   * Variable: useGrid
   *
   * Specifies if the panning steps should be aligned to the grid size.
   * Default is false.
   */
  const [isUseGrid, setUseGrid] = addProp(false);

  /**
   * Variable: panningEnabled
   *
   * Specifies if panning should be enabled. Default is true.
   */
  const [isPanningEnabled, setPanningEnabled] = addProp(true);

  /**
   * Variable: pinchEnabled
   *
   * Specifies if pinch gestures should be handled as zoom. Default is true.
   */
  const [isPinchEnabled, setPinchEnabled] = addProp(true);

  /**
   * Variable: maxScale
   *
   * Specifies the maximum scale. Default is 8.
   */
  const [getMaxScale, setMaxScale] = addProp(8);

  /**
   * Variable: minScale
   *
   * Specifies the minimum scale. Default is 0.01.
   */
  const [getMinScale, setMinScale] = addProp(0.01);

  /**
   * Variable: dx
   *
   * Holds the current horizontal offset.
   */
  const [getDx, setDx] = addProp();
  const [getDx0, setDx0] = addProp();

  /**
   * Variable: dy
   *
   * Holds the current vertical offset.
   */
  const [getDy, setDy] = addProp();
  const [getDy0, setDy0] = addProp();

  /**
   * Variable: startX
   *
   * Holds the x-coordinate of the start point.
   */
  const [getStartX, setStartX] = addProp(0);

  /**
   * Variable: startY
   *
   * Holds the y-coordinate of the start point.
   */
  const [getStartY, setStartY] = addProp(0);

  const [_isActive, setActive] = addProp(false);

  const [getInitialScale, setInitialScale] = addProp();
  const [getMouseDownEvent, setMouseDownEvent] = addProp();
  const [_isPanningTrigger, setPanningTrigger] = addProp(false);

  // Handles force panning event
  const [getForcePanningHandler, setForcePanningHandler] = addProp(
    (sender, evt) => {
      const evtName = evt.getProperty('eventName');
      const mE = evt.getProperty('event');

      if (evtName === Event.MOUSE_DOWN && isForcePanningEvent(mE)) {
        start(mE);
        _setActive(true);
        fireEvent(EventObject(Event.PAN_START, 'event', mE));
        mE.consume();
      }
    }
  );

  // Handles pinch gestures
  const [getGestureHandler, setGestureHandler] = addProp((sender, eo) => {
    if (isPinchEnabled()) {
      const evt = eo.getProperty('event');

      if (!Event.isConsumed(evt) && evt.type === 'gesturestart') {
        setInitialScale(getGraph().getView().getScale());

        // Forces start of panning when pinch gesture starts
        if (!_isActive() && isSet(getMouseDownEvent())) {
          start(getMouseDownEvent());
          setMouseDownEvent();
        }
      } else if (evt.type === 'gestureend' && isSet(getInitialScale())) {
        setInitialScale();
      }

      if (isSet(getInitialScale())) {
        zoomGraph(evt);
      }
    }
  });

  const [getMouseUpListener, setMouseUpListener] = addProp(() => {
    if (_isActive()) reset();
  });

  /**
   * Function: isActive
   *
   * Returns true if the handler is currently active.
   */
  const isActive = () => _isActive() || isSet(getInitialScale());

  /**
   * Function: isPanningTrigger
   *
   * Returns true if the given event is a panning trigger for the optional
   * given cell. This returns true if control-shift is pressed or if
   * <usePopupTrigger> is true and the event is a popup trigger.
   */
  const isPanningTrigger = (mE) => {
    const evt = mE.getEvent();

    return (
      (isUseLeftButtonForPanning() &&
        isUnset(mE.getState()) &&
        Event.isLeftMouseButton(evt)) ||
      (Event.isControlDown(evt) && Event.isShiftDown(evt)) ||
      (isUsePopupTrigger() && Event.isPopupTrigger(evt))
    );
  };

  /**
   * Function: isForcePanningEvent
   *
   * Returns true if the given <mxMouseEvent> should start panning. This
   * implementation always returns true if <ignoreCell> is true or for
   * multi touch events.
   */
  const isForcePanningEvent = (mE) =>
    isIgnoreCell() || Event.isMultiTouchEvent(mE.getEvent());

  /**
   * Function: mouseDown
   *
   * Handles the event by initiating the panning. By consuming the event all
   * subsequent events of the gesture are redirected to this handler.
   */
  const mouseDown = (sender, mE) => {
    setMouseDownEvent(mE);

    if (
      !mE.isConsumed() &&
      isPanningEnabled() &&
      !_isActive() &&
      isPanningTrigger(mE)
    ) {
      start(mE);
      consumePanningTrigger(mE);
    }
  };

  /**
   * Function: start
   *
   * Starts panning at the given event.
   */
  const start = (mE) => {
    setDx0(-getGraph().getContainer().scrollLeft);
    setDy0(-getGraph().getContainer().scrollTop);

    // Stores the location of the trigger event
    setStartX(mE.getX());
    setStartY(mE.getY());
    setDx();
    setDy();

    setPanningTrigger(true);
  };

  /**
   * Function: consumePanningTrigger
   *
   * Consumes the given <mxMouseEvent> if it was a panning trigger in
   * <mouseDown>. The default is to invoke <mxMouseEvent.consume>. Note that this
   * will block any further event processing. If you haven't disabled built-in
   * context menus and require immediate selection of the cell on mouseDown in
   * Safari and/or on the Mac, then use the following code:
   *
   * (code)
   * mxPanningHandler.prototype.consumePanningTrigger = function(me)
   * {
   *   if (me.evt.preventDefault)
   *   {
   *     me.evt.preventDefault();
   *   }
   *
   *   // Stops event processing in IE
   *   me.evt.returnValue = false;
   *
   *   // Sets local consumed state
   *   if (!mxClient.IS_SF && !mxClient.IS_MAC)
   *   {
   *     me.consumed = true;
   *   }
   * };
   * (end)
   */
  const consumePanningTrigger = (mE) => mE.consume();

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the panning on the graph.
   */
  const mouseMove = (sender, mE) => {
    const graph = getGraph();

    setDx(mE.getX() - getStartX());
    setDy(mE.getY() - getStartY());

    if (_isActive()) {
      if (isPreviewEnabled()) {
        // Applies the grid to the panning steps
        if (isUseGrid()) {
          setDx(graph.snap(getDx()));
          setDy(graph.snap(getDy()));
        }

        graph.panGraph(getDx() + getDx0(), getDy() + getDy0());
      }

      fireEvent(EventObject(Event.PAN, 'event', mE));
    } else if (_isPanningTrigger()) {
      const tmp = _isActive();

      // Panning is activated only if the mouse is moved
      // beyond the graph tolerance
      setActive(
        Math.abs(getDx()) > graph.getTolerance() ||
          Math.abs(getDy()) > graph.getTolerance()
      );

      if (!tmp && _isActive()) {
        fireEvent(EventObject(Event.PAN_START, 'event', mE));
      }
    }

    if (_isActive() || _isPanningTrigger()) {
      mE.consume();
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

    if (_isActive()) {
      if (isSet(getDx()) && isSet(getDy())) {
        // Ignores if scrollbars have been used for panning
        if (
          !graph.isUseScrollbarsForPanning() ||
          !hasScrollbars(graph.getContainer())
        ) {
          const scale = graph.getView().getScale();
          const t = graph.getView().getTranslate();
          graph.panGraph(0, 0);
          panGraph(t.getX() + getDx() / scale, t.getY() + getDy() / scale);
        }

        mE.consume();
      }

      fireEvent(EventObject(Event.PAN_END, 'event', mE));
    }

    reset();
  };

  /**
   * Function: zoomGraph
   *
   * Zooms the graph to the given value and consumed the event if needed.
   */
  const zoomGraph = (evt) => {
    let value = Math.round(getInitialScale() * evt.getScale() * 100) / 100;

    if (isSet(getMinScale())) {
      value = Math.max(getMinScale(), value);
    }

    if (isSet(getMaxScale())) {
      value = Math.min(getMaxScale(), value);
    }

    if (getGraph().getView().getScale() !== value) {
      getGraph().zoomTo(value);
      Event.consume(evt);
    }
  };

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  const reset = () => {
    setPanningTrigger(false);
    setMouseDownEvent();
    setActive(false);
    setDx();
    setDy();
  };

  /**
   * Function: panGraph
   *
   * Pans <graph> by the given amount.
   */
  const panGraph = (dx, dy) => getGraph().getView().setTranslate(dx, dy);

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  const destroy = () => {
    getGraph().removeMouseListener(me);
    getGraph().removeListener(getForcePanningHandler());
    getGraph().removeListener(getGestureHandler());
    Event.removeListener(document, 'mouseup', getMouseUpListener());
  };

  const { fireEvent } = EventSource();

  const me = {
    isActive,

    /**
     * Function: isPanningEnabled
     *
     * Returns <panningEnabled>.
     */
    isPanningEnabled,

    /**
     * Function: setPanningEnabled
     *
     * Sets <panningEnabled>.
     */
    setPanningEnabled,

    /**
     * Function: isPinchEnabled
     *
     * Returns <pinchEnabled>.
     */
    isPinchEnabled,

    /**
     * Function: setPinchEnabled
     *
     * Sets <pinchEnabled>.
     */
    setPinchEnabled,
    isPanningTrigger,
    isForcePanningEvent,
    mouseDown,
    start,
    consumePanningTrigger,
    mouseMove,
    mouseUp,
    zoomGraph,
    reset,
    panGraph,
    destroy
  };

  graph.addMouseListener(me);
  graph.addListener(Event.FIRE_MOUSE_EVENT, getForcePanningHandler());
  graph.addListener(Event.GESTURE, getGestureHandler());

  // Stops scrolling on every mouseup anywhere in the document
  Event.addListener(document, 'mouseup', getMouseUpListener());

  return me;
};

export default makeComponent(PanningHandler);
