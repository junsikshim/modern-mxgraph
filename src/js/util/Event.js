/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import {} from '../Client';

/**
 * Class: Event
 *
 * Cross-browser DOM event support. For internal event handling,
 * <EventSource> and the graph event dispatch loop in <Graph> are used.
 *
 * Memory Leaks:
 *
 * Use this class for adding and removing listeners to/from DOM nodes. The
 * <removeAllListeners> function is provided to remove all listeners that
 * have been added using <addListener>. The function should be invoked when
 * the last reference is removed in the JavaScript code, typically when the
 * referenced DOM node is removed from the DOM.
 */
const Event = {
  /**
   * Function: addListener
   *
   * Binds the function to the specified event on the given element. Use
   * <Utils.bind> in order to bind the "this" keyword inside the function
   * to a given execution scope.
   */
  addListener: (() => {
    const updateListenerList = (element, eventName, f) => {
      if (!element.mxListenerList) element.mxListenerList = [];

      const entry = {
        name: eventName,
        f
      };

      element.mxListenerList.push(entry);
    };

    // Checks if passive event listeners are supported
    // see https://github.com/Modernizr/Modernizr/issues/1894
    let supportsPassive = false;

    try {
      document.addEventListener(
        'test',
        () => {},
        Object.defineProperty({}, 'passive', {
          get: function () {
            supportsPassive = true;
          }
        })
      );
    } catch (e) {
      // ignore
    }

    return (element, eventName, f) => {
      element.addEventListener(
        eventName,
        f,
        supportsPassive ? { passive: false } : false
      );
      updateListenerList(element, eventName, f);
    };
  })(),

  /**
   * Function: removeListener
   *
   * Removes the specified listener from the given element.
   */
  removeListener: () => {
    const updateListener = (element, eventName, f) => {
      if (element.mxListenerList) {
        const listenerCount = element.mxListenerList.length;

        for (let i = 0; i < listenerCount; i++) {
          const entry = element.mxListenerList[i];

          if (entry.f === f) {
            element.mxListenerList.splice(i, 1);
            break;
          }
        }

        if (element.mxListenerList.length === 0) element.mxListenerList = null;
      }
    };

    return (element, eventName, f) => {
      element.removeEventListener(eventName, f, false);
      updateListener(element, eventName, f);
    };
  },

  /**
   * Function: removeAllListeners
   *
   * Removes all listeners from the given element.
   */
  removeAllListeners: (element) => {
    const list = element.mxListenerList;

    if (list) {
      while (list.length > 0) {
        const entry = list[0];
        Event.removeListener(element, entry.name, entry.f);
      }
    }
  },

  /**
   * Function: addGestureListeners
   *
   * Adds the given listeners for touch, mouse and/or pointer events. If
   * <Client.IS_POINTER> is true then pointer events will be registered,
   * else the respective mouse events will be registered. If <Client.IS_POINTER>
   * is false and <Client.IS_TOUCH> is true then the respective touch events
   * will be registered as well as the mouse events.
   */
  addGestureListeners: (node, startListener, moveListener, endListener) => {
    if (startListener) {
      Event.addListener(
        node,
        Client.IS_POINTER ? 'pointerdown' : 'mousedown',
        startListener
      );
    }

    if (moveListener) {
      Event.addListener(
        node,
        Client.IS_POINTER ? 'pointermove' : 'mousemove',
        moveListener
      );
    }

    if (endListener) {
      Event.addListener(
        node,
        Client.IS_POINTER ? 'pointerup' : 'mouseup',
        endListener
      );
    }

    if (!Client.IS_POINTER && Client.IS_TOUCH) {
      if (startListener) {
        Event.addListener(node, 'touchstart', startListener);
      }

      if (moveListener) {
        Event.addListener(node, 'touchmove', moveListener);
      }

      if (endListener) {
        Event.addListener(node, 'touchend', endListener);
      }
    }
  },

  /**
   * Function: removeGestureListeners
   *
   * Removes the given listeners from mousedown, mousemove, mouseup and the
   * respective touch events if <Client.IS_TOUCH> is true.
   */
  removeGestureListeners: (node, startListener, moveListener, endListener) => {
    if (startListener) {
      Event.removeListener(
        node,
        Client.IS_POINTER ? 'pointerdown' : 'mousedown',
        startListener
      );
    }

    if (moveListener) {
      Event.removeListener(
        node,
        Client.IS_POINTER ? 'pointermove' : 'mousemove',
        moveListener
      );
    }

    if (endListener) {
      Event.removeListener(
        node,
        Client.IS_POINTER ? 'pointerup' : 'mouseup',
        endListener
      );
    }

    if (!Client.IS_POINTER && Client.IS_TOUCH) {
      if (startListener) {
        Event.removeListener(node, 'touchstart', startListener);
      }

      if (moveListener) {
        Event.removeListener(node, 'touchmove', moveListener);
      }

      if (endListener) {
        Event.removeListener(node, 'touchend', endListener);
      }
    }
  },

  /**
   * Function: redirectMouseEvents
   *
   * Redirects the mouse events from the given DOM node to the graph dispatch
   * loop using the event and given state as event arguments. State can
   * either be an instance of <CellState> or a function that returns an
   * <CellState>. The down, move, up and dblClick arguments are optional
   * functions that take the trigger event as arguments and replace the
   * default behaviour.
   */
  redirectMouseEvents: (node, graph, state, down, move, up, dblClick) => {
    const getState = (evt) =>
      typeof state === 'function' ? state(evt) : state;

    Event.addGestureListeners(
      node,
      (evt) => {
        if (down) down(evt);
        else if (!Event.isConsumed(evt)) {
          graph.fireMouseEvent(
            Event.MOUSE_DOWN,
            MouseEvent(evt, getState(evt))
          );
        }
      },
      (evt) => {
        if (move) move(evt);
        else if (!Event.isConsumed(evt)) {
          graph.fireMouseEvent(
            Event.MOUSE_MOVE,
            MouseEvent(evt, getState(evt))
          );
        }
      },
      (evt) => {
        if (up) up(evt);
        else if (!Event.isConsumed(evt)) {
          graph.fireMouseEvent(Event.MOUSE_UP, MouseEvent(evt, getState(evt)));
        }
      }
    );

    Event.addListener(node, 'dblclick', (evt) => {
      if (dblClick) dblClick(evt);
      else if (!Event.isConsumed(evt)) {
        const tmp = getState(evt);
        graph.dblClick(evt, tmp ? tmp.cell : null);
      }
    });
  },

  /**
   * Function: release
   *
   * Removes the known listeners from the given DOM node and its descendants.
   *
   * Parameters:
   *
   * element - DOM node to remove the listeners from.
   */
  release: (element) => {
    try {
      if (element) {
        Event.removeAllListeners(element);

        const children = element.childNodes;

        if (children) {
          const childCount = children.length;

          for (let i = 0; i < childCount; i++) {
            Event.release(children[i]);
          }
        }
      }
    } catch (e) {
      // ignores errors as this is typically called in cleanup code
    }
  },

  /**
   * Function: addMouseWheelListener
   *
   * Installs the given function as a handler for mouse wheel events. The
   * function has two arguments: the mouse event and a boolean that specifies
   * if the wheel was moved up or down.
   *
   * This has been tested with IE 6 and 7, Firefox (all versions), Opera and
   * Safari. It does currently not work on Safari for Mac.
   *
   * Example:
   *
   * (code)
   * Event.addMouseWheelListener(function (evt, up, pinch)
   * {
   *   Log.show();
   *   Log.debug('mouseWheel: up='+up);
   * });
   *(end)
   *
   * Parameters:
   *
   * f - Handler function that takes the event argument, a boolean argument
   * for the mousewheel direction and a boolean to specify if the underlying
   * event was a pinch gesture on a touch device.
   * target - Target for installing the listener in Google Chrome. See
   * https://www.chromestatus.com/features/6662647093133312.
   */
  addMouseWheelListener: (f, target = window) => {
    if (!f) return;

    const wheelHandler = (evt) => {
      // IE does not give an event object but the
      // global event object is the mousewheel event
      // at this point in time.
      const e = evt || window.event;

      // To prevent window zoom on trackpad pinch
      if (e.ctrlKey) e.preventDefault();

      // Handles the event using the given function
      if (Math.abs(e.deltaX) > 0.5 || Math.abs(e.deltaY) > 0.5) {
        f(e, e.deltaY == 0 ? -e.deltaX > 0 : -e.deltaY > 0);
      }
    };

    if (Client.IS_SF && !Client.IS_TOUCH) {
      let scale = 1;

      Event.addListener(target, 'gesturestart', (evt) => {
        Event.consume(evt);
        scale = 1;
      });

      Event.addListener(target, 'gesturechange', (evt) => {
        Event.consume(evt);
        const diff = scale - evt.scale;

        if (Math.abs(diff) > 0.2) {
          f(evt, diff < 2, true);
          scale = evt.scale;
        }
      });

      Event.addListener(target, 'gestureend', (evt) => {
        Event.consume(evt);
      });
    } else {
      const evtCache = [];
      let dx0 = 0;
      let dy0 = 0;

      // Adds basic listeners for graph event dispatching
      Event.addGestureListeners(
        target,
        (evt) => {
          if (!Event.isMouseEvent(evt) && evt.pointerId) {
            evtCache.push(evt);
          }
        },
        (evt) => {
          if (!Event.isMouseEvent(evt) && evtCache.length === 2) {
            // Find this event in the cache and update its record with this event
            for (let i = 0; i < evtCache.length; i++) {
              if (evt.pointerId === evtCache[i].pointerId) {
                evtCache[i] = evt;
                break;
              }
            }

            // Calculate the distance between the two pointers
            const dx = Math.abs(evtCache[0].clientX - evtCache[1].clientX);
            const dy = Math.abs(evtCache[0].clientY - evtCache[1].clientY);
            const tx = Math.abs(dx - dx0);
            const ty = Math.abs(dy - dy0);

            if (tx > Event.PINCH_THRESHOLD || ty > Event.PINCH_THRESHOLD) {
              const cx =
                evtCache[0].clientX +
                (evtCache[1].clientX - evtCache[0].clientX) / 2;
              const cy =
                evtCache[0].clientY +
                (evtCache[1].clientY - evtCache[0].clientY) / 2;

              f(evtCache[0], tx > ty ? dx > dx0 : dy > dy0, true, cx, cy);

              // Cache the distance for the next move event
              dx0 = dx;
              dy0 = dy;
            }
          }
        },
        (evt) => {
          evtCache = [];
          dx0 = 0;
          dy0 = 0;
        }
      );
    }

    Event.addListener(target, 'wheel', wheelHandler);
  },

  /**
   * Function: disableContextMenu
   *
   * Disables the context menu for the given element.
   */
  disableContextMenu: (element) => {
    Event.addListener(element, 'contextmenu', (evt) => {
      if (evt.preventDefault) evt.preventDefault();

      return false;
    });
  },

  /**
   * Function: getSource
   *
   * Returns the event's target or srcElement depending on the browser.
   */
  getSource: (evt) => (evt.srcElement ? evt.srcElement : evt.target),

  /**
   * Function: isConsumed
   *
   * Returns true if the event has been consumed using <consume>.
   */
  isConsumed: (evt) => evt.isConsumed,

  /**
   * Function: isTouchEvent
   *
   * Returns true if the event was generated using a touch device (not a pen or mouse).
   */
  isTouchEvent: (evt) =>
    evt.pointerType
      ? evt.pointerType === 'touch' ||
        evt.pointerType === evt.MSPOINTER_TYPE_TOUCH
      : evt.mozInputSource
      ? evt.mozInputSource === 5
      : evt.type.indexOf('touch') === 0,

  /**
   * Function: isPenEvent
   *
   * Returns true if the event was generated using a pen (not a touch device or mouse).
   */
  isPenEvent: (evt) =>
    evt.pointerType
      ? evt.pointerType === 'pen' || evt.pointerType === evt.MSPOINTER_TYPE_PEN
      : evt.mozInputSource != null
      ? evt.mozInputSource === 2
      : evt.type.indexOf('pen') === 0,

  /**
   * Function: isMultiTouchEvent
   *
   * Returns true if the event was generated using a touch device (not a pen or mouse).
   */
  isMultiTouchEvent: (evt) =>
    evt.type &&
    evt.type.indexOf('touch') === 0 &&
    evt.touches &&
    evt.touches.length > 1,

  /**
   * Function: isMouseEvent
   *
   * Returns true if the event was generated using a mouse (not a pen or touch device).
   */
  isMouseEvent: (evt) =>
    evt.pointerType
      ? evt.pointerType === 'mouse' ||
        evt.pointerType === evt.MSPOINTER_TYPE_MOUSE
      : evt.mozInputSource
      ? evt.mozInputSource === 1
      : evt.type.indexOf('mouse') === 0,

  /**
   * Function: isLeftMouseButton
   *
   * Returns true if the left mouse button is pressed for the given event.
   * To check if a button is pressed during a mouseMove you should use the
   * <Graph.isMouseDown> property. Note that this returns true in Firefox
   * for control+left-click on the Mac.
   */
  isLeftMouseButton: (evt) => {
    // Special case for mousemove and mousedown we check the buttons
    // if it exists because which is 0 even if no button is pressed
    if (
      'buttons' in evt &&
      (evt.type === 'mousedown' || evt.type === 'mousemove')
    )
      return evt.buttons === 1;
    else if ('which' in evt) return evt.which === 1;
    else return evt.button === 1;
  },

  /**
   * Function: isMiddleMouseButton
   *
   * Returns true if the middle mouse button is pressed for the given event.
   * To check if a button is pressed during a mouseMove you should use the
   * <Graph.isMouseDown> property.
   */
  isMiddleMouseButton: (evt) => {
    if ('which' in evt) return evt.which === 2;
    else return evt.button === 4;
  },

  /**
   * Function: isRightMouseButton
   *
   * Returns true if the right mouse button was pressed. Note that this
   * button might not be available on some systems. For handling a popup
   * trigger <isPopupTrigger> should be used.
   */
  isRightMouseButton: (evt) => {
    if ('which' in evt) return evt.which === 3;
    else return evt.button === 2;
  },

  /**
   * Function: isPopupTrigger
   *
   * Returns true if the event is a popup trigger. This implementation
   * returns true if the right button or the left button and control was
   * pressed on a Mac.
   */
  isPopupTrigger: (evt) =>
    Event.isRightMouseButton(evt) ||
    (Client.IS_MAC &&
      Event.isControlDown(evt) &&
      !Event.isShiftDown(evt) &&
      !Event.isMetaDown(evt) &&
      !Event.isAltDown(evt)),

  /**
   * Function: isShiftDown
   *
   * Returns true if the shift key is pressed for the given event.
   */
  isShiftDown: (evt) => (evt ? evt.shiftKey : false),

  /**
   * Function: isAltDown
   *
   * Returns true if the alt key is pressed for the given event.
   */
  isAltDown: (evt) => (evt ? evt.altKey : false),

  /**
   * Function: isControlDown
   *
   * Returns true if the control key is pressed for the given event.
   */
  isControlDown: (evt) => (evt ? evt.ctrlKey : false),

  /**
   * Function: isMetaDown
   *
   * Returns true if the meta key is pressed for the given event.
   */
  isMetaDown: (evt) => (evt ? evt.metaKey : false),

  /**
   * Function: getMainEvent
   *
   * Returns the touch or mouse event that contains the mouse coordinates.
   */
  getMainEvent: (evt) => {
    if (
      (evt.type === 'touchstart' || evt.type === 'touchmove') &&
      evt.touches &&
      evt.touches[0]
    ) {
      return evt.touches[0];
    } else if (
      evt.type === 'touchend' &&
      evt.changedTouches &&
      evt.changedTouches[0]
    ) {
      return evt.changedTouches[0];
    }

    return evt;
  },

  /**
   * Function: getClientX
   *
   * Returns true if the meta key is pressed for the given event.
   */
  getClientX: (evt) => Event.getMainEvent(evt).clientX,

  /**
   * Function: getClientY
   *
   * Returns true if the meta key is pressed for the given event.
   */
  getClientY: (evt) => Event.getMainEvent(evt).clientY,

  /**
   * Function: consume
   *
   * Consumes the given event.
   *
   * Parameters:
   *
   * evt - Native event to be consumed.
   * preventDefault - Optional boolean to prevent the default for the event.
   * Default is true.
   * stopPropagation - Option boolean to stop event propagation. Default is
   * true.
   */
  consume: (evt, preventDefault = true, stopPropagation = true) => {
    if (preventDefault) {
      if (evt.preventDefault) {
        if (stopPropagation) evt.stopPropagation();

        evt.preventDefault();
      } else if (stopPropagation) {
        evt.cancelBubble = true;
      }
    }

    // Opera
    evt.isConsumed = true;

    // Other browsers
    if (!evt.preventDefault) evt.returnValue = false;
  },

  //
  // Special handles in mouse events
  //

  /**
   * Variable: LABEL_HANDLE
   *
   * Index for the label handle in an mxMouseEvent. This should be a negative
   * value that does not interfere with any possible handle indices. Default
   * is -1.
   */
  LABEL_HANDLE: -1,

  /**
   * Variable: ROTATION_HANDLE
   *
   * Index for the rotation handle in an mxMouseEvent. This should be a
   * negative value that does not interfere with any possible handle indices.
   * Default is -2.
   */
  ROTATION_HANDLE: -2,

  /**
   * Variable: CUSTOM_HANDLE
   *
   * Start index for the custom handles in an mxMouseEvent. This should be a
   * negative value and is the start index which is decremented for each
   * custom handle. Default is -100.
   */
  CUSTOM_HANDLE: -100,

  /**
   * Variable: VIRTUAL_HANDLE
   *
   * Start index for the virtual handles in an mxMouseEvent. This should be a
   * negative value and is the start index which is decremented for each
   * virtual handle. Default is -100000. This assumes that there are no more
   * than VIRTUAL_HANDLE - CUSTOM_HANDLE custom handles.
   *
   */
  VIRTUAL_HANDLE: -100000,

  //
  // Event names
  //

  /**
   * Variable: MOUSE_DOWN
   *
   * Specifies the event name for mouseDown.
   */
  MOUSE_DOWN: 'mouseDown',

  /**
   * Variable: MOUSE_MOVE
   *
   * Specifies the event name for mouseMove.
   */
  MOUSE_MOVE: 'mouseMove',

  /**
   * Variable: MOUSE_UP
   *
   * Specifies the event name for mouseUp.
   */
  MOUSE_UP: 'mouseUp',

  /**
   * Variable: ACTIVATE
   *
   * Specifies the event name for activate.
   */
  ACTIVATE: 'activate',

  /**
   * Variable: RESIZE_START
   *
   * Specifies the event name for resizeStart.
   */
  RESIZE_START: 'resizeStart',

  /**
   * Variable: RESIZE
   *
   * Specifies the event name for resize.
   */
  RESIZE: 'resize',

  /**
   * Variable: RESIZE_END
   *
   * Specifies the event name for resizeEnd.
   */
  RESIZE_END: 'resizeEnd',

  /**
   * Variable: MOVE_START
   *
   * Specifies the event name for moveStart.
   */
  MOVE_START: 'moveStart',

  /**
   * Variable: MOVE
   *
   * Specifies the event name for move.
   */
  MOVE: 'move',

  /**
   * Variable: MOVE_END
   *
   * Specifies the event name for moveEnd.
   */
  MOVE_END: 'moveEnd',

  /**
   * Variable: PAN_START
   *
   * Specifies the event name for panStart.
   */
  PAN_START: 'panStart',

  /**
   * Variable: PAN
   *
   * Specifies the event name for pan.
   */
  PAN: 'pan',

  /**
   * Variable: PAN_END
   *
   * Specifies the event name for panEnd.
   */
  PAN_END: 'panEnd',

  /**
   * Variable: MINIMIZE
   *
   * Specifies the event name for minimize.
   */
  MINIMIZE: 'minimize',

  /**
   * Variable: NORMALIZE
   *
   * Specifies the event name for normalize.
   */
  NORMALIZE: 'normalize',

  /**
   * Variable: MAXIMIZE
   *
   * Specifies the event name for maximize.
   */
  MAXIMIZE: 'maximize',

  /**
   * Variable: HIDE
   *
   * Specifies the event name for hide.
   */
  HIDE: 'hide',

  /**
   * Variable: SHOW
   *
   * Specifies the event name for show.
   */
  SHOW: 'show',

  /**
   * Variable: CLOSE
   *
   * Specifies the event name for close.
   */
  CLOSE: 'close',

  /**
   * Variable: DESTROY
   *
   * Specifies the event name for destroy.
   */
  DESTROY: 'destroy',

  /**
   * Variable: REFRESH
   *
   * Specifies the event name for refresh.
   */
  REFRESH: 'refresh',

  /**
   * Variable: SIZE
   *
   * Specifies the event name for size.
   */
  SIZE: 'size',

  /**
   * Variable: SELECT
   *
   * Specifies the event name for select.
   */
  SELECT: 'select',

  /**
   * Variable: FIRED
   *
   * Specifies the event name for fired.
   */
  FIRED: 'fired',

  /**
   * Variable: FIRE_MOUSE_EVENT
   *
   * Specifies the event name for fireMouseEvent.
   */
  FIRE_MOUSE_EVENT: 'fireMouseEvent',

  /**
   * Variable: GESTURE
   *
   * Specifies the event name for gesture.
   */
  GESTURE: 'gesture',

  /**
   * Variable: TAP_AND_HOLD
   *
   * Specifies the event name for tapAndHold.
   */
  TAP_AND_HOLD: 'tapAndHold',

  /**
   * Variable: GET
   *
   * Specifies the event name for get.
   */
  GET: 'get',

  /**
   * Variable: RECEIVE
   *
   * Specifies the event name for receive.
   */
  RECEIVE: 'receive',

  /**
   * Variable: CONNECT
   *
   * Specifies the event name for connect.
   */
  CONNECT: 'connect',

  /**
   * Variable: DISCONNECT
   *
   * Specifies the event name for disconnect.
   */
  DISCONNECT: 'disconnect',

  /**
   * Variable: SUSPEND
   *
   * Specifies the event name for suspend.
   */
  SUSPEND: 'suspend',

  /**
   * Variable: RESUME
   *
   * Specifies the event name for suspend.
   */
  RESUME: 'resume',

  /**
   * Variable: MARK
   *
   * Specifies the event name for mark.
   */
  MARK: 'mark',

  /**
   * Variable: ROOT
   *
   * Specifies the event name for root.
   */
  ROOT: 'root',

  /**
   * Variable: POST
   *
   * Specifies the event name for post.
   */
  POST: 'post',

  /**
   * Variable: OPEN
   *
   * Specifies the event name for open.
   */
  OPEN: 'open',

  /**
   * Variable: SAVE
   *
   * Specifies the event name for open.
   */
  SAVE: 'save',

  /**
   * Variable: BEFORE_ADD_VERTEX
   *
   * Specifies the event name for beforeAddVertex.
   */
  BEFORE_ADD_VERTEX: 'beforeAddVertex',

  /**
   * Variable: ADD_VERTEX
   *
   * Specifies the event name for addVertex.
   */
  ADD_VERTEX: 'addVertex',

  /**
   * Variable: AFTER_ADD_VERTEX
   *
   * Specifies the event name for afterAddVertex.
   */
  AFTER_ADD_VERTEX: 'afterAddVertex',

  /**
   * Variable: DONE
   *
   * Specifies the event name for done.
   */
  DONE: 'done',

  /**
   * Variable: EXECUTE
   *
   * Specifies the event name for execute.
   */
  EXECUTE: 'execute',

  /**
   * Variable: EXECUTED
   *
   * Specifies the event name for executed.
   */
  EXECUTED: 'executed',

  /**
   * Variable: BEGIN_UPDATE
   *
   * Specifies the event name for beginUpdate.
   */
  BEGIN_UPDATE: 'beginUpdate',

  /**
   * Variable: START_EDIT
   *
   * Specifies the event name for startEdit.
   */
  START_EDIT: 'startEdit',

  /**
   * Variable: END_UPDATE
   *
   * Specifies the event name for endUpdate.
   */
  END_UPDATE: 'endUpdate',

  /**
   * Variable: END_EDIT
   *
   * Specifies the event name for endEdit.
   */
  END_EDIT: 'endEdit',

  /**
   * Variable: BEFORE_UNDO
   *
   * Specifies the event name for beforeUndo.
   */
  BEFORE_UNDO: 'beforeUndo',

  /**
   * Variable: UNDO
   *
   * Specifies the event name for undo.
   */
  UNDO: 'undo',

  /**
   * Variable: REDO
   *
   * Specifies the event name for redo.
   */
  REDO: 'redo',

  /**
   * Variable: CHANGE
   *
   * Specifies the event name for change.
   */
  CHANGE: 'change',

  /**
   * Variable: NOTIFY
   *
   * Specifies the event name for notify.
   */
  NOTIFY: 'notify',

  /**
   * Variable: LAYOUT_CELLS
   *
   * Specifies the event name for layoutCells.
   */
  LAYOUT_CELLS: 'layoutCells',

  /**
   * Variable: CLICK
   *
   * Specifies the event name for click.
   */
  CLICK: 'click',

  /**
   * Variable: SCALE
   *
   * Specifies the event name for scale.
   */
  SCALE: 'scale',

  /**
   * Variable: TRANSLATE
   *
   * Specifies the event name for translate.
   */
  TRANSLATE: 'translate',

  /**
   * Variable: SCALE_AND_TRANSLATE
   *
   * Specifies the event name for scaleAndTranslate.
   */
  SCALE_AND_TRANSLATE: 'scaleAndTranslate',

  /**
   * Variable: UP
   *
   * Specifies the event name for up.
   */
  UP: 'up',

  /**
   * Variable: DOWN
   *
   * Specifies the event name for down.
   */
  DOWN: 'down',

  /**
   * Variable: ADD
   *
   * Specifies the event name for add.
   */
  ADD: 'add',

  /**
   * Variable: REMOVE
   *
   * Specifies the event name for remove.
   */
  REMOVE: 'remove',

  /**
   * Variable: CLEAR
   *
   * Specifies the event name for clear.
   */
  CLEAR: 'clear',

  /**
   * Variable: ADD_CELLS
   *
   * Specifies the event name for addCells.
   */
  ADD_CELLS: 'addCells',

  /**
   * Variable: CELLS_ADDED
   *
   * Specifies the event name for cellsAdded.
   */
  CELLS_ADDED: 'cellsAdded',

  /**
   * Variable: MOVE_CELLS
   *
   * Specifies the event name for moveCells.
   */
  MOVE_CELLS: 'moveCells',

  /**
   * Variable: CELLS_MOVED
   *
   * Specifies the event name for cellsMoved.
   */
  CELLS_MOVED: 'cellsMoved',

  /**
   * Variable: RESIZE_CELLS
   *
   * Specifies the event name for resizeCells.
   */
  RESIZE_CELLS: 'resizeCells',

  /**
   * Variable: CELLS_RESIZED
   *
   * Specifies the event name for cellsResized.
   */
  CELLS_RESIZED: 'cellsResized',

  /**
   * Variable: TOGGLE_CELLS
   *
   * Specifies the event name for toggleCells.
   */
  TOGGLE_CELLS: 'toggleCells',

  /**
   * Variable: CELLS_TOGGLED
   *
   * Specifies the event name for cellsToggled.
   */
  CELLS_TOGGLED: 'cellsToggled',

  /**
   * Variable: ORDER_CELLS
   *
   * Specifies the event name for orderCells.
   */
  ORDER_CELLS: 'orderCells',

  /**
   * Variable: CELLS_ORDERED
   *
   * Specifies the event name for cellsOrdered.
   */
  CELLS_ORDERED: 'cellsOrdered',

  /**
   * Variable: REMOVE_CELLS
   *
   * Specifies the event name for removeCells.
   */
  REMOVE_CELLS: 'removeCells',

  /**
   * Variable: CELLS_REMOVED
   *
   * Specifies the event name for cellsRemoved.
   */
  CELLS_REMOVED: 'cellsRemoved',

  /**
   * Variable: GROUP_CELLS
   *
   * Specifies the event name for groupCells.
   */
  GROUP_CELLS: 'groupCells',

  /**
   * Variable: UNGROUP_CELLS
   *
   * Specifies the event name for ungroupCells.
   */
  UNGROUP_CELLS: 'ungroupCells',

  /**
   * Variable: REMOVE_CELLS_FROM_PARENT
   *
   * Specifies the event name for removeCellsFromParent.
   */
  REMOVE_CELLS_FROM_PARENT: 'removeCellsFromParent',

  /**
   * Variable: FOLD_CELLS
   *
   * Specifies the event name for foldCells.
   */
  FOLD_CELLS: 'foldCells',

  /**
   * Variable: CELLS_FOLDED
   *
   * Specifies the event name for cellsFolded.
   */
  CELLS_FOLDED: 'cellsFolded',

  /**
   * Variable: ALIGN_CELLS
   *
   * Specifies the event name for alignCells.
   */
  ALIGN_CELLS: 'alignCells',

  /**
   * Variable: LABEL_CHANGED
   *
   * Specifies the event name for labelChanged.
   */
  LABEL_CHANGED: 'labelChanged',

  /**
   * Variable: CONNECT_CELL
   *
   * Specifies the event name for connectCell.
   */
  CONNECT_CELL: 'connectCell',

  /**
   * Variable: CELL_CONNECTED
   *
   * Specifies the event name for cellConnected.
   */
  CELL_CONNECTED: 'cellConnected',

  /**
   * Variable: SPLIT_EDGE
   *
   * Specifies the event name for splitEdge.
   */
  SPLIT_EDGE: 'splitEdge',

  /**
   * Variable: FLIP_EDGE
   *
   * Specifies the event name for flipEdge.
   */
  FLIP_EDGE: 'flipEdge',

  /**
   * Variable: START_EDITING
   *
   * Specifies the event name for startEditing.
   */
  START_EDITING: 'startEditing',

  /**
   * Variable: EDITING_STARTED
   *
   * Specifies the event name for editingStarted.
   */
  EDITING_STARTED: 'editingStarted',

  /**
   * Variable: EDITING_STOPPED
   *
   * Specifies the event name for editingStopped.
   */
  EDITING_STOPPED: 'editingStopped',

  /**
   * Variable: ADD_OVERLAY
   *
   * Specifies the event name for addOverlay.
   */
  ADD_OVERLAY: 'addOverlay',

  /**
   * Variable: REMOVE_OVERLAY
   *
   * Specifies the event name for removeOverlay.
   */
  REMOVE_OVERLAY: 'removeOverlay',

  /**
   * Variable: UPDATE_CELL_SIZE
   *
   * Specifies the event name for updateCellSize.
   */
  UPDATE_CELL_SIZE: 'updateCellSize',

  /**
   * Variable: ESCAPE
   *
   * Specifies the event name for escape.
   */
  ESCAPE: 'escape',

  /**
   * Variable: DOUBLE_CLICK
   *
   * Specifies the event name for doubleClick.
   */
  DOUBLE_CLICK: 'doubleClick',

  /**
   * Variable: START
   *
   * Specifies the event name for start.
   */
  START: 'start',

  /**
   * Variable: RESET
   *
   * Specifies the event name for reset.
   */
  RESET: 'reset',

  /**
   * Variable: PINCH_THRESHOLD
   *
   * Threshold for pinch gestures to fire a mouse wheel event.
   * Default value is 10.
   */
  PINCH_THRESHOLD: 10
};

export default Event;
