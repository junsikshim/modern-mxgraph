/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { IS_TOUCH } from '../Client';
import { addProp, isSet, isUnset, makeComponent, noop } from '../Helpers';
import ImageShape from '../shape/ImageShape';
import RectangleShape from '../shape/RectangleShape';
import {
  CONNECT_HANDLE_FILLCOLOR,
  CURSOR_BEND_HANDLE,
  CURSOR_LABEL_HANDLE,
  CURSOR_MOVABLE_EDGE,
  CURSOR_TERMINAL_HANDLE,
  CURSOR_VIRTUAL_BEND_HANDLE,
  DEFAULT_VALID_COLOR,
  EDGE_SELECTION_COLOR,
  EDGE_SELECTION_DASHED,
  EDGE_SELECTION_STROKEWIDTH,
  HANDLE_FILLCOLOR,
  HANDLE_SIZE,
  HANDLE_STROKECOLOR,
  HIGHLIGHT_STROKEWIDTH,
  LABEL_HANDLE_FILLCOLOR,
  LABEL_HANDLE_SIZE,
  LOCKED_HANDLE_FILLCOLOR,
  OUTLINE_HIGHLIGHT_COLOR,
  STYLE_ENTRY_X,
  STYLE_ENTRY_Y,
  STYLE_EXIT_X,
  STYLE_EXIT_Y
} from '../util/Constants';
import Event from '../util/Event';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import { contains, equalPoints, getValue, intersects } from '../util/Utils';
import ConnectionConstraint from '../view/ConnectionConstraint';
import EdgeStyle from '../view/EdgeStyle';
import CellMarker from './CellMarker';
import ConstraintHandler from './ConstraintHandler';

/**
 * Class: EdgeHandler
 *
 * Graph event handler that reconnects edges and modifies control points and
 * the edge label location. Uses <mxTerminalMarker> for finding and
 * highlighting new source and target vertices. This handler is automatically
 * created in <mxGraph.createHandler> for each selected edge.
 *
 * To enable adding/removing control points, the following code can be used:
 *
 * (code)
 * mxEdgeHandler.prototype.addEnabled = true;
 * mxEdgeHandler.prototype.removeEnabled = true;
 * (end)
 *
 * Note: This experimental feature is not recommended for production use.
 *
 * Constructor: mxEdgeHandler
 *
 * Constructs an edge handler for the specified <mxCellState>.
 *
 * Parameters:
 *
 * state - <mxCellState> of the cell to be handled.
 */
const EdgeHandler = (state) => {
  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp();

  /**
   * Variable: state
   *
   * Reference to the <mxCellState> being modified.
   */
  const [getState, setState] = addProp(state);

  /**
   * Variable: marker
   *
   * Holds the <mxTerminalMarker> which is used for highlighting terminals.
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
   * Holds the current validation error while a connection is being changed.
   */
  const [getError, setError] = addProp();

  /**
   * Variable: shape
   *
   * Holds the <mxShape> that represents the preview edge.
   */
  const [getShape, setShape] = addProp();

  /**
   * Variable: bends
   *
   * Holds the <mxShapes> that represent the points.
   */
  const [getBends, setBends] = addProp();

  const [getLabel, setLabel] = addProp();

  /**
   * Variable: labelShape
   *
   * Holds the <mxShape> that represents the label position.
   */
  const [getLabelShape, setLabelShape] = addProp();

  const [getLabelHandleImage, setLabelHandleImage] = addProp();

  /**
   * Variable: cloneEnabled
   *
   * Specifies if cloning by control-drag is enabled. Default is true.
   */
  const [isCloneEnabled, setCloneEnabled] = addProp(true);

  /**
   * Variable: addEnabled
   *
   * Specifies if adding bends by shift-click is enabled. Default is false.
   * Note: This experimental feature is not recommended for production use.
   */
  const [isAddEnabled, setAddEnabled] = addProp(false);

  /**
   * Variable: removeEnabled
   *
   * Specifies if removing bends by shift-click is enabled. Default is false.
   * Note: This experimental feature is not recommended for production use.
   */
  const [isRemoveEnabled, setRemoveEnabled] = addProp(false);

  /**
   * Variable: dblClickRemoveEnabled
   *
   * Specifies if removing bends by double click is enabled. Default is false.
   */
  const [isDblClickRemoveEnabled, setDblClickRemoveEnabled] = addProp(false);

  /**
   * Variable: mergeRemoveEnabled
   *
   * Specifies if removing bends by dropping them on other bends is enabled.
   * Default is false.
   */
  const [isMergeRemoveEnabled, setMergeRemoveEnabled] = addProp(false);

  /**
   * Variable: straightRemoveEnabled
   *
   * Specifies if removing bends by creating straight segments should be enabled.
   * If enabled, this can be overridden by holding down the alt key while moving.
   * Default is false.
   */
  const [isStraightRemoveEnabled, setStraightRemoveEnabled] = addProp(false);

  /**
   * Variable: virtualBendsEnabled
   *
   * Specifies if virtual bends should be added in the center of each
   * segments. These bends can then be used to add new waypoints.
   * Default is false.
   */
  const [_isVirtualBendsEnabled, setVirtualBendsEnabled] = addProp(false);

  const [getVirtualBends, setVirtualBends] = addProp();

  /**
   * Variable: virtualBendOpacity
   *
   * Opacity to be used for virtual bends (see <virtualBendsEnabled>).
   * Default is 20.
   */
  const [getVirtualBendOpacity, setVirtualBendOpacity] = addProp(20);

  /**
   * Variable: parentHighlightEnabled
   *
   * Specifies if the parent should be highlighted if a child cell is selected.
   * Default is false.
   */
  const [isParentHighlightEnabled, setParentHighlightEnabled] = addProp(false);

  /**
   * Variable: allowHandleBoundsCheck
   *
   * Specifies if the bounds of handles should be used for hit-detection in IE
   * Default is true.
   */
  const [isAllowHandleBoundsCheck, setAllowHandleBoundsCheck] = addProp(true);

  /**
   * Variable: snapToTerminals
   *
   * Specifies if waypoints should snap to the routing centers of terminals.
   * Default is false.
   */
  const [isSnapToTerminals, setSnapToTerminals] = addProp(false);

  /**
   * Variable: handleImage
   *
   * Optional <mxImage> to be used as handles. Default is null.
   */
  const [getHandleImage, setHandleImage] = addProp();

  /**
   * Variable: tolerance
   *
   * Optional tolerance for hit-detection in <getHandleForEvent>. Default is 0.
   */
  const [getTolerance, setTolerance] = addProp(0);

  /**
   * Variable: outlineConnect
   *
   * Specifies if connections to the outline of a highlighted target should be
   * enabled. This will allow to place the connection point along the outline of
   * the highlighted target. Default is false.
   */
  const [isOutlineConnect, setOutlineConnect] = addProp(false);

  /**
   * Variable: manageLabelHandle
   *
   * Specifies if the label handle should be moved if it intersects with another
   * handle. Uses <checkLabelHandle> for checking and moving. Default is false.
   */
  const [isManageLabelHandle, setManageLabelHandle] = addProp(false);
  const [getAbsPoints, setAbsPoints] = addProp();
  const [getPoints, setPoints] = addProp();
  const [isActive, setActive] = addProp(false);

  // Handles escape keystrokes
  const [getEscapeHandler, setEscapeHandler] = addProp((sender, evt) => {
    const dirty = isSet(getIndex());
    reset();

    if (dirty) {
      getGraph()
        .getCellRenderer()
        .redraw(getState(), false, getState().getView().isRendering());
    }
  });

  const [getCustomHandles, setCustomHandles] = addProp();
  const [getParentHighlight, setParentHighlight] = addProp();
  const [getIndex, setIndex] = addProp();
  const [getSnapPoint, setSnapPoint] = addProp();
  const [getStartX, setStartX] = addProp();
  const [getStartY, setStartY] = addProp();
  const [isSource, setSource] = addProp(false);
  const [isTarget, setTarget] = addProp(false);
  const [isLabel, setIsLabel] = addProp(false);
  const [getCurrentPoint, setCurrentPoint] = addProp();
  const [isLivePreview, setLivePreview] = addProp(true);
  const [getSizers, setSizers] = addProp();

  /**
   * Function: init
   *
   * Initializes the shapes required for this edge handler.
   */
  const init = () => {
    const state = getState();
    const graph = setGraph(state.getView().getGraph());
    setMarker(createMarker());
    setConstraintHandler(ConstraintHandler(graph));

    // Clones the original points from the cell
    // and makes sure at least one point exists
    setPoints([]);

    // Uses the absolute points of the state
    // for the initial configuration and preview
    setAbsPoints(getSelectionPoints(state));
    const shape = setShape(createSelectionShape(getAbsPoints()));
    shape.init(graph.getView().getOverlayPane());
    shape.setPointerEvents(false);
    shape.setCursor(CURSOR_MOVABLE_EDGE);
    Event.redirectMouseEvents(shape.getNode(), graph, state);

    const { getMaxCells } = graph.getGraphHandler();

    // Creates bends for the non-routed absolute points
    // or bends that don't correspond to points
    if (graph.getSelectionCount() < getMaxCells() || getMaxCells() <= 0) {
      setBends(me.createBends());

      if (isVirtualBendsEnabled()) {
        setVirtualBends(me.createVirtualBends());
      }
    }

    // Adds a rectangular handle for the label position
    setLabel(
      Point(state.getAbsoluteOffset().getX(), state.getAbsoluteOffset().getY())
    );
    setLabelShape(createLabelHandleShape());
    initBend(getLabelShape());
    getLabelShape().setCursor(CURSOR_LABEL_HANDLE);

    setCustomHandles(createCustomHandles());

    updateParentHighlight();
    me.redraw();
  };

  /**
   * Function: isParentHighlightVisible
   *
   * Returns true if the parent highlight should be visible. This implementation
   * always returns true.
   */
  const isParentHighlightVisible = () =>
    !getGraph().isCellSelected(
      getGraph().getModel().getParent(getState().getCell())
    );

  /**
   * Function: updateParentHighlight
   *
   * Updates the highlight of the parent if <parentHighlightEnabled> is true.
   */
  const updateParentHighlight = () => {
    const graph = getGraph();

    if (!isDestroyed()) {
      const visible = isParentHighlightVisible();
      const parent = graph.getModel().getParent(getState().getCell());
      const pstate = graph.getView().getState(parent);

      if (isSet(getParentHighlight())) {
        if (graph.getModel().isVertex(parent) && visible) {
          const b = getParentHighlight().getBounds();

          if (
            isSet(pstate) &&
            (b.getX() !== pstate.getX() ||
              b.getY() !== pstate.getY() ||
              b.getWidth() !== pstate.getWidth() ||
              b.getHeight() !== pstate.getHeight())
          ) {
            getParentHighlight().setBounds(Rectangle.fromRectangle(pstate));
            getParentHighlight().redraw();
          }
        } else {
          if (
            isSet(pstate) &&
            pstate.getParentHighlight() === getParentHighlight()
          ) {
            pstate.setParentHighlight();
          }

          getParentHighlight().destroy();
          setParentHighlight();
        }
      } else if (isParentHighlightEnabled() && visible) {
        if (
          graph.getModel().isVertex(parent) &&
          isSet(pstate) &&
          isUnset(pstate.getParentHighlight())
        ) {
          const parentHighlight = setParentHighlight(
            createParentHighlightShape(pstate)
          );
          parentHighlight.setPointerEvents(false);
          parentHighlight.setRotation(
            Number(pstate.getStyle()[STYLE_ROTATION] || '0')
          );
          parentHighlight.init(graph.getView().getOverlayPane());
          parentHighlight.redraw();

          // Shows highlight once per parent
          pstate.setParentHighlight(parentHighlight);
        }
      }
    }
  };

  /**
   * Function: createCustomHandles
   *
   * Returns an array of custom handles. This implementation returns null.
   */
  const createCustomHandles = noop;

  /**
   * Function: isVirtualBendsEnabled
   *
   * Returns true if virtual bends should be added. This returns true if
   * <virtualBendsEnabled> is true and the current style allows and
   * renders custom waypoints.
   */
  const isVirtualBendsEnabled = (evt) => {
    const style = getState().getStyle();

    return (
      _isVirtualBendsEnabled() &&
      (isUnset(style[STYLE_EDGE]) ||
        style[STYLE_EDGE] === NONE ||
        style[STYLE_NOEDGESTYLE] === 1) &&
      getValue(style, STYLE_SHAPE) !== 'arrow'
    );
  };

  /**
   * Function: isCellEnabled
   *
   * Returns true if the given cell allows new connections to be created. This implementation
   * always returns true.
   */
  const isCellEnabled = (cell) => true;

  /**
   * Function: isAddPointEvent
   *
   * Returns true if the given event is a trigger to add a new point. This
   * implementation returns true if shift is pressed.
   */
  const isAddPointEvent = (evt) => Event.isShiftDown(evt);

  /**
   * Function: isRemovePointEvent
   *
   * Returns true if the given event is a trigger to remove a point. This
   * implementation returns true if shift is pressed.
   */
  const isRemovePointEvent = (evt) => Event.isShiftDown(evt);

  /**
   * Function: getSelectionPoints
   *
   * Returns the list of points that defines the selection stroke.
   */
  const getSelectionPoints = (state) => state.getAbsolutePoints();

  /**
   * Function: createParentHighlightShape
   *
   * Creates the shape used to draw the selection border.
   */
  const createParentHighlightShape = (bounds) => {
    const shape = RectangleShape(
      Rectangle.fromRectangle(bounds),
      undefined,
      getSelectionColor()
    );
    shape.setStrokeWidth(getSelectionStrokeWidth());
    shape.setDashed(isSelectionDashed());

    return shape;
  };

  /**
   * Function: createSelectionShape
   *
   * Creates the shape used to draw the selection border.
   */
  const createSelectionShape = (points) => {
    const shape = getState().getShape().constructor();
    shape.setOutline(true);
    shape.apply(getState());

    shape.setDashed(isSelectionDashed());
    shape.setStroke(getSelectionColor());
    shape.setShadow(false);

    return shape;
  };

  /**
   * Function: getSelectionColor
   *
   * Returns <mxConstants.EDGE_SELECTION_COLOR>.
   */
  const getSelectionColor = () => EDGE_SELECTION_COLOR;

  /**
   * Function: getSelectionStrokeWidth
   *
   * Returns <mxConstants.EDGE_SELECTION_STROKEWIDTH>.
   */
  const getSelectionStrokeWidth = () => EDGE_SELECTION_STROKEWIDTH;

  /**
   * Function: isSelectionDashed
   *
   * Returns <mxConstants.EDGE_SELECTION_DASHED>.
   */
  const isSelectionDashed = () => EDGE_SELECTION_DASHED;

  /**
   * Function: isConnectableCell
   *
   * Returns true if the given cell is connectable. This is a hook to
   * disable floating connections. This implementation returns true.
   */
  const isConnectableCell = (cell) => true;

  /**
   * Function: getCellAt
   *
   * Creates and returns the <mxCellMarker> used in <marker>.
   */
  const getCellAt = (x, y) =>
    !isOutlineConnect() ? getGraph().getCellAt(x, y) : undefined;

  /**
   * Function: createMarker
   *
   * Creates and returns the <mxCellMarker> used in <marker>.
   */
  const createMarker = () => {
    const graph = getGraph();
    const marker = CellMarker(graph);

    const _getCell = marker.getCell;

    // Only returns edges if they are connectable and never returns
    // the edge that is currently being modified
    marker.getCell = (mE) => {
      let cell = _getCell(mE);

      // Checks for cell at preview point (with grid)
      if (
        (cell === getState().getCell() || isUnset(cell)) &&
        isSet(getCurrentPoint())
      ) {
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

      const model = graph.getModel();

      if (
        (graph.isSwimlane(cell) &&
          isSet(getCurrentPoint()) &&
          graph.hitsSwimlaneContent(
            cell,
            getCurrentPoint().getX(),
            getCurrentPoint().getY()
          )) ||
        !isConnectableCell(cell) ||
        cell === getState().getCell() ||
        (isSet(cell) && !graph.isConnectableEdges() && model.isEdge(cell)) ||
        model.isAncestor(getState().getCell(), cell)
      ) {
        cell = undefined;
      }

      if (!graph.isCellConnectable(cell)) {
        cell = undefined;
      }

      return cell;
    };

    // Sets the highlight color according to validateConnection
    marker.isValidState = (state) => {
      const model = graph.getModel();
      const other = graph
        .getView()
        .getTerminalPort(
          state,
          graph
            .getView()
            .getState(model.getTerminal(getState().getCell(), !isSource())),
          !isSource()
        );
      const otherCell = isSet(other) ? other.getCell() : undefined;
      const source = isSource() ? state.getCell() : otherCell;
      const target = isSource() ? otherCell : state.getCell();

      // Updates the error message of the handler
      setError(validateConnection(source, target));

      return isUnset(getError());
    };

    return marker;
  };

  /**
   * Function: validateConnection
   *
   * Returns the error message or an empty string if the connection for the
   * given source, target pair is not valid. Otherwise it returns null. This
   * implementation uses <mxGraph.getEdgeValidationError>.
   *
   * Parameters:
   *
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   */
  const validateConnection = (source, target) =>
    getGraph().getEdgeValidationError(getState().getCell(), source, target);

  /**
   * Function: createBends
   *
   * Creates and returns the bends used for modifying the edge. This is
   * typically an array of <mxRectangleShapes>.
   */
  const createBends = () => {
    const cell = getState().getCell();
    const bends = [];

    for (let i = 0; i < getAbsPoints().length; i++) {
      if (isHandleVisible(i)) {
        const source = i === 0;
        const target = i === getAbsPoints().length - 1;
        const terminal = source || target;

        if (terminal || getGraph().isCellBendable(cell)) {
          ((index) => {
            const bend = createHandleShape(index);
            initBend(bend, () => {
              if (isDblClickRemoveEnabled()) {
                removePoint(getState(), index);
              }
            });

            if (isHandleEnabled(i)) {
              bend.setCursor(
                terminal ? CURSOR_TERMINAL_HANDLE : CURSOR_BEND_HANDLE
              );
            }

            bends.push(bend);

            if (!terminal) {
              getPoints().push(Point(0, 0));
              bend.getNode().style.visibility = 'hidden';
            }
          })(i);
        }
      }
    }

    return bends;
  };

  /**
   * Function: createVirtualBends
   *
   * Creates and returns the bends used for modifying the edge. This is
   * typically an array of <mxRectangleShapes>.
   */
  const createVirtualBends = () => {
    const cell = getState().getCell();
    const last = getAbsPoints()[0];
    const bends = [];

    if (getGraph().isCellBendable(cell)) {
      for (let i = 1; i < getAbsPoints().length; i++) {
        ((bend) => {
          initBend(bend);
          bend.setCursor(CURSOR_VIRTUAL_BEND_HANDLE);
          bends.push(bend);
        })(createHandleShape());
      }
    }

    return bends;
  };

  /**
   * Function: isHandleEnabled
   *
   * Creates the shape used to display the given bend.
   */
  const isHandleEnabled = (index) => true;

  /**
   * Function: isHandleVisible
   *
   * Returns true if the handle at the given index is visible.
   */
  const isHandleVisible = (index) => {
    const state = getState();
    const source = state.getVisibleTerminalState(true);
    const target = state.getVisibleTerminalState(false);
    const geo = getGraph().getCellGeometry(state.getCell());
    const edgeStyle = isSet(geo)
      ? getGraph()
          .getView()
          .getEdgeStyle(state, geo.getPoints(), source, target)
      : undefined;

    return (
      edgeStyle !== EdgeStyle.EntityRelation ||
      index === 0 ||
      index === getAbsPoints().length - 1
    );
  };

  /**
   * Function: createHandleShape
   *
   * Creates the shape used to display the given bend. Note that the index may be
   * null for special cases, such as when called from
   * <mxElbowEdgeHandler.createVirtualBend>. Only images and rectangles should be
   * returned if support for HTML labels with not foreign objects is required.
   * Index if null for virtual handles.
   */
  const createHandleShape = (index) => {
    if (isSet(getHandleImage())) {
      const shape = ImageShape(
        Rectangle(
          0,
          0,
          getHandleImage().getWidth(),
          getHandleImage().getHeight()
        ),
        getHandleImage().getSrc()
      );

      // Allows HTML rendering of the images
      shape.setPreserveImageAspect(false);

      return shape;
    } else {
      const s = HANDLE_SIZE;

      return RectangleShape(
        Rectangle(0, 0, s, s),
        HANDLE_FILLCOLOR,
        HANDLE_STROKECOLOR
      );
    }
  };

  /**
   * Function: createLabelHandleShape
   *
   * Creates the shape used to display the the label handle.
   */
  const createLabelHandleShape = () => {
    const labelHandleImage = getLabelHandleImage();

    if (isSet(labelHandleImage)) {
      const shape = ImageShape(
        Rectangle(
          0,
          0,
          labelHandleImage.getWidth(),
          labelHandleImage.getHeight()
        ),
        labelHandleImage.getSrc()
      );

      // Allows HTML rendering of the images
      shape.setPreserveImageAspect(false);

      return shape;
    } else {
      const s = LABEL_HANDLE_SIZE;
      return RectangleShape(
        Rectangle(0, 0, s, s),
        LABEL_HANDLE_FILLCOLOR,
        HANDLE_STROKECOLOR
      );
    }
  };

  /**
   * Function: initBend
   *
   * Helper method to initialize the given bend.
   *
   * Parameters:
   *
   * bend - <mxShape> that represents the bend to be initialized.
   */
  const initBend = (bend, dblClick) => {
    bend.init(getGraph().getView().getOverlayPane());

    Event.redirectMouseEvents(
      bend.getNode(),
      getGraph(),
      getState(),
      undefined,
      undefined,
      undefined,
      dblClick
    );

    if (IS_TOUCH) {
      bend.getNode().setAttribute('pointer-events', 'none');
    }
  };

  /**
   * Function: getHandleForEvent
   *
   * Returns the index of the handle for the given event.
   */
  const getHandleForEvent = (mE) => {
    let result;

    if (isSet(getState())) {
      // Connection highlight may consume events before they reach sizer handle
      const tol = !Event.isMouseEvent(mE.getEvent()) ? getTolerance() : 1;
      const hit =
        isAllowHandleBoundsCheck() && tol > 0
          ? Rectangle(
              mE.getGraphX() - tol,
              mE.getGraphY() - tol,
              2 * tol,
              2 * tol
            )
          : undefined;
      let minDistSq;

      const checkShape = (shape) => {
        if (
          isSet(shape) &&
          isSet(shape.getNode()) &&
          shape.getNode().style.display !== 'none' &&
          shape.getNode().style.visibility !== 'hidden' &&
          (mE.isSource(shape) ||
            (isSet(hit) && intersects(shape.getBounds(), hit)))
        ) {
          const dx = mE.getGraphX() - shape.getBounds().getCenterX();
          const dy = mE.getGraphY() - shape.getBounds().getCenterY();
          const tmp = dx * dx + dy * dy;

          if (isUnset(minDistSq) || tmp <= minDistSq) {
            minDistSq = tmp;

            return true;
          }
        }

        return false;
      };

      if (isSet(getCustomHandles()) && isCustomHandleEvent(mE)) {
        // Inverse loop order to match display order
        for (let i = getCustomHandles().length - 1; i >= 0; i--) {
          if (checkShape(getCustomHandles()[i].shape)) {
            // LATER: Return reference to active shape
            return Event.CUSTOM_HANDLE - i;
          }
        }
      }

      if (mE.isSource(getState().getText()) || checkShape(getLabelShape())) {
        result = Event.LABEL_HANDLE;
      }

      if (isSet(getBends())) {
        for (let i = 0; i < getBends().length; i++) {
          if (checkShape(getBends()[i])) {
            result = i;
          }
        }
      }

      if (isSet(getVirtualBends()) && isAddVirtualBendEvent(mE)) {
        for (let i = 0; i < getVirtualBends().length; i++) {
          if (checkShape(getVirtualBends()[i])) {
            result = Event.VIRTUAL_HANDLE - i;
          }
        }
      }
    }

    return result;
  };

  /**
   * Function: isAddVirtualBendEvent
   *
   * Returns true if the given event allows virtual bends to be added. This
   * implementation returns true.
   */
  const isAddVirtualBendEvent = (mE) => true;

  /**
   * Function: isCustomHandleEvent
   *
   * Returns true if the given event allows custom handles to be changed. This
   * implementation returns true.
   */
  const isCustomHandleEvent = (mE) => true;

  /**
   * Function: mouseDown
   *
   * Handles the event by checking if a special element of the handler
   * was clicked, in which case the index parameter is non-null. The
   * indices may be one of <LABEL_HANDLE> or the number of the respective
   * control point. The source and target points are used for reconnecting
   * the edge.
   */
  const mouseDown = (sender, mE) => {
    const handle = getHandleForEvent(mE);

    if (isSet(getBends()) && isSet(getBends()[handle])) {
      const b = getBends()[handle].getBounds();
      setSnapPoint(Point(b.getCenterX(), b.getCenterY()));
    }

    if (isAddEnabled() && isUnset(handle) && isAddPointEvent(mE.getEvent())) {
      addPoint(getState(), mE.getEvent());
      mE.consume();
    } else if (isSet(handle) && !mE.isConsumed() && getGraph().isEnabled()) {
      if (isRemoveEnabled() && isRemovePointEvent(mE.getEvent())) {
        removePoint(getState(), handle);
      } else if (
        handle !== Event.LABEL_HANDLE ||
        getGraph().isLabelMovable(mE.getCell())
      ) {
        if (handle <= Event.VIRTUAL_HANDLE) {
          setOpacity(
            getVirtualBends()[Event.VIRTUAL_HANDLE - handle].getNode(),
            100
          );
        }

        me.start(mE.getX(), mE.getY(), handle);
      }

      mE.consume();
    }
  };

  /**
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  const start = (x, y, index) => {
    const graph = getGraph();

    setStartX(x);
    setStartY(y);

    const isSource = setSource(isUnset(getBends()) ? false : index === 0);
    const isTarget = setTarget(
      isUnset(getBends()) ? false : index === getBends().length - 1
    );
    setIsLabel(index === Event.LABEL_HANDLE);

    if (isSource || isTarget) {
      const cell = getState().getCell();
      const terminal = graph.getModel().getTerminal(cell, isSource);

      if (
        (isUnset(terminal) && graph.isTerminalPointMovable(cell, isSource)) ||
        (isSet(terminal) &&
          graph.isCellDisconnectable(cell, terminal, isSource))
      ) {
        setIndex(index);
      }
    } else {
      setIndex(index);
    }

    // Hides other custom handles
    if (
      getIndex() <= Event.CUSTOM_HANDLE &&
      getIndex() > Event.VIRTUAL_HANDLE
    ) {
      if (isSet(getCustomHandles())) {
        for (let i = 0; i < getCustomHandles().length; i++) {
          if (i !== Event.CUSTOM_HANDLE - getIndex()) {
            getCustomHandles()[i].setVisible(false);
          }
        }
      }
    }
  };

  /**
   * Function: clonePreviewState
   *
   * Returns a clone of the current preview state for the given point and terminal.
   */
  const clonePreviewState = (point, terminal) => getState().clone();

  /**
   * Function: getSnapToTerminalTolerance
   *
   * Returns the tolerance for the guides. Default value is
   * gridSize * scale / 2.
   */
  const getSnapToTerminalTolerance = () =>
    (getGraph().getGridSize() * getGraph().getView().getScale()) / 2;

  /**
   * Function: updateHint
   *
   * Hook for subclassers do show details while the handler is active.
   */
  const updateHint = (mE, point) => {};

  /**
   * Function: removeHint
   *
   * Hooks for subclassers to hide details when the handler gets inactive.
   */
  const removeHint = noop;

  /**
   * Function: roundLength
   *
   * Hook for rounding the unscaled width or height. This uses Math.round.
   */
  const roundLength = (length) => Math.round(length);

  /**
   * Function: isSnapToTerminalsEvent
   *
   * Returns true if <snapToTerminals> is true and if alt is not pressed.
   */
  const isSnapToTerminalsEvent = (mE) =>
    isSnapToTerminals() && !Event.isAltDown(mE.getEvent());

  /**
   * Function: getPointForEvent
   *
   * Returns the point for the given event.
   */
  const getPointForEvent = (mE) => {
    const graph = getGraph();
    const view = graph.getView();
    const state = getState();
    const scale = view.getScale();
    const point = Point(
      roundLength(mE.getGraphX() / scale) * scale,
      roundLength(mE.getGraphY() / scale) * scale
    );

    const tt = getSnapToTerminalTolerance();
    let overrideX = false;
    let overrideY = false;

    if (tt > 0 && isSnapToTerminalsEvent(mE)) {
      const snapToPoint = (pt) => {
        if (isSet(pt)) {
          const x = pt.getX();

          if (Math.abs(point.getX() - x) < tt) {
            point.setX(x);
            overrideX = true;
          }

          const y = pt.getY();

          if (Math.abs(point.getY() - y) < tt) {
            point.setY(y);
            overrideY = true;
          }
        }
      };

      // Temporary function
      const snapToTerminal = (terminal) => {
        if (isSet(terminal)) {
          snapToPoint(
            Point(
              view.getRoutingCenterX(terminal),
              view.getRoutingCenterY(terminal)
            )
          );
        }
      };

      snapToTerminal(state.getVisibleTerminalState(true));
      snapToTerminal(state.getVisibleTerminalState(false));

      if (isSet(state.getAbsolutePoints())) {
        for (let i = 0; i < state.getAbsolutePoints().length; i++) {
          snapToPoint(state.getAbsolutePoints()[i]);
        }
      }
    }

    if (graph.isGridEnabledEvent(mE.getEvent())) {
      const tr = view.getTranslate();

      if (!overrideX) {
        point.setX(
          (graph.snap(point.getX() / scale - tr.getX()) + tr.getX()) * scale
        );
      }

      if (!overrideY) {
        point.setY(
          (graph.snap(point.getY() / scale - tr.getY()) + tr.getY()) * scale
        );
      }
    }

    return point;
  };

  /**
   * Function: getPreviewTerminalState
   *
   * Updates the given preview state taking into account the state of the constraint handler.
   */
  const getPreviewTerminalState = (mE) => {
    const graph = getGraph();
    const marker = getMarker();
    const constraintHandler = getConstraintHandler();

    constraintHandler.update(
      mE,
      isSource(),
      true,
      mE.isSource(marker.getHighlight().getShape())
        ? undefined
        : getCurrentPoint()
    );

    if (
      isSet(constraintHandler.getCurrentFocus()) &&
      isSet(constraintHandler.getCurrentConstraint())
    ) {
      const highlight = marker.getHighlight();

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

      const model = graph.getModel();
      const other = graph
        .getView()
        .getTerminalPort(
          getState(),
          graph
            .getView()
            .getState(model.getTerminal(getState().getCell(), !isSource())),
          !isSource()
        );
      const otherCell = isSet(other) ? other.getCell() : undefined;
      const source = isSource()
        ? constraintHandler.getCurrentFocus().getCell()
        : otherCell;
      const target = isSource()
        ? otherCell
        : constraintHandler.getCurrentFocus().getCell();

      // Updates the error message of the handler
      setError(validateConnection(source, target));
      let result;

      if (isUnset(getError())) {
        result = constraintHandler.getCurrentFocus();
      }

      if (
        isSet(getError()) ||
        (isSet(result) && !isCellEnabled(result.getCell()))
      ) {
        constraintHandler.reset();
      }

      return result;
    } else if (!graph.isIgnoreTerminalEvent(mE.getEvent())) {
      marker.process(mE);
      const state = marker.getValidState();

      if (isSet(state) && !isCellEnabled(state.getCell())) {
        constraintHandler.reset();
        marker.reset();
      }

      return marker.getValidState();
    } else {
      marker.reset();

      return;
    }
  };

  /**
   * Function: getPreviewPoints
   *
   * Updates the given preview state taking into account the state of the constraint handler.
   *
   * Parameters:
   *
   * pt - <mxPoint> that contains the current pointer position.
   * me - Optional <mxMouseEvent> that contains the current event.
   */
  const getPreviewPoints = (pt, mE) => {
    const graph = getGraph();
    const state = getState();
    const geometry = graph.getCellGeometry(state.getCell());
    let points = isSet(geometry.getPoints())
      ? geometry.getPoints().slice()
      : undefined;
    const point = Point(pt.getX(), pt.getY());
    let result;

    if (!isSource() && !isTarget()) {
      me.convertPoint(point, false);

      const index = getIndex();

      if (isUnset(points)) {
        points = [point];
      } else {
        // Adds point from virtual bend
        if (index <= Event.VIRTUAL_HANDLE) {
          points.splice(Event.VIRTUAL_HANDLE - index, 0, point);
        }

        // Removes point if dragged on terminal point
        if (!isSource() && !isTarget()) {
          for (let i = 0; i < getBends().length; i++) {
            if (i !== index) {
              const bend = getBends()[i];

              if (
                isSet(bend) &&
                contains(bend.getBounds(), pt.getX(), pt.getY())
              ) {
                if (index <= Event.VIRTUAL_HANDLE) {
                  points.splice(Event.VIRTUAL_HANDLE - index, 1);
                } else {
                  points.splice(index - 1, 1);
                }

                result = points;
              }
            }
          }

          // Removes point if user tries to straighten a segment
          if (
            isUnset(result) &&
            isStraightRemoveEnabled() &&
            (isUnset(mE) || !Event.isAltDown(mE.getEvent()))
          ) {
            const tol = graph.getTolerance() * graph.getTolerance();
            const abs = state.getAbsolutePoints().slice();
            abs[index] = pt;

            // Handes special case where removing waypoint affects tolerance (flickering)
            const src = state.getVisibleTerminalState(true);

            if (isSet(src)) {
              const c = graph.getConnectionConstraint(state, src, true);

              // Checks if point is not fixed
              if (isUnset(c) || isUnset(graph.getConnectionPoint(src, c))) {
                abs[0] = Point(
                  src.getView().getRoutingCenterX(src),
                  src.getView().getRoutingCenterY(src)
                );
              }
            }

            const trg = state.getVisibleTerminalState(false);

            if (isSet(trg)) {
              const c = graph.getConnectionConstraint(state, trg, false);

              // Checks if point is not fixed
              if (isUnset(c) || isUnset(graph.getConnectionPoint(trg, c))) {
                abs[abs.length - 1] = Point(
                  trg.getView().getRoutingCenterX(trg),
                  trg.getView().getRoutingCenterY(trg)
                );
              }
            }

            const checkRemove = (idx, tmp) => {
              if (
                idx > 0 &&
                idx < abs.length - 1 &&
                ptSegDistSq(
                  abs[idx - 1].getX(),
                  abs[idx - 1].getY(),
                  abs[idx + 1].getX(),
                  abs[idx + 1].getY(),
                  tmp.getX(),
                  tmp.getY()
                ) < tol
              ) {
                points.splice(idx - 1, 1);
                result = points;
              }
            };

            // LATER: Check if other points can be removed if a segment is made straight
            checkRemove(index, pt);
          }
        }

        // Updates existing point
        if (isUnset(result) && index > Event.VIRTUAL_HANDLE) {
          points[index - 1] = point;
        }
      }
    } else if (graph.isResetEdgesOnConnect()) {
      points = undefined;
    }

    return isSet(result) ? result : points;
  };

  /**
   * Function: isOutlineConnectEvent
   *
   * Returns true if <outlineConnect> is true and the source of the event is the outline shape
   * or shift is pressed.
   */
  const isOutlineConnectEvent = (mE) => {
    const graph = getGraph();
    const marker = getMarker();
    const offset = getOffset(graph.getContainer());
    const evt = mE.getEvent();

    const clientX = Event.getClientX(evt);
    const clientY = Event.getClientY(evt);

    const doc = document.documentElement;
    const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

    const gridX =
      getCurrentPoint().getX() -
      graph.getContainer().scrollLeft +
      offset.getX() -
      left;
    const gridY =
      getCurrentPoint().getY() -
      graph.getContainer().scrollTop +
      offset.getY() -
      top;

    return (
      isOutlineConnect() &&
      !Event.isShiftDown(mE.getEvent()) &&
      (mE.isSource(marker.getHighlight().getShape()) ||
        (Event.isAltDown(mE.getEvent()) && isSet(mE.getState())) ||
        marker.getHhighlight().isHighlightAt(clientX, clientY) ||
        ((gridX !== clientX || gridY !== clientY) &&
          isUnset(mE.getState()) &&
          marker.getHighlight().isHighlightAt(gridX, gridY)))
    );
  };

  /**
   * Function: updatePreviewState
   *
   * Updates the given preview state taking into account the state of the constraint handler.
   */
  const updatePreviewState = (edge, point, terminalState, mE, outline) => {
    const graph = getGraph();
    const state = getState();
    const marker = getMarker();

    // Computes the points for the edge style and terminals
    const sourceState = isSource()
      ? terminalState
      : state.getVisibleTerminalState(true);
    const targetState = isTarget()
      ? terminalState
      : state.getVisibleTerminalState(false);

    let sourceConstraint = graph.getConnectionConstraint(
      edge,
      sourceState,
      true
    );
    let targetConstraint = graph.getConnectionConstraint(
      edge,
      targetState,
      false
    );

    const constraintHandler = getConstraintHandler();
    const constraint = constraintHandler.getCurrentConstraint();

    if (isUnset(constraint) && outline) {
      if (isSet(terminalState)) {
        // Handles special case where mouse is on outline away from actual end point
        // in which case the grid is ignored and mouse point is used instead
        if (mE.isSource(marker.getHighlight().getShape())) {
          point = Point(mE.getGraphX(), mE.getGraphY());
        }

        constraint = graph.getOutlineConstraint(point, terminalState, mE);
        constraintHandler.setFocus(mE, terminalState, isSource());
        constraintHandler.setCurrentConstraint(constraint);
        constraintHandler.setCurrentPoint(point);
      } else {
        constraint = ConnectionConstraint();
      }
    }

    const highlight = marker.getHighlight();

    if (isOutlineConnect() && isSet(highlight) && isSet(highlight.getShape())) {
      const s = graph.getView().getScale();

      if (
        isSet(constraintHandler.getCurrentConstraint()) &&
        isSet(constraintHandler.getCurrentFocus())
      ) {
        highlight
          .getShape()
          .setStroke(outline ? OUTLINE_HIGHLIGHT_COLOR : 'transparent');
        highlight
          .getShape()
          .setStrokeWidth(OUTLINE_HIGHLIGHT_STROKEWIDTH / s / s);
        highlight.repaint();
      } else if (marker.hasValidState()) {
        highlight
          .getShape()
          .setStroke(
            graph.isCellConnectable(mE.getCell()) &&
              marker.getValidState() !== mE.getState()
              ? 'transparent'
              : DEFAULT_VALID_COLOR
          );
        highlight.getShape().setStrokeWidth(HIGHLIGHT_STROKEWIDTH / s / s);
        highlight.repaint();
      }
    }

    if (isSource()) {
      sourceConstraint = constraint;
    } else if (isTarget()) {
      targetConstraint = constraint;
    }

    if (isSource() || isTarget()) {
      if (isSet(constraint) && isSet(constraint.getPoint())) {
        edge.getStyle()[
          isSource() ? STYLE_EXIT_X : STYLE_ENTRY_X
        ] = constraint.getPoint().getX();
        edge.getStyle()[
          isSource() ? STYLE_EXIT_Y : STYLE_ENTRY_Y
        ] = constraint.getPoint().getY();
      } else {
        delete edge.getStyle()[isSource() ? STYLE_EXIT_X : STYLE_ENTRY_X];
        delete edge.getStyle()[isSource() ? STYLE_EXIT_Y : STYLE_ENTRY_Y];
      }
    }

    edge.setVisibleTerminalState(sourceState, true);
    edge.setVisibleTerminalState(targetState, false);

    if (!isSource() || isSet(sourceState)) {
      edge
        .getView()
        .updateFixedTerminalPoint(edge, sourceState, true, sourceConstraint);
    }

    if (!isTarget() || isSet(targetState)) {
      edge
        .getView()
        .updateFixedTerminalPoint(edge, targetState, false, targetConstraint);
    }

    if ((isSource() || isTarget()) && isUnset(terminalState)) {
      edge.setAbsoluteTerminalPoint(point, isSource());

      if (isUnset(marker.getMarkedState())) {
        setError(graph.isAllowDanglingEdges() ? null : '');
      }
    }

    edge.getView().updatePoints(edge, getPoints(), sourceState, targetState);
    edge.getView().updateFloatingTerminalPoints(edge, sourceState, targetState);
  };

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the preview.
   */
  const mouseMove = (sender, mE) => {
    const graph = getGraph();
    const index = getIndex();
    const marker = getMarker();
    const constraintHandler = getConstraintHandler();

    if (isSet(index) && isSet(marker)) {
      const currentPoint = setCurrentPoint(getPointForEvent(mE));
      setError();

      const snapPoint = getSnapPoint();

      // Uses the current point from the constraint handler if available
      if (
        !graph.isIgnoreTerminalEvent(mE.getEvent()) &&
        Event.isShiftDown(mE.getEvent()) &&
        isSet(snapPoint)
      ) {
        if (
          Math.abs(snapPoint.getX() - currentPoint.getX()) <
          Math.abs(snapPoint.getY() - currentPoint.getY())
        ) {
          currentPoint.setX(snapPoint.getX());
        } else {
          currentPoint.setY(snapPoint.getY());
        }
      }

      if (index <= Event.CUSTOM_HANDLE && index > Event.VIRTUAL_HANDLE) {
        if (isSet(getCustomHandles())) {
          getCustomHandles()[Event.CUSTOM_HANDLE - index].processEvent(mE);
          getCustomHandles()[Event.CUSTOM_HANDLE - index].positionChanged();

          if (isSet(getShape()) && isSet(getShape().getNode())) {
            getShape().getNode().style.display = 'none';
          }
        }
      } else if (isLabel()) {
        getLabel().setX(currentPoint.getX());
        getLabel().setY(currentPoint.getY());
      } else {
        setPoints(me.getPreviewPoints(currentPoint, mE));

        let terminalState =
          isSource() || isTarget() ? getPreviewTerminalState(mE) : undefined;
        let outline;

        if (
          isSet(constraintHandler.getCurrentConstraint()) &&
          isSet(constraintHandler.getCurrentFocus()) &&
          isSet(constraintHandler.getCurrentPoint())
        ) {
          setCurrentPoint(constraintHandler.getCurrentPoint().clone());
        } else if (isOutlineConnect()) {
          // Need to check outline before cloning terminal state
          outline =
            isSource() || isTarget() ? isOutlineConnectEvent(mE) : false;

          if (outline) {
            terminalState = marker.getHighlight().getState();
          } else if (
            isSet(terminalState) &&
            terminalState !== mE.getState() &&
            graph.isCellConnectable(mE.getCell()) &&
            isSet(marker.getHighlight().getShape())
          ) {
            marker.getHighlight().getShape().setStroke('transparent');
            marker.getHighlight().repaint();
            terminalState = undefined;
          }
        }

        if (isSet(terminalState) && !isCellEnabled(terminalState.getCell())) {
          terminalState = undefined;
          marker.reset();
        }

        const clone = clonePreviewState(
          getCurrentPoint(),
          isSet(terminalState) ? terminalState.getCell() : undefined
        );
        me.updatePreviewState(
          clone,
          getCurrentPoint(),
          terminalState,
          mE,
          outline
        );

        // Sets the color of the preview to valid or invalid, updates the
        // points of the preview and redraws
        const color = isUnset(getError())
          ? marker.getValidColor()
          : marker.getInvalidColor();
        setPreviewColor(color);
        setAbsPoints(clone.getAbsolutePoints());
        setActive(true);
        updateHint(mE, getCurrentPoint());
      }

      // This should go before calling isOutlineConnectEvent above. As a workaround
      // we add an offset of gridSize to the hint to avoid problem with hit detection
      // in highlight.isHighlightAt (which uses comonentFromPoint)
      drawPreview();
      Event.consume(mE.getEvent());
      mE.consume();
    }
  };

  /**
   * Function: mouseUp
   *
   * Handles the event to applying the previewed changes on the edge by
   * using <moveLabel>, <connect> or <changePoints>.
   */
  const mouseUp = (sender, mE) => {
    const graph = getGraph();
    const state = getState();
    const marker = getMarker();

    // Workaround for wrong event source in Webkit
    if (isSet(getIndex()) && isSet(getMarker())) {
      if (isSet(getShape()) && isSet(getShape().getNode())) {
        getShape().getNode().style.display = '';
      }

      let edge = state.getCell();
      const index = getIndex();
      setIndex();

      // Ignores event if mouse has not been moved
      if (mE.getX() !== getStartX() || mE.getY() !== getStartY()) {
        const clone =
          !graph.isIgnoreTerminalEvent(mE.getEvent()) &&
          graph.isCloneEvent(mE.getEvent()) &&
          isCloneEnabled() &&
          graph.isCellsCloneable();

        // Displays the reason for not carriying out the change
        // if there is an error message with non-zero length
        if (isSet(getError())) {
          if (getError().length > 0) {
            graph.validationAlert(getError());
          }
        } else if (
          index <= Event.CUSTOM_HANDLE &&
          index > Event.VIRTUAL_HANDLE
        ) {
          if (isSet(getCustomHandles())) {
            const model = graph.getModel();

            model.beginUpdate();

            try {
              getCustomHandles()[Event.CUSTOM_HANDLE - index].execute(mE);

              if (isSet(getShape()) && isSet(getShape().getNode())) {
                getShape().apply(state);
                getShape().redraw();
              }
            } finally {
              model.endUpdate();
            }
          }
        } else if (isLabel()) {
          moveLabel(state, getLabel().getX(), getLabel().getY());
        } else if (isSource() || isTarget()) {
          let terminal;

          if (
            isSet(getConstraintHandler().getCurrentConstraint()) &&
            isSet(getConstraintHandler().getCurrentFocus())
          ) {
            terminal = getConstraintHandler().getCurrentFocus().getCell();
          }

          if (
            isUnset(terminal) &&
            marker.hasValidState() &&
            isSet(marker.getHighlight()) &&
            isSet(marker.getHighlight().getShape()) &&
            marker.getHighlight().getShape().getStroke() !== 'transparent' &&
            marker.getHighlight().getShape().getStroke() !== 'white'
          ) {
            terminal = marker.getValidState().getCell();
          }

          if (isSet(terminal)) {
            const model = graph.getModel();
            const parent = model.getParent(edge);

            model.beginUpdate();

            try {
              // Clones and adds the cell
              if (clone) {
                const geo = model.getGeometry(edge);
                const clone = graph.cloneCell(edge);
                model.add(parent, clone, model.getChildCount(parent));

                if (isSet(geo)) {
                  geo = geo.clone();
                  model.setGeometry(clone, geo);
                }

                const other = model.getTerminal(edge, !isSource());
                graph.connectCell(clone, other, !isSource());

                edge = clone;
              }

              edge = me.connect(edge, terminal, isSource(), clone, mE);
            } finally {
              model.endUpdate();
            }
          } else if (graph.isAllowDanglingEdges()) {
            const pt = getAbsPoints()[
              isSource() ? 0 : getAbsPoints().length - 1
            ];
            pt.setX(
              roundLength(
                pt.getX() / graph.getView().getScale() -
                  graph.getView().getTranslate().getX()
              )
            );
            pt.setY(
              roundLength(
                pt.getY() / graph.getView().getScale() -
                  graph.getView().getTranslate().getY()
              )
            );

            const pstate = graph
              .getView()
              .getState(graph.getModel().getParent(edge));

            if (isSet(pstate)) {
              pt.setX(pt.getX() - pstate.getOrigin().getX());
              pt.setY(pt.getY() - pstate.getOrigin().getY());
            }

            pt.setX(pt.getX() - graph.getPanDx() / graph.getView().getScale());
            pt.setY(pt.getY() - graph.getPanDy() / graph.getView().getScale());

            // Destroys and recreates this handler
            edge = changeTerminalPoint(edge, pt, isSource(), clone);
          }
        } else if (isActive()) {
          edge = changePoints(edge, getPoints(), clone);
        } else {
          graph.getView().invalidate(state.getCell());
          graph.getView().validate(state.getCell());
        }
      } else if (graph.isToggleEvent(mE.getEvent())) {
        graph.selectCellForEvent(state.getCell(), mE.getEvent());
      }

      // Resets the preview color the state of the handler if this
      // handler has not been recreated
      if (isSet(marker)) {
        reset();

        // Updates the selection if the edge has been cloned
        if (edge !== state.getCell()) {
          graph.setSelectionCell(edge);
        }
      }

      mE.consume();
    }
  };

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  const reset = () => {
    if (isActive()) {
      refresh();
    }

    setError();
    setIndex();
    setLabel();
    setPoints();
    setSnapPoint();
    setIsLabel(false);
    setSource(false);
    setTarget(false);
    setActive(false);

    if (isLivePreview() && isSet(getSizers())) {
      for (let i = 0; i < getSizers().length; i++) {
        if (isSet(getSizers()[i])) {
          getSizers()[i].getNode().style.display = '';
        }
      }
    }

    if (isSet(getMarker())) {
      getMarker().reset();
    }

    if (isSet(getConstraintHandler())) {
      getConstraintHandler().reset();
    }

    if (isSet(getCustomHandles())) {
      for (let i = 0; i < getCustomHandles().length; i++) {
        getCustomHandles()[i].reset();
      }
    }

    setPreviewColor(EDGE_SELECTION_COLOR);
    removeHint();
    me.redraw();
  };

  /**
   * Function: setPreviewColor
   *
   * Sets the color of the preview to the given value.
   */
  const setPreviewColor = (color) => {
    if (isSet(getShape())) {
      getShape().setStroke(color);
    }
  };

  /**
   * Function: convertPoint
   *
   * Converts the given point in-place from screen to unscaled, untranslated
   * graph coordinates and applies the grid. Returns the given, modified
   * point instance.
   *
   * Parameters:
   *
   * point - <mxPoint> to be converted.
   * gridEnabled - Boolean that specifies if the grid should be applied.
   */
  const convertPoint = (point, gridEnabled) => {
    const graph = getGraph();
    const scale = graph.getView().getScale();
    const tr = graph.getView().getTranslate();

    if (gridEnabled) {
      point.setX(graph.snap(point.getX()));
      point.setY(graph.snap(point.getY()));
    }

    point.setX(Math.round(point.getX() / scale - tr.getX()));
    point.setY(Math.round(point.getY() / scale - tr.getY()));

    const pstate = graph
      .getView()
      .getState(graph.getModel().getParent(getState().getCell()));

    if (isSet(pstate)) {
      point.setX(point.getX() - pstate.getOrigin().getX());
      point.setY(point.getY() - pstate.getOrigin().getY());
    }

    return point;
  };

  /**
   * Function: moveLabel
   *
   * Changes the coordinates for the label of the given edge.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge.
   * x - Integer that specifies the x-coordinate of the new location.
   * y - Integer that specifies the y-coordinate of the new location.
   */
  const moveLabel = (edgeState, x, y) => {
    const model = graph.getModel();
    let geometry = model.getGeometry(edgeState.getCell());

    if (isSet(geometry)) {
      const scale = graph.getView().getScale();
      geometry = geometry.clone();

      if (geometry.isRelative()) {
        // Resets the relative location stored inside the geometry
        let pt = graph.getView().getRelativePoint(edgeState, x, y);
        geometry.setX(Math.round(pt.getX() * 10000) / 10000);
        geometry.setY(Math.round(pt.getY()));

        // Resets the offset inside the geometry to find the offset
        // from the resulting point
        geometry.setOffset(Point(0, 0));
        pt = graph.getView().getPoint(edgeState, geometry);
        geometry.setOffset(
          Point(
            Math.round((x - pt.getX()) / scale),
            Math.round((y - pt.getY()) / scale)
          )
        );
      } else {
        const points = edgeState.getAbsolutePoints();
        const p0 = points[0];
        const pe = points[points.length - 1];

        if (isSet(p0) && isSet(pe)) {
          const cx = p0.getX() + (pe.getX() - p0.getX()) / 2;
          const cy = p0.getY() + (pe.getY() - p0.getY()) / 2;

          geometry.setOffset(
            Point(Math.round((x - cx) / scale), Math.round((y - cy) / scale))
          );
          geometry.setX(0);
          geometry.setY(0);
        }
      }

      model.setGeometry(edgeState.getCell(), geometry);
    }
  };

  /**
   * Function: connect
   *
   * Changes the terminal or terminal point of the given edge in the graph
   * model.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to be reconnected.
   * terminal - <mxCell> that represents the new terminal.
   * isSource - Boolean indicating if the new terminal is the source or
   * target terminal.
   * isClone - Boolean indicating if the new connection should be a clone of
   * the old edge.
   * me - <mxMouseEvent> that contains the mouse up event.
   */
  const connect = (edge, terminal, isSource, isClone, mE) => {
    const model = getGraph().getModel();

    model.beginUpdate();

    try {
      let constraint = getConstraintHandler().getCurrentConstraint();

      if (isUnset(constraint)) {
        constraint = ConnectionConstraint();
      }

      getGraph().connectCell(edge, terminal, isSource, constraint);
    } finally {
      model.endUpdate();
    }

    return edge;
  };

  /**
   * Function: changeTerminalPoint
   *
   * Changes the terminal point of the given edge.
   */
  const changeTerminalPoint = (edge, point, isSource, clone) => {
    const graph = getGraph();
    const model = graph.getModel();

    model.beginUpdate();

    try {
      if (clone) {
        const parent = model.getParent(edge);
        const terminal = model.getTerminal(edge, !isSource);
        edge = graph.cloneCell(edge);
        model.add(parent, edge, model.getChildCount(parent));
        model.setTerminal(edge, terminal, !isSource);
      }

      let geo = model.getGeometry(edge);

      if (isSet(geo)) {
        geo = geo.clone();
        geo.setTerminalPoint(point, isSource);
        model.setGeometry(edge, geo);
        graph.connectCell(edge, undefined, isSource, ConnectionConstraint());
      }
    } finally {
      model.endUpdate();
    }

    return edge;
  };

  /**
   * Function: changePoints
   *
   * Changes the control points of the given edge in the graph model.
   */
  const changePoints = (edge, points, clone) => {
    const model = getGraph().getModel();

    model.beginUpdate();

    try {
      if (clone) {
        const parent = model.getParent(edge);
        const source = model.getTerminal(edge, true);
        const target = model.getTerminal(edge, false);
        edge = getGraph().cloneCell(edge);
        model.add(parent, edge, model.getChildCount(parent));
        model.setTerminal(edge, source, true);
        model.setTerminal(edge, target, false);
      }

      let geo = model.getGeometry(edge);

      if (isSet(geo)) {
        geo = geo.clone();
        geo.setPoints(points);

        model.setGeometry(edge, geo);
      }
    } finally {
      model.endUpdate();
    }

    return edge;
  };

  /**
   * Function: addPoint
   *
   * Adds a control point for the given state and event.
   */
  const addPoint = (state, evt) => {
    const pt = me.convertPoint(
      getGraph().getContainer(),
      Event.getClientX(evt),
      Event.getClientY(evt)
    );
    const gridEnabled = getGraph().isGridEnabledEvent(evt);
    me.convertPoint(pt, gridEnabled);
    addPointAt(state, pt.getX(), pt.getY());
    Event.consume(evt);
  };

  /**
   * Function: addPointAt
   *
   * Adds a control point at the given point.
   */
  const addPointAt = (state, x, y) => {
    const graph = getGraph();
    let geo = getGraph().getCellGeometry(state.getCell());
    const pt = Point(x, y);

    if (isSet(geo)) {
      geo = geo.clone();
      const t = graph.getView().getTranslate();
      const s = graph.getView().getScale();
      let offset = Point(t.getX() * s, t.getY() * s);

      const parent = graph.getModel().getParent(getState().getCell());

      if (graph.getModel().isVertex(parent)) {
        const pState = graph.getView().getState(parent);
        offset = Point(pState.getX(), pState.getY());
      }

      const index = findNearestSegment(
        state,
        pt.getX() * s + offset.getX(),
        pt.getY() * s + offset.getY()
      );

      if (isUnset(geo.getPoints())) {
        geo.setPoints([pt]);
      } else {
        geo.getPoints().splice(index, 0, pt);
      }

      graph.getModel().setGeometry(state.getCell(), geo);
      refresh();
      me.redraw();
    }
  };

  /**
   * Function: removePoint
   *
   * Removes the control point at the given index from the given state.
   */
  const removePoint = (state, index) => {
    if (index > 0 && index < getAbsPoints().length - 1) {
      let geo = getGraph().getCellGeometry(getState().getCell());

      if (isUnset(geo) && isUnset(geo.getPoints())) {
        geo = geo.clone();
        geo.getPoints().splice(index - 1, 1);
        getGraph().getModel().setGeometry(state.getCell(), geo);
        refresh();
        me.redraw();
      }
    }
  };

  /**
   * Function: getHandleFillColor
   *
   * Returns the fillcolor for the handle at the given index.
   */
  const getHandleFillColor = (index) => {
    const graph = getGraph();
    const isSource = index === 0;
    const cell = getState().getCell();
    const terminal = graph.getModel().getTerminal(cell, isSource);
    let color = HANDLE_FILLCOLOR;

    if (
      (isSet(terminal) &&
        !graph.isCellDisconnectable(cell, terminal, isSource)) ||
      (isUnset(terminal) && !graph.isTerminalPointMovable(cell, isSource))
    ) {
      color = LOCKED_HANDLE_FILLCOLOR;
    } else if (
      isSet(terminal) &&
      graph.isCellDisconnectable(cell, terminal, isSource)
    ) {
      color = CONNECT_HANDLE_FILLCOLOR;
    }

    return color;
  };

  /**
   * Function: redraw
   *
   * Redraws the preview, and the bends- and label control points.
   */
  const redraw = (ignoreHandles) => {
    const state = getState();

    if (isSet(state)) {
      setAbsPoints(state.getAbsolutePoints().slice());
      const g = getGraph().getModel().getGeometry(state.getCell());

      if (isSet(g)) {
        const pts = g.getPoints();
        const bends = getBends();

        if (isSet(bends) && bends.length > 0) {
          if (isSet(pts)) {
            if (isUnset(getPoints())) {
              setPoints([]);
            }

            for (let i = 1; i < bends.length - 1; i++) {
              if (isSet(bends[i]) && isSet(getAbsPoints[i])) {
                getPoints()[i - 1] = pts[i - 1];
              }
            }
          }
        }
      }

      drawPreview();

      if (!ignoreHandles) {
        redrawHandles();
      }
    }
  };

  /**
   * Function: redrawHandles
   *
   * Redraws the handles.
   */
  const redrawHandles = () => {
    const graph = getGraph();
    const state = getState();
    const cell = state.getCell();

    // Updates the handle for the label position
    const labelShape = getLabelShape();
    let b = labelShape.getBounds();
    const label = setLabel(
      Point(state.getAbsoluteOffset().getX(), state.getAbsoluteOffset().getY())
    );
    labelShape.setBounds(
      Rectangle(
        Math.round(label.getX() - b.getWidth() / 2),
        Math.round(label.getY() - b.getHeight() / 2),
        b.getWidth(),
        b.getHeight()
      )
    );

    // Shows or hides the label handle depending on the label
    const lab = graph.getLabel(cell);
    labelShape.setVisible(
      isSet(lab) && lab.length > 0 && graph.isLabelMovable(cell)
    );

    const bends = getBends();

    if (isSet(bends) && bends.length > 0) {
      const n = getAbsPoints().length - 1;

      const p0 = getAbsPoints()[0];
      const x0 = p0.getX();
      const y0 = p0.getY();

      b = bends[0].getBounds();
      bends[0].setBounds(
        Rectangle(
          Math.floor(x0 - b.getWidth() / 2),
          Math.floor(y0 - b.getHeight() / 2),
          b.getWidth(),
          b.getHeight()
        )
      );
      bends[0].setFill(getHandleFillColor(0));
      bends[0].redraw();

      if (isManageLabelHandle()) {
        checkLabelHandle(bends[0].getBounds());
      }

      const pe = getAbsPoints()[n];
      const xn = pe.getX();
      const yn = pe.getY();

      const bn = bends.length - 1;
      b = bends[bn].getBounds();
      bends[bn].setBounds(
        Rectangle(
          Math.floor(xn - b.getWidth() / 2),
          Math.floor(yn - b.getHeight() / 2),
          b.getWidth(),
          b.getHeight()
        )
      );
      bends[bn].setFill(getHandleFillColor(bn));
      bends[bn].redraw();

      if (isManageLabelHandle()) {
        checkLabelHandle(bends[bn].getBounds());
      }

      me.redrawInnerBends(p0, pe);
    }

    const absPoints = getAbsPoints();
    const virtualBends = getVirtualBends();

    if (isSet(absPoints) && isSet(virtualBends) && virtualBends.length > 0) {
      let last = absPoints[0];

      for (let i = 0; i < virtualBends.length; i++) {
        if (isSet(virtualBends[i]) && isSet(absPoints[i + 1])) {
          const pt = absPoints[i + 1];
          const b = virtualBends[i];
          const x = last.getX() + (pt.getX() - last.getX()) / 2;
          const y = last.getY() + (pt.getY() - last.getY()) / 2;
          b.setBounds(
            Rectangle(
              Math.floor(x - b.bounds.getWidth() / 2),
              Math.floor(y - b.bounds.getHeight() / 2),
              b.bounds.getWidth(),
              b.bounds.getHeight()
            )
          );
          b.redraw();
          setOpacity(b.getNode(), getVirtualBendOpacity());
          last = pt;

          if (isManageLabelHandle()) {
            checkLabelHandle(b.getBounds());
          }
        }
      }
    }

    if (isSet(labelShape)) {
      labelShape.redraw();
    }

    const customHandles = getCustomHandles();

    if (isSet(customHandles)) {
      for (let i = 0; i < customHandles.length; i++) {
        const temp = customHandles[i].getShape().getNode().style.display;
        customHandles[i].redraw();
        customHandles[i].getShape().getNode().style.display = temp;

        // Hides custom handles during text editing
        customHandles[i]
          .getShape()
          .getNode().style.visibility = isCustomHandleVisible(customHandles[i])
          ? ''
          : 'hidden';
      }
    }
  };

  /**
   * Function: isCustomHandleVisible
   *
   * Returns true if the given custom handle is visible.
   */
  const isCustomHandleVisible = (handle) =>
    !getGraph().isEditing() &&
    getState().getView().getGraph().getSelectionCount() === 1;

  /**
   * Function: setHandlesVisible
   */
  const setHandlesVisible = (visible) => {
    if (isSet(getBends())) {
      for (let i = 0; i < getBends().length; i++) {
        getBends()[i].getNode().style.display = visible ? '' : 'none';
      }
    }

    if (isSet(getVirtualBends())) {
      for (let i = 0; i < getVirtualBends().length; i++) {
        getVirtualBends()[i].getNode().style.display = visible ? '' : 'none';
      }
    }

    if (isSet(getLabelShape())) {
      getLabelShape().getNode().style.display = visible ? '' : 'none';
    }

    if (isSet(getCustomHandles())) {
      for (let i = 0; i < getCustomHandles().length; i++) {
        getCustomHandles()[i].setVisible(visible);
      }
    }
  };

  /**
   * Function: redrawInnerBends
   *
   * Updates and redraws the inner bends.
   *
   * Parameters:
   *
   * p0 - <mxPoint> that represents the location of the first point.
   * pe - <mxPoint> that represents the location of the last point.
   */
  const redrawInnerBends = (p0, pe) => {
    const bends = getBends();

    for (let i = 1; i < bends.length - 1; i++) {
      if (isSet(bends[i])) {
        const absPoints = getAbsPoints();

        if (isSet(absPoints[i])) {
          const x = absPoints[i].getX();
          const y = absPoints[i].getY();

          const b = bends[i].getBounds();
          bends[i].getNode().style.visibility = 'visible';
          bends[i].setBounds(
            Rectangle(
              Math.round(x - b.getWidth() / 2),
              Math.round(y - b.getHeight() / 2),
              b.getWidth(),
              b.getHeight()
            )
          );

          if (isManageLabelHandle()) {
            checkLabelHandle(bends[i].getBounds());
          } else if (
            isUnset(getHandleImage()) &&
            getLabelShape().isVisible() &&
            intersects(bends[i].getBounds(), getLabelShape().getBounds())
          ) {
            const w = HANDLE_SIZE + 3;
            const h = HANDLE_SIZE + 3;
            bends[i].setBounds(
              Rectangle(Math.round(x - w / 2), Math.round(y - h / 2), w, h)
            );
          }

          bends[i].redraw();
        } else {
          bends[i].destroy();
          bends[i] = undefined;
        }
      }
    }
  };

  /**
   * Function: checkLabelHandle
   *
   * Checks if the label handle intersects the given bounds and moves it if it
   * intersects.
   */
  const checkLabelHandle = (b) => {
    if (isSet(getLabelShape())) {
      const b2 = getLabelShape().getBounds();

      if (intersects(b, b2)) {
        if (b.getCenterY() < b2.getCenterY()) {
          b2.setY(b.getY() + b.getHeight());
        } else {
          b2.setY(b.getY() - b2.getHeight());
        }
      }
    }
  };

  /**
   * Function: drawPreview
   *
   * Redraws the preview.
   */
  const drawPreview = () => {
    try {
      if (isLabel()) {
        const b = getLabelShape().getBounds();
        const bounds = Rectangle(
          Math.round(getLabel().getX() - b.getWidth() / 2),
          Math.round(getLabel().getY() - b.getHeight() / 2),
          b.getWidth(),
          b.getHeight()
        );

        if (!getLabelShape().getBounds().equals(bounds)) {
          getLabelShape().setBounds(bounds);
          getLabelShape().redraw();
        }
      }

      const shape = getShape();

      if (isSet(shape) && !equalPoints(shape.getPoints(), getAbsPoints())) {
        shape.apply(getState());
        shape.setPoints(getAbsPoints().slice());
        shape.setScale(getState().getView().getScale());
        shape.setDashed(isSelectionDashed());
        shape.setStroke(getSelectionColor());
        shape.setStrokeWidth(
          getSelectionStrokeWidth() / shape.getScale() / shape.getScale()
        );
        shape.setShadow(false);
        shape.redraw();
      }

      updateParentHighlight();
    } catch (e) {
      console.log(e);
      // ignore
    }
  };

  /**
   * Function: refresh
   *
   * Refreshes the bends of this handler.
   */
  const refresh = () => {
    if (isSet(getState())) {
      setAbsPoints(getSelectionPoints(getState()));
      setPoints([]);

      if (isSet(getBends())) {
        destroyBends(getBends());
        setBends(me.createBends());
      }

      if (isSet(getVirtualBends())) {
        destroyBends(getVirtualBends());
        setVirtualBends(me.createVirtualBends());
      }

      if (isSet(getCustomHandles())) {
        destroyBends(getCustomHandles());
        setCustomHandles(createCustomHandles());
      }

      const labelShape = getLabelShape();

      // Puts label node on top of bends
      if (
        isSet(labelShape) &&
        isSet(labelShape.getNode()) &&
        isSet(labelShape.getNode().parentNode)
      ) {
        labelShape.getNode().parentNode.appendChild(labelShape.getNode());
      }
    }
  };

  /**
   * Function: isDestroyed
   *
   * Returns true if <destroy> was called.
   */
  const isDestroyed = () => isUnset(getShape());

  /**
   * Function: destroyBends
   *
   * Destroys all elements in <bends>.
   */
  const destroyBends = (bends) => {
    if (isSet(bends)) {
      for (let i = 0; i < bends.length; i++) {
        if (isSet(bends[i])) {
          bends[i].destroy();
        }
      }
    }
  };

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes. This does
   * normally not need to be called as handlers are destroyed automatically
   * when the corresponding cell is deselected.
   */
  const destroy = () => {
    if (isSet(getEscapeHandler())) {
      getState().getView().getGraph().removeListener(getEscapeHandler());
      setEscapeHandler();
    }

    if (isSet(getMarker())) {
      getMarker().destroy();
      setMarker();
    }

    if (isSet(getShape())) {
      getShape().destroy();
      setShape();
    }

    const parentHighlight = getParentHighlight();

    if (isSet(parentHighlight)) {
      const parent = getGraph().getModel().getParent(getState().getCell());
      const pstate = getGraph().getView().getState(parent);

      if (
        isSet(pstate) &&
        pstate.getParentHighlight() === getParentHighlight()
      ) {
        pstate.setParentHighlight();
      }

      parentHighlight.destroy();
      setParentHighlight();
    }

    if (isSet(getLabelShape())) {
      getLabelShape().destroy();
      setLabelShape();
    }

    if (isSet(getConstraintHandler())) {
      getConstraintHandler().destroy();
      setConstraintHandler();
    }

    destroyBends(getVirtualBends());
    setVirtualBends();

    destroyBends(getCustomHandles());
    setCustomHandles();

    destroyBends(getBends());
    setBends();

    removeHint();
  };

  const me = {
    getGraph,
    setGraph,
    getState,
    setState,
    getMarker,
    setMarker,
    getConstraintHandler,
    setConstraintHandler,
    getError,
    setError,
    getShape,
    setShape,
    getBends,
    setBends,
    getLabelShape,
    setLabelShape,
    isCloneEnabled,
    setCloneEnabled,
    isAddEnabled,
    setAddEnabled,
    isRemoveEnabled,
    setRemoveEnabled,
    isDblClickRemoveEnabled,
    setDblClickRemoveEnabled,
    isMergeRemoveEnabled,
    setMergeRemoveEnabled,
    isStraightRemoveEnabled,
    setStraightRemoveEnabled,
    isVirtualBendsEnabled,
    setVirtualBendsEnabled,
    getVirtualBendOpacity,
    setVirtualBendOpacity,
    isParentHighlightEnabled,
    setParentHighlightEnabled,
    isAllowHandleBoundsCheck,
    setAllowHandleBoundsCheck,
    isSnapToTerminals,
    setSnapToTerminals,
    getHandleImage,
    setHandleImage,
    getTolerance,
    setTolerance,
    isOutlineConnect,
    setOutlineConnect,
    isManageLabelHandle,
    setManageLabelHandle,
    init,
    isParentHighlightVisible,
    updateParentHighlight,
    createCustomHandles,
    isCellEnabled,
    isAddPointEvent,
    isRemovePointEvent,
    getSelectionPoints,
    createParentHighlightShape,
    createSelectionShape,
    getSelectionColor,
    getSelectionStrokeWidth,
    isSelectionDashed,
    isConnectableCell,
    getCellAt,
    createMarker,
    validateConnection,
    createBends,
    createVirtualBends,
    isHandleEnabled,
    isHandleVisible,
    createHandleShape,
    createLabelHandleShape,
    initBend,
    getHandleForEvent,
    isAddVirtualBendEvent,
    isCustomHandleEvent,
    mouseDown,
    start,
    clonePreviewState,
    getSnapToTerminalTolerance,
    updateHint,
    removeHint,
    roundLength,
    isSnapToTerminalsEvent,
    getPointForEvent,
    getPreviewTerminalState,
    getPreviewPoints,
    isOutlineConnectEvent,
    updatePreviewState,
    mouseMove,
    mouseUp,
    reset,
    setPreviewColor,
    convertPoint,
    moveLabel,
    connect,
    changeTerminalPoint,
    changePoints,
    addPoint,
    addPointAt,
    removePoint,
    getHandleFillColor,
    redraw,
    redrawHandles,
    isCustomHandleVisible,
    setHandlesVisible,
    redrawInnerBends,
    checkLabelHandle,
    drawPreview,
    refresh,
    getIndex,
    setIndex,
    isDestroyed,
    destroyBends,
    destroy
  };

  if (isSet(state) && isSet(state.getShape())) {
    setState(state);
    init();

    state.getView().getGraph().addListener(Event.ESCAPE, getEscapeHandler());
  }

  return me;
};

export default makeComponent(EdgeHandler);
