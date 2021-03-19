/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { IS_IOS } from '../Client';
import { addProp, isSet, isUnset, makeComponent } from '../Helpers';
import RectangleShape from '../shape/RectangleShape';
import {
  CURSOR_MOVABLE_EDGE,
  CURSOR_MOVABLE_VERTEX,
  DROP_TARGET_COLOR,
  INVALID_CONNECT_TARGET_COLOR,
  STYLE_ROTATION,
  VALID_COLOR
} from '../util/Constants';
import Dictionary from '../util/Dictionary';
import Event from '../util/Event';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import {
  contains,
  convertPoint,
  getValue,
  setCellStyleFlags,
  toRadians
} from '../util/Utils';
import CellHighlight from './CellHighlight';

/**
 * Class: GraphHandler
 *
 * Graph event handler that handles selection. Individual cells are handled
 * separately using <mxVertexHandler> or one of the edge handlers. These
 * handlers are created using <mxGraph.createHandler> in
 * <mxGraphSelectionModel.cellAdded>.
 *
 * To avoid the container to scroll a moved cell into view, set
 * <scrollAfterMove> to false.
 *
 * Constructor: mxGraphHandler
 *
 * Constructs an event handler that creates handles for the
 * selection cells.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
const GraphHandler = (graph) => {
  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: maxCells
   *
   * Defines the maximum number of cells to paint subhandles
   * for. Default is 50 for Firefox and 20 for IE. Set this
   * to 0 if you want an unlimited number of handles to be
   * displayed. This is only recommended if the number of
   * cells in the graph is limited to a small number, eg.
   * 500.
   */
  const [getMaxCells, setMaxCells] = addProp(50);

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: highlightEnabled
   *
   * Specifies if drop targets under the mouse should be enabled. Default is
   * true.
   */
  const [isHighlightEnabled, setHighlightEnabled] = addProp(true);

  /**
   * Variable: cloneEnabled
   *
   * Specifies if cloning by control-drag is enabled. Default is true.
   */
  const [isCloneEnabled, setCloneEnabled] = addProp(true);

  /**
   * Variable: moveEnabled
   *
   * Specifies if moving is enabled. Default is true.
   */
  const [isMoveEnabled, setMoveEnabled] = addProp(true);

  /**
   * Variable: guidesEnabled
   *
   * Specifies if other cells should be used for snapping the right, center or
   * left side of the current selection. Default is false.
   */
  const [isGuidesEnabled, setGuidesEnabled] = addProp(false);

  /**
   * Variable: handlesVisible
   *
   * Whether the handles of the selection are currently visible.
   */
  const [isHandlesVisible, setHandlesVisible] = addProp(true);

  /**
   * Variable: guide
   *
   * Holds the <mxGuide> instance that is used for alignment.
   */
  const [getGuide, setGuide] = addProp();

  /**
   * Variable: currentDx
   *
   * Stores the x-coordinate of the current mouse move.
   */
  const [getCurrentDx, setCurrentDx] = addProp();

  /**
   * Variable: currentDy
   *
   * Stores the y-coordinate of the current mouse move.
   */
  const [getCurrentDy, setCurrentDy] = addProp();

  /**
   * Variable: updateCursor
   *
   * Specifies if a move cursor should be shown if the mouse is over a movable
   * cell. Default is true.
   */
  const [isUpdateCursor, setUpdateCursor] = addProp(true);

  /**
   * Variable: selectEnabled
   *
   * Specifies if selecting is enabled. Default is true.
   */
  const [isSelectEnabled, setSelectEnabled] = addProp(true);

  /**
   * Variable: removeCellsFromParent
   *
   * Specifies if cells may be moved out of their parents. Default is true.
   */
  const [isRemoveCellsFromParent, setRemoveCellsFromParent] = addProp(true);

  /**
   * Variable: removeEmptyParents
   *
   * If empty parents should be removed from the model after all child cells
   * have been moved out. Default is true.
   */
  const [isRemoveEmptyParents, setRemoveEmptyParents] = addProp(false);

  /**
   * Variable: connectOnDrop
   *
   * Specifies if drop events are interpreted as new connections if no other
   * drop action is defined. Default is false.
   */
  const [isConnectOnDrop, setConnectOnDrop] = addProp(false);

  /**
   * Variable: scrollOnMove
   *
   * Specifies if the view should be scrolled so that a moved cell is
   * visible. Default is true.
   */
  const [isScrollOnMove, setScrollOnMove] = addProp(true);

  /**
   * Variable: minimumSize
   *
   * Specifies the minimum number of pixels for the width and height of a
   * selection border. Default is 6.
   */
  const [getMinimumSize, setMinimumSize] = addProp(6);

  /**
   * Variable: previewColor
   *
   * Specifies the color of the preview shape. Default is black.
   */
  const [getPreviewColor, setPreviewColor] = addProp('black');

  /**
   * Variable: htmlPreview
   *
   * Specifies if the graph container should be used for preview. If this is used
   * then drop target detection relies entirely on <mxGraph.getCellAt> because
   * the HTML preview does not "let events through". Default is false.
   */
  const [isHtmlPreview, setHtmlPreview] = addProp(false);

  /**
   * Variable: shape
   *
   * Reference to the <mxShape> that represents the preview.
   */
  const [getShape, setShape] = addProp();

  /**
   * Variable: scaleGrid
   *
   * Specifies if the grid should be scaled. Default is false.
   */
  const [isScaleGrid, setScaleGrid] = addProp(false);

  /**
   * Variable: rotationEnabled
   *
   * Specifies if the bounding box should allow for rotation. Default is true.
   */
  const [isRotationEnabled, setRotationEnabled] = addProp(true);

  /**
   * Variable: maxLivePreview
   *
   * Maximum number of cells for which live preview should be used. Default is 0
   * which means no live preview.
   */
  const [getMaxLivePreview, setMaxLivePreview] = addProp(0);

  /**
   * Variable: allowLivePreview
   *
   * If live preview is allowed on this system. Default is true for systems with
   * SVG support.
   */
  const [isAllowLivePreview, setAllowLivePreview] = addProp(true);

  const [_isDelayedSelection, setDelayedSelection] = addProp(false);

  const [isCellWasClicked, setCellWasClicked] = addProp(false);

  const [getPanHandler, setPanHandler] = addProp(() => {
    if (!isSuspended()) {
      updatePreview();
      updateHint();
    }
  });

  const [getEscapeHandler, setEscapeHandler] = addProp((sender, evt) =>
    reset()
  );

  const [getRefreshThread, setRefreshThread] = addProp();
  const [getRefreshHandler, setRefreshHandler] = addProp((sender, evt) => {
    // Merges multiple pending calls
    if (getRefreshThread()) {
      window.clearTimeout(getRefreshThread());
    }

    // Waits for the states and handlers to be updated
    setRefreshThread(
      window.setTimeout(() => {
        setRefreshThread();

        if (isSet(getFirst()) && !isSuspended()) {
          // Updates preview with no translate to compute bounding box
          const dx = getCurrentDx();
          const dy = getCurrentDy();
          setCurrentDx(0);
          setCurrentDy(0);
          updatePreview();
          setBounds(getGraph().getView().getBounds(getCells()));
          setPBounds(getPreviewBounds(getCells()));

          if (isUnset(getPBounds()) && !isLivePreviewUsed()) {
            reset();
          } else {
            // Restores translate and updates preview
            setCurrentDx(dx);
            setCurrentDy(dy);
            updatePreview();
            updateHint();

            if (isLivePreviewUsed()) {
              // Forces update to ignore last visible state
              setHandlesVisibleForCells(
                getGraph()
                  .getSelectionCellsHandler()
                  .getHandledSelectionCells(),
                false,
                true
              );
              updatePreview();
            }
          }
        }
      }),
      0
    );
  });

  const [getKeyHandler, setKeyHandler] = addProp((e) => {
    const graph = getGraph();

    if (
      isSet(graph.getContainer()) &&
      graph.getContainer().style.visibility !== 'hidden' &&
      isSet(getFirst()) &&
      !isSuspended()
    ) {
      const clone =
        graph.isCloneEvent(e) && graph.isCellsCloneable() && isCloneEnabled();

      if (clone !== isCloning()) {
        setCloning(clone);
        checkPreview();
        updatePreview();
      }
    }
  });

  const [isLivePreviewUsed, setLivePreviewUsed] = addProp(false);
  const [isLivePreviewActive, setLivePreviewActive] = addProp(false);
  const [getCell, setCell] = addProp();
  const [getCellCount, setCellCount] = addProp(0);
  const [getHighlight, setHighlight] = addProp();
  const [isSuspended, setSuspended] = addProp(false);
  const [isCloning, setCloning] = addProp(false);
  const [getAllCells, setAllCells] = addProp();
  const [getBounds, setBounds] = addProp();
  const [getPBounds, setPBounds] = addProp();
  const [getGuides, setGuides] = addProp();
  const [getTarget, setTarget] = addProp();
  const [getFirst, setFirst] = addProp();
  const [_getCells, setCells] = addProp();

  /**
   * Function: isPropagateSelectionCell
   *
   * Returns true if the given cell and parent should propagate
   * selection state to the parent.
   */
  const isPropagateSelectionCell = (cell, immediate, mE) => {
    const graph = getGraph();
    const parent = graph.getModel().getParent(cell);

    if (immediate) {
      const geo = graph.getModel().isEdge(cell)
        ? null
        : graph.getCellGeometry(cell);

      return (
        !graph.isSiblingSelected(cell) &&
        ((isSet(geo) && geo.isRelative()) || !graph.isSwimlane(parent))
      );
    } else {
      return (
        (!graph.isToggleEvent(mE.getEvent()) ||
          (!graph.isSiblingSelected(cell) &&
            !graph.isCellSelected(cell) &&
            !graph.isSwimlane(parent)) ||
          graph.isCellSelected(parent)) &&
        (graph.isToggleEvent(mE.getEvent()) || !graph.isCellSelected(parent))
      );
    }
  };

  /**
   * Function: getInitialCellForEvent
   *
   * Hook to return initial cell for the given event. This returns
   * the topmost cell that is not a swimlane or is selected.
   */
  const getInitialCellForEvent = (mE) => {
    const graph = getGraph();
    let state = mE.getState();

    if (
      (!graph.isToggleEvent(mE.getEvent()) ||
        !Event.isAltDown(mE.getEvent())) &&
      isSet(state) &&
      !graph.isCellSelected(state.getCell())
    ) {
      const model = graph.getModel();
      let next = graph.getView().getState(model.getParent(state.getCell()));

      while (
        isSet(next) &&
        !graph.isCellSelected(next.getCell()) &&
        (model.isVertex(next.getCell()) || model.isEdge(next.getCell())) &&
        this.isPropagateSelectionCell(state.getCell(), true, mE)
      ) {
        state = next;
        next = graph.getView().getState(model.getParent(state.getCell()));
      }
    }

    return isSet(state) ? state.getCell() : null;
  };

  /**
   * Function: isDelayedSelection
   *
   * Returns true if the cell or one of its ancestors is selected.
   */
  const isDelayedSelection = (cell, mE) => {
    const graph = getGraph();

    if (
      !graph.isToggleEvent(mE.getEvent()) ||
      !Event.isAltDown(mE.getEvent())
    ) {
      while (isSet(cell)) {
        if (graph.getSelectionCellsHandler().isHandled(cell)) {
          return graph.getCellEditor().getEditingCell() !== cell;
        }

        cell = graph.getModel().getParent(cell);
      }
    }

    return (
      graph.isToggleEvent(mE.getEvent()) && !Event.isAltDown(mE.getEvent())
    );
  };

  /**
   * Function: selectDelayed
   *
   * Implements the delayed selection for the given mouse event.
   */
  const selectDelayed = (mE) => {
    if (!getGraph().getPopupMenuHandler().isPopupTrigger(mE)) {
      let cell = mE.getCell();

      if (isUnset(cell)) {
        cell = getCell();
      }

      selectCellForEvent(cell, mE);
    }
  };

  /**
   * Function: selectCellForEvent
   *
   * Selects the given cell for the given <mxMouseEvent>.
   */
  const selectCellForEvent = (cell, mE) => {
    const graph = getGraph();
    const state = graph.getView().getState(cell);

    if (isSet(state)) {
      if (mE.isSource(state.getControl())) {
        graph.selectCellForEvent(cell, mE.getEvent());
      } else {
        if (
          !graph.isToggleEvent(mE.getEvent()) ||
          !Event.isAltDown(mE.getEvent())
        ) {
          const model = graph.getModel();
          let parent = model.getParent(cell);

          while (
            isSet(graph.getView().getState(parent)) &&
            (model.isVertex(parent) || model.isEdge(parent)) &&
            isPropagateSelectionCell(cell, false, mE)
          ) {
            cell = parent;
            parent = model.getParent(cell);
          }
        }

        graph.selectCellForEvent(cell, mE.getEvent());
      }
    }

    return cell;
  };

  /**
   * Function: consumeMouseEvent
   *
   * Consumes the given mouse event. NOTE: This may be used to enable click
   * events for links in labels on iOS as follows as consuming the initial
   * touchStart disables firing the subsequent click event on the link.
   *
   * <code>
   * mxGraphHandler.prototype.consumeMouseEvent = function(evtName, me)
   * {
   *   var source = mxEvent.getSource(me.getEvent());
   *
   *   if (!mxEvent.isTouchEvent(me.getEvent()) || source.nodeName != 'A')
   *   {
   *     me.consume();
   *   }
   * }
   * </code>
   */
  const consumeMouseEvent = (evtName, mE) => mE.consume();

  /**
   * Function: mouseDown
   *
   * Handles the event by selecing the given cell and creating a handle for
   * it. By consuming the event all subsequent events of the gesture are
   * redirected to this handler.
   */
  const mouseDown = (sender, mE) => {
    const graph = getGraph();

    if (
      !mE.isConsumed() &&
      isEnabled() &&
      graph.isEnabled() &&
      isSet(mE.getState()) &&
      !Event.isMultiTouchEvent(mE.getEvent())
    ) {
      const cell = getInitialCellForEvent(mE);
      setDelayedSelection(isDelayedSelection(cell, mE));
      setCell();

      if (isSelectEnabled() && !_isDelayedSelection()) {
        graph.selectCellForEvent(cell, mE.getEvent());
      }

      if (isMoveEnabled()) {
        const model = graph.getModel();
        const geo = model.getGeometry(cell);

        if (
          graph.isCellMovable(cell) &&
          (!model.isEdge(cell) ||
            graph.getSelectionCount() > 1 ||
            (isSet(geo.getPoints()) && geo.getPoints().length > 0) ||
            isUnset(model.getTerminal(cell, true)) ||
            isUnset(model.getTerminal(cell, false)) ||
            graph.isAllowDanglingEdges() ||
            (graph.isCloneEvent(mE.getEvent()) && graph.isCellsCloneable()))
        ) {
          start(cell, mE.getX(), mE.getY());
        } else if (_isDelayedSelection()) {
          setCell(cell);
        }

        setCellWasClicked(true);
        consumeMouseEvent(Event.MOUSE_DOWN, mE);
      }
    }
  };

  /**
   * Function: getGuideStates
   *
   * Creates an array of cell states which should be used as guides.
   */
  const getGuideStates = () => {
    const graph = getGraph();
    const parent = graph.getDefaultParent();
    const model = graph.getModel();

    const filter = (cell) =>
      isSet(graph.getView().getState(cell)) &&
      model.isVertex(cell) &&
      isSet(model.getGeometry(cell)) &&
      !model.getGeometry(cell).isRelative();

    return graph
      .getView()
      .getCellStates(model.filterDescendants(filter, parent));
  };

  /**
   * Function: getCells
   *
   * Returns the cells to be modified by this handler. This implementation
   * returns all selection cells that are movable, or the given initial cell if
   * the given cell is not selected and movable. This handles the case of moving
   * unselectable or unselected cells.
   *
   * Parameters:
   *
   * initialCell - <mxCell> that triggered this handler.
   */
  const getCells = (initialCell) => {
    if (!_isDelayedSelection() && getGraph().isCellMovable(initialCell)) {
      return [initialCell];
    } else {
      return getGraph().getMovableCells(getGraph().getSelectionCells());
    }
  };

  /**
   * Function: getPreviewBounds
   *
   * Returns the <mxRectangle> used as the preview bounds for
   * moving the given cells.
   */
  const getPreviewBounds = (cells) => {
    const bounds = getBoundingBox(cells);

    if (isSet(bounds)) {
      // Corrects width and height
      bounds.setWidth(Math.max(0, bounds.getWidth() - 1));
      bounds.setHeight(Math.max(0, bounds.getHeight() - 1));

      if (bounds.getWidth() < getMinimumSize()) {
        const dx = getMinimumSize() - bounds.getWidth();
        bounds.setX(bounds.getX() - dx / 2);
        bounds.setWidth(getMinimumSize());
      } else {
        bounds.setX(Math.round(bounds.getX()));
        bounds.setWidth(Math.ceil(bounds.getWidth()));
      }

      if (bounds.getHeight() < getMinimumSize()) {
        const dy = getMinimumSize() - bounds.getHeight();
        bounds.setY(bounds.getY() - dy / 2);
        bounds.setHeight(getMinimumSize());
      } else {
        bounds.setY(Math.round(bounds.getY()));
        bounds.setHeight(Math.ceil(bounds.getHeight()));
      }
    }

    return bounds;
  };

  /**
   * Function: getBoundingBox
   *
   * Returns the union of the <mxCellStates> for the given array of <mxCells>.
   * For vertices, this method uses the bounding box of the corresponding shape
   * if one exists. The bounding box of the corresponding text label and all
   * controls and overlays are ignored. See also: <mxGraphView.getBounds> and
   * <mxGraph.getBoundingBox>.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounding box should be returned.
   */
  const getBoundingBox = (cells) => {
    let result = null;

    if (isSet(cells) && cells.length > 0) {
      const model = getGraph().getModel();

      for (let i = 0; i < cells.length; i++) {
        if (model.isVertex(cells[i]) || model.isEdge(cells[i])) {
          const state = getGraph().getView().getState(cells[i]);

          if (isSet(state)) {
            let bbox = state;

            if (
              model.isVertex(cells[i]) &&
              isSet(state.getShape()) &&
              isSet(state.getShape().getBoundingBox())
            ) {
              bbox = state.getShape().getBoundingBox();
            }

            if (isUnset(result)) {
              result = Rectangle.fromRectangle(bbox);
            } else {
              result.add(bbox);
            }
          }
        }
      }
    }

    return result;
  };

  /**
   * Function: createPreviewShape
   *
   * Creates the shape used to draw the preview for the given bounds.
   */
  const createPreviewShape = (bounds) => {
    const shape = RectangleShape(bounds, null, getPreviewColor());
    shape.setDashed(true);

    if (isHtmlPreview()) {
      shape.init(getGraph().getContainer());
    } else {
      shape.init(getGraph().getView().getOverlayPane());
      shape.setPointerEvents(false);

      // Workaround for artifacts on iOS
      if (IS_IOS) {
        shape.getSvgScreenOffset = () => 0;
      }
    }

    return shape;
  };

  /**
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  const start = (cell, x, y, cells) => {
    const graph = getGraph();

    setCell(cell);
    setFirst(convertPoint(graph.getContainer(), x, y));
    setCells(isSet(cells) ? cells : getCells(getCell()));
    setBounds(graph.getView().getBounds(_getCells()));
    setPBounds(getPreviewBounds(_getCells()));
    setAllCells(Dictionary());
    setCloning(false);
    setCellCount(0);

    for (let i = 0; i < _getCells().length; i++) {
      setCellCount(getCellCount() + addStates(_getCells()[i], getAllCells()));
    }

    if (isGuidesEnabled()) {
      setGuide(Guide(graph, getGuideStates()));
      const parent = graph.getModel().getParent(cell);
      const ignore = graph.getModel().getChildCount(parent) < 2;

      // Uses connected states as guides
      const connected = Dictionary();
      const opps = graph.getOpposites(graph.getEdges(getCell()), getCell());

      for (let i = 0; i < opps.length; i++) {
        const state = graph.getView().getState(opps[i]);

        if (isSet(state) && !connected.get(state)) {
          connected.put(state, true);
        }
      }

      guide.isStateIgnored = (state) => {
        const p = graph.getModel().getParent(state.getCell());

        return (
          isSet(state.getCell()) &&
          ((!isCloning() && isCellMoving(state.getCell())) ||
            (state.getCell() !== (getTarget() || parent) &&
              !ignore &&
              !connected.get(state) &&
              (isUnset(getTarget()) ||
                graph.getModel().getChildCount(getTarget()) >= 2) &&
              p !== (getTarget() || parent)))
        );
      };
    }
  };

  /**
   * Function: addStates
   *
   * Adds the states for the given cell recursively to the given dictionary.
   */
  const addStates = (cell, dict) => {
    const state = getGraph().getView().getState(cell);
    let count = 0;

    if (isSet(state) && isUnset(dict.get(cell))) {
      dict.put(cell, state);
      count++;

      const childCount = getGraph().getModel().getChildCount(cell);

      for (let i = 0; i < childCount; i++) {
        count += addStates(getGraph().getModel().getChildAt(cell, i), dict);
      }
    }

    return count;
  };

  /**
   * Function: isCellMoving
   *
   * Returns true if the given cell is currently being moved.
   */
  const isCellMoving = (cell) => isSet(getAllCells().get(cell));

  /**
   * Function: useGuidesForEvent
   *
   * Returns true if the guides should be used for the given <mxMouseEvent>.
   * This implementation returns <mxGuide.isEnabledForEvent>.
   */
  const useGuidesForEvent = (mE) =>
    isSet(getGuide())
      ? getGuide().isEnabledForEvent(mE.getEvent()) &&
        !getGraph().isConstrainedEvent(mE.getEvent())
      : true;

  /**
   * Function: snap
   *
   * Snaps the given vector to the grid and returns the given mxPoint instance.
   */
  const snap = (vector) => {
    const scale = getScaleGrid() ? getGraph().getView().getScale() : 1;

    vector.setX(getGraph().snap(vector.getX() / scale) * scale);
    vector.setY(getGraph().snap(vector.getY() / scale) * scale);

    return vector;
  };

  /**
   * Function: getDelta
   *
   * Returns an <mxPoint> that represents the vector for moving the cells
   * for the given <mxMouseEvent>.
   */
  const getDelta = (mE) => {
    const point = convertPoint(getGraph().getContainer(), mE.getX(), mE.getY());

    return Point(
      point.getX() - getFirst().getX() - getGraph().getPanDx(),
      point.getY() - getFirst().getY() - getGraph().getPanDy()
    );
  };

  /**
   * Function: updateHint
   *
   * Hook for subclassers do show details while the handler is active.
   */
  const updateHint = (mE) => {};

  /**
   * Function: removeHint
   *
   * Hooks for subclassers to hide details when the handler gets inactive.
   */
  const removeHint = () => {};

  /**
   * Function: roundLength
   *
   * Hook for rounding the unscaled vector. Allows for half steps in the raster so
   * numbers coming in should be rounded if no half steps are allowed (ie for non
   * aligned standard moving where pixel steps should be preferred).
   */
  const roundLength = (length) => Math.round(length * 100) / 100;

  /**
   * Function: isValidDropTarget
   *
   * Returns true if the given cell is a valid drop target.
   */
  const isValidDropTarget = (target, mE) =>
    getGraph().getModel().getParent(getCell()) !== target;

  /**
   * Function: checkPreview
   *
   * Updates the preview if cloning state has changed.
   */
  const checkPreview = () => {
    if (isLivePreviewActive() && isCloning()) {
      resetLivePreview();
      setLivePreviewActive(false);
    } else if (
      getMaxLivePreview() >= getCellCount() &&
      !isLivePreviewActive() &&
      isAllowLivePreview()
    ) {
      if (!isCloning() || !isLivePreviewActive()) {
        setLivePreviewActive(true);
        setLivePreviewUsed(true);
      }
    } else if (!isLivePreviewUsed() && isUnset(getShape())) {
      setShape(createPreviewShape(getBounds()));
    }
  };

  /**
   * Function: mouseMove
   *
   * Handles the event by highlighting possible drop targets and updating the
   * preview.
   */
  const mouseMove = (sender, mE) => {
    const graph = getGraph();

    if (
      !mE.isConsumed() &&
      graph.isMouseDown() &&
      isSet(getCell()) &&
      isSet(getFirst()) &&
      isSet(getBounds()) &&
      !isSuspended()
    ) {
      // Stops moving if a multi touch event is received
      if (Event.isMultiTouchEvent(mE.getEvent())) {
        reset();
        return;
      }

      let delta = getDelta(mE);
      const tol = graph.getTolerance();

      if (
        isSet(getShape()) ||
        isLivePreviewActive() ||
        Math.abs(delta.getX()) > tol ||
        Math.abs(delta.getY()) > tol
      ) {
        // Highlight is used for highlighting drop targets
        if (isUnset(getHighlight())) {
          setHighlight(CellHighlight(graph, DROP_TARGET_COLOR, 3));
        }

        const clone =
          graph.isCloneEvent(mE.getEvent()) &&
          graph.isCellsCloneable() &&
          isCloneEnabled();
        const gridEnabled = graph.isGridEnabledEvent(mE.getEvent());
        const cell = mE.getCell();
        let hideGuide = true;
        let target = null;
        setCloning(clone);

        if (graph.isDropEnabled() && isHighlightEnabled()) {
          // Contains a call to getCellAt to find the cell under the mouse
          target = graph.getDropTarget(_getCells(), mE.getEvent(), cell, clone);
        }

        let state = graph.getView().getState(target);
        let highlight = false;

        if (isSet(state) && (clone || isValidDropTarget(target, mE))) {
          if (getTarget() !== target) {
            setTarget(target);
            setHighlightColor(DROP_TARGET_COLOR);
          }

          highlight = true;
        } else {
          setTarget();

          if (
            isConnectOnDrop() &&
            isSet(cell) &&
            _getCells().length === 1 &&
            graph.getModel().isVertex(cell) &&
            graph.isCellConnectable(cell)
          ) {
            state = graph.getView().getState(cell);

            if (isSet(state)) {
              const error = graph.getEdgeValidationError(null, getCell(), cell);
              const color = isUnset(getError())
                ? VALID_COLOR
                : INVALID_CONNECT_TARGET_COLOR;
              setHighlightColor(color);
              highlight = true;
            }
          }
        }

        if (isSet(state) && highlight) {
          getHighlight().highlight(state);
        } else {
          getHighlight().hide();
        }

        if (isSet(getGuide()) && useGuidesForEvent(mE)) {
          delta = getGuide().move(getBounds(), delta, gridEnabled, clone);
          hideGuide = false;
        } else {
          delta = graph.snapDelta(
            delta,
            getBounds(),
            !gridEnabled,
            false,
            false
          );
        }

        if (isSet(getGuide()) && hideGuide) {
          getGuide().hide();
        }

        // Constrained movement if shift key is pressed
        if (graph.isConstrainedEvent(mE.getEvent())) {
          if (Math.abs(delta.getX()) > Math.abs(delta.getY())) {
            delta.setY(0);
          } else {
            delta.setX(0);
          }
        }

        checkPreview();

        if (
          getCurrentDx() !== delta.getX() ||
          getCurrentDy() !== delta.getY()
        ) {
          setCurrentDx(delta.getX());
          setCurrentDy(delta.getY());
          updatePreview();
        }
      }

      updateHint(mE);
      consumeMouseEvent(Event.MOUSE_MOVE, mE);

      // Cancels the bubbling of events to the container so
      // that the droptarget is not reset due to an mouseMove
      // fired on the container with no associated state.
      Event.consume(mE.getEvent());
    } else if (
      (isMoveEnabled() || isCloneEnabled()) &&
      isUpdateCursor() &&
      !mE.isConsumed() &&
      (isSet(mE.getState()) || isSet(mE.getSourceState())) &&
      !graph.isMouseDown()
    ) {
      let cursor = graph.getCursorForMouseEvent(mE);

      if (
        isUnset(cursor) &&
        graph.isEnabled() &&
        graph.isCellMovable(mE.getCell())
      ) {
        if (graph.getModel().isEdge(mE.getCell())) {
          cursor = CURSOR_MOVABLE_EDGE;
        } else {
          cursor = CURSOR_MOVABLE_VERTEX;
        }
      }

      // Sets the cursor on the original source state under the mouse
      // instead of the event source state which can be the parent
      if (isSet(cursor) && isSet(mE.getSourceState())) {
        mE.getSourceState().setCursor(cursor);
      }
    }
  };

  /**
   * Function: updatePreview
   *
   * Updates the bounds of the preview shape.
   */
  const updatePreview = (remote) => {
    if (isLivePreviewUsed() && !remote) {
      if (isSet(_getCells())) {
        setHandlesVisibleForCells(
          getGraph().getSelectionCellsHandler().getHandledSelectionCells(),
          false
        );
        updateLivePreview(getCurrentDx(), getCurrentDy());
      }
    } else {
      updatePreviewShape();
    }
  };

  /**
   * Function: updatePreviewShape
   *
   * Updates the bounds of the preview shape.
   */
  const updatePreviewShape = () => {
    const shape = getShape();
    const pBounds = getPBounds();

    if (isSet(shape) && isSet(pBounds)) {
      shape.setBounds(
        Rectangle(
          Math.round(pBounds.getX() + getCurrentDx()),
          Math.round(pBounds.getY() + getCurrentDy()),
          pBounds.getWidth(),
          pBounds.getHeight()
        )
      );
      shape.redraw();
    }
  };

  /**
   * Function: updateLivePreview
   *
   * Updates the bounds of the preview shape.
   */
  const updateLivePreview = (dx, dy) => {
    const graph = getGraph();

    if (!isSuspended()) {
      const states = [];
      const allCells = getAllCells();

      if (isSet(allCells)) {
        allCells.visit((key, state) => {
          const realState = graph.getView().getState(state.getCell());

          // Checks if cell was removed or replaced
          if (realState !== state) {
            state.destroy();

            if (isSet(realState)) {
              allCells.put(state.getCell(), realState);
            } else {
              allCells.remove(state.getCell());
            }

            state = realState;
          }

          if (isSet(state)) {
            // Saves current state
            const tempState = state.clone();
            states.push([state, tempState]);
            const shape = state.getShape();
            const text = state.getText();

            // Makes transparent for events to detect drop targets
            if (isSet(shape)) {
              if (isUnset(shape.isOriginalPointerEvents())) {
                shape.setOriginalPointerEvents(shape.isPointerEvents());
              }

              shape.setPointerEvents(false);

              if (isSet(text)) {
                if (isUnset(text.isOriginalPointerEvents())) {
                  text.setOriginalPointerEvents(text.isPointerEvents());
                }

                text.setPointerEvents(false);
              }
            }

            // Temporarily changes position
            if (graph.getModel().isVertex(state.getCell())) {
              state.setX(state.getX() + dx);
              state.setY(state.getY() + dy);

              // Draws the live preview
              if (!isCloning()) {
                state
                  .getView()
                  .getGraph()
                  .getCellRenderer()
                  .redraw(state, true);

                // Forces redraw of connected edges after all states
                // have been updated but avoids update of state
                state.getView().invalidate(state.getCell());
                state.setInvalid(false);

                // Hides folding icon
                if (
                  isSet(state.getControl()) &&
                  isSet(state.getControl().getNode())
                ) {
                  state.getControl().getNode().style.visibility = 'hidden';
                }
              }
              // Clone live preview may use text bounds
              else if (isSet(text)) {
                text.updateBoundingBox();

                // Fixes preview box for edge labels
                if (isSet(text.getBoundingBox())) {
                  text.getBoundingBox().setX(text.getBoundingBox().getX() + dx);
                  text.getBoundingBox().setY(text.getBoundingBox().getY() + dy);
                }

                if (isSet(text.getUnrotatedBoundingBox())) {
                  text
                    .getUnrotatedBoundingBox()
                    .setX(text.getUnrotatedBoundingBox().getX() + dx);
                  text
                    .getUnrotatedBoundingBox()
                    .setY(text.getUnrotatedBoundingBox().getY() + dy);
                }
              }
            }
          }
        });
      }

      // Resets the handler if everything was removed
      if (states.length === 0) {
        reset();
      } else {
        // Redraws connected edges
        const s = graph.getView().getScale();

        for (let i = 0; i < states.length; i++) {
          const state = states[i][0];

          if (graph.getModel().isEdge(state.getCell())) {
            const geometry = graph.getCellGeometry(state.getCell());
            const points = [];

            if (isSet(geometry) && isSet(geometry.getPoints())) {
              for (let j = 0; j < geometry.points.length; j++) {
                if (isSet(geometry.getPoints()[j])) {
                  points.push(
                    Point(
                      geometry.getPoints()[j].getX() + dx / s,
                      geometry.getPoints()[j].getY() + dy / s
                    )
                  );
                }
              }
            }

            let source = state.getVisibleSourceState();
            let target = state.getVisibleTargetState();
            const pts = states[i][1].getAbsolutePoints();

            if (isUnset(source) || !isCellMoving(source.getCell())) {
              const pt0 = pts[0];
              state.setAbsoluteTerminalPoint(
                Point(pt0.getX() + dx, pt0.getY() + dy),
                true
              );
              source = null;
            } else {
              state
                .getView()
                .updateFixedTerminalPoint(
                  state,
                  source,
                  true,
                  graph.getConnectionConstraint(state, source, true)
                );
            }

            if (isUnset(target) || !isCellMoving(target.getCell())) {
              const ptn = pts[pts.length - 1];
              state.setAbsoluteTerminalPoint(
                Point(ptn.getX() + dx, ptn.getY() + dy),
                false
              );
              target = null;
            } else {
              state
                .getView()
                .updateFixedTerminalPoint(
                  state,
                  target,
                  false,
                  graph.getConnectionConstraint(state, target, false)
                );
            }

            state.getView().updatePoints(state, points, source, target);
            state.getView().updateFloatingTerminalPoints(state, source, target);
            state.getView().updateEdgeLabelOffset(state);
            state.setInvalid(false);

            // Draws the live preview but avoids update of state
            if (!isCloning()) {
              state.getView().getGraph().getCellRenderer().redraw(state, true);
            }
          }
        }

        graph.getView().validate();
        redrawHandles(states);
        resetPreviewStates(states);
      }
    }
  };

  /**
   * Function: redrawHandles
   *
   * Redraws the preview shape for the given states array.
   */
  const redrawHandles = (states) => {
    for (let i = 0; i < states.length; i++) {
      const handler = getGraph()
        .getSelectionCellsHandler()
        .getHandler(states[i][0].getCell());

      if (isSet(handler)) {
        handler.redraw(true);
      }
    }
  };

  /**
   * Function: resetPreviewStates
   *
   * Resets the given preview states array.
   */
  const resetPreviewStates = (states) => {
    for (let i = 0; i < states.length; i++) {
      states[i][0].setState(states[i][1]);
    }
  };

  /**
   * Function: suspend
   *
   * Suspends the livew preview.
   */
  const suspend = () => {
    if (!isSuspended()) {
      if (isLivePreviewUsed()) {
        updateLivePreview(0, 0);
      }

      if (isSet(getShape())) {
        getShape().getNode().style.visibility = 'hidden';
      }

      if (isSet(getGuide())) {
        getGuide().setVisible(false);
      }

      setSuspended(true);
    }
  };

  /**
   * Function: resume
   *
   * Suspends the livew preview.
   */
  const resume = () => {
    if (isSuspended()) {
      setSuspended();

      if (isLivePreviewUsed()) {
        setLivePreviewActive(true);
      }

      if (isSet(getShape())) {
        getShape().getNode().style.visibility = 'visible';
      }

      if (isSet(getGuide())) {
        getGuide().setVisible(true);
      }
    }
  };

  /**
   * Function: resetLivePreview
   *
   * Resets the livew preview.
   */
  const resetLivePreview = () => {
    const allCells = getAllCells();

    if (isSet(allCells)) {
      allCells.visit((key, state) => {
        const shape = state.getShape();
        const text = state.getText();
        const control = state.getControl();

        // Restores event handling
        if (isSet(shape) && isSet(shape.getOriginalPointerEvents())) {
          shape.setPointerEvents(shape.getOriginalPointerEvents());
          shape.setOriginalPointerEvents();

          // Forces repaint even if not moved to update pointer events
          shape.setBounds();

          if (isSet(text)) {
            text.setPointerEvents(text.getOriginalPointerEvents());
            text.setOriginalPointerEvents();
          }
        }

        // Shows folding icon
        if (
          isSet(control) &&
          isSet(control.getNode()) &&
          control.getNode().style.visibility === 'hidden'
        ) {
          control.getNode().style.visibility = '';
        }

        // Fixes preview box for edge labels
        if (!isCloning()) {
          if (isSet(text)) {
            text.updateBoundingBox();
          }
        }

        // Forces repaint of connected edges
        state.getView().invalidate(state.getCell());
      });

      // Repaints all invalid states
      getGraph().getView().validate();
    }
  };

  /**
   * Function: setHandlesVisibleForCells
   *
   * Sets wether the handles attached to the given cells are visible.
   *
   * Parameters:
   *
   * cells - Array of <mxCells>.
   * visible - Boolean that specifies if the handles should be visible.
   * force - Forces an update of the handler regardless of the last used value.
   */
  const setHandlesVisibleForCells = (cells, visible, force) => {
    if (force || isHandlesVisible() !== visible) {
      setHandlesVisible(visible);

      for (let i = 0; i < cells.length; i++) {
        const handler = getGraph()
          .getSelectionCellsHandler()
          .getHandler(cells[i]);

        if (isSet(handler)) {
          handler.setHandlesVisible(visible);

          if (visible) {
            handler.redraw();
          }
        }
      }
    }
  };

  /**
   * Function: setHighlightColor
   *
   * Sets the color of the rectangle used to highlight drop targets.
   *
   * Parameters:
   *
   * color - String that represents the new highlight color.
   */
  const setHighlightColor = (color) => {
    if (isSet(getHighlight())) {
      getHighlight().setHighlightColor(color);
    }
  };

  /**
   * Function: mouseUp
   *
   * Handles the event by applying the changes to the selection cells.
   */
  const mouseUp = (sender, mE) => {
    if (!mE.isConsumed()) {
      if (isLivePreviewUsed()) {
        resetLivePreview();
      }

      if (
        isSet(getCell()) &&
        isSet(getFirst()) &&
        (isSet(getShape()) || isLivePreviewUsed()) &&
        isSet(getCurrentDx()) &&
        isSet(getCurrentDy())
      ) {
        const graph = getGraph();
        const cell = mE.getCell();

        if (
          isConnectOnDrop() &&
          isUnset(getTarget()) &&
          isSet(cell) &&
          graph.getModel().isVertex(cell) &&
          graph.isCellConnectable(cell) &&
          graph.isEdgeValid(null, getCell(), cell)
        ) {
          graph.getConnectionHandler().connect(getCell(), cell, mE.getEvent());
        } else {
          const clone =
            graph.isCloneEvent(mE.getEvent()) &&
            graph.isCellsCloneable() &&
            isCloneEnabled();
          const scale = graph.getView().getScale();
          const dx = roundLength(getCurrentDx() / scale);
          const dy = roundLength(getCurrentDy() / scale);
          const target = getTarget();

          if (
            graph.isSplitEnabled() &&
            graph.isSplitTarget(target, _getCells(), mE.getEvent())
          ) {
            graph.splitEdge(
              target,
              _getCells(),
              null,
              dx,
              dy,
              mE.getGraphX(),
              mE.getGraphY()
            );
          } else {
            moveCells(_getCells(), dx, dy, clone, getTarget(), mE.getEvent());
          }
        }
      } else if (
        isSelectEnabled() &&
        _isDelayedSelection() &&
        isSet(getCell())
      ) {
        selectDelayed(mE);
      }
    }

    // Consumes the event if a cell was initially clicked
    if (isCellWasClicked()) {
      consumeMouseEvent(Event.MOUSE_UP, mE);
    }

    reset();
  };

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  const reset = () => {
    if (isLivePreviewUsed()) {
      resetLivePreview();
      setHandlesVisibleForCells(
        getGraph().getSelectionCellsHandler().getHandledSelectionCells(),
        true
      );
    }

    destroyShapes();
    removeHint();

    setDelayedSelection(false);
    setLivePreviewActive();
    setLivePreviewUsed();
    setCellWasClicked(false);
    setSuspended();
    setCurrentDx();
    setCurrentDy();
    setCellCount();
    setCloning(false);
    setAllCells();
    setPBounds();
    setGuides();
    setTarget();
    setFirst();
    setCells();
    setCell();
  };

  /**
   * Function: shouldRemoveCellsFromParent
   *
   * Returns true if the given cells should be removed from the parent for the specified
   * mousereleased event.
   */
  const shouldRemoveCellsFromParent = (parent, cells, evt) => {
    const graph = getGraph();

    if (graph.getModel().isVertex(parent)) {
      const pState = graph.getView().getState(parent);

      if (isSet(pState)) {
        let pt = convertPoint(
          graph.getContainer(),
          Event.getClientX(evt),
          Event.getClientY(evt)
        );
        const alpha = toRadians(
          getValue(pState.getStyle(), STYLE_ROTATION) || 0
        );

        if (alpha !== 0) {
          const cos = Math.cos(-alpha);
          const sin = Math.sin(-alpha);
          const cx = Point(pState.getCenterX(), pState.getCenterY());
          pt = getRotatedPoint(pt, cos, sin, cx);
        }

        return !contains(pState, pt.getX(), pt.getY());
      }
    }

    return false;
  };

  /**
   * Function: moveCells
   *
   * Moves the given cells by the specified amount.
   */
  const moveCells = (cells, dx, dy, clone, target, evt) => {
    const graph = getGraph();

    if (clone) {
      cells = graph.getCloneableCells(cells);
    }

    // Removes cells from parent
    const parent = graph.getModel().getParent(getCell());

    if (
      isUnset(target) &&
      isRemoveCellsFromParent() &&
      shouldRemoveCellsFromParent(parent, cells, evt)
    ) {
      target = graph.getDefaultParent();
    }

    // Cloning into locked cells is not allowed
    clone = clone && !graph.isCellLocked(target || graph.getDefaultParent());

    graph.getModel().beginUpdate();

    try {
      const parents = [];

      // Removes parent if all child cells are removed
      if (!clone && isSet(target) && isRemoveEmptyParents()) {
        // Collects all non-selected parents
        const dict = Dictionary();

        for (let i = 0; i < cells.length; i++) {
          dict.put(cells[i], true);
        }

        // LATER: Recurse up the cell hierarchy
        for (let i = 0; i < cells.length; i++) {
          const par = graph.getModel().getParent(cells[i]);

          if (isSet(par) && !dict.get(par)) {
            dict.put(par, true);
            parents.push(par);
          }
        }
      }

      // Passes all selected cells in order to correctly clone or move into
      // the target cell. The method checks for each cell if its movable.
      cells = graph.moveCells(cells, dx, dy, clone, target, evt);

      // Removes parent if all child cells are removed
      const temp = [];

      for (let i = 0; i < parents.length; i++) {
        if (shouldRemoveParent(parents[i])) {
          temp.push(parents[i]);
        }
      }

      graph.removeCells(temp, false);
    } finally {
      graph.getModel().endUpdate();
    }

    // Selects the new cells if cells have been cloned
    if (clone) {
      graph.setSelectionCells(cells);
    }

    if (isSelectEnabled() && isScrollOnMove()) {
      graph.scrollCellToVisible(cells[0]);
    }
  };

  /**
   * Function: shouldRemoveParent
   *
   * Returns true if the given parent should be removed after removal of child cells.
   */
  const shouldRemoveParent = (parent) => {
    const graph = getGraph();
    const state = graph.getView().getState(parent);

    return (
      isSet(state) &&
      (graph.getModel().isEdge(state.getCell()) ||
        graph.getModel().isVertex(state.getCell())) &&
      graph.isCellDeletable(state.getCell()) &&
      graph.getModel().getChildCount(state.getCell()) === 0 &&
      graph.isTransparentState(state)
    );
  };

  /**
   * Function: destroyShapes
   *
   * Destroy the preview and highlight shapes.
   */
  const destroyShapes = () => {
    // Destroys the preview dashed rectangle
    if (isSet(getShape())) {
      getShape().destroy();
      setShape();
    }

    if (isSet(getGuide())) {
      getGuide().destroy();
      setGuide();
    }

    // Destroys the drop target highlight
    if (isSet(getHighlight())) {
      getHighlight().destroy();
      setHighlight();
    }
  };

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  const destroy = () => {
    const graph = getGraph();

    graph.removeMouseListener(me);
    graph.removeListener(getPanHandler());

    if (isSet(getEscapeHandler())) {
      graph.removeListener(getEscapeHandler());
      setEscapeHandler();
    }

    if (isSet(getRefreshHandler())) {
      graph.getModel().removeListener(getRefreshHandler());
      graph.removeListener(getRefreshHandler());
      setRefreshHandler();
    }

    Event.removeListener(document, 'keydown', getKeyHandler());
    Event.removeListener(document, 'keyup', getKeyHandler());

    destroyShapes();
    removeHint();
  };

  const me = {
    /**
     * Function: isEnabled
     *
     * Returns <enabled>.
     */
    isEnabled,

    /**
     * Function: setEnabled
     *
     * Sets <enabled>.
     */
    setEnabled,

    /**
     * Function: isCloneEnabled
     *
     * Returns <cloneEnabled>.
     */
    isCloneEnabled,

    /**
     * Function: setCloneEnabled
     *
     * Sets <cloneEnabled>.
     *
     * Parameters:
     *
     * value - Boolean that specifies the new clone enabled state.
     */
    setCloneEnabled,

    /**
     * Function: isMoveEnabled
     *
     * Returns <moveEnabled>.
     */
    isMoveEnabled,

    /**
     * Function: setMoveEnabled
     *
     * Sets <moveEnabled>.
     */
    setMoveEnabled,

    /**
     * Function: isSelectEnabled
     *
     * Returns <selectEnabled>.
     */
    isSelectEnabled,

    /**
     * Function: setSelectEnabled
     *
     * Sets <selectEnabled>.
     */
    setSelectEnabled,

    /**
     * Function: isRemoveCellsFromParent
     *
     * Returns <removeCellsFromParent>.
     */
    isRemoveCellsFromParent,

    /**
     * Function: setRemoveCellsFromParent
     *
     * Sets <removeCellsFromParent>.
     */
    setRemoveCellsFromParent,
    isPropagateSelectionCell,
    getInitialCellForEvent,
    isDelayedSelection,
    selectDelayed,
    selectCellForEvent,
    consumeMouseEvent,
    mouseDown,
    getGuideStates,
    getCells,
    getPreviewBounds,
    getBoundingBox,
    createPreviewShape,
    start,
    addStates,
    isCellMoving,
    useGuidesForEvent,
    snap,
    getDelta,
    updateHint,
    removeHint,
    roundLength,
    isValidDropTarget,
    checkPreview,
    mouseMove,
    updatePreview,
    updatePreviewShape,
    updateLivePreview,
    redrawHandles,
    resetPreviewStates,
    suspend,
    resume,
    resetLivePreview,
    setHandlesVisibleForCells,
    setHighlightColor,
    mouseUp,
    reset,
    shouldRemoveCellsFromParent,
    moveCells,
    shouldRemoveParent,
    getMaxCells,
    destroyShapes,
    destroy
  };

  graph.addMouseListener(me);
  graph.addListener(Event.PAN, getPanHandler());
  graph.addListener(Event.ESCAPE, getEscapeHandler());
  graph.getModel().addListener(Event.CHANGE, getRefreshHandler());
  graph.addListener(Event.REFRESH, getRefreshHandler());
  Event.addListener(document, 'keydown', getKeyHandler());
  Event.addListener(document, 'keyup', getKeyHandler());

  return me;
};

export default makeComponent(GraphHandler);
