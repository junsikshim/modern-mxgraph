/**
 * Copyright (c) 2006-2016, JGraph Ltd
 * Copyright (c) 2006-2016, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet, isUnset } from '../Helpers';
import Cell from '../model/Cell';
import Geometry from '../model/Geometry';
import ImageShape from '../shape/ImageShape';
import Polyline from '../shape/Polyline';
import {
  CURSOR_CONNECT,
  DEFAULT_VALID_COLOR,
  HIGHLIGHT_STROKEWIDTH,
  INVALID_COLOR,
  OUTLINE_HIGHLIGHT_COLOR,
  OUTLINE_HIGHLIGHT_STROKEWIDTH,
  STYLE_ROTATION,
  TOOLTIP_VERTICAL_OFFSET
} from '../util/Constants';
import Event from '../util/Event';
import EventObject from '../util/EventObject';
import EventSource from '../util/EventSource';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import { getOffset, getRotatedPoint, getValue, toRadians } from '../util/Utils';

/**
 * Class: ConnectionHandler
 *
 * Graph event handler that creates new connections. Uses <mxTerminalMarker>
 * for finding and highlighting the source and target vertices and
 * <factoryMethod> to create the edge instance. This handler is built-into
 * <mxGraph.connectionHandler> and enabled using <mxGraph.setConnectable>.
 *
 * Example:
 *
 * (code)
 * new mxConnectionHandler(graph, function(source, target, style)
 * {
 *   edge = new mxCell('', new mxGeometry());
 *   edge.setEdge(true);
 *   edge.setStyle(style);
 *   edge.geometry.relative = true;
 *   return edge;
 * });
 * (end)
 *
 * Here is an alternative solution that just sets a specific user object for
 * new edges by overriding <insertEdge>.
 *
 * (code)
 * mxConnectionHandlerInsertEdge = mxConnectionHandler.prototype.insertEdge;
 * mxConnectionHandler.prototype.insertEdge = function(parent, id, value, source, target, style)
 * {
 *   value = 'Test';
 *
 *   return mxConnectionHandlerInsertEdge.apply(this, arguments);
 * };
 * (end)
 *
 * Using images to trigger connections:
 *
 * This handler uses mxTerminalMarker to find the source and target cell for
 * the new connection and creates a new edge using <connect>. The new edge is
 * created using <createEdge> which in turn uses <factoryMethod> or creates a
 * new default edge.
 *
 * The handler uses a "highlight-paradigm" for indicating if a cell is being
 * used as a source or target terminal, as seen in other diagramming products.
 * In order to allow both, moving and connecting cells at the same time,
 * <mxConstants.DEFAULT_HOTSPOT> is used in the handler to determine the hotspot
 * of a cell, that is, the region of the cell which is used to trigger a new
 * connection. The constant is a value between 0 and 1 that specifies the
 * amount of the width and height around the center to be used for the hotspot
 * of a cell and its default value is 0.5. In addition,
 * <mxConstants.MIN_HOTSPOT_SIZE> defines the minimum number of pixels for the
 * width and height of the hotspot.
 *
 * This solution, while standards compliant, may be somewhat confusing because
 * there is no visual indicator for the hotspot and the highlight is seen to
 * switch on and off while the mouse is being moved in and out. Furthermore,
 * this paradigm does not allow to create different connections depending on
 * the highlighted hotspot as there is only one hotspot per cell and it
 * normally does not allow cells to be moved and connected at the same time as
 * there is no clear indication of the connectable area of the cell.
 *
 * To come across these issues, the handle has an additional <createIcons> hook
 * with a default implementation that allows to create one icon to be used to
 * trigger new connections. If this icon is specified, then new connections can
 * only be created if the image is clicked while the cell is being highlighted.
 * The <createIcons> hook may be overridden to create more than one
 * <mxImageShape> for creating new connections, but the default implementation
 * supports one image and is used as follows:
 *
 * In order to display the "connect image" whenever the mouse is over the cell,
 * an DEFAULT_HOTSPOT of 1 should be used:
 *
 * (code)
 * mxConstants.DEFAULT_HOTSPOT = 1;
 * (end)
 *
 * In order to avoid confusion with the highlighting, the highlight color
 * should not be used with a connect image:
 *
 * (code)
 * mxConstants.HIGHLIGHT_COLOR = null;
 * (end)
 *
 * To install the image, the connectImage field of the mxConnectionHandler must
 * be assigned a new <mxImage> instance:
 *
 * (code)
 * mxConnectionHandler.prototype.connectImage = new mxImage('images/green-dot.gif', 14, 14);
 * (end)
 *
 * This will use the green-dot.gif with a width and height of 14 pixels as the
 * image to trigger new connections. In createIcons the icon field of the
 * handler will be set in order to remember the icon that has been clicked for
 * creating the new connection. This field will be available under selectedIcon
 * in the connect method, which may be overridden to take the icon that
 * triggered the new connection into account. This is useful if more than one
 * icon may be used to create a connection.
 *
 * Group: Events
 *
 * Event: mxEvent.START
 *
 * Fires when a new connection is being created by the user. The <code>state</code>
 * property contains the state of the source cell.
 *
 * Event: mxEvent.CONNECT
 *
 * Fires between begin- and endUpdate in <connect>. The <code>cell</code>
 * property contains the inserted edge, the <code>event</code> and <code>target</code>
 * properties contain the respective arguments that were passed to <connect> (where
 * target corresponds to the dropTarget argument). Finally, the <code>terminal</code>
 * property corresponds to the target argument in <connect> or the clone of the source
 * terminal if <createTarget> is enabled.
 *
 * Note that the target is the cell under the mouse where the mouse button was released.
 * Depending on the logic in the handler, this doesn't necessarily have to be the target
 * of the inserted edge. To print the source, target or any optional ports IDs that the
 * edge is connected to, the following code can be used. To get more details about the
 * actual connection point, <mxGraph.getConnectionConstraint> can be used. To resolve
 * the port IDs, use <mxGraphModel.getCell>.
 *
 * (code)
 * graph.connectionHandler.addListener(mxEvent.CONNECT, function(sender, evt)
 * {
 *   var edge = evt.getProperty('cell');
 *   var source = graph.getModel().getTerminal(edge, true);
 *   var target = graph.getModel().getTerminal(edge, false);
 *
 *   var style = graph.getCellStyle(edge);
 *   var sourcePortId = style[mxConstants.STYLE_SOURCE_PORT];
 *   var targetPortId = style[mxConstants.STYLE_TARGET_PORT];
 *
 *   mxLog.show();
 *   mxLog.debug('connect', edge, source.id, target.id, sourcePortId, targetPortId);
 * });
 * (end)
 *
 * Event: mxEvent.RESET
 *
 * Fires when the <reset> method is invoked.
 *
 * Constructor: mxConnectionHandler
 *
 * Constructs an event handler that connects vertices using the specified
 * factory method to create the new edges. Modify
 * <mxConstants.ACTIVE_REGION> to setup the region on a cell which triggers
 * the creation of a new connection or use connect icons as explained
 * above.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * factoryMethod - Optional function to create the edge. The function takes
 * the source and target <mxCell> as the first and second argument and an
 * optional cell style from the preview as the third argument. It returns
 * the <mxCell> that represents the new edge.
 */
const ConnectionHandler = (graph, factoryMethod) => {
  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: factoryMethod
   *
   * Function that is used for creating new edges. The function takes the
   * source and target <mxCell> as the first and second argument and returns
   * a new <mxCell> that represents the edge. This is used in <createEdge>.
   */
  const [getFactoryMethod, setFactoryMethod] = addProp(factoryMethod);

  /**
   * Variable: moveIconFront
   *
   * Specifies if icons should be displayed inside the graph container instead
   * of the overlay pane. This is used for HTML labels on vertices which hide
   * the connect icon. This has precendence over <moveIconBack> when set
   * to true. Default is false.
   */
  const [isMoveIconFront, setMoveIconFront] = addProp(false);

  /**
   * Variable: moveIconBack
   *
   * Specifies if icons should be moved to the back of the overlay pane. This can
   * be set to true if the icons of the connection handler conflict with other
   * handles, such as the vertex label move handle. Default is false.
   */
  const [isMoveIconBack, setMoveIconBack] = addProp(false);

  /**
   * Variable: connectImage
   *
   * <mxImage> that is used to trigger the creation of a new connection. This
   * is used in <createIcons>. Default is null.
   */
  const [getConnectImage, setConnectImage] = addProp();

  /**
   * Variable: targetConnectImage
   *
   * Specifies if the connect icon should be centered on the target state
   * while connections are being previewed. Default is false.
   */
  const [getTargetConnectImage, setTargetConnectImage] = addProp(false);

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: select
   *
   * Specifies if new edges should be selected. Default is true.
   */
  const [isSelect, setSelect] = addProp(true);

  /**
   * Variable: createTarget
   *
   * Specifies if <createTargetVertex> should be called if no target was under the
   * mouse for the new connection. Setting this to true means the connection
   * will be drawn as valid if no target is under the mouse, and
   * <createTargetVertex> will be called before the connection is created between
   * the source cell and the newly created vertex in <createTargetVertex>, which
   * can be overridden to create a new target. Default is false.
   */
  const [isCreateTarget, setCreateTarget] = addProp(false);

  /**
   * Variable: marker
   *
   * Holds the <mxTerminalMarker> used for finding source and target cells.
   */
  const [getMarker, setMarker] = addProp();

  /**
   * Variable: constraintHandler
   *
   * Holds the <mxConstraintHandler> used for drawing and highlighting
   * constraints.
   */
  const [getConstraintHandler, setConstraintHandler] = addProp();

  /**
   * Variable: error
   *
   * Holds the current validation error while connections are being created.
   */
  const [getError, setError] = addProp();

  /**
   * Variable: waypointsEnabled
   *
   * Specifies if single clicks should add waypoints on the new edge. Default is
   * false.
   */
  const [isWaypointsEnabled, setWaypointsEnabled] = addProp(false);

  /**
   * Variable: ignoreMouseDown
   *
   * Specifies if the connection handler should ignore the state of the mouse
   * button when highlighting the source. Default is false, that is, the
   * handler only highlights the source if no button is being pressed.
   */
  const [isIgnoreMouseDown, setIgnoreMouseDown] = addProp(false);

  /**
   * Variable: first
   *
   * Holds the <mxPoint> where the mouseDown took place while the handler is
   * active.
   */
  const [getFirst, setFirst] = addProp();

  /**
   * Variable: connectIconOffset
   *
   * Holds the offset for connect icons during connection preview.
   * Default is mxPoint(0, <mxConstants.TOOLTIP_VERTICAL_OFFSET>).
   * Note that placing the icon under the mouse pointer with an
   * offset of (0,0) will affect hit detection.
   */
  const [getConnectionIconOffset, setConnectionIconOffset] = addProp(
    Point(0, TOOLTIP_VERTICAL_OFFSET)
  );

  /**
   * Variable: edgeState
   *
   * Optional <mxCellState> that represents the preview edge while the
   * handler is active. This is created in <createEdgeState>.
   */
  const [getEdgeState, setEdgeState] = addProp();

  /**
   * Variable: changeHandler
   *
   * Holds the change event listener for later removal.
   */
  const [getChangeHandler, setChangeHandler] = addProp();

  /**
   * Variable: drillHandler
   *
   * Holds the drill event listener for later removal.
   */
  const [getDrillHandler, setDrillHandler] = addProp();

  /**
   * Variable: mouseDownCounter
   *
   * Counts the number of mouseDown events since the start. The initial mouse
   * down event counts as 1.
   */
  const [getMouseDownCounter, setMouseDownCounter] = addProp(0);

  /**
   * Variable: outlineConnect
   *
   * Specifies if connections to the outline of a highlighted target should be
   * enabled. This will allow to place the connection point along the outline of
   * the highlighted target. Default is false.
   */
  const [isOutlineConnect, setOutlineConnect] = addProp(false);

  /**
   * Variable: livePreview
   *
   * Specifies if the actual shape of the edge state should be used for the preview.
   * Default is false. (Ignored if no edge state is created in <createEdgeState>.)
   */
  const [isLivePreview, setLivePreview] = addProp(false);

  /**
   * Variable: cursor
   *
   * Specifies the cursor to be used while the handler is active. Default is null.
   */
  const [getCursor, setCursor] = addProp();

  /**
   * Variable: insertBeforeSource
   *
   * Specifies if new edges should be inserted before the source vertex in the
   * cell hierarchy. Default is false for backwards compatibility.
   */
  const [isInsertBeforeSource, setInsertBeforeSource] = addProp(false);

  const [getEscapeHandler, setEscapeHandler] = addProp(() => reset());

  /**
   * Function: isInsertBefore
   *
   * Returns <insertBeforeSource> for non-loops and false for loops.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to be inserted.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * evt - Mousedown event of the connect gesture.
   * dropTarget - <mxCell> that represents the cell under the mouse when it was
   * released.
   */
  const isInsertBefore = (edge, source, target, evt, dropTarget) =>
    isInsertBeforeSource() && source !== target;

  /**
   * Function: createShape
   *
   * Creates the preview shape for new connections.
   */
  const createShape = () => {
    const graph = getGraph();

    // Creates the edge preview
    const shape =
      isLivePreview() && isSet(getEdgeState())
        ? graph.getCellRenderer().createShape(getEdgeState())
        : Polyline([], INVALID_COLOR);
    shape.setScale(graph.getView().getScale());
    shape.setPointerEvents(false);
    shape.setDashed(true);
    shape.init(graph.getView().getOverlayPane());
    Event.redirectMouseEvents(shape.getNode(), graph);

    return shape;
  };

  /**
   * Function: init
   *
   * Initializes the shapes required for this connection handler. This should
   * be invoked if <mxGraph.container> is assigned after the connection
   * handler has been created.
   */
  const init = () => {
    const graph = getGraph();

    graph.addMouseListener(me);
    setMarker(createMarker());
    setConstraintHandler(ConstraintHandler(graph));

    // Redraws the icons if the graph changes
    setChangeHandler((sender) => {
      if (isSet(setIconState())) {
        setIconState(graph.getView().getState(getIconState().getCell()));
      }

      if (isSet(getIconState())) {
        redrawIcons(getIcons(), getIconState());
        getConstraintHandler().reset();
      } else if (
        isSet(getPrevious()) &&
        isUnset(graph.getView().getState(getPrevious().getCell()))
      ) {
        reset();
      }
    });

    graph.getModel().addListener(Event.CHANGE, getChangeHandler());
    graph.getView().addListener(Event.SCALE, getChangeHandler());
    graph.getView().addListener(Event.TRANSLATE, getChangeHandler());
    graph.getView().addListener(Event.SCALE_AND_TRANSLATE, getChangeHandler());

    // Removes the icon if we step into/up or start editing
    setDrillHandler((sender) => reset());

    graph.addListener(Event.START_EDITING, getDrillHandler());
    graph.getView().addListener(Event.DOWN, getDrillHandler());
    graph.getView().addListener(Event.UP, getDrillHandler());
  };

  /**
   * Function: isConnectableCell
   *
   * Returns true if the given cell is connectable. This is a hook to
   * disable floating connections. This implementation returns true.
   */
  const isConnectableCell = (cell) => true;

  /**
   * Function: createMarker
   *
   * Creates and returns the <mxCellMarker> used in <marker>.
   */
  const createMarker = () => {
    const graph = getGraph();

    const marker = CellMarker(graph);
    marker.setHotspotEnabled(true);

    // Overrides to return cell at location only if valid (so that
    // there is no highlight for invalid cells)
    marker.getCell = (mE) => {
      let cell = marker.getCell(mE);
      setError();

      // Checks for cell at preview point (with grid)
      if (isUnset(cell) && isSet(getCurrentPoint())) {
        cell = graph.getCellAt(
          getCurrentPoint().getX(),
          getCurrentPoint().getY()
        );
      }

      // Uses connectable parent vertex if one exists
      if (isSet(cell) && !graph.isCellConnectable(cell)) {
        const parent = graph.getModel().getParent(cell);

        if (
          graph.getModel().isVertex(parent) &&
          graph.isCellConnectable(parent)
        ) {
          cell = parent;
        }
      }

      if (
        (graph.isSwimlane(cell) &&
          isSet(getCurrentPoint()) &&
          graph.hitsSwimlaneContent(
            cell,
            getCurrentPoint().getX(),
            getCurrentPoint().getY()
          )) ||
        !isConnectableCell(cell)
      ) {
        cell = undefined;
      }

      if (isSet(cell)) {
        if (isConnecting()) {
          if (isSet(getPrevious())) {
            setError(validateConnection(getPrevious().getCell(), cell));

            if (isSet(getError()) && getError().length === 0) {
              cell = undefined;

              // Enables create target inside groups
              if (isCreateTarget(mE.getEvent())) {
                setError();
              }
            }
          }
        } else if (!isValidSource(cell, mE)) {
          cell = undefined;
        }
      } else if (
        isConnecting() &&
        !isCreateTarget(mE.getEvent()) &&
        !graph.isAllowDanglingEdges()
      ) {
        setError('');
      }

      return cell;
    };

    // Sets the highlight color according to validateConnection
    marker.isValidState = (state) => {
      if (isConnecting()) {
        return isUnset(getError());
      } else {
        return marker.isValidState(state);
      }
    };

    // Overrides to use marker color only in highlight mode or for
    // target selection
    marker.getMarkerColor = (evt, state, isValid) =>
      isUnset(getConnectImage()) || isConnecting()
        ? marker.getMarkerColor(evt, state, isValid)
        : undefined;

    // Overrides to use hotspot only for source selection otherwise
    // intersects always returns true when over a cell
    marker.intersects = (state, evt) => {
      if (isSet(getConnectImage()) || isConnecting()) {
        return true;
      }

      return marker.intersects(state, evt);
    };

    return marker;
  };

  /**
   * Function: start
   *
   * Starts a new connection for the given state and coordinates.
   */
  const start = (state, x, y, edgeState = createEdgeState()) => {
    setPrevious(state);
    setFirst(Point(x, y));
    setEdgeState(edgeState);

    // Marks the source state
    const marker = getMarker();
    marker.setCurrentColor(marker.getValidColor());
    marker.setMarkedState(state);
    marker.mark();

    fireEvent(EventObject(Event.START, 'state', getPrevious()));
  };

  /**
   * Function: isConnecting
   *
   * Returns true if the source terminal has been clicked and a new
   * connection is currently being previewed.
   */
  const isConnecting = () => isSet(getFirst()) && isSet(getShape());

  /**
   * Function: isValidSource
   *
   * Returns <mxGraph.isValidSource> for the given source terminal.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the source terminal.
   * me - <mxMouseEvent> that is associated with this call.
   */
  const isValidSource = (cell, mE) => getGraph().isValidSource(cell);

  /**
   * Function: isValidTarget
   *
   * Returns true. The call to <mxGraph.isValidTarget> is implicit by calling
   * <mxGraph.getEdgeValidationError> in <validateConnection>. This is an
   * additional hook for disabling certain targets in this specific handler.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the target terminal.
   */
  const isValidTarget = (cell) => true;

  /**
   * Function: validateConnection
   *
   * Returns the error message or an empty string if the connection for the
   * given source target pair is not valid. Otherwise it returns null. This
   * implementation uses <mxGraph.getEdgeValidationError>.
   *
   * Parameters:
   *
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   */
  const validateConnection = (source, target) => {
    if (!isValidTarget(target)) {
      return '';
    }

    return getGraph().getEdgeValidationError(undefined, source, target);
  };

  /**
   * Function: isMoveIconToFrontForState
   *
   * Returns true if the state has a HTML label in the graph's container, otherwise
   * it returns <moveIconFront>.
   *
   * Parameters:
   *
   * state - <mxCellState> whose connect icons should be returned.
   */
  const isMoveIconToFrontForState = (state) => {
    if (
      isSet(state.getText()) &&
      state.getText().getNode().parentNode === getGraph().container
    ) {
      return true;
    }

    return getMoveIconFront();
  };

  /**
   * Function: createIcons
   *
   * Creates the array <mxImageShapes> that represent the connect icons for
   * the given <mxCellState>.
   *
   * Parameters:
   *
   * state - <mxCellState> whose connect icons should be returned.
   */
  const createIcons = (state) => {
    const image = getConnectImage(state);

    if (isSet(image) && isSet(state)) {
      setIconState(state);
      const icons = [];

      // Cannot use HTML for the connect icons because the icon receives all
      // mouse move events in IE, must use VML and SVG instead even if the
      // connect-icon appears behind the selection border and the selection
      // border consumes the events before the icon gets a chance
      const bounds = Rectangle(0, 0, image.getWidth(), image.getHeight());
      let icon = ImageShape(bounds, image.getSrc(), undefined, undefined, 0);
      icon.setPreserveImageAspect(false);

      if (isMoveIconToFrontForState(state)) {
        icon.init(getGraph().getContainer());
      } else {
        icon.init(getGraph().getView().getOverlayPane());

        // Move the icon back in the overlay pane
        if (isMoveIconBack() && isSet(icon.getNode().previousSibling)) {
          icon
            .getNode()
            .parentNode.insertBefore(
              icon.getNode(),
              icon.getNode().parentNode.firstChild
            );
        }
      }

      icon.getNode().style.cursor = CURSOR_CONNECT;

      // Events transparency
      const getState = () =>
        isSet(getCurrentState()) ? getCurrentState() : state;

      // Updates the local icon before firing the mouse down event.
      const mouseDown = (evt) => {
        if (!Event.isConsumed(evt)) {
          setIcon(icon);
          getGraph().fireMouseEvent(
            Event.MOUSE_DOWN,
            MouseEvent(evt, getState())
          );
        }
      };

      Event.redirectMouseEvents(
        icon.getNode(),
        getGraph(),
        getState,
        mouseDown
      );

      icons.push(icon);
      redrawIcons(icons, getIconState());

      return icons;
    }

    return;
  };

  /**
   * Function: redrawIcons
   *
   * Redraws the given array of <mxImageShapes>.
   *
   * Parameters:
   *
   * icons - Optional array of <mxImageShapes> to be redrawn.
   */
  const redrawIcons = (icons, state) => {
    if (isSet(icons) && isSet(icons[0]) && isSet(state)) {
      const pos = getIconPosition(icons[0], state);
      icons[0].getBounds().setX(pos.getX());
      icons[0].getBounds().setY(pos.getY());
      icons[0].redraw();
    }
  };

  /**
   * Function: getIconPosition
   *
   * Returns the center position of the given icon.
   *
   * Parameters:
   *
   * icon - The connect icon of <mxImageShape> with the mouse.
   * state - <mxCellState> under the mouse.
   */
  const getIconPosition = (icon, state) => {
    const scale = getGraph().getView().getScale();
    let cx = state.getCenterX();
    let cy = state.getCenterY();

    if (getGraph().isSwimlane(state.getCell())) {
      const size = getGraph().getStartSize(state.getCell());

      cx =
        size.getWidth() !== 0
          ? state.getX() + (size.getWidth() * scale) / 2
          : cx;
      cy =
        size.getHeight() != 0
          ? state.getY() + (size.getHeight() * scale) / 2
          : cy;

      const alpha = toRadians(getValue(state.getStyle(), STYLE_ROTATION) || 0);

      if (alpha !== 0) {
        const cos = Math.cos(alpha);
        const sin = Math.sin(alpha);
        const ct = Point(state.getCenterX(), state.getCenterY());
        const pt = getRotatedPoint(Point(cx, cy), cos, sin, ct);
        cx = pt.getX();
        cy = pt.getY();
      }
    }

    return Point(
      cx - icon.bounds.getWidth() / 2,
      cy - icon.bounds.getHeight() / 2
    );
  };

  /**
   * Function: destroyIcons
   *
   * Destroys the connect icons and resets the respective state.
   */
  const destroyIcons = () => {
    const icons = getIcons();

    if (isSet(icons)) {
      for (let i = 0; i < icons.length; i++) {
        icons[i].destroy();
      }

      setIcons();
      setIcon();
      setSelectedIcon();
      setIconState();
    }
  };

  /**
   * Function: isStartEvent
   *
   * Returns true if the given mouse down event should start this handler. The
   * This implementation returns true if the event does not force marquee
   * selection, and the currentConstraint and currentFocus of the
   * <constraintHandler> are not null, or <previous> and <error> are not null and
   * <icons> is null or <icons> and <icon> are not null.
   */
  const isStartEvent = (mE) =>
    (isSet(getConstraintHandler().getCurrentFocus()) &&
      isSet(getConstraintHandler().getCurrentConstraint())) ||
    (isSet(getPrevious()) &&
      isUnset(getError()) &&
      (isUnset(getIcons()) || (isSet(getIcons()) && isSet(getIcon()))));

  /**
   * Function: mouseDown
   *
   * Handles the event by initiating a new connection.
   */
  const mouseDown = (sender, mE) => {
    setMouseDownCounter(getMouseDownCounter() + 1);

    if (
      isEnabled() &&
      getGraph().isEnabled() &&
      !mE.isConsumed() &&
      !isConnecting() &&
      isStartEvent(me)
    ) {
      const constraintHandler = getConstraintHandler();

      if (
        isSet(constraintHandler.getCurrentConstraint()) &&
        isSet(constraintHandler.getCurrentFocus()) &&
        isSet(constraintHandler.getCurrentPoint())
      ) {
        setSourceConstraint(constraintHandler.getCurrentConstraint());
        setPrevious(constraintHandler.getCurrentFocus());
        setFirst(constraintHandler.getCurrentPoint().clone());
      } else {
        // Stores the location of the initial mousedown
        setFirst(Point(mE.getGraphX(), mE.getGraphY()));
      }

      setEdgeState(createEdgeState(mE));
      setMouseDownCounter(1);

      if (isWaypointsEnabled() && isUnset(getShape())) {
        setWaypoints();
        setShape(createShape());

        if (isSet(getEdgeState())) {
          getShape.apply(getEdgeState());
        }
      }

      // Stores the starting point in the geometry of the preview
      if (isUnset(getPrevious()) && isSet(getEdgeState())) {
        const pt = getGraph().getPointForEvent(mE.getEvent());
        getEdgeState().getCell().getGeometry().setTerminalPoint(pt, true);
      }

      fireEvent(EventObject(Event.START, 'state', getPrevious()));

      mE.consume();
    }

    setSelectedIcon(getIcon());
    setIcon();
  };

  /**
   * Function: isImmediateConnectSource
   *
   * Returns true if a tap on the given source state should immediately start
   * connecting. This implementation returns true if the state is not movable
   * in the graph.
   */
  const isImmediateConnectSource = (state) =>
    !getGraph().isCellMovable(state.getCell());

  /**
   * Function: createEdgeState
   *
   * Hook to return an <mxCellState> which may be used during the preview.
   * This implementation returns null.
   *
   * Use the following code to create a preview for an existing edge style:
   *
   * (code)
   * graph.connectionHandler.createEdgeState = function(me)
   * {
   *   var edge = graph.createEdge(null, null, null, null, null, 'edgeStyle=elbowEdgeStyle');
   *
   *   return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
   * };
   * (end)
   */
  const createEdgeState = (mE) => undefined;

  /**
   * Function: isOutlineConnectEvent
   *
   * Returns true if <outlineConnect> is true and the source of the event is the outline shape
   * or shift is pressed.
   */
  const isOutlineConnectEvent = (mE) => {
    const offset = getOffset(getGraph().getContainer());
    const evt = mE.getEvent();

    const clientX = Event.getClientX(evt);
    const clientY = Event.getClientY(evt);

    const doc = document.documentElement;
    const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

    const gridX =
      getCurrentPoint().getX() -
      getGraph().getContainer().scrollLeft +
      offset.getX() -
      left;
    const gridY =
      getCurrentPoint().getY() -
      getGraph().getContainer().scrollTop +
      offset.getY() -
      top;

    return (
      isOutlineConnect() &&
      !Event.isShiftDown(mE.getEvent()) &&
      (mE.isSource(getMarker().getHighlight().getShape()) ||
        (Event.isAltDown(mE.getEvent()) && isSet(mE.getState())) ||
        getMarker().getHighlight().isHighlightAt(clientX, clientY) ||
        ((gridX !== clientX || gridY !== clientY) &&
          isUnset(mE.getState()) &&
          getMarker().getHighlight().isHighlightAt(gridX, gridY)))
    );
  };

  /**
   * Function: updateCurrentState
   *
   * Updates the current state for a given mouse move event by using
   * the <marker>.
   */
  const updateCurrentState = (mE, point) => {
    const constraintHandler = getConstraintHandler();
    const marker = getMarker();
    const highlight = marker.getHighlight();

    constraintHandler.update(
      mE,
      isUnset(getFirst()),
      false,
      isUnset(getFirst()) || mE.isSource(highlight.getShape())
        ? undefined
        : point
    );

    if (
      isSet(constraintHandler.getCurrentFocus()) &&
      isSet(constraintHandler.getCurrentConstraint())
    ) {
      // Handles special case where grid is large and connection point is at actual point in which
      // case the outline is not followed as long as we're < gridSize / 2 away from that point
      if (
        isSet(highlight) &&
        isSet(highlight.getState()) &&
        highlight.getState().getCell() ===
          constraintHandler.getCurrentFocus().getCell()
      ) {
        // Direct repaint needed if cell already highlighted
        if (highlight.getShape().getStroke() !== 'transparent') {
          highlight.getShape().setStroke('transparent');
          highlight.repaint();
        }
      } else {
        marker.markCell(
          constraintHandler.getCurrentFocus().getCell(),
          'transparent'
        );
      }

      // Updates validation state
      if (isSet(getPrevious())) {
        setError(
          validateConnection(
            getPrevious().getCell(),
            constraintHandler.getCurrentFocus().getCell()
          )
        );

        if (isUnset(getError())) {
          setCurrentState(constraintHandler.getCurrentFocus());
        }

        if (
          isSet(getError()) ||
          (isSet(getCurrentState()) &&
            !isCellEnabled(getCurrentState().getCell()))
        ) {
          constraintHandler.reset();
        }
      }
    } else {
      if (getGraph().isIgnoreTerminalEvent(mE.getEvent())) {
        marker.reset();
        setCurrentState();
      } else {
        marker.process(mE);
        setCurrentState(marker.getValidState());
      }

      if (
        isSet(getCurrentState()) &&
        !isCellEnabled(getCurrentState().getCell())
      ) {
        constraintHandler.reset();
        marker.reset();
        setCurrentState();
      }

      const outline = isOutlineConnectEvent(mE);

      if (isSet(getCurrentState()) && outline) {
        // Handles special case where mouse is on outline away from actual end point
        // in which case the grid is ignored and mouse point is used instead
        if (mE.isSource(highlight.getShape())) {
          point = Point(mE.getGraphX(), mE.getGraphY());
        }

        const constraint = getGraph().getOutlineConstraint(
          point,
          getCurrentState(),
          mE
        );
        constraintHandler.setFocus(mE, getCurrentState(), false);
        constraintHandler.setCurrentConstraint(constraint);
        constraintHandler.setCurrentPoint(point);
      }

      if (isOutlineConnect()) {
        if (isSet(highlight) && isSet(highlight.getShape())) {
          const s = getGraph().getView().getScale();

          if (
            isSet(constraintHandler.getCurrentConstraint()) &&
            isSet(constraintHandler.getCurrentFocus())
          ) {
            highlight.getShape().setStroke(OUTLINE_HIGHLIGHT_COLOR);
            highlight
              .getShape()
              .setStrokeWidth(OUTLINE_HIGHLIGHT_STROKEWIDTH / s / s);
            highlight.repaint();
          } else if (marker.hasValidState()) {
            // Handles special case where actual end point of edge and current mouse point
            // are not equal (due to grid snapping) and there is no hit on shape or highlight
            // but ignores cases where parent is used for non-connectable child cells
            if (
              getGraph().isCellConnectable(mE.getCell()) &&
              marker.getValidState() !== mE.getState()
            ) {
              highlight.getShape().setStroke('transparent');
              setCurrentState();
            } else {
              highlight.getShape().setStroke(DEFAULT_VALID_COLOR);
            }

            highlight.getShape().setStrokeWidth(HIGHLIGHT_STROKEWIDTH / s / s);
            highlight.repaint();
          }
        }
      }
    }
  };

  /**
   * Function: isCellEnabled
   *
   * Returns true if the given cell allows new connections to be created. This implementation
   * always returns true.
   */
  const isCellEnabled = (cell) => true;

  /**
   * Function: convertWaypoint
   *
   * Converts the given point from screen coordinates to model coordinates.
   */
  const convertWaypoint = (point) => {
    const scale = getGraph().getView().getScale();
    const tr = getGraph().getView().getTranslate();

    point.setX(point.getX() / scale - tr.getX());
    point.setY(point.getY() / scale - tr.getY());
  };

  /**
   * Function: snapToPreview
   *
   * Called to snap the given point to the current preview. This snaps to the
   * first point of the preview if alt is not pressed.
   */
  const snapToPreview = (mE, point) => {
    if (!Event.isAltDown(mE.getEvent()) && isSet(getPrevious())) {
      const tol =
        (getGraph().getGridSize() * getGraph().getView().getScale()) / 2;
      const tmp = isSet(getSourceConstraint())
        ? getFirst()
        : Point(getPrevious().getCenterX(), getPrevious().getCenterY());

      if (Math.abs(tmp.getX() - mE.getGraphX()) < tol) {
        point.setX(tmp.getX());
      }

      if (Math.abs(tmp.getY() - mE.getGraphY()) < tol) {
        point.setY(tmp.getY());
      }
    }
  };

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the preview edge or by highlighting
   * a possible source or target terminal.
   */
  const mouseMove = (sender, mE) => {
    const graph = getGraph();

    if (
      !mE.isConsumed() &&
      (isIgnoreMouseDown() || isSet(getFirst()) || !graph.isMouseDown())
    ) {
      // Handles special case when handler is disabled during highlight
      if (!isEnabled() && isset(getCurrentState())) {
        destroyIcons();
        setCurrentState();
      }

      const view = graph.getView();
      const scale = view.getScale();
      const tr = view.getTranslate();
      let point = Point(mE.getGraphX(), mE.getGraphY());
      setError();

      if (graph.isGridEnabledEvent(mE.getEvent())) {
        point = Point(
          (graph.snap(point.getX() / scale - tr.getX()) + tr.getX()) * scale,
          (graph.snap(point.getY() / scale - tr.getY()) + tr.getY()) * scale
        );
      }

      snapToPreview(mE, point);
      setCurrentPoint(point);

      if (
        (isSet(getFirst()) || (isEnabled() && graph.isEnabled())) &&
        (isSet(getShape()) ||
          isUnset(getFirst()) ||
          Math.abs(mE.getGraphX() - getFirst().getX()) > graph.getTolerance() ||
          Math.abs(mE.getGraphY() - getFirst().getY()) > graph.getTolerance())
      ) {
        updateCurrentState(mE, point);
      }

      if (isSet(getFirst())) {
        const constraintHandler = getConstraintHandler();
        let constraint;
        let current = point;

        // Uses the current point from the constraint handler if available
        if (
          isSet(constraintHandler.getCurrentConstraint()) &&
          isSet(constraintHandler.getCurrentFocus()) &&
          isSet(constraintHandler.getCurrentPoint())
        ) {
          constraint = constraintHandler.getCurrentConstraint();
          current = constraintHandler.getCurrentPoint().clone();
        } else if (
          isSet(getPrevious()) &&
          !graph.isIgnoreTerminalEvent(mE.getEvent()) &&
          Event.isShiftDown(mE.getEvent())
        ) {
          const previous = getPrevious();

          if (
            Math.abs(previous.getCenterX() - point.getX()) <
            Math.abs(previous.getCenterY() - point.getY())
          ) {
            point.setX(previous.getCenterX());
          } else {
            point.setY(previous.getCenterY());
          }
        }

        let pt2 = getFirst();
        const selectedIcon = getSelectedIcon();

        // Moves the connect icon with the mouse
        if (isSet(selectedIcon)) {
          const w = selectedIcon.getBounds().getWidth();
          const h = selectedIcon.getBounds().getHeight();

          if (isSet(getCurrentState()) && getTargetConnectImage()) {
            const pos = getIconPosition(getSelectedIcon(), getCurrentState());
            selectedIcon.getBounds().setX(pos.getX());
            selectedIcon.getBounds().setY(pos.getY());
          } else {
            const bounds = Rectangle(
              mE.getGraphX() + getConnectIconOffset().getX(),
              mE.getGraphY() + getConnectIconOffset().getY(),
              w,
              h
            );
            selectedIcon.setBounds(bounds);
          }

          selectedIcon.redraw();
        }

        // Uses edge state to compute the terminal points
        if (isSet(getEdgeState())) {
          updateEdgeState(current, constraint);
          current = getEdgeState().getAbsolutePoints()[
            getEdgeState().getAbsolutePoints().length - 1
          ];
          pt2 = getEdgeState().getAbsolutePoints()[0];
        } else {
          if (isSet(getCurrentState())) {
            if (isUnset(constraintHandler.getCurrentConstraint())) {
              const tmp = getTargetPerimeterPoint(getCurrentState(), mE);

              if (isSet(tmp)) {
                current = tmp;
              }
            }
          }

          // Computes the source perimeter point
          if (isUnset(getSourceConstraint()) && isSet(getPrevious())) {
            const next =
              isSet(getWaypoints()) && getWaypoints().length > 0
                ? getWaypoints()[0]
                : current;
            const tmp = getSourcePerimeterPoint(getPrevious(), next, mE);

            if (isSet(tmp)) {
              pt2 = tmp;
            }
          }
        }

        // Creates the preview shape (lazy)
        if (isUnset(getShape())) {
          const dx = Math.abs(mE.getGraphX() - getFirst().getX());
          const dy = Math.abs(mE.getGraphY() - getFirst().getY());

          if (dx > graph.getTolerance() || dy > graph.getTolerance()) {
            setShape(createShape());

            if (isSet(getEdgeState())) {
              getShape().apply(getEdgeState());
            }

            // Revalidates current connection
            updateCurrentState(mE, point);
          }
        }

        // Updates the points in the preview edge
        if (isSet(getShape())) {
          if (isSet(getEdgeState())) {
            getShape().setPoints(getEdgeState().getAbsolutePoints());
          } else {
            let pts = [pt2];

            if (isSet(getWaypoints())) {
              pts = pts.concat(getWaypoints());
            }

            pts.push(current);
            getShape().setPoints(pts);
          }

          drawPreview();
        }

        // Makes sure endpoint of edge is visible during connect
        if (isSet(getCursor())) {
          graph.getContainer().style.cursor = getCursor();
        }

        Event.consume(mE.getEvent());
        mE.consume();
      } else if (!isEnabled() || !graph.isEnabled()) {
        constraintHandler.reset();
      } else if (
        getPrevious() !== this.currentState &&
        isUnset(getEdgeState())
      ) {
        destroyIcons();

        // Sets the cursor on the current shape
        if (
          isSet(getCurrentState()) &&
          isUnset(getError()) &&
          isUnset(constraintHandler.getCurrentConstraint())
        ) {
          setIcons(createIcons(getCurrentState()));

          if (isUnset(getIcons())) {
            getCurrentState().setCursor(CURSOR_CONNECT);
            mE.consume();
          }
        }

        setPrevious(getCurrentState());
      } else if (
        getPrevious() === getCurrentState() &&
        isSet(getCurrentState()) &&
        isUnset(getIcons()) &&
        !graph.isMouseDown()
      ) {
        // Makes sure that no cursors are changed
        mE.consume();
      }

      if (
        !graph.isMouseDown() &&
        isSet(getCurrentState()) &&
        isSet(getIcons())
      ) {
        let hitsIcon = false;
        const target = mE.getSource();
        const icons = getIcons();

        for (let i = 0; i < icons.length && !hitsIcon; i++) {
          hitsIcon =
            target === icons[i].getNode() ||
            target.parentNode === icons[i].getNode();
        }

        if (!hitsIcon) {
          updateIcons(getCurrentState(), icons, mE);
        }
      }
    } else {
      constraintHandler.reset();
    }
  };

  /**
   * Function: updateEdgeState
   *
   * Updates <edgeState>.
   */
  const updateEdgeState = (current, constraint) => {
    const sc = getSourceConstraint();
    const edgeState = getEdgeState();

    // TODO: Use generic method for writing constraint to style
    if (isSet(sc) && isSet(sc.getPoint())) {
      edgeState.getStyle()[STYLE_EXIT_X] = sc.getPoint().getX();
      edgeState.getStyle()[STYLE_EXIT_Y] = sc.getPoint().getY();
    }

    if (isSet(constraint) && isSet(constraint.getPoint())) {
      edgeState.getStyle()[STYLE_ENTRY_X] = constraint.getPoint().getX();
      edgeState.getStyle()[STYLE_ENTRY_Y] = constraint.getPoint().getY();
    } else {
      delete edgeState.getStyle()[STYLE_ENTRY_X];
      delete edgeState.getStyle()[STYLE_ENTRY_Y];
    }

    edgeState.setAbsolutePoints([
      undefined,
      isSet(getCurrentState()) ? undefined : current
    ]);

    getGraph()
      .getView()
      .updateFixedTerminalPoint(edgeState, getPrevious(), true, sc);

    if (isSet(getCurrentState())) {
      if (isUnset(constraint)) {
        constraint = getGraph().getConnectionConstraint(
          edgeState,
          getPrevious(),
          false
        );
      }

      edgeState.setAbsoluteTerminalPoint(undefined, false);
      getGraph()
        .getView()
        .updateFixedTerminalPoint(
          edgeState,
          getCurrentState(),
          false,
          constraint
        );
    }

    // Scales and translates the waypoints to the model
    let realPoints;

    if (isSet(getWaypoints())) {
      realPoints = [];

      for (let i = 0; i < getWaypoints().length; i++) {
        const pt = getWaypoints()[i].clone();
        convertWaypoint(pt);
        realPoints[i] = pt;
      }
    }

    getGraph()
      .getView()
      .updatePoints(edgeState, realPoints, getPrevious(), getCurrentState());
    getGraph()
      .getView()
      .updateFloatingTerminalPoints(
        edgeState,
        getPrevious(),
        getCurrentState()
      );
  };

  /**
   * Function: getTargetPerimeterPoint
   *
   * Returns the perimeter point for the given target state.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the target cell state.
   * me - <mxMouseEvent> that represents the mouse move.
   */
  const getTargetPerimeterPoint = (state, mE) => {
    let result;
    const view = state.getView();
    const targetPerimeter = view.getPerimeterFunction(state);

    if (isSet(targetPerimeter)) {
      const next =
        isSet(getWaypoints()) && getWaypoints().length > 0
          ? getWaypoints()[getWaypoints().length - 1]
          : Point(getWaypoints().getCenterX(), getWaypoints().getCenterY());
      const tmp = targetPerimeter(
        view.getPerimeterBounds(state),
        getEdgeState(),
        next,
        false
      );

      if (isSet(tmp)) {
        result = tmp;
      }
    } else {
      result = Point(state.getCenterX(), state.getCenterY());
    }

    return result;
  };

  /**
   * Function: getSourcePerimeterPoint
   *
   * Hook to update the icon position(s) based on a mouseOver event. This is
   * an empty implementation.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the target cell state.
   * next - <mxPoint> that represents the next point along the previewed edge.
   * me - <mxMouseEvent> that represents the mouse move.
   */
  const getSourcePerimeterPoint = (state, next, mE) => {
    let result;
    const view = state.getView();
    const sourcePerimeter = view.getPerimeterFunction(state);
    const c = Point(state.getCenterX(), state.getCenterY());

    if (isSet(sourcePerimeter)) {
      const theta = getValue(state.getStyle(), STYLE_ROTATION, 0);
      const rad = -theta * (Math.PI / 180);

      if (theta !== 0) {
        next = getRotatedPoint(
          Point(next.getX(), next.getY()),
          Math.cos(rad),
          Math.sin(rad),
          c
        );
      }

      const tmp = sourcePerimeter(
        view.getPerimeterBounds(state),
        state,
        next,
        false
      );

      if (isSet(tmp)) {
        if (theta !== 0) {
          tmp = getRotatedPoint(
            Point(tmp.getX(), tmp.getY()),
            Math.cos(-rad),
            Math.sin(-rad),
            c
          );
        }

        result = tmp;
      }
    } else {
      result = c;
    }

    return result;
  };

  /**
   * Function: updateIcons
   *
   * Hook to update the icon position(s) based on a mouseOver event. This is
   * an empty implementation.
   *
   * Parameters:
   *
   * state - <mxCellState> under the mouse.
   * icons - Array of currently displayed icons.
   * me - <mxMouseEvent> that contains the mouse event.
   */
  const updateIcons = (state, icons, me) => {};

  /**
   * Function: isStopEvent
   *
   * Returns true if the given mouse up event should stop this handler. The
   * connection will be created if <error> is null. Note that this is only
   * called if <waypointsEnabled> is true. This implemtation returns true
   * if there is a cell state in the given event.
   */
  const isStopEvent = (mE) => isSet(mE.getState());

  /**
   * Function: addWaypoint
   *
   * Adds the waypoint for the given event to <waypoints>.
   */
  const addWaypointForEvent = (mE) => {
    const graph = getGraph();
    const point = convertPoint(graph.getContainer(), mE.getX(), mE.getY());
    const dx = Math.abs(point.getX() - getFirst().getX());
    const dy = Math.abs(point.getY() - getFirst().getY());
    const addPoint =
      isSet(getWaypoints()) ||
      (getMouseDownCounter() > 1 &&
        (dx > graph.getTolerance() || dy > graph.getTolerance()));

    if (addPoint) {
      if (isUnset(getWaypoints())) {
        setWaypoints([]);
      }

      const scale = graph.getView().getScale();
      const point = Point(
        graph.snap(mE.getGraphX() / scale) * scale,
        graph.snap(mE.getGraphY() / scale) * scale
      );
      getWaypoints().push(point);
    }
  };

  /**
   * Function: checkConstraints
   *
   * Returns true if the connection for the given constraints is valid. This
   * implementation returns true if the constraints are not pointing to the
   * same fixed connection point.
   */
  const checkConstraints = (c1, c2) =>
    isUnset(c1) ||
    isUnset(c2) ||
    isUnset(c1.getPoint()) ||
    isUnset(c2.getPoint()) ||
    !c1.getPoint().equals(c2.getPoint()) ||
    c1.getDx() !== c2.getDx() ||
    c1.getDy() !== c2.getDy() ||
    c1.getPerimeter() !== c2.getPerimeter();

  /**
   * Function: mouseUp
   *
   * Handles the event by inserting the new connection.
   */
  const mouseUp = (sender, mE) => {
    const constraintHandler = getConstraintHandler();

    if (!mE.isConsumed() && isConnecting()) {
      if (isWaypointsEnabled() && !isStopEvent(mE)) {
        addWaypointForEvent(mE);
        mE.consume();

        return;
      }

      const c1 = getSourceConstraint();
      const c2 = constraintHandler.getCurrentConstraint();

      const source = isSet(getPrevious()) ? getPrevious().getCell() : undefined;
      let target;

      if (
        isSet(constraintHandler.getCurrentConstraint()) &&
        isSet(constraintHandler.getCurrentFocus())
      ) {
        target = constraintHandler.getCurrentFocus().getCell();
      }

      if (isUnset(target) && isSet(getCurrentState())) {
        target = getCurrentState().getCell();
      }

      // Inserts the edge if no validation error exists and if constraints differ
      if (
        isUnset(getError()) &&
        (isUnset(source) ||
          isUnset(target) ||
          source !== target ||
          checkConstraints(c1, c2))
      ) {
        connect(source, target, mE.getEvent(), mE.getCell());
      } else {
        // Selects the source terminal for self-references
        if (
          isSet(getPrevious()) &&
          isSet(getMarker().getValidState()) &&
          getPrevious().getCell() === getMarker().getValidState().getCell()
        ) {
          getGraph().selectCellForEvent(getMarker().getSource(), mE.getEvent());
        }

        // Displays the error message if it is not an empty string,
        // for empty error messages, the event is silently dropped
        if (isSet(getError()) && getError().length > 0) {
          getGraph().validationAlert(getError());
        }
      }

      // Redraws the connect icons and resets the handler state
      destroyIcons();
      mE.consume();
    }

    if (isSet(getFirst())) {
      reset();
    }
  };

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  const reset = () => {
    if (isSet(getShape())) {
      etShape().destroy();
      setShape();
    }

    // Resets the cursor on the container
    if (isSet(getCursor()) && isSet(getGraph().getContainer())) {
      getGraph().getContainer().style.cursor = '';
    }

    destroyIcons();
    getMarker().reset();
    getConstraintHandler().reset();
    setOriginalPoint();
    setCurrentPoint();
    setEdgeState();
    setPrevious();
    setError();
    setSourceConstraint();
    setMouseDownCounter(0);
    setFirst();

    fireEvent(EventObject(Event.RESET));
  };

  /**
   * Function: drawPreview
   *
   * Redraws the preview edge using the color and width returned by
   * <getEdgeColor> and <getEdgeWidth>.
   */
  const drawPreview = () => {
    updatePreview(isUnset(getError()));
    getShape().redraw();
  };

  const updatePreview = (valid) => {
    getShape().setStrokeWidth(getEdgeWidth(valid));
    getShape().setStroke(getEdgeColor(valid));
  };

  /**
   * Function: getEdgeColor
   *
   * Returns the color used to draw the preview edge. This returns green if
   * there is no edge validation error and red otherwise.
   *
   * Parameters:
   *
   * valid - Boolean indicating if the color for a valid edge should be
   * returned.
   */
  const getEdgeColor = (valid) => (valid ? VALID_COLOR : INVALID_COLOR);

  /**
   * Function: getEdgeWidth
   *
   * Returns the width used to draw the preview edge. This returns 3 if
   * there is no edge validation error and 1 otherwise.
   *
   * Parameters:
   *
   * valid - Boolean indicating if the width for a valid edge should be
   * returned.
   */
  const getEdgeWidth = (valid) => (valid ? 3 : 1);

  /**
   * Function: connect
   *
   * Connects the given source and target using a new edge. This
   * implementation uses <createEdge> to create the edge.
   *
   * Parameters:
   *
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * evt - Mousedown event of the connect gesture.
   * dropTarget - <mxCell> that represents the cell under the mouse when it was
   * released.
   */
  const connect = (source, target, evt, dropTarget) => {
    const graph = getGraph();

    if (isSet(target) || isCreateTarget(evt) || graph.isAllowDanglingEdges()) {
      // Uses the common parent of source and target or
      // the default parent to insert the edge
      const model = graph.getModel();
      let terminalInserted = false;
      let edge;

      model.beginUpdate();

      try {
        if (
          isSet(source) &&
          isUnset(target) &&
          !graph.isIgnoreTerminalEvent(evt) &&
          isCreateTarget(evt)
        ) {
          target = createTargetVertex(evt, source);

          if (isSet(target)) {
            dropTarget = graph.getDropTarget([target], evt, dropTarget);
            terminalInserted = true;

            // Disables edges as drop targets if the target cell was created
            // FIXME: Should not shift if vertex was aligned (same in Java)
            if (isUnset(dropTarget) || !graph.getModel().isEdge(dropTarget)) {
              const pstate = graph.getView().getState(dropTarget);

              if (isSet(pstate)) {
                const tmp = model.getGeometry(target);
                tmp.setX(tmp.getX() - pstate.getOrigin().getX());
                tmp.setY(tmp.getY() - pstate.getOrigin().getY());
              }
            } else {
              dropTarget = graph.getDefaultParent();
            }

            graph.addCell(target, dropTarget);
          }
        }

        let parent = graph.getDefaultParent();

        if (
          isSet(source) &&
          isSet(target) &&
          model.getParent(source) === model.getParent(target) &&
          model.getParent(model.getParent(source)) !== model.getRoot()
        ) {
          parent = model.getParent(source);

          if (
            isSet(source.getGeometry()) &&
            source.getGeometry().isRelative() &&
            isSet(target.getGeometry()) &&
            target.getGeometry().isRelative()
          ) {
            parent = model.getParent(parent);
          }
        }

        // Uses the value of the preview edge state for inserting
        // the new edge into the graph
        let value;
        let style;

        if (isSet(getEdgeState())) {
          value = getEdgeState().getCell().getValue();
          style = getEdgeState().getCell().getStyle();
        }

        edge = insertEdge(parent, undefined, value, source, target, style);

        if (isSet(edge)) {
          // Updates the connection constraints
          graph.setConnectionConstraint(
            edge,
            source,
            true,
            getSourceConstraint()
          );
          graph.setConnectionConstraint(
            edge,
            target,
            false,
            getConstraintHandler().getCurrentConstraint()
          );

          // Uses geometry of the preview edge state
          if (isSet(getEdgeState())) {
            model.setGeometry(edge, getEdgeState().getCell().getGeometry());
          }

          parent = model.getParent(source);

          // Inserts edge before source
          if (isInsertBefore(edge, source, target, evt, dropTarget)) {
            let tmp = source;

            while (
              isSet(tmp.getParent()) &&
              isSet(tmp.getGeometry()) &&
              tmp.getGeometry().isRelative() &&
              tmp.getParent() !== edge.getParent()
            ) {
              tmp = graph.getModel().getParent(tmp);
            }

            if (
              isSet(tmp) &&
              isSet(tmp.getParent()) &&
              tmp.getParent() === edge.getParent()
            ) {
              model.add(parent, edge, tmp.parent.getIndex(tmp));
            }
          }

          // Makes sure the edge has a non-null, relative geometry
          let geo = model.getGeometry(edge);

          if (isUnset(geo)) {
            geo = Geometry();
            geo.setRelative(true);

            model.setGeometry(edge, geo);
          }

          // Uses scaled waypoints in geometry
          if (isSet(getWaypoints()) && getWaypoints().length > 0) {
            const s = graph.getView().getScale();
            const tr = graph.getView().getTranslate();
            geo.setPoints([]);

            for (let i = 0; i < getWaypoints().length; i++) {
              const pt = getWaypoints()[i];
              geo
                .getPoints()
                .push(
                  Point(pt.getX() / s - tr.getX(), pt.getY() / s - tr.getY())
                );
            }
          }

          if (isUnset(target)) {
            const t = graph.getView().getTranslate();
            const s = graph.getView().getScale();
            const pt = isSet(getOriginalPoint())
              ? Point(
                  getOriginalPoint().getX() / s - t.getX(),
                  getOriginalPoint().y / s - t.y
                )
              : Point(
                  getCurrentPoint().getX() / s - t.getX(),
                  getCurrentPoint().y / s - t.y
                );
            pt.setX(pt.getX() - graph.getPanDx() / s);
            pt.setY(pt.getY() - graph.getPanDy() / s);
            geo.setTerminalPoint(pt, false);
          }

          fireEvent(
            EventObject(
              Event.CONNECT,
              'cell',
              edge,
              'terminal',
              target,
              'event',
              evt,
              'target',
              dropTarget,
              'terminalInserted',
              terminalInserted
            )
          );
        }
      } catch (e) {
        // mxLog.show();
        // mxLog.debug(e.message);
      } finally {
        model.endUpdate();
      }

      if (isSelect()) {
        selectCells(edge, terminalInserted ? target : undefined);
      }
    }
  };

  /**
   * Function: selectCells
   *
   * Selects the given edge after adding a new connection. The target argument
   * contains the target vertex if one has been inserted.
   */
  const selectCells = (edge, target) => getGraph().setSelectionCell(edge);

  /**
   * Function: insertEdge
   *
   * Creates, inserts and returns the new edge for the given parameters. This
   * implementation does only use <createEdge> if <factoryMethod> is defined,
   * otherwise <mxGraph.insertEdge> will be used.
   */
  const insertEdge = (parent, id, value, source, target, style) => {
    if (isUnset(getFactoryMethod())) {
      return getGraph().insertEdge(parent, id, value, source, target, style);
    } else {
      const edge = createEdge(value, source, target, style);
      edge = getGraph().addEdge(edge, parent, source, target);

      return edge;
    }
  };

  /**
   * Function: createTargetVertex
   *
   * Hook method for creating new vertices on the fly if no target was
   * under the mouse. This is only called if <createTarget> is true and
   * returns null.
   *
   * Parameters:
   *
   * evt - Mousedown event of the connect gesture.
   * source - <mxCell> that represents the source terminal.
   */
  const createTargetVertex = (evt, source) => {
    const graph = getGraph();

    // Uses the first non-relative source
    let geo = graph.getCellGeometry(source);

    while (isSet(geo) && geo.isRelative()) {
      source = graph.getModel().getParent(source);
      geo = graph.getCellGeometry(source);
    }

    const clone = graph.cloneCell(source);
    geo = graph.getModel().getGeometry(clone);

    if (isSet(geo)) {
      const t = graph.getView().getTranslate();
      const s = graph.getView().getScale();
      const point = Point(
        getCurrentPoint().getX() / s - t.getX(),
        getCurrentPoint().getY() / s - t.getY()
      );
      geo.setX(
        Math.round(point.getX() - geo.getWidth() / 2 - graph.getPanDx() / s)
      );
      geo.setY(
        Math.round(point.getY() - geo.getHeight() / 2 - graph.getPanDy() / s)
      );

      // Aligns with source if within certain tolerance
      const tol = getAlignmentTolerance();

      if (tol > 0) {
        const sourceState = graph.getView().getState(source);

        if (isSet(sourceState)) {
          const x = sourceState.getX() / s - t.getX();
          const y = sourceState.getY() / s - t.getY();

          if (Math.abs(x - geo.getX()) <= tol) {
            geo.setX(Math.round(x));
          }

          if (Math.abs(y - geo.getY()) <= tol) {
            geo.setY(Math.round(y));
          }
        }
      }
    }

    return clone;
  };

  /**
   * Function: getAlignmentTolerance
   *
   * Returns the tolerance for aligning new targets to sources. This returns the grid size / 2.
   */
  const getAlignmentTolerance = (evt) =>
    getGraph().isGridEnabled()
      ? getGraph().getGridSize() / 2
      : getGraph().getTolerance();

  /**
   * Function: createEdge
   *
   * Creates and returns a new edge using <factoryMethod> if one exists. If
   * no factory method is defined, then a new default edge is returned. The
   * source and target arguments are informal, the actual connection is
   * setup later by the caller of this function.
   *
   * Parameters:
   *
   * value - Value to be used for creating the edge.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * style - Optional style from the preview edge.
   */
  const createEdge = (value, source, target, style) => {
    let edge;

    // Creates a new edge using the factoryMethod
    if (isSet(getFactoryMethod())) {
      edge = factoryMethod(source, target, style);
    }

    if (isUnset(edge)) {
      edge = Cell(value || '');
      edge.setEdge(true);
      edge.setStyle(style);

      const geo = Geometry();
      geo.setRelative(true);
      edge.setGeometry(geo);
    }

    return edge;
  };

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes. This should be
   * called on all instances. It is called automatically for the built-in
   * instance created for each <mxGraph>.
   */
  const destroy = () => {
    const graph = getGraph();

    graph.removeMouseListener(me);

    if (isSet(getShape())) {
      getShape().destroy();
      setShape();
    }

    if (isSet(getMarker())) {
      getMarker().destroy();
      setMarker();
    }

    if (isSet(getConstraintHandler())) {
      getConstraintHandler().destroy();
      setConstraintHandler();
    }

    if (isSet(getChangeHandler())) {
      graph.getModel().removeListener(getChangeHandler());
      graph.getView().removeListener(getChangeHandler());
      setChangeHandler();
    }

    if (isSet(getDrillHandler())) {
      graph.removeListener(getDrillHandler());
      graph.getView().removeListener(getDrillHandler());
      setDrillHandler();
    }

    if (isSet(getEscapeHandler())) {
      graph.removeListener(getEscapeHandler());
      setEscapeHandler();
    }
  };

  const { fireEvent } = EventSource();

  const me = {
    /**
     * Function: isEnabled
     *
     * Returns true if events are handled. This implementation
     * returns <enabled>.
     */
    isEnabled,

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
    isInsertBefore,

    /**
     * Function: isCreateTarget
     *
     * Returns <createTarget>.
     *
     * Parameters:
     *
     * evt - Current active native pointer event.
     */
    isCreateTarget,

    /**
     * Function: setCreateTarget
     *
     * Sets <createTarget>.
     */
    setCreateTarget,
    createShape,
    init,
    isConnectableCell,
    createMarker,
    start,
    isConnecting,
    isValidSource,
    isValidTarget,
    validateConnection,

    /**
     * Function: getConnectImage
     *
     * Hook to return the <mxImage> used for the connection icon of the given
     * <mxCellState>. This implementation returns <connectImage>.
     *
     * Parameters:
     *
     * state - <mxCellState> whose connect image should be returned.
     */
    getConnectImage,
    isMoveIconToFrontForState,
    createIcons,
    redrawIcons,
    getIconPosition,
    destroyIcons,
    isStartEvent,
    mouseDown,
    isImmediateConnectSource,
    createEdgeState,
    isOutlineConnectEvent,
    updateCurrentState,
    isCellEnabled,
    convertWaypoint,
    snapToPreview,
    mouseMove,
    updateEdgeState,
    getTargetPerimeterPoint,
    getSourcePerimeterPoint,
    updateIcons,
    isStopEvent,
    addWaypointForEvent,
    checkConstraints,
    mouseUp,
    reset,
    drawPreview,
    updatePreview,
    getEdgeColor,
    getEdgeWidth,
    connect,
    selectCells,
    insertEdge,
    createTargetVertex,
    getAlignmentTolerance,
    createEdge,
    destroy
  };

  graph.addListener(Event.ESCAPE, getEscapeHandler());

  return me;
};

export default ConnectionHandler;
