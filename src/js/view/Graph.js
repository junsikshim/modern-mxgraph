import { IS_IE } from '../Client';
import { addProp, isSet, isUnset } from '../Helpers';
import Cell from '../model/Cell';
import Geometry from '../model/Geometry';
import {
  ChildChange,
  GeometryChange,
  RootChange,
  StyleChange,
  TerminalChange,
  ValueChange
} from '../model/GraphModel';
import {
  ALIGN_MIDDLE,
  PAGE_FORMAT_A4_PORTRAIT,
  STYLE_FILLCOLOR,
  STYLE_IMAGE,
  STYLE_INDICATOR_GRADIENTCOLOR
} from '../util/Constants';
import Dictionary from '../util/Dictionary';
import Event from '../util/Event';
import EventObject from '../util/EventObject';
import EventSource from '../util/EventSource';
import Rectangle from '../util/Rectangle';
import {
  findNearestSegment,
  hasScrollbars,
  parseCssNumber,
  sortCells
} from '../util/Utils';
import GraphView from './GraphView';

const Graph = (container, model, _, stylesheet) => {
  const { fireEvent } = EventSource();

  const [getMouseListeners, setMouseListeners] = addProp();
  const [isMouseDown, setMouseDown] = addProp(false);
  const [getModel, setModel] = addProp();
  const [getView, setView] = addProp();
  const [getStylesheet, setStylesheet] = addProp();
  const [getSelectionModel, setSelectionModel] = addProp();
  const [getCellEditor, setCellEditor] = addProp();
  const [getCellRenderer, setCellRenderer] = addProp();
  const [getMultiplicities, setMultiplicities] = addProp();
  const [getGridSize, setGridSize] = addProp(10);
  const [isGridEnabled, setGridEnabled] = addProp(true);
  const [isPortsEnabled, setPortsEnabled] = addProp(true);
  const [isNativeDblClickEnabled, setNativeDblClickEnabled] = addProp(true);
  const [isDoubleTapEnabled, setDoubleTabEnabled] = addProp(true);
  const [getDoubleTapTimeout, setDoubleTapTimeout] = addProp(500);
  const [getDoubleTapTolerance, setDoubleTapTolerance] = addProp(25);
  const [getLastTouchX, setLastTouchX] = addProp(0);
  const [getLastTouchY, setLastTouchY] = addProp(0);
  const [getLastTouchTime, setLastTouchTime] = addProp(0);
  const [isTapAndHoldEnabled, setTapAndHoldEnabled] = addProp(true);
  const [getTapAndHoldDelay, setTapAndHoldDelay] = addProp(500);
  const [isTapAndHoldInProgress, setTapAndHoldInProgress] = addProp(false);
  const [isTapAndHoldValid, setTapAndHoldValid] = addProp(false);
  const [getInitialTouchX, setInitialTouchX] = addProp(0);
  const [getInitialTouchY, setInitialTouchY] = addProp(0);
  const [getTolerance, setTolerance] = addProp(4);
  const [getDefaultOverlap, setDefaultOverlap] = addProp(0.5);
  const [getDefaultParent, setDefaultParent] = addProp();
  const [getAlternateEdgeStyle, setAlternateEdgeStyle] = addProp();
  const [getBackgroundImage, setBackgroundImage] = addProp();
  const [isPageVisible, setPageVisible] = addProp(false);
  const [isPageBreaksVisible, setPageBreaksVisible] = addProp(false);
  const [getPageBreakColor, setPageBreakColor] = addProp('gray');
  const [isPageBreakDashed, setPageBreakDashed] = addProp(true);
  const [getMinPageBreakDist, setMinPageBreakDist] = addProp(20);
  const [isPreferPageSize, setPreferPageSize] = addProp(false);
  const [getPageFormat, setPageFormat] = addProp(PAGE_FORMAT_A4_PORTRAIT);
  const [getPageScale, setPageScale] = addProp(1.5);
  const [isEnabled, setEnabled] = addProp(true);
  const [isEscapeEnabled, setEscapeEnabled] = addProp(true);
  const [isInvokesStopCellEditing, setInvokesStopCellEditing] = addProp(true);
  const [isEnterStopsCellEditing, setEnterStopsCellEditing] = addProp(false);
  const [isUseScrollBarsForPanning, setUseScrollBarsForPanning] = addProp(true);
  const [isExportEnabled, setExportEnabled] = addProp(true);
  const [isImportEnabled, setImportEnabled] = addProp(true);
  const [isCellsLocked, setCellsLocked] = addProp(false);
  const [isCellsCloneable, setCellsCloneable] = addProp(true);
  const [isFoldingEnabled, setFoldingEnabled] = addProp(true);
  const [isCellsEditable, setCellsEditable] = addProp(true);
  const [isCellsDeletable, setCellsDeletable] = addProp(true);
  const [isCellsMovable, setCellsMovable] = addProp(true);
  const [isEdgeLabelsMovable, setEdgeLabelsMovable] = addProp(true);
  const [isVertexLabelsMovable, setVertexLabelsMovable] = addProp(false);
  const [isDropEnabled, setDropEnabled] = addProp(false);
  const [isSplitEnabled, setSplitEnabled] = addProp(true);
  const [isCellsResizable, setCellsResizable] = addProp(true);
  const [isCellsBendable, setCellsBendable] = addProp(true);
  const [isCellsSelectable, setCellsSelectable] = addProp(true);
  const [isCellsDisconnectable, setCellsDisconnectable] = addProp(true);
  const [isAutoSizeCells, setAutoSizeCells] = addProp(false);
  const [isAutoSizeCellsOnAdd, setAutoSizeCellsOnAdd] = addProp(false);
  const [isAutoScroll, setAutoScroll] = addProp(true);
  const [isIgnoreScrollbars, setIgnoreScrollbars] = addProp(false);
  const [isTranslateToScrollPosition, setTranslateToScrollPosition] = addProp(
    false
  );
  const [isTimerAutoScroll, setTimerAutoScroll] = addProp(false);
  const [isAllowAutoPanning, setAllowAutoPanning] = addProp(false);
  const [isAutoExtend, setAutoExtend] = addProp(true);
  const [getMaximumGraphBounds, setMaximiumGraphBounds] = addProp();
  const [getMinimumGraphSize, setMinimumGraphSize] = addProp();
  const [getMinimumContainerSize, setMinimumContainerSize] = addProp();
  const [getMaximumContainerSize, setMaximumContainerSize] = addProp();
  const [isResizeContainer, setResizeContainer] = addProp(false);
  const [getBorder, setBorder] = addProp(0);
  const [isKeepEdgesInForeground, setKeepEdgesInForeground] = addProp(false);
  const [isKeepEdgesInBackground, setKeepEdgesInBackground] = addProp(false);
  const [isAllowNegativeCoordinates, setAllowNegativeCoordinates] = addProp(
    true
  );
  const [isConstrainChildren, setConstrainChildren] = addProp(true);
  const [isConstrainRelativeChildren, setConstrainRelativeChildren] = addProp(
    false
  );
  const [isExtendParents, setExtendParents] = addProp(true);
  const [isExtendParentsOnAdd, setExtendParentsOnAdd] = addProp(true);
  const [isExtendParentsOnMove, setExtendParentsOnMove] = addProp(false);
  const [isRecursiveResize, setRecursiveResize] = addProp(false);
  const [isCollapseToPreferredSize, setCollapseToPreferredSize] = addProp(true);
  const [getZoomFactor, setZoomFactor] = addProp(1.2);
  const [isKeepSelectionVisibleOnZoom, setKeepSelectionVisibleOnZoom] = addProp(
    false
  );
  const [isCenterZoom, setCenterZoom] = addProp(true);
  const [isResetViewOnRootChange, setResetViewOnRootChange] = addProp(true);
  const [isResetEdgesOnResize, setResetEdgesOnResize] = addProp(false);
  const [isResetEdgesOnMove, setResetEdgesOnMove] = addProp(false);
  const [isResetEdgesOnConnect, setResetEdgesOnConnect] = addProp(true);
  const [isAllowLoops, setAllowLoops] = addProp(false);
  const [getDefaultLoopStyle, setDefaultLoopStyle] = addProp(EdgeStyle.Loop);
  const [isMultigraph, setMultigraph] = addProp(true);
  const [isConnectableEdges, setConnectableEdges] = addProp(false);
  const [isAllowDanglingEdges, setAllowDanglingEdges] = addProp(true);
  const [isCloneInvalidEdges, setCloneInvalidEdges] = addProp(false);
  const [isDisconnectOnMove, setDisconnectOnMove] = addProp(true);
  const [isLabelsVisible, setLabelsVisible] = addProp(true);
  const [isHtmlLabels, setHtmlLabels] = addProp(false);
  const [isSwimlaneSelectionEnabled, setSwimlaneSelectionEnabled] = addProp(
    true
  );
  const [isSwimlaneNesting, setSwimlaneNesting] = addProp(true);
  const [
    getSwimlaneIndicatorColorAttribute,
    setSwimlaneIndicatorColorAttribute
  ] = addProp(STYLE_FILLCOLOR);
  const [getImageBundles, setImageBundles] = addProp();
  const [getMinFitScale, setMinFitScale] = addProp(0.1);
  const [getMaxFitScale, setMaxFitScale] = addProp(8);
  const [getPanDx, setPanDx] = addProp(0);
  const [getPanDy, setPanDy] = addProp(0);
  const [getCollapsedImage, setCollapsedImage] = addProp(
    Image(Client.imageBasePath + '/collapsed.gif', 9, 9)
  );
  const [getExpandedImage, setExpandedImage] = addProp(
    Image(Client.imageBasePath + '/expanded.gif', 9, 9)
  );
  const [getWarningImage, setWarningImage] = addProp(
    Image(Client.imageBasePath + '/warning.png', 16, 16)
  );
  const [getContainer, setContainer] = addProp();
  const [getShiftPreview1, setShiftPreview1] = addProp();
  const [getShiftPreview2, setShiftPreview2] = addProp();

  const init = (container) => {
    setContainer(container);

    // Initializes the in-place editor
    setCellEditor(createCellEditor());

    // Initializes the container using the view
    getView().init();

    // Updates the size of the container for the current graph
    sizeDidChange();

    // Hides tooltips and resets tooltip timer if mouse leaves container
    Event.addListener(container, 'mouseleave', (evt) => {
      if (
        isSet(getTooltipHandler()) &&
        isSet(getTooltipHandler().getDiv()) &&
        getTooltipHandler().getDiv() !== evt.relatedTarget
      ) {
        getTooltipHandler().hide();
      }
    });
  };

  const createHandlers = () => {
    setTooltipHandler(createTooltipHandler());
    getTooltipHandler().setEnabled(false);
    setSelectionCellHandler(createSelectionCellsHandler());
    setConnectionHandler(createConnectionHandler());
    getConnectionHandler().setEnabled(false);
    setGraphHandler(createGraphHandler());
    setPanningHandler(createPanningHandler());
    getPanningHandler().setPanningEnabled(false);
    setPopupMenuHandler(createPopupMenuHandler());
  };

  const createTooltipHandler = () => TooltipHandler(me);

  const createSelectionCellsHandler = () => SelectionCellsHandler(me);

  const createConnectionHandler = () => ConnectionHandler(me);

  const createGraphHandler = () => GraphHandler(me);

  const createPanningHandler = () => PanningHandler(me);

  const createPopupMenuHandler = () => PopupMenuHandler(me);

  const createSelectionModel = () => GraphSelectionModel(me);

  const createStylesheet = () => Stylesheet(me);

  const createGraphView = () => GraphView(me);

  const createCellRenderer = () => CellRenderer(me);

  const createCellEditor = () => CellEditor(me);

  const getSelectionCellsForChanges = (changes, ignoreFn) => {
    const model = getModel();
    const dict = Dictionary();
    const cells = [];

    const addCell = (cell) => {
      if (!dict.get(cell) && model.contains(cell)) {
        if (model.isEdge(cell) || model.isVertex(cell)) {
          dict.put(cell, true);
          cells.push(cell);
        } else {
          const childCount = model.getChildCount(cell);

          for (let i = 0; i < childCount; i++) {
            addCell(model.getChildAt(cell, i));
          }
        }
      }
    };

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];

      if (
        change.constructor !== RootChange &&
        (isUnset(ignoreFn) || !ignoreFn(change))
      ) {
        let cell = null;

        if (change.constructor === ChildChange) {
          cell = change.child;
        } else if (isSet(change.cell) && change.cell.constructor === Cell) {
          cell = change.cell;
        }

        if (isSet(cell)) {
          addCell(cell);
        }
      }
    }

    return cells;
  };

  const graphModelChanged = (changes) => {
    for (let i = 0; i < changes.length; i++) {
      processChange(changes[i]);
    }

    updateSelection();
    getView().validate();
    sizeDidChange();
  };

  const updateSelection = () => {
    const model = getModel();
    const cells = getSelectionCells();
    const removed = [];

    for (let i = 0; i < cells.length; i++) {
      if (!model.contains(cells[i]) || !isCellVisible(cells[i])) {
        removed.push(cells[i]);
      } else {
        let par = model.getParent(cells[i]);

        while (isSet(par) && par !== getView().getCurrentRoot()) {
          if (isCellCollapsed(par) || !isCellVisible(par)) {
            removed.push(cells[i]);
            break;
          }

          par = model.getParent(par);
        }
      }
    }

    removeSelectionCells(removed);
  };

  const processChange = (change) => {
    const view = getView();

    // Resets the view settings, removes all cells and clears
    // the selection if the root changes.
    if (change.constructor === RootChange) {
      clearSelection();
      setDefaultParent();
      removeStateForCell(change.getPrevious());

      if (isResetViewOnRootChange()) {
        view.setScale(1);
        view.getTranslate().setX(0);
        view.getTranslate().setY(0);
      }

      fireEvent(EventObject(Event.ROOT));
    }

    // Adds or removes a child to the view by online invaliding
    // the minimal required portions of the cache, namely, the
    // old and new parent and the child.
    else if (change.constructor === ChildChange) {
      const child = change.getChild();
      const newParent = getModel().getParent(child);
      view.invalidate(child, true, true);

      if (!getModel().contains(newParent) || isCellCollapsed(newParent)) {
        view.invalidate(child, true, true);
        removeStateForCell(child);

        // Handles special case of current root of view being removed
        if (view.getCurrentRoot() === child) {
          home();
        }
      }

      const previous = change.getPrevious();

      if (newParent !== previous) {
        // Refreshes the collapse/expand icons on the parents
        if (isSet(newParent)) {
          view.invalidate(newParent, false, false);
        }

        if (isSet(previous)) {
          view.invalidate(previous, false, false);
        }
      }
    }

    // Handles two special cases where the shape does not need to be
    // recreated from scratch, it only needs to be invalidated.
    else if (
      change.constructor === TerminalChange ||
      change.constructor === GeometryChange
    ) {
      // Checks if the geometry has changed to avoid unnessecary revalidation
      if (
        change.constructor === TerminalChange ||
        (isUnset(change.getPrevious()) && isSet(change.getGeometry())) ||
        (isSet(change.getPrevious()) &&
          !change.getPrevious().equals(change.getGeometry()))
      ) {
        view.invalidate(change.getCell());
      }
    }

    // Handles two special cases where only the shape, but no
    // descendants need to be recreated
    else if (change.constructor === ValueChange) {
      view.invalidate(change.getCell(), false, false);
    }

    // Requires a new mxShape in JavaScript
    else if (change.constructor === StyleChange) {
      view.invalidate(change.getCell(), true, true);
      const state = view.getState(change.getCell());

      if (isSet(state)) {
        state.setInvalidStyle(true);
      }
    }

    // Removes the state from the cache by default
    else if (isSet(change.getCell()) && change.getCell().constructor === Cell) {
      removeStateForCell(change.getCell());
    }
  };

  const removeStateForCell = (cell) => {
    const childCount = getModel().getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      removeStateForCell(getModel().getChildAt(cell, i));
    }

    getView().invalidate(cell, false, true);
    getView().removeState(cell);
  };

  /**
   * Group: Overlays
   */

  const addCellOverlay = (cell, overlay) => {
    if (isUnset(cell.getOverlays())) {
      cell.setOverlays([]);
    }

    cell.getOverlays().push(overlay);

    const state = getView().getState(cell);

    // Immediately updates the cell display if the state exists
    if (isSet(state)) {
      getCellRenderer().redraw(state);
    }

    fireEvent(EventObject(Event.ADD_OVERLAY, 'cell', cell, 'overlay', overlay));

    return overlay;
  };

  const getCellOverlays = (cell) => cell.getOverlays();

  const removeCellOverlay = (cell, overlay) => {
    if (isUnset(overlay)) {
      removeCellOverlays(cell);
    } else {
      const index = cell.getOverlays().indexOf(overlay);

      if (index >= 0) {
        cell.getOverlays().splice(index, 1);

        if (cell.getOverlays().length === 0) {
          cell.setOverlays();
        }

        // Immediately updates the cell display if the state exists
        const state = getView().getState(cell);

        if (isSet(state)) {
          getCellRenderer().redraw(state);
        }

        fireEvent(
          EventObject(Event.REMOVE_OVERLAY, 'cell', cell, 'overlay', overlay)
        );
      } else {
        overlay = null;
      }
    }

    return overlay;
  };

  const removeCellOverlays = (cell) => {
    const overlays = cell.getOverlays();

    if (isSet(overlays)) {
      cell.setOverlays();

      // Immediately updates the cell display if the state exists
      const state = getView().getState(cell);

      if (isSet(state)) {
        getCellRenderer().redraw(state);
      }

      for (let i = 0; i < overlays.length; i++) {
        fireEvent(
          EventObject(
            Event.REMOVE_OVERLAY,
            'cell',
            cell,
            'overlay',
            overlays[i]
          )
        );
      }
    }

    return overlays;
  };

  const clearCellOverlays = (cell = getModel().getRoot()) => {
    removeCellOverlays(cell);

    // Recursively removes all overlays from the children
    const childCount = getModel().getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      const child = getModel().getChildAt(cell, i);
      clearCellOverlays(child); // recurse
    }
  };

  const setCellWarning = (cell, warning, img = getWarningImage(), isSelect) => {
    if (isSet(warning) && warning.length > 0) {
      // Creates the overlay with the image and warning
      const overlay = CellOverlay(
        img,
        '<font color=red>' + warning + '</font>'
      );

      // Adds a handler for single mouseclicks to select the cell
      if (isSelect) {
        overlay.addListener(Event.CLICK, () => {
          if (isEnabled()) {
            setSelectionCell(cell);
          }
        });
      }

      // Sets and returns the overlay in the graph
      return addCellOverlay(cell, overlay);
    } else {
      removeCellOverlays(cell);
    }

    return null;
  };

  /**
   * Group: In-place editing
   */

  const startEditing = (evt) => startEditingAtCell(null, evt);

  const startEditingAtCell = (cell, evt) => {
    if (isUnset(evt) || !Event.isMultiTouchEvent(evt)) {
      if (isUnset(cell)) {
        cell = getSelectionCell();

        if (isSet(cell) && !isCellEditable(cell)) {
          cell = null;
        }
      }

      if (isSet(cell)) {
        fireEvent(EventObject(Event.START_EDITING, 'cell', cell, 'event', evt));
        cellEditor.startEditing(cell, evt);
        fireEvent(
          EventObject(Event.EDITING_STARTED, 'cell', cell, 'event', evt)
        );
      }
    }
  };

  const getEditingValue = (cell, evt) => convertValueToString(cell);

  const stopEditing = (cancel) => {
    getCellEditor().stopEditing(cancel);
    fireEvent(EventObject(Event.EDITING_STOPPED, 'cancel', cancel));
  };

  const labelChanged = (cell, value, evt) => {
    getModel().beginUpdate();

    try {
      const old = cell.getValue();
      cellLabelChanged(cell, value, isAutoSizeCell(cell));
      fireEvent(
        EventObject(
          Event.LABEL_CHANGED,
          'cell',
          cell,
          'value',
          value,
          'old',
          old,
          'event',
          evt
        )
      );
    } finally {
      getModel().endUpdate();
    }

    return cell;
  };

  const cellLabelChanged = (cell, value, autoSize) => {
    getModel().beginUpdate();
    try {
      getModel().setValue(cell, value);

      if (autoSize) {
        cellSizeUpdated(cell, false);
      }
    } finally {
      getModel().endUpdate();
    }
  };

  const escape = (evt) => fireEvent(EventObject(Event.ESCAPE, 'event', evt));

  const click = (mE) => {
    const evt = mE.getEvent();
    const cell = mE.getCell();
    const mxe = EventObject(Event.CLICK, 'event', evt, 'cell', cell);

    if (mE.isConsumed()) {
      mxe.consume();
    }

    fireEvent(mxe);

    if (isEnabled() && !Event.isConsumed(evt) && !mxe.isConsumed()) {
      if (isSet(cell)) {
        if (isTransparentClickEvent(evt)) {
          let active = false;

          const tmp = getCellAt(
            mE.getGraphX(),
            mE.getGraphY(),
            null,
            null,
            null,
            (state) => {
              const selected = isCellSelected(state.getCell());
              active = active || selected;

              return (
                !active ||
                selected ||
                (state.getCell() !== cell &&
                  getModel().isAncestor(state.getCell(), cell))
              );
            }
          );

          if (isSet(tmp)) {
            cell = tmp;
          }
        }
      } else if (isSwimlaneSelectionEnabled()) {
        cell = getSwimlaneAt(mE.getGraphX(), mE.getGraphY());

        if (isSet(cell) && (!isToggleEvent(evt) || !Event.isAltDown(evt))) {
          let temp = cell;
          const swimlanes = [];

          while (isSet(temp)) {
            temp = getModel().getParent(temp);
            const state = getView().getState(temp);

            if (isSwimlane(temp) && isSet(state)) {
              swimlanes.push(temp);
            }
          }

          // Selects ancestors for selected swimlanes
          if (swimlanes.length > 0) {
            swimlanes = swimlanes.reverse();
            swimlanes.splice(0, 0, cell);
            swimlanes.push(cell);

            for (let i = 0; i < swimlanes.length - 1; i++) {
              if (isCellSelected(swimlanes[i])) {
                cell = swimlanes[isToggleEvent(evt) ? i : i + 1];
              }
            }
          }
        }
      }

      if (isSet(cell)) {
        selectCellForEvent(cell, evt);
      } else if (!isToggleEvent(evt)) {
        clearSelection();
      }
    }
  };

  const isSiblingSelected = (cell) => {
    const model = getModel();
    const parent = model.getParent(cell);
    const childCount = model.getChildCount(parent);

    for (let i = 0; i < childCount; i++) {
      const child = model.getChildAt(parent, i);

      if (cell !== child && isCellSelected(child)) {
        return true;
      }
    }

    return false;
  };

  const dblClick = (evt, cell) => {
    const mxe = EventObject(Event.DOUBLE_CLICK, 'event', evt, 'cell', cell);
    fireEvent(mxe);

    // Handles the event if it has not been consumed
    if (
      isEnabled() &&
      !Event.isConsumed(evt) &&
      !mxe.isConsumed() &&
      isSet(cell) &&
      isCellEditable(cell) &&
      !isEditing(cell)
    ) {
      startEditingAtCell(cell, evt);
      Event.consume(evt);
    }
  };

  const tapAndHold = (mE) => {
    const evt = mE.getEvent();
    const mxe = EventObject(
      Event.TAP_AND_HOLD,
      'event',
      evt,
      'cell',
      mE.getCell()
    );

    // LATER: Check if event should be consumed if me is consumed
    fireEvent(mxe);

    if (mxe.isConsumed()) {
      // Resets the state of the panning handler
      getPanningHandler().setPanningTrigger(false);
    }

    // Handles the event if it has not been consumed
    if (
      isEnabled() &&
      !Event.isConsumed(evt) &&
      !mxe.isConsumed() &&
      getConnectionHandler().isEnabled()
    ) {
      const connectionHandler = getConnectionHandler();
      const marker = connectionHandler.getMarker();
      const state = getView().getState(marker.getCell(mE));

      if (isSet(state)) {
        marker.setCurrentColor(marker.getValidColor());
        marker.setMarkedState(state);
        marker.mark();

        connectionHandler.setFirst(Point(mE.getGraphX(), mE.getGraphY()));
        connectionHandler.setEdgeState(connectionHandler.createEdgeState(mE));
        connectionHandler.setPrevious(state);
        connectionHandler.fireEvent(
          EventObject(Event.START, 'state', connectionHandler.getPrevious())
        );
      }
    }
  };

  const scrollPointToVisible = (x, y, extend, border = 20) => {
    if (
      !isTimerAutoScroll() &&
      (isIgnoreScrollbars() || hasScrollbars(getContainer()))
    ) {
      const c = getContainer();

      if (
        x >= c.scrollLeft &&
        y >= c.scrollTop &&
        x <= c.scrollLeft + c.clientWidth &&
        y <= c.scrollTop + c.clientHeight
      ) {
        const dx = c.scrollLeft + c.clientWidth - x;

        if (dx < border) {
          const old = c.scrollLeft;
          c.scrollLeft += border - dx;

          // Automatically extends the canvas size to the bottom, right
          // if the event is outside of the canvas and the edge of the
          // canvas has been reached. Notes: Needs fix for IE.
          if (extend && old === c.scrollLeft) {
            const root = getView().getDrawPane().ownerSVGElement;
            const width = c.scrollWidth + border - dx;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            root.style.setWidth(width + 'px');

            c.scrollLeft += border - dx;
          }
        } else {
          dx = x - c.scrollLeft;

          if (dx < border) {
            c.scrollLeft -= border - dx;
          }
        }

        const dy = c.scrollTop + c.clientHeight - y;

        if (dy < border) {
          const old = c.scrollTop;
          c.scrollTop += border - dy;

          if (old === c.scrollTop && extend) {
            const root = getView().getDrawPane().ownerSVGElement;
            const height = c.scrollHeight + border - dy;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            root.style.height = height + 'px';

            c.scrollTop += border - dy;
          }
        } else {
          dy = y - c.scrollTop;

          if (dy < border) {
            c.scrollTop -= border - dy;
          }
        }
      }
    } else if (isAllowAutoPanning() && !getPanningHandler().isActive()) {
      if (isUnset(getPanningManager())) {
        setPanningManager(createPanningManager());
      }

      getPanningManager().panTo(x + getPanDx(), y + getPanDy());
    }
  };

  const createPanningManager = () => PanningManager(me);

  const getBorderSizes = () => {
    const css = getCurrentStyle(getContainer());

    return Rectangle(
      parseCssNumber(css.paddingLeft) +
        (css.borderLeftStyle !== 'none'
          ? parseCssNumber(css.borderLeftWidth)
          : 0),
      parseCssNumber(css.paddingTop) +
        (css.borderTopStyle !== 'none'
          ? parseCssNumber(css.borderTopWidth)
          : 0),
      parseCssNumber(css.paddingRight) +
        (css.borderRightStyle !== 'none'
          ? parseCssNumber(css.borderRightWidth)
          : 0),
      parseCssNumber(css.paddingBottom) +
        (css.borderBottomStyle !== 'none'
          ? parseCssNumber(css.borderBottomWidth)
          : 0)
    );
  };

  const getPreferredPageSize = (bounds, width, height) => {
    const tr = getView().getTranslate();
    const fmt = getPageFormat();
    const ps = getPageScale();
    const page = Rectangle(
      0,
      0,
      Math.ceil(fmt.getWidth() * ps),
      Math.ceil(fmt.getHeight() * ps)
    );

    const hCount = isPageBreaksVisible()
      ? Math.ceil(width / page.getWidth())
      : 1;
    const vCount = isPageBreaksVisible()
      ? Math.ceil(height / page.getHeight())
      : 1;

    return Rectangle(
      0,
      0,
      hCount * page.getWidth() + 2 + tr.getX(),
      vCount * page.getHeight() + 2 + tr.getY()
    );
  };

  const fit = (
    border = getBorder(),
    keepOrigin = false,
    margin = 0,
    enabled = true,
    ignoreWidth = false,
    ignoreHeight = false,
    maxHeight
  ) => {
    const container = getContainer();
    const view = getView();

    if (isSet(container)) {
      // Adds spacing and border from css
      const cssBorder = getBorderSizes();
      let w1 =
        container.offsetWidth - cssBorder.getX() - cssBorder.getWidth() - 1;
      let h1 = isSet(maxHeight)
        ? maxHeight
        : container.offsetHeight - cssBorder.getY() - cssBorder.getHeight() - 1;
      let bounds = view.getGraphBounds();

      if (bounds.getWidth() > 0 && bounds.getHeight() > 0) {
        if (keepOrigin && isSet(bounds.getX()) && isSet(bounds.getY())) {
          bounds = bounds.clone();
          bounds.setWidth(bounds.getWidth() + bounds.getX());
          bounds.setHeight(bounds.getHeight() + bounds.getY());
          bounds.setX(0);
          bounds.setY(0);
        }

        // LATER: Use unscaled bounding boxes to fix rounding errors
        const s = view.getScale();
        let w2 = bounds.getWidth() / s;
        let h2 = bounds.getHeight() / s;

        // Fits to the size of the background image if required
        if (isSet(getBackgroundImage())) {
          w2 = Math.max(
            w2,
            getBackgroundImage().getWidth() - bounds.getX() / s
          );
          h2 = Math.max(
            h2,
            getBackgroundImage().getHeight() - bounds.getY() / s
          );
        }

        const b = (keepOrigin ? border : 2 * border) + margin + 1;

        w1 -= b;
        h1 -= b;

        let s2 = ignoreWidth
          ? h1 / h2
          : ignoreHeight
          ? w1 / w2
          : Math.min(w1 / w2, h1 / h2);

        if (isSet(getMinFitScale())) {
          s2 = Math.max(s2, getMinFitScale());
        }

        if (isSet(getMaxFitScale())) {
          s2 = Math.min(s2, getMaxFitScale());
        }

        if (enabled) {
          if (!keepOrigin) {
            if (!hasScrollbars(container)) {
              const x0 = isSet(bounds.getX())
                ? Math.floor(
                    view.getTranslate().getX() -
                      bounds.getX() / s +
                      border / s2 +
                      margin / 2
                  )
                : border;
              const y0 = isSet(bounds.getY())
                ? Math.floor(
                    view.getTranslate().getY() -
                      bounds.getY() / s +
                      border / s2 +
                      margin / 2
                  )
                : border;

              view.scaleAndTranslate(s2, x0, y0);
            } else {
              view.setScale(s2);
              const b2 = getGraphBounds();

              if (isSet(b2.getX())) {
                container.scrollLeft = b2.getX();
              }

              if (isSet(b2.getY())) {
                container.scrollTop = b2.getY();
              }
            }
          } else if (view.getScale() !== s2) {
            view.setScale(s2);
          }
        } else {
          return s2;
        }
      }
    }

    return view.getScale();
  };

  const sizeDidChange = () => {
    const view = getView();
    const bounds = getGraphBounds();
    const scale = view.getScale();

    if (isSet(getContainer())) {
      const border = this.getBorder();

      let width = Math.max(0, bounds.getX()) + bounds.getWidth() + 2 * border;
      let height = Math.max(0, bounds.getY()) + bounds.getHeight() + 2 * border;

      if (isSet(getMinimumContainerSize())) {
        width = Math.max(width, getMinimumContainerSize().getWidth());
        height = Math.max(height, getMinimumContainerSize().getHeight());
      }

      if (isResizeContainer()) {
        doResizeContainer(width, height);
      }

      if (isPreferPageSize() || (!IS_IE && isPageVisible())) {
        const size = getPreferredPageSize(
          bounds,
          Math.max(1, width),
          Math.max(1, height)
        );

        if (isSet(size)) {
          width = size.getWidth() * scale;
          height = size.getHeight() * scale;
        }
      }

      if (isSet(getMinimumGraphSize())) {
        width = Math.max(width, getMinimumGraphSize().getWidth() * scale);
        height = Math.max(height, getMinimumGraphSize().getHeight() * scale);
      }

      width = Math.ceil(width);
      height = Math.ceil(height);

      const root = view.getDrawPane().ownerSVGElement;

      if (isSet(root)) {
        root.style.minWidth = Math.max(1, width) + 'px';
        root.style.minHeight = Math.max(1, height) + 'px';
        root.style.width = '100%';
        root.style.height = '100%';
      }

      updatePageBreaks(isPageBreaksVisible(), width, height);
    }

    fireEvent(EventObject(Event.SIZE, 'bounds', bounds));
  };

  const doResizeContainer = (width, height) => {
    if (isSet(getMaximumContainerSize())) {
      width = Math.min(getMaximumContainerSize().getWidth(), width);
      height = Math.min(getMaximumContainerSize().getHeight(), height);
    }

    getContainer().style.width = Math.ceil(width) + 'px';
    getContainer().style.height = Math.ceil(height) + 'px';
  };

  const updatePageBreaks = (visible, width, height) => {
    const view = getView();
    const scale = view.getScale();
    const tr = view.getTranslate();
    const fmt = getPageFormat();
    const ps = scale * getPageScale();
    const bounds = Rectangle(0, 0, fmt.getWidth() * ps, fmt.getHeight() * ps);

    const gb = Rectangle.fromRectangle(getGraphBounds());
    gb.setWidth(Math.max(1, gb.getWidth()));
    gb.setHeight(Math.max(1, gb.getHeight()));

    bounds.setX(
      Math.floor((gb.getX() - tr.getX() * scale) / bounds.getWidth()) *
        bounds.getWidth() +
        tr.getX() * scale
    );
    bounds.setY(
      Math.floor((gb.getY() - tr.getY() * scale) / bounds.getHeight()) *
        bounds.getHeight() +
        tr.getY() * scale
    );

    gb.setWidth(
      Math.ceil(
        (gb.getWidth() + (gb.getX() - bounds.getX())) / bounds.getWidth()
      ) * bounds.getWidth()
    );
    gb.setHeight(
      Math.ceil(
        (gb.getHeight() + (gb.getY() - bounds.getY())) / bounds.getHeight()
      ) * bounds.getHeight()
    );

    // Does not show page breaks if the scale is too small
    visible =
      visible &&
      Math.min(bounds.getWidth(), bounds.getHeight()) > getMinPageBreakDist();

    const horizontalCount = visible
      ? Math.ceil(gb.getHeight() / bounds.getHeight()) + 1
      : 0;
    const verticalCount = visible
      ? Math.ceil(gb.getWidth() / bounds.getWidth()) + 1
      : 0;
    const right = (verticalCount - 1) * bounds.getWidth();
    const bottom = (horizontalCount - 1) * bounds.getHeight();

    if (isUnset(getHorizontalPageBreaks()) && horizontalCount > 0) {
      setHorizontalPageBreaks([]);
    }

    if (isUnset(getVerticalPageBreaks()) && verticalCount > 0) {
      setVerticalPageBreaks([]);
    }

    const drawPageBreaks = (breaks) => {
      if (isSet(breaks)) {
        const count =
          breaks === getHorizontalPageBreaks()
            ? horizontalCount
            : verticalCount;

        for (let i = 0; i <= count; i++) {
          const pts =
            breaks === getHorizontalPageBreaks()
              ? [
                  Point(
                    Math.round(bounds.getX()),
                    Math.round(bounds.getY() + i * bounds.getHeight())
                  ),
                  Point(
                    Math.round(bounds.getX() + right),
                    Math.round(bounds.getY() + i * bounds.getHeight())
                  )
                ]
              : [
                  Point(
                    Math.round(bounds.getX() + i * bounds.getWidth()),
                    Math.round(bounds.getY())
                  ),
                  Point(
                    Math.round(bounds.getX() + i * bounds.getWidth()),
                    Math.round(bounds.getY() + bottom)
                  )
                ];

          if (isSet(breaks[i])) {
            breaks[i].setPoints(pts);
            breaks[i].redraw();
          } else {
            const pageBreak = Polyline(pts, getPageBreakColor());
            pageBreak.setPointerEvents(false);
            pageBreak.setDashed(isPageBreakDashed());
            pageBreak.init(view.getBackgroundPane());
            pageBreak.redraw();

            breaks[i] = pageBreak;
          }
        }

        for (let i = count; i < breaks.length; i++) {
          breaks[i].destroy();
        }

        breaks.splice(count, breaks.length - count);
      }
    };

    drawPageBreaks(getHorizontalPageBreaks());
    drawPageBreaks(getVerticalPageBreaks());
  };

  /**
   * Group: Cell styles
   */

  const getCurrentCellStyle = (cell, ignoreState) => {
    const state = ignoreState ? null : getView().getState(cell);

    return isSet(state) ? state.getStyle() : getCellStyle(cell);
  };

  const getCellStyle = (cell) => {
    const stylename = getModel().getStyle(cell);
    const stylesheet = getStylesheet();
    let style = null;

    // Gets the default style for the cell
    if (getModel().isEdge(cell)) {
      style = stylesheet.getDefaultEdgeStyle();
    } else {
      style = stylesheet.getDefaultVertexStyle();
    }

    // Resolves the stylename using the above as the default
    if (isSet(stylename)) {
      style = postProcessCellStyle(stylesheet.getCellStyle(stylename, style));
    }

    // Returns a non-null value if no style can be found
    if (isUnset(style)) {
      style = {};
    }

    return style;
  };

  const postProcessCellStyle = (style) => {
    if (isSet(style)) {
      const key = style[STYLE_IMAGE];
      let image = getImageFromBundles(key);

      if (isSet(image)) {
        style[STYLE_IMAGE] = image;
      } else {
        image = key;
      }

      // Converts short data uris to normal data uris
      if (isSet(image) && image.substring(0, 11) === 'data:image/') {
        if (image.substring(0, 20) === 'data:image/svg+xml,<') {
          // Required for FF and IE11
          image =
            image.substring(0, 19) + encodeURIComponent(image.substring(19));
        } else if (image.substring(0, 22) !== 'data:image/svg+xml,%3C') {
          const comma = image.indexOf(',');

          // Adds base64 encoding prefix if needed
          if (
            comma > 0 &&
            image.substring(comma - 7, comma + 1) !== ';base64,'
          ) {
            image =
              image.substring(0, comma) +
              ';base64,' +
              image.substring(comma + 1);
          }
        }

        style[STYLE_IMAGE] = image;
      }
    }

    return style;
  };

  const setCellStyle = (style, cells = getSelectionCells()) => {
    if (isSet(cells)) {
      getModel().beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          getModel().setStyle(cells[i], style);
        }
      } finally {
        getModel().endUpdate();
      }
    }
  };

  const toggleCellStyle = (key, defaultValue, cell = getSelectionCell()) =>
    toggleCellStyles(key, defaultValue, [cell]);

  const toggleCellStyles = (
    key,
    defaultValue = false,
    cells = getSelectionCells()
  ) => {
    let value = null;

    if (isSet(cells) && cells.length > 0) {
      const style = getCurrentCellStyle(cells[0]);
      value = getValue(style, key, defaultValue) ? 0 : 1;
      setCellStyles(key, value, cells);
    }

    return value;
  };

  const setCellStyles = (key, value, cells = getSelectionCells()) =>
    setCellStyles(getModel(), cells, key, value);

  const toggleCellStyleFlags = (key, flag, cells) =>
    setCellStyleFlags(key, flag, null, cells);

  const setCellStyleFlags = (key, flag, value, cells = getSelectionCells()) => {
    if (isSet(cells) && cells.length > 0) {
      if (isUnset(value)) {
        const style = getCurrentCellStyle(cells[0]);
        const current = parseInt(style[key] || 0);
        value = !((current & flag) == flag);
      }

      setCellStyleFlags(getModel(), cells, key, flag, value);
    }
  };

  /**
   * Group: Cell alignment and orientation
   */

  const alignCells = (align, cells = getSelectionCells(), param) => {
    if (isSet(cells) && cells.length > 1) {
      // Finds the required coordinate for the alignment
      if (isUnset(param)) {
        for (let i = 0; i < cells.length; i++) {
          const state = getView().getState(cells[i]);

          if (isSet(state) && !getModel().isEdge(cells[i])) {
            if (isUnset(param)) {
              if (align === ALIGN_CENTER) {
                param = state.getX() + state.getWidth() / 2;
                break;
              } else if (align === ALIGN_RIGHT) {
                param = state.getX() + state.getWidth();
              } else if (align === ALIGN_TOP) {
                param = state.getY();
              } else if (align === ALIGN_MIDDLE) {
                param = state.getY() + state.getHeight() / 2;
                break;
              } else if (align === ALIGN_BOTTOM) {
                param = state.getY() + state.getHeight();
              } else {
                param = state.getX();
              }
            } else {
              if (align === ALIGN_RIGHT) {
                param = Math.max(param, state.getX() + state.getWidth());
              } else if (align === ALIGN_TOP) {
                param = Math.min(param, state.getY());
              } else if (align === ALIGN_BOTTOM) {
                param = Math.max(param, state.getY() + state.getHeight());
              } else {
                param = Math.min(param, state.getX());
              }
            }
          }
        }
      }

      // Aligns the cells to the coordinate
      if (isSet(param)) {
        const s = getView().getScale();

        getModel().beginUpdate();

        try {
          for (let i = 0; i < cells.length; i++) {
            const state = getView().getState(cells[i]);

            if (isSet(state)) {
              let geo = getCellGeometry(cells[i]);

              if (isSet(geo) && !getModel().isEdge(cells[i])) {
                geo = geo.clone();

                if (align === ALIGN_CENTER) {
                  geo.setX(
                    geo.getX() +
                      (param - state.getX() - state.getWidth() / 2) / s
                  );
                } else if (align === ALIGN_RIGHT) {
                  geo.setX(
                    geo.getX() + (param - state.getX() - state.getWidth()) / s
                  );
                } else if (align === ALIGN_TOP) {
                  geo.setY(geo.getY() + (param - state.getY()) / s);
                } else if (align === ALIGN_MIDDLE) {
                  geo.setY(
                    geo.getY() +
                      (param - state.getY() - state.getHeight() / 2) / s
                  );
                } else if (align === ALIGN_BOTTOM) {
                  geo.setY(
                    geo.getY() + (param - state.getY() - state.getHeight()) / s
                  );
                } else {
                  geo.setX(geo.getX() + (param - state.getX()) / s);
                }

                resizeCell(cells[i], geo);
              }
            }
          }

          fireEvent(
            EventObject(Event.ALIGN_CELLS, 'align', align, 'cells', cells)
          );
        } finally {
          getModel().endUpdate();
        }
      }
    }

    return cells;
  };

  const flipEdge = (edge) => {
    const model = getModel();

    if (isSet(edge) && isSet(getAlternateEdgeStyle())) {
      model.beginUpdate();

      try {
        const style = model.getStyle(edge);

        if (isUnset(style) || style.length == 0) {
          model.setStyle(edge, getAlternateEdgeStyle());
        } else {
          model.setStyle(edge, null);
        }

        // Removes all existing control points
        resetEdge(edge);
        fireEvent(EventObject(Event.FLIP_EDGE, 'edge', edge));
      } finally {
        model.endUpdate();
      }
    }

    return edge;
  };

  const addImageBundle = (bundle) => getImageBundles().push(bundle);

  const removeImageBundle = (bundle) => {
    const tmp = [];
    const imageBundles = getImageBundles();

    for (let i = 0; i < imageBundles.length; i++) {
      if (imageBundles[i] !== bundle) {
        tmp.push(imageBundles[i]);
      }
    }

    setImageBundles(tmp);
  };

  const getImageFromBundles = (key) => {
    const imageBundles = getImageBundles();

    if (isSet(key)) {
      for (let i = 0; i < imageBundles.length; i++) {
        const image = imageBundles[i].getImage(key);

        if (isSet(image)) {
          return image;
        }
      }
    }

    return null;
  };

  /**
   * Group: Order
   */

  const orderCells = (back, cells) => {
    if (isUnset(cells)) {
      cells = sortCells(getSelectionCells(), true);
    }

    getModel().beginUpdate();

    try {
      cellsOrdered(cells, back);
      fireEvent(EventObject(Event.ORDER_CELLS, 'back', back, 'cells', cells));
    } finally {
      getModel().endUpdate();
    }

    return cells;
  };

  const cellsOrdered = (cells, back) => {
    const model = getModel();

    if (isSet(cells)) {
      model.beginUpdate();
      try {
        for (let i = 0; i < cells.length; i++) {
          const parent = model.getParent(cells[i]);

          if (back) {
            model.add(parent, cells[i], i);
          } else {
            model.add(parent, cells[i], model.getChildCount(parent) - 1);
          }
        }

        fireEvent(
          EventObject(Event.CELLS_ORDERED, 'back', back, 'cells', cells)
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Group: Grouping
   */

  const groupCells = (group, border, cells) => {
    const model = getModel();

    if (isUnset(cells)) {
      cells = sortCells(getSelectionCells(), true);
    }

    cells = getCellsForGroup(cells);

    if (isUnset(group)) {
      group = createGroupCell(cells);
    }

    const bounds = getBoundsForGroup(group, cells, border);

    if (cells.length > 1 && bounds != null) {
      // Uses parent of group or previous parent of first child
      let parent = model.getParent(group);

      if (isUnset(parent)) {
        parent = model.getParent(cells[0]);
      }

      model.beginUpdate();

      try {
        // Checks if the group has a geometry and
        // creates one if one does not exist
        if (isUnset(getCellGeometry(group))) {
          model.setGeometry(group, Geometry());
        }

        // Adds the group into the parent
        let index = model.getChildCount(parent);
        cellsAdded([group], parent, index, null, null, false, false, false);

        // Adds the children into the group and moves
        index = model.getChildCount(group);
        cellsAdded(cells, group, index, null, null, false, false, false);
        cellsMoved(cells, -bounds.getX(), -bounds.getY(), false, false, false);

        // Resizes the group
        cellsResized([group], [bounds], false);

        fireEvent(
          EventObject(
            Event.GROUP_CELLS,
            'group',
            group,
            'border',
            border,
            'cells',
            cells
          )
        );
      } finally {
        model.endUpdate();
      }
    }

    return group;
  };

  const getCellsForGroup = (cells) => {
    const result = [];

    if (isSet(cells) && cells.length > 0) {
      const parent = getModel().getParent(cells[0]);
      result.push(cells[0]);

      // Filters selection cells with the same parent
      for (let i = 1; i < cells.length; i++) {
        if (getModel().getParent(cells[i]) === parent) {
          result.push(cells[i]);
        }
      }
    }

    return result;
  };

  const getBoundsForGroup = (group, children, border) => {
    const result = getBoundingBoxFromGeometry(children, true);

    if (isSet(result)) {
      if (isSwimlane(group)) {
        const size = getStartSize(group);

        result.setX(result.getX() - size.getWidth());
        result.setY(result.getY() - size.getHeight());
        result.setWidth(result.getWidth() + size.getWidth());
        result.setHeight(result.getHeight() + size.getHeight());
      }

      // Adds the border
      if (isSet(border)) {
        result.setX(result.getX() - border);
        result.setY(result.getY() - border);
        result.setWidth(result.getWidth() + 2 * border);
        result.setHeight(result.getHeight() + 2 * border);
      }
    }

    return result;
  };

  const createGroupCell = (cells) => {
    const group = Cell('');
    group.setVertex(true);
    group.setConnectable(false);

    return group;
  };

  const ungroupCells = (cells = getCellsForUngroup()) => {
    const result = [];
    const model = getModel();

    if (isSet(cells) && cells.length > 0) {
      model.beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          let children = model.getChildren(cells[i]);

          if (isSet(children) && children.length > 0) {
            children = children.slice();
            const parent = model.getParent(cells[i]);
            const index = model.getChildCount(parent);

            cellsAdded(children, parent, index, null, null, true);
            result = result.concat(children);

            // Fix relative child cells
            for (let j = 0; j < children.length; j++) {
              const state = getView().getState(children[j]);
              let geo = getCellGeometry(children[j]);

              if (isSet(state) && isSet(geo) && geo.isRelative()) {
                geo = geo.clone();
                geo.setX(state.getOrigin().getX());
                geo.setY(state.getOrigin().getY());
                geo.setRelative(false);

                model.setGeometry(children[j], geo);
              }
            }
          }
        }

        removeCellsAfterUngroup(cells);
        fireEvent(EventObject(Event.UNGROUP_CELLS, 'cells', cells));
      } finally {
        model.endUpdate();
      }
    }

    return result;
  };

  const getCellsForUngroup = () => {
    const cells = getSelectionCells();

    // Finds the cells with children
    const tmp = [];

    for (let i = 0; i < cells.length; i++) {
      if (
        getModel().isVertex(cells[i]) &&
        getModel().getChildCount(cells[i]) > 0
      ) {
        tmp.push(cells[i]);
      }
    }

    return tmp;
  };

  const removeCellsAfterUngroup = (cells) => cellsRemoved(addAllEdges(cells));

  const removeCellsFromParent = (cells = getSelectionCells()) => {
    const model = getModel();

    model.beginUpdate();

    try {
      const parent = getDefaultParent();
      const index = model.getChildCount(parent);

      cellsAdded(cells, parent, index, null, null, true);
      fireEvent(EventObject(Event.REMOVE_CELLS_FROM_PARENT, 'cells', cells));
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  const updateGroupBounds = (
    cells = getSelectionCells(),
    border = 0,
    moveGroup = false,
    topBorder = 0,
    rightBorder = 0,
    bottomBorder = 0,
    leftBorder = 0
  ) => {
    const model = getModel();

    this.model.beginUpdate();

    try {
      for (let i = cells.length - 1; i >= 0; i--) {
        let geo = getCellGeometry(cells[i]);

        if (isSet(geo)) {
          const children = getChildCells(cells[i]);

          if (isSet(children) && children.length > 0) {
            const bounds = getBoundingBoxFromGeometry(children, true);

            if (
              isSet(bounds) &&
              bounds.getWidth() > 0 &&
              bounds.getHeight() > 0
            ) {
              // Adds the size of the title area for swimlanes
              const size = isSwimlane(cells[i])
                ? getActualStartSize(cells[i], true)
                : Rectangle();
              geo = geo.clone();

              if (moveGroup) {
                geo.setX(
                  Math.round(
                    geo.getX() +
                      bounds.getX() -
                      border -
                      size.getX() -
                      leftBorder
                  )
                );
                geo.setY(
                  Math.round(
                    geo.getY() +
                      bounds.getY() -
                      border -
                      size.getY() -
                      topBorder
                  )
                );
              }

              geo.setWidth(
                Math.round(
                  bounds.getWidth() +
                    2 * border +
                    size.getX() +
                    leftBorder +
                    rightBorder +
                    size.getWidth()
                )
              );
              geo.setHeight(
                Math.round(
                  bounds.getHeight() +
                    2 * border +
                    size.getY() +
                    topBorder +
                    bottomBorder +
                    size.getHeight()
                )
              );

              model.setGeometry(cells[i], geo);
              moveCells(
                children,
                border + size.getX() - bounds.getX() + leftBorder,
                border + size.getY() - bounds.getY() + topBorder
              );
            }
          }
        }
      }
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  const getBoundingBox = (cells) => {
    let result = null;

    if (isSet(cells) && cells.length > 0) {
      for (let i = 0; i < cells.length; i++) {
        if (getModel().isVertex(cells[i]) || getModel().isEdge(cells[i])) {
          const bbox = getView().getBoundingBox(
            getView().getState(cells[i]),
            true
          );

          if (isSet(bbox)) {
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
   * Group: Cell cloning, insertion and removal
   */

  const cloneCell = (cell, allowInvalidEdges, mapping, keepPosition) =>
    cloneCells([cell], allowInvalidEdges, mapping, keepPosition)[0];

  const cloneCells = (
    cells,
    allowInvalidEdges = true,
    mapping,
    keepPosition
  ) => {
    const view = getView();
    const model = getModel();
    let clones = null;

    if (isSet(cells)) {
      // Creates a dictionary for fast lookups
      const dict = Dictionary();
      const tmp = [];

      for (let i = 0; i < cells.length; i++) {
        dict.put(cells[i], true);
        tmp.push(cells[i]);
      }

      if (tmp.length > 0) {
        const scale = view.getScale();
        const trans = view.getTranslate();
        clones = model.cloneCells(cells, true, mapping);

        for (let i = 0; i < cells.length; i++) {
          if (
            !allowInvalidEdges &&
            model.isEdge(clones[i]) &&
            getEdgeValidationError(
              clones[i],
              model.getTerminal(clones[i], true),
              isSet(model.getTerminal(clones[i], false))
            )
          ) {
            clones[i] = null;
          } else {
            const g = model.getGeometry(clones[i]);

            if (isSet(g)) {
              const state = view.getState(cells[i]);
              const pstate = view.getState(model.getParent(cells[i]));

              if (isSet(state) && isSet(pstate)) {
                const dx = keepPosition ? 0 : pstate.getOrigin().getX();
                const dy = keepPosition ? 0 : pstate.getOrigin().getY();

                if (model.isEdge(clones[i])) {
                  const pts = state.getAabsolutePoints();

                  if (isSet(pts)) {
                    // Checks if the source is cloned or sets the terminal point
                    let src = model.getTerminal(cells[i], true);

                    while (isSet(src) && !dict.get(src)) {
                      src = model.getParent(src);
                    }

                    if (isUnset(src) && isSet(pts[0])) {
                      g.setTerminalPoint(
                        Point(
                          pts[0].getX() / scale - trans.getX(),
                          pts[0].getY() / scale - trans.getY()
                        ),
                        true
                      );
                    }

                    // Checks if the target is cloned or sets the terminal point
                    let trg = model.getTerminal(cells[i], false);

                    while (isSet(trg) && !dict.get(trg)) {
                      trg = model.getParent(trg);
                    }

                    const n = pts.length - 1;

                    if (isUnset(trg) && isSet(pts[n])) {
                      g.setTerminalPoint(
                        Point(
                          pts[n].getX() / scale - trans.getX(),
                          pts[n].getY() / scale - trans.getY()
                        ),
                        false
                      );
                    }

                    // Translates the control points
                    const points = g.getPoints();

                    if (isSet(points)) {
                      for (let j = 0; j < points.length; j++) {
                        points[j].setX(points[j].getX() + dx);
                        points[j].setY(points[j].getY() + dy);
                      }
                    }
                  }
                } else {
                  g.translate(dx, dy);
                }
              }
            }
          }
        }
      } else {
        clones = [];
      }
    }

    return clones;
  };

  const insertVertex = (
    parent,
    id,
    value,
    x,
    y,
    width,
    height,
    style,
    relative
  ) => {
    const vertex = createVertex(
      parent,
      id,
      value,
      x,
      y,
      width,
      height,
      style,
      relative
    );

    return addCell(vertex, parent);
  };

  const createVertex = (
    parent,
    id,
    value,
    x,
    y,
    width,
    height,
    style,
    relative = false
  ) => {
    // Creates the geometry for the vertex
    const geometry = Geometry(x, y, width, height);
    geometry.setRelative(relative);

    // Creates the vertex
    const vertex = Cell(value, geometry, style);
    vertex.setId(id);
    vertex.setVertex(true);
    vertex.setConnectable(true);

    return vertex;
  };

  const insertEdge = (parent, id, value, source, target, style) => {
    const edge = createEdge(parent, id, value, source, target, style);

    return addEdge(edge, parent, source, target);
  };

  const createEdge = (parent, id, value, source, target, style) => {
    // Creates the edge
    const edge = Cell(value, Geometry(), style);
    edge.setId(id);
    edge.setEdge(true);
    edge.getGeometry().setRelative(true);

    return edge;
  };

  const addEdge = (edge, parent, source, target, index) =>
    addCell(edge, parent, index, source, target);

  const addCell = (cell, parent, index, source, target) =>
    addCells([cell], parent, index, source, target)[0];

  const addCells = (cells, parent, index, source, target, absolute = false) => {
    const model = getModel();

    if (isUnset(parent)) {
      parent = getDefaultParent();
    }

    if (isUnset(index)) {
      index = model.getChildCount(parent);
    }

    model.beginUpdate();

    try {
      cellsAdded(cells, parent, index, source, target, absolute, true);
      fireEvent(
        EventObject(
          Event.ADD_CELLS,
          'cells',
          cells,
          'parent',
          parent,
          'index',
          index,
          'source',
          source,
          'target',
          target
        )
      );
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  const cellsAdded = (
    cells,
    parent,
    index,
    source,
    target,
    absolute,
    constrain,
    extend
  ) => {
    const model = getModel();

    if (isSet(cells) && isSet(parent) && isSet(index)) {
      model.beginUpdate();

      try {
        const parentState = absolute ? getView().getState(parent) : null;
        const o1 = isSet(parentState) ? parentState.origin : null;
        const zero = Point(0, 0);

        for (let i = 0; i < cells.length; i++) {
          if (isUnset(cells[i])) {
            index--;
          } else {
            const previous = model.getParent(cells[i]);

            // Keeps the cell at its absolute location
            if (isSet(o1) && cells[i] !== parent && parent !== previous) {
              const oldState = getView().getState(previous);
              const o2 = isSet(oldState) ? oldState.getOrigin() : zero;
              let geo = model.getGeometry(cells[i]);

              if (isSet(geo)) {
                const dx = o2.getX() - o1.getX();
                const dy = o2.getY() - o1.getY();

                // FIXME: Cells should always be inserted first before any other edit
                // to avoid forward references in sessions.
                geo = geo.clone();
                geo.translate(dx, dy);

                if (
                  !geo.isRelative() &&
                  model.isVertex(cells[i]) &&
                  !isAllowNegativeCoordinates()
                ) {
                  geo.setX(Math.max(0, geo.getX()));
                  geo.setY(Math.max(0, geo.getY()));
                }

                model.setGeometry(cells[i], geo);
              }
            }

            // Decrements all following indices
            // if cell is already in parent
            if (
              parent === previous &&
              index + i > model.getChildCount(parent)
            ) {
              index--;
            }

            model.add(parent, cells[i], index + i);

            if (isAutoSizeCellsOnAdd()) {
              autoSizeCell(cells[i], true);
            }

            // Extends the parent or constrains the child
            if (
              (isUnset(extend) || extend) &&
              isExtendParentsOnAdd(cells[i]) &&
              isExtendParent(cells[i])
            ) {
              extendParent(cells[i]);
            }

            // Additionally constrains the child after extending the parent
            if (isUnset(constrain) || constrain) {
              constrainChild(cells[i]);
            }

            // Sets the source terminal
            if (isSet(source)) {
              cellConnected(cells[i], source, true);
            }

            // Sets the target terminal
            if (isSet(target)) {
              cellConnected(cells[i], target, false);
            }
          }
        }

        fireEvent(
          EventObject(
            Event.CELLS_ADDED,
            'cells',
            cells,
            'parent',
            parent,
            'index',
            index,
            'source',
            source,
            'target',
            target,
            'absolute',
            absolute
          )
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  const autoSizeCell = (cell, recurse = true) => {
    const model = getModel();

    if (recurse) {
      const childCount = model.getChildCount(cell);

      for (let i = 0; i < childCount; i++) {
        autoSizeCell(model.getChildAt(cell, i));
      }
    }

    if (model.isVertex(cell) && isAutoSizeCell(cell)) {
      updateCellSize(cell);
    }
  };

  const removeCells = (cells, includeEdges = true) => {
    if (isUnset(cells)) {
      cells = getDeletableCells(getSelectionCells());
    }

    // Adds all edges to the cells
    if (includeEdges) {
      // FIXME: Remove duplicate cells in result or do not add if
      // in cells or descendant of cells
      cells = getDeletableCells(addAllEdges(cells));
    } else {
      cells = cells.slice();

      // Removes edges that are currently not
      // visible as those cannot be updated
      const edges = getDeletableCells(getAllEdges(cells));
      const dict = Dictionary();

      for (let i = 0; i < cells.length; i++) {
        dict.put(cells[i], true);
      }

      for (let i = 0; i < edges.length; i++) {
        if (getView().getState(isUnset(edges[i])) && !dict.get(edges[i])) {
          dict.put(edges[i], true);
          cells.push(edges[i]);
        }
      }
    }

    getModel().beginUpdate();

    try {
      cellsRemoved(cells);
      fireEvent(
        EventObject(
          Event.REMOVE_CELLS,
          'cells',
          cells,
          'includeEdges',
          includeEdges
        )
      );
    } finally {
      getModel().endUpdate();
    }

    return cells;
  };

  const cellsRemoved = (cells) => {
    const model = getModel();

    if (isSet(cells) && cells.length > 0) {
      const scale = getView().getScale();
      const tr = getView().getTranslate();

      model.beginUpdate();

      try {
        // Creates hashtable for faster lookup
        const dict = Dictionary();

        for (let i = 0; i < cells.length; i++) {
          dict.put(cells[i], true);
        }

        for (let i = 0; i < cells.length; i++) {
          // Disconnects edges which are not being removed
          const edges = this.getAllEdges([cells[i]]);

          const disconnectTerminal = (edge, source) => {
            let geo = model.getGeometry(edge);

            if (isSet(geo)) {
              // Checks if terminal is being removed
              const terminal = model.getTerminal(edge, source);
              let connected = false;
              let tmp = terminal;

              while (isSet(tmp)) {
                if (cells[i] === tmp) {
                  connected = true;
                  break;
                }

                tmp = model.getParent(tmp);
              }

              if (connected) {
                geo = geo.clone();
                const state = getView().getState(edge);

                if (isSet(state) && isSet(state.getAbsolutePoints())) {
                  const pts = state.getAbsolutePoints();
                  const n = source ? 0 : pts.length - 1;

                  geo.setTerminalPoint(
                    Point(
                      pts[n].getX() / scale - tr.getX() - state.origin.getX(),
                      pts[n].getY() / scale - tr.getY() - state.origin.getY()
                    ),
                    source
                  );
                } else {
                  // Fallback to center of terminal if routing
                  // points are not available to add new point
                  // KNOWN: Should recurse to find parent offset
                  // of edge for nested groups but invisible edges
                  // should be removed in removeCells step
                  const tstate = getView().getState(terminal);

                  if (isSet(tstate)) {
                    geo.setTerminalPoint(
                      Point(
                        tstate.getCenterX() / scale - tr.getX(),
                        tstate.getCenterY() / scale - tr.getY()
                      ),
                      source
                    );
                  }
                }

                model.setGeometry(edge, geo);
                model.setTerminal(edge, null, source);
              }
            }
          };

          for (let j = 0; j < edges.length; j++) {
            if (!dict.get(edges[j])) {
              dict.put(edges[j], true);
              disconnectTerminal(edges[j], true);
              disconnectTerminal(edges[j], false);
            }
          }

          model.remove(cells[i]);
        }

        fireEvent(EventObject(Event.CELLS_REMOVED, 'cells', cells));
      } finally {
        model.endUpdate();
      }
    }
  };

  const splitEdge = (edge, cells, newEdge, dx = 0, dy = 0, x, y, parent) => {
    const view = getView();
    const model = getModel();

    parent = isSet(parent) ? parent : model.getParent(edge);
    const source = model.getTerminal(edge, true);

    model.beginUpdate();

    try {
      if (isUnset(newEdge)) {
        newEdge = cloneCell(edge);

        // Removes waypoints before/after new cell
        const state = view.getState(edge);
        let geo = getCellGeometry(newEdge);

        if (isSet(geo) && isSet(geo.getPoints()) && isSet(state)) {
          const t = view.getTranslate();
          const s = view.getScale();
          const idx = findNearestSegment(
            state,
            (dx + t.getX()) * s,
            (dy + t.getY()) * s
          );
          geo.setPoints(geo.getPoints().slice(0, idx));

          geo = getCellGeometry(edge);

          if (isSet(geo) && isSet(geo.getPoints())) {
            geo = geo.clone();
            geo.setPoints(geo.getPoints().slice(idx));
            model.setGeometry(edge, geo);
          }
        }
      }

      cellsMoved(cells, dx, dy, false, false);
      cellsAdded(cells, parent, model.getChildCount(parent), null, null, true);
      cellsAdded(
        [newEdge],
        parent,
        model.getChildCount(parent),
        source,
        cells[0],
        false
      );
      cellConnected(edge, cells[0], true);
      fireEvent(
        EventObject(
          Event.SPLIT_EDGE,
          'edge',
          edge,
          'cells',
          cells,
          'newEdge',
          newEdge,
          'dx',
          dx,
          'dy',
          dy
        )
      );
    } finally {
      model.endUpdate();
    }

    return newEdge;
  };

  /**
   * Group: Cell visibility
   */

  const toggleCells = (show, cells, includeEdges) => {
    const model = getModel();

    if (isUnset(cells)) {
      cells = getSelectionCells();
    }

    // Adds all connected edges recursively
    if (includeEdges) {
      cells = addAllEdges(cells);
    }

    model.beginUpdate();

    try {
      cellsToggled(cells, show);
      fireEvent(
        EventObject(
          Event.TOGGLE_CELLS,
          'show',
          show,
          'cells',
          cells,
          'includeEdges',
          includeEdges
        )
      );
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  const cellsToggled = (cells, show) => {
    const model = getModel();

    if (isSet(cells) && cells.length > 0) {
      model.beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          model.setVisible(cells[i], show);
        }
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Group: Folding
   */

  const foldCells = (collapse, recurse = false, cells, checkFoldable, evt) => {
    const model = getModel();

    if (isUnset(cells)) {
      cells = getFoldableCells(getSelectionCells(), collapse);
    }

    stopEditing(false);

    model.beginUpdate();

    try {
      cellsFolded(cells, collapse, recurse, checkFoldable);
      fireEvent(
        EventObject(
          Event.FOLD_CELLS,
          'collapse',
          collapse,
          'recurse',
          recurse,
          'cells',
          cells
        )
      );
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  const cellsFolded = (cells, collapse, recurse, checkFoldable) => {
    const model = getModel();

    if (isSet(cells) && cells.length > 0) {
      model.beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          if (
            (!checkFoldable || isCellFoldable(cells[i], collapse)) &&
            collapse !== isCellCollapsed(cells[i])
          ) {
            model.setCollapsed(cells[i], collapse);
            swapBounds(cells[i], collapse);

            if (isExtendParent(cells[i])) {
              extendParent(cells[i]);
            }

            if (recurse) {
              const children = model.getChildren(cells[i]);
              cellsFolded(children, collapse, recurse);
            }

            constrainChild(cells[i]);
          }
        }

        fireEvent(
          EventObject(
            Event.CELLS_FOLDED,
            'cells',
            cells,
            'collapse',
            collapse,
            'recurse',
            recurse
          )
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  const swapBounds = (cell, willCollapse) => {
    if (isSet(cell)) {
      let geo = getModel().getGeometry(cell);

      if (isSet(geo)) {
        geo = geo.clone();

        updateAlternateBounds(cell, geo, willCollapse);
        geo.swap();

        getModel().setGeometry(cell, geo);
      }
    }
  };

  const updateAlternateBounds = (cell, geo, willCollapse) => {
    if (isSet(cell) && isSet(geo)) {
      const style = getCurrentCellStyle(cell);

      if (isUnset(geo.getAlternateBounds())) {
        let bounds = geo;

        if (isCollapseToPreferredSize()) {
          const tmp = getPreferredSizeForCell(cell);

          if (isSet(tmp)) {
            bounds = tmp;

            const startSize = getValue(style, STYLE_STARTSIZE);

            if (startSize > 0) {
              bounds.setHeight(Math.max(bounds.getHeight(), startSize));
            }
          }
        }

        geo.setAlternateBounds(
          Rectangle(0, 0, bounds.getWidth(), bounds.getHeight())
        );
      }

      if (isSet(geo.getAlternateBounds())) {
        const bounds = geo.getAlternateBounds();
        bounds.setX(geo.getX());
        bounds.setY(geo.getY());

        const alpha = toRadians(style[STYLE_ROTATION] || 0);

        if (alpha !== 0) {
          const dx = bounds.getCenterX() - geo.getCenterX();
          const dy = bounds.getCenterY() - geo.getCenterY();

          const cos = Math.cos(alpha);
          const sin = Math.sin(alpha);

          const dx2 = cos * dx - sin * dy;
          const dy2 = sin * dx + cos * dy;

          bounds.setX(bounds.getX() + dx2 - dx);
          bounds.setY(bounds.getY() + dy2 - dy);
        }
      }
    }
  };

  const addAllEdges = (cells) => {
    const allCells = cells.slice();

    return removeDuplicates(allCells.concat(getAllEdges(cells)));
  };

  const getAllEdges = (cells) => {
    const model = getModel();
    const edges = [];

    if (isSet(cells)) {
      for (let i = 0; i < cells.length; i++) {
        const edgeCount = model.getEdgeCount(cells[i]);

        for (let j = 0; j < edgeCount; j++) {
          edges.push(model.getEdgeAt(cells[i], j));
        }

        // Recurses
        const children = model.getChildren(cells[i]);
        edges = edges.concat(getAllEdges(children));
      }
    }

    return edges;
  };

  /**
   * Group: Cell sizing
   */

  const updateCellSize = (cell, ignoreChildren = false) => {
    getModel().beginUpdate();

    try {
      cellSizeUpdated(cell, ignoreChildren);
      fireEvent(
        EventObject(
          Event.UPDATE_CELL_SIZE,
          'cell',
          cell,
          'ignoreChildren',
          ignoreChildren
        )
      );
    } finally {
      getModel().endUpdate();
    }

    return cell;
  };

  const cellSizeUpdated = (cell, ignoreChildren) => {
    const view = getView();
    const model = getModel();

    if (isSet(cell)) {
      model.beginUpdate();

      try {
        const size = getPreferredSizeForCell(cell);
        let geo = model.getGeometry(cell);

        if (isSet(size) && isSet(geo)) {
          const collapsed = isCellCollapsed(cell);
          geo = geo.clone();

          if (isSwimlane(cell)) {
            const style = getCellStyle(cell);
            let cellStyle = model.getStyle(cell);

            if (isUnset(cellStyle)) {
              cellStyle = '';
            }

            if (getValue(style, STYLE_HORIZONTAL, true)) {
              cellStyle = setStyle(
                cellStyle,
                STYLE_STARTSIZE,
                size.getHeight() + 8
              );

              if (collapsed) {
                geo.setHeight(size.getHeight() + 8);
              }

              geo.setWidth(size.getWidth());
            } else {
              cellStyle = setStyle(
                cellStyle,
                STYLE_STARTSIZE,
                size.getWidth() + 8
              );

              if (collapsed) {
                geo.setWidth(size.getWidth() + 8);
              }

              geo.setHeight(size.getHeight());
            }

            model.setStyle(cell, cellStyle);
          } else {
            const state = view.createState(cell);
            const align = state.style[STYLE_ALIGN] || ALIGN_CENTER;

            if (align === ALIGN_RIGHT) {
              geo.setX(geo.getX() + geo.getWidth() - size.getWidth());
            } else if (align === ALIGN_CENTER) {
              geo.setX(
                geo.getX() + Math.round((geo.getWidth() - size.getWidth()) / 2)
              );
            }

            const valign = getVerticalAlign(state);

            if (valign === ALIGN_BOTTOM) {
              geo.setY(geo.getY() + geo.getHeight() - size.getHeight());
            } else if (valign === ALIGN_MIDDLE) {
              geo.setY(
                geo.getY() +
                  Math.round((geo.getHeight() - size.getHeight()) / 2)
              );
            }

            geo.setWidth(size.getWidth());
            geo.setHeight(size.getHeight());
          }

          if (!ignoreChildren && !collapsed) {
            const bounds = view.getBounds(model.getChildren(cell));

            if (isSet(bounds)) {
              const tr = view.getTranslate();
              const scale = view.getScale();

              const width =
                (bounds.getX() + bounds.getWidth()) / scale -
                geo.getX() -
                tr.getX();
              const height =
                (bounds.getY() + bounds.getHeight()) / scale -
                geo.getY() -
                tr.getY();

              geo.setWidth(Math.max(geo.getWidth(), width));
              geo.setHeight(Math.max(geo.getHeight(), height));
            }
          }

          cellsResized([cell], [geo], false);
        }
      } finally {
        model.endUpdate();
      }
    }
  };

  const getPreferredSizeForCell = (cell, textWidth) => {
    let result = null;

    if (isSet(cell)) {
      const state = getView().createState(cell);
      const style = state.getStyle();

      if (!getModel().isEdge(cell)) {
        const fontSize = style[STYLE_FONTSIZE] || DEFAULT_FONTSIZE;
        let dx = 0;
        let dy = 0;

        // Adds dimension of image if shape is a label
        if (isSet(getImage(state)) || isSet(style[STYLE_IMAGE])) {
          if (style[STYLE_SHAPE] === SHAPE_LABEL) {
            if (style[STYLE_VERTICAL_ALIGN] === ALIGN_MIDDLE) {
              dx += parseFloat(style[STYLE_IMAGE_WIDTH]) || Label.imageSize;
            }

            if (style[STYLE_ALIGN] != ALIGN_CENTER) {
              dy += parseFloat(style[STYLE_IMAGE_HEIGHT]) || Label.imageSize;
            }
          }
        }

        // Adds spacings
        dx += 2 * (style[STYLE_SPACING] || 0);
        dx += style[STYLE_SPACING_LEFT] || 0;
        dx += style[STYLE_SPACING_RIGHT] || 0;

        dy += 2 * (style[STYLE_SPACING] || 0);
        dy += style[STYLE_SPACING_TOP] || 0;
        dy += style[STYLE_SPACING_BOTTOM] || 0;

        // Add spacing for collapse/expand icon
        // LATER: Check alignment and use constants
        // for image spacing
        const image = getFoldingImage(state);

        if (isSet(image)) {
          dx += image.getWidth() + 8;
        }

        // Adds space for label
        let value = getCellRenderer().getLabelValue(state);

        if (value != null && value.length > 0) {
          if (!isHtmlLabel(state.getCell())) {
            value = htmlEntities(value, false);
          }

          value = value.replace(/\n/g, '<br>');

          const size = getSizeForString(
            value,
            fontSize,
            style[STYLE_FONTFAMILY],
            textWidth,
            style[STYLE_FONTSTYLE]
          );
          let width = size.getWidth() + dx;
          let height = size.getHeight() + dy;

          if (!getValue(style, STYLE_HORIZONTAL, true)) {
            const tmp = height;

            height = width;
            width = tmp;
          }

          if (isGridEnabled()) {
            width = snap(width + getGridSize() / 2);
            height = snap(height + getGridSize() / 2);
          }

          result = Rectangle(0, 0, width, height);
        } else {
          const gs2 = 4 * getGridSize();
          result = Rectangle(0, 0, gs2, gs2);
        }
      }
    }

    return result;
  };

  const resizeCell = (cell, bounds, recurse) =>
    resizeCells([cell], [bounds], recurse)[0];

  const resizeCells = (cells, bounds, recurse = isRecursiveResize()) => {
    getModel().beginUpdate();

    try {
      const prev = cellsResized(cells, bounds, recurse);
      fireEvent(
        EventObject(
          Event.RESIZE_CELLS,
          'cells',
          cells,
          'bounds',
          bounds,
          'previous',
          prev
        )
      );
    } finally {
      getModel().endUpdate();
    }

    return cells;
  };

  const cellsResized = (cells, bounds, recurse = false) => {
    const prev = [];

    if (isSet(cells) && isSet(bounds) && cells.length === bounds.length) {
      getModel().beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          prev.push(cellResized(cells[i], bounds[i], false, recurse));

          if (isExtendParent(cells[i])) {
            extendParent(cells[i]);
          }

          constrainChild(cells[i]);
        }

        if (isResetEdgesOnResize()) {
          resetEdges(cells);
        }

        fireEvent(
          EventObject(
            Event.CELLS_RESIZED,
            'cells',
            cells,
            'bounds',
            bounds,
            'previous',
            prev
          )
        );
      } finally {
        getModel().endUpdate();
      }
    }

    return prev;
  };

  const cellResized = (cell, bounds, ignoreRelative, recurse) => {
    const mode = getModel();
    const prev = model.getGeometry(cell);

    if (isSet(prev) && prev.equals(bounds)) {
      const geo = prev.clone();

      if (!ignoreRelative && geo.isRelative()) {
        const offset = geo.getOffset();

        if (isSet(offset)) {
          offset.setX(offset.getX() + bounds.getX() - geo.getX());
          offset.setY(offset.getY() + bounds.getY() - geo.getY());
        }
      } else {
        geo.setX(bounds.getX());
        geo.setY(bounds.getY());
      }

      geo.setWidth(bounds.getWidth());
      geo.setHeight(bounds.getHeight());

      if (
        !geo.isRelative() &&
        model.isVertex(cell) &&
        !isAllowNegativeCoordinates()
      ) {
        geo.setX(Math.max(0, geo.getX()));
        geo.setY(Math.max(0, geo.getY()));
      }

      model.beginUpdate();

      try {
        if (recurse) {
          resizeChildCells(cell, geo);
        }

        model.setGeometry(cell, geo);
        constrainChildCells(cell);
      } finally {
        model.endUpdate();
      }
    }

    return prev;
  };

  const resizeChildCells = (cell, newGeo) => {
    const model = getModel();
    const geo = model.getGeometry(cell);
    const dx = geo.getWidth() !== 0 ? newGeo.getWidth() / geo.getWidth() : 1;
    const dy = geo.getHeight() !== 0 ? newGeo.getHeight() / geo.getHeight() : 1;
    const childCount = model.getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      scaleCell(model.getChildAt(cell, i), dx, dy, true);
    }
  };

  const constrainChildCells = (cell) => {
    const model = getModel();
    const childCount = model.getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      constrainChild(model.getChildAt(cell, i));
    }
  };

  const scaleCell = (cell, dx, dy, recurse) => {
    const model = getModel();
    let geo = model.getGeometry(cell);

    if (isSet(geo)) {
      const style = getCurrentCellStyle(cell);
      geo = geo.clone();

      // Stores values for restoring based on style
      const x = geo.getX();
      const y = geo.getY();
      const w = geo.getWidth();
      const h = geo.getHeight();

      geo.scale(dx, dy, style[STYLE_ASPECT] === 'fixed');

      if (style[STYLE_RESIZE_WIDTH] === '1') {
        geo.setWidth(w * dx);
      } else if (style[STYLE_RESIZE_WIDTH] === '0') {
        geo.setWidth(w);
      }

      if (style[STYLE_RESIZE_HEIGHT] === '1') {
        geo.setHeight(h * dy);
      } else if (style[STYLE_RESIZE_HEIGHT] === '0') {
        geo.setHeight(h);
      }

      if (!isCellMovable(cell)) {
        geo.setX(x);
        geo.setY(y);
      }

      if (!isCellResizable(cell)) {
        geo.setWidth(w);
        geo.setHeight(h);
      }

      if (model.isVertex(cell)) {
        cellResized(cell, geo, true, recurse);
      } else {
        model.setGeometry(cell, geo);
      }
    }
  };

  const extendParent = (cell) => {
    if (isSet(cell)) {
      const parent = getModel().getParent(cell);
      let p = getCellGeometry(parent);

      if (isSet(parent) && isSet(p) && !isCellCollapsed(parent)) {
        const geo = getCellGeometry(cell);

        if (
          isSet(geo) &&
          !geo.isRelative() &&
          (p.getWidth() < geo.getX() + geo.getWidth() ||
            p.getHeight() < geo.getY() + geo.getHeight())
        ) {
          p = p.clone();

          p.setWidth(Math.max(p.getWidth(), geo.getX() + geo.getWidth()));
          p.setHeight(Math.max(p.getHeight(), geo.getY() + geo.getHeight()));

          cellsResized([parent], [p], false);
        }
      }
    }
  };

  /**
   * Group: Cell moving
   */

  const importCells = (cells, dx, dy, target, evt, mapping) =>
    moveCells(cells, dx, dy, true, target, evt, mapping);

  const moveCells = (
    cells,
    dx = 0,
    dy = 0,
    clone = false,
    target,
    evt,
    mapping
  ) => {
    const model = getModel();

    if (isSet(cells) && (dx !== 0 || dy !== 0 || clone || isSet(target))) {
      // Removes descendants with ancestors in cells to avoid multiple moving
      cells = model.getTopmostCells(cells);
      const origCells = cells;

      model.beginUpdate();

      try {
        // Faster cell lookups to remove relative edge labels with selected
        // terminals to avoid explicit and implicit move at same time
        const dict = Dictionary();

        for (let i = 0; i < cells.length; i++) {
          dict.put(cells[i], true);
        }

        const isSelected = (cell) => {
          while (isSet(cell)) {
            if (dict.get(cell)) {
              return true;
            }

            cell = model.getParent(cell);
          }

          return false;
        };

        // Removes relative edge labels with selected terminals
        const checked = [];

        for (let i = 0; i < cells.length; i++) {
          const geo = getCellGeometry(cells[i]);
          const parent = model.getParent(cells[i]);

          if (
            isUnset(geo) ||
            !geo.isRelative() ||
            !model.isEdge(parent) ||
            (!isSelected(model.getTerminal(parent, true)) &&
              !isSelected(model.getTerminal(parent, false)))
          ) {
            checked.push(cells[i]);
          }
        }

        cells = checked;

        if (clone) {
          cells = cloneCells(cells, isCloneInvalidEdges(), mapping);

          if (isUnset(target)) {
            target = getDefaultParent();
          }
        }

        // FIXME: Cells should always be inserted first before any other edit
        // to avoid forward references in sessions.
        // Need to disable allowNegativeCoordinates if target not null to
        // allow for temporary negative numbers until cellsAdded is called.
        const previous = isAllowNegativeCoordinates();

        if (isSet(target)) {
          setAllowNegativeCoordinates(true);
        }

        cellsMoved(
          cells,
          dx,
          dy,
          !clone && isDisconnectOnMove() && isAllowDanglingEdges(),
          isUnset(target),
          isExtendParentsOnMove() && isUnset(target)
        );

        setAllowNegativeCoordinates(previous);

        if (isSet(target)) {
          const index = model.getChildCount(target);
          cellsAdded(cells, target, index, null, null, true);

          // Restores parent edge on cloned edge labels
          if (clone) {
            for (let i = 0; i < cells.length; i++) {
              const geo = getCellGeometry(cells[i]);
              const parent = model.getParent(origCells[i]);

              if (
                isSet(geo) &&
                geo.isRelative() &&
                model.isEdge(parent) &&
                model.contains(parent)
              ) {
                model.add(parent, cells[i]);
              }
            }
          }
        }

        // Dispatches a move event
        fireEvent(
          EventObject(
            Event.MOVE_CELLS,
            'cells',
            cells,
            'dx',
            dx,
            'dy',
            dy,
            'clone',
            clone,
            'target',
            target,
            'event',
            evt
          )
        );
      } finally {
        model.endUpdate();
      }
    }

    return cells;
  };

  const cellsMoved = (cells, dx, dy, disconnect, constrain, extend = false) => {
    const model = getModel();

    if (isSet(cells) && (dx !== 0 || dy !== 0)) {
      model.beginUpdate();

      try {
        if (disconnect) {
          disconnectGraph(cells);
        }

        for (let i = 0; i < cells.length; i++) {
          translateCell(cells[i], dx, dy);

          if (extend && isExtendParent(cells[i])) {
            extendParent(cells[i]);
          } else if (constrain) {
            constrainChild(cells[i]);
          }
        }

        if (isResetEdgesOnMove()) {
          resetEdges(cells);
        }

        fireEvent(
          EventObject(
            Event.CELLS_MOVED,
            'cells',
            cells,
            'dx',
            dx,
            'dy',
            dy,
            'disconnect',
            disconnect
          )
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  const translateCell = (cell, dx, dy) => {
    const model = getModel();
    let geo = model.getGeometry(cell);

    if (isSet(geo)) {
      dx = parseFloat(dx);
      dy = parseFloat(dy);
      geo = geo.clone();
      geo.translate(dx, dy);

      if (
        !geo.isRelative() &&
        model.isVertex(cell) &&
        !isAllowNegativeCoordinates()
      ) {
        geo.setX(Math.max(0, parseFloat(geo.getX())));
        geo.setY(Math.max(0, parseFloat(geo.getY())));
      }

      if (geo.isRelative() && !model.isEdge(cell)) {
        const parent = model.getParent(cell);
        let angle = 0;

        if (model.isVertex(parent)) {
          const style = getCurrentCellStyle(parent);
          angle = getValue(style, STYLE_ROTATION, 0);
        }

        if (angle !== 0) {
          const rad = toRadians(-angle);
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const pt = getRotatedPoint(Point(dx, dy), cos, sin, Point(0, 0));
          dx = pt.getX();
          dy = pt.getY();
        }

        if (isUnset(geo.getOffset())) {
          geo.setOffset(Point(dx, dy));
        } else {
          const offset = geo.getOffset();
          offset.setX(parseFloat(offset.getX()) + dx);
          offset.setY(parseFloat(offset.getY()) + dy);
        }
      }

      model.setGeometry(cell, geo);
    }
  };

  const getCellContainmentArea = (cell) => {
    const model = getModel();

    if (isSet(cell) && !model.isEdge(cell)) {
      const parent = model.getParent(cell);

      if (isSet(parent) && parent !== getDefaultParent()) {
        const g = model.getGeometry(parent);

        if (isSet(g)) {
          let x = 0;
          let y = 0;
          let w = g.getWidth();
          let h = g.getHeight();

          if (isSwimlane(parent)) {
            const size = getStartSize(parent);
            const style = getCurrentCellStyle(parent);
            const dir = getValue(style, STYLE_DIRECTION, DIRECTION_EAST);
            const flipH = getValue(style, STYLE_FLIPH, 0) === 1;
            const flipV = getValue(style, STYLE_FLIPV, 0) === 1;

            if (dir === DIRECTION_SOUTH || dir === DIRECTION_NORTH) {
              const tmp = size.getWidth();
              size.setWidth(size.getHeight());
              size.setHeight(tmp);
            }

            if (
              (dir === DIRECTION_EAST && !flipV) ||
              (dir === DIRECTION_NORTH && !flipH) ||
              (dir === DIRECTION_WEST && flipV) ||
              (dir === DIRECTION_SOUTH && flipH)
            ) {
              x = size.getWidth();
              y = size.getHeight();
            }

            w -= size.getWidth();
            h -= size.getHeight();
          }

          return Rectangle(x, y, w, h);
        }
      }
    }

    return null;
  };

  const constrainChild = (cell, sizeFirst = true) => {
    const model = getModel();

    if (isSet(cell)) {
      const geo = getCellGeometry(cell);

      if (isSet(geo) && (isConstrainRelativeChildren() || !geo.isRelative())) {
        const parent = model.getParent(cell);
        const pgeo = getCellGeometry(parent);
        let max = getMaximumGraphBounds();

        // Finds parent offset
        if (isSet(max)) {
          const off = getBoundingBoxFromGeometry([parent], false);

          if (isSet(off)) {
            max = Rectangle.fromRectangle(max);

            max.setX(max.getX() - off.getX());
            max.setY(max.getY() - off.getY());
          }
        }

        if (isConstrainChild(cell)) {
          let tmp = getCellContainmentArea(cell);

          if (isSet(tmp)) {
            const overlap = getOverlap(cell);

            if (overlap > 0) {
              tmp = Rectangle.fromRectangle(tmp);

              tmp.setX(tmp.getX() - tmp.getWidth() * overlap);
              tmp.setY(tmp.getY() - tmp.getHeight() * overlap);
              tmp.setWidth(tmp.getWidth() + 2 * tmp.getWidth() * overlap);
              tmp.setHeight(tmp.getHeight() + 2 * tmp.getHeight() * overlap);
            }

            // Find the intersection between max and tmp
            if (isUnset(max)) {
              max = tmp;
            } else {
              max = Rectangle.fromRectangle(max);
              max.intersect(tmp);
            }
          }
        }

        if (isSet(max)) {
          const cells = [cell];

          if (!isCellCollapsed(cell)) {
            const desc = model.getDescendants(cell);

            for (let i = 0; i < desc.length; i++) {
              if (isCellVisible(desc[i])) {
                cells.push(desc[i]);
              }
            }
          }

          const bbox = getBoundingBoxFromGeometry(cells, false);

          if (isSet(bbox)) {
            geo = geo.clone();

            // Cumulative horizontal movement
            let dx = 0;

            if (geo.getWidth() > max.getWidth()) {
              dx = geo.getWidth() - max.getWidth();
              geo.setWidth(geo.getWidth() - dx);
            }

            if (bbox.getX() + bbox.getWidth() > max.getX() + max.getWidth()) {
              dx -=
                bbox.getX() +
                bbox.getWidth() -
                max.getX() -
                max.getWidth() -
                dx;
            }

            // Cumulative vertical movement
            let dy = 0;

            if (geo.getHeight() > max.getHeight()) {
              dy = geo.getHeight() - max.getHeight();
              geo.setHeight(geo.getHeight() - dy);
            }

            if (bbox.getY() + bbox.getHeight() > max.getY() + max.getHeight()) {
              dy -=
                bbox.getY() +
                bbox.getHeight() -
                max.getY() -
                max.getHeight() -
                dy;
            }

            if (bbox.getX() < max.getX()) {
              dx -= bbox.getX() - max.getX();
            }

            if (bbox.getY() < max.getY()) {
              dy -= bbox.getY() - max.getY();
            }

            if (dx !== 0 || dy !== 0) {
              if (geo.isRelative()) {
                const offset = geo.getOffset();

                // Relative geometries are moved via absolute offset
                if (isUnset(offset)) {
                  geo.setOffset(Point());
                }

                offset.setX(offset.getX() + dx);
                offset.setY(offset.getY() + dy);
              } else {
                geo.setX(geo.getX() + dx);
                geo.setY(geo.getY() + dy);
              }
            }

            model.setGeometry(cell, geo);
          }
        }
      }
    }
  };

  const resetEdges = (cells) => {
    const view = getView();
    const model = getModel();

    if (isSet(cells)) {
      // Prepares faster cells lookup
      const dict = Dictionary();

      for (let i = 0; i < cells.length; i++) {
        dict.put(cells[i], true);
      }

      model.beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          const edges = model.getEdges(cells[i]);

          if (isSet(edges)) {
            for (let j = 0; j < edges.length; j++) {
              const state = view.getState(edges[j]);

              const source = isSet(state)
                ? state.getVisibleTerminal(true)
                : view.getVisibleTerminal(edges[j], true);
              const target = isSet(state)
                ? state.getVisibleTerminal(false)
                : view.getVisibleTerminal(edges[j], false);

              // Checks if one of the terminals is not in the given array
              if (!dict.get(source) || !dict.get(target)) {
                resetEdge(edges[j]);
              }
            }
          }

          resetEdges(model.getChildren(cells[i]));
        }
      } finally {
        model.endUpdate();
      }
    }
  };

  const resetEdge = (edge) => {
    const model = getModel();
    let geo = model.getGeometry(edge);

    // Resets the control points
    if (isSet(geo) && isSet(geo.getPoints()) && geo.getPoints().length > 0) {
      geo = geo.clone();
      geo.setPoints([]);
      model.setGeometry(edge, geo);
    }

    return edge;
  };

  /**
   * Group: Cell connecting and connection constraints
   */

  const getOutlineConstraint = (point, terminalState, mE) => {
    const shape = terminalState.getShape();
    const style = terminalState.getStyle();

    if (isSet(shape)) {
      const bounds = getView().getPerimeterBounds(terminalState);
      const direction = style[STYLE_DIRECTION];

      if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
        bounds.setX(
          bounds.getX() + (bounds.getWidth() / 2 - bounds.getHeight() / 2)
        );
        bounds.setY(
          bounds.getY() + (bounds.getHeight() / 2 - bounds.getWidth() / 2)
        );
        const tmp = bounds.getWidth();
        bounds.setWidth(bounds.getHeight());
        bounds.setHeight(tmp);
      }

      const alpha = toRadians(shape.getShapeRotation());

      if (alpha !== 0) {
        const cos = Math.cos(-alpha);
        const sin = Math.sin(-alpha);

        const ct = Point(bounds.getCenterX(), bounds.getCenterY());
        point = getRotatedPoint(point, cos, sin, ct);
      }

      let sx = 1;
      let sy = 1;
      let dx = 0;
      let dy = 0;

      // LATER: Add flipping support for image shapes
      if (getModel().isVertex(terminalState.getCell())) {
        let flipH = style[STYLE_FLIPH];
        let flipV = style[STYLE_FLIPV];

        if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
          const tmp = flipH;
          flipH = flipV;
          flipV = tmp;
        }

        if (flipH) {
          sx = -1;
          dx = -bounds.getWidth();
        }

        if (flipV) {
          sy = -1;
          dy = -bounds.getHeight();
        }
      }

      point = Point(
        (point.getX() - bounds.getX()) * sx - dx + bounds.getX(),
        (point.getY() - bounds.getY()) * sy - dy + bounds.getY()
      );

      const x =
        bounds.getWidth() === 0
          ? 0
          : Math.round(
              ((point.getX() - bounds.getX()) * 1000) / bounds.getWidth()
            ) / 1000;
      const y =
        bounds.getHeight() === 0
          ? 0
          : Math.round(
              ((point.getY() - bounds.getY()) * 1000) / bounds.getHeight()
            ) / 1000;

      return ConnectionConstraint(Point(x, y), false);
    }

    return null;
  };

  const getAllConnectionConstraints = (terminal, source) => {
    if (
      isSet(terminal) &&
      isSet(terminal.getShape()) &&
      isSet(terminal.getShape().getStencil())
    ) {
      return terminal.getShape().getStencil().getConstraints();
    }

    return null;
  };

  const getConnectionConstraint = (edge, terminal, source) => {
    const style = edge.getStyle();
    let point = null;
    const x = style[source ? STYLE_EXIT_X : STYLE_ENTRY_X];

    if (isSet(x)) {
      const y = style[source ? STYLE_EXIT_Y : STYLE_ENTRY_Y];

      if (isSet(y)) {
        point = Point(parseFloat(x), parseFloat(y));
      }
    }

    let perimeter = false;
    let dx = 0,
      dy = 0;

    if (isSet(point)) {
      perimeter = getValue(
        style,
        source ? STYLE_EXIT_PERIMETER : STYLE_ENTRY_PERIMETER,
        true
      );

      //Add entry/exit offset
      dx = parseFloat(style[source ? STYLE_EXIT_DX : STYLE_ENTRY_DX]);
      dy = parseFloat(style[source ? STYLE_EXIT_DY : STYLE_ENTRY_DY]);

      dx = isFinite(dx) ? dx : 0;
      dy = isFinite(dy) ? dy : 0;
    }

    return ConnectionConstraint(point, perimeter, null, dx, dy);
  };

  const setConnectionConstraint = (edge, terminal, source, constraint) => {
    if (isSet(constraint)) {
      getModel().beginUpdate();

      try {
        const point = constraint.getPoint();

        if (isUnset(constraint) || isUnset(point)) {
          setCellStyles(source ? STYLE_EXIT_X : STYLE_ENTRY_X, null, [edge]);
          setCellStyles(source ? STYLE_EXIT_Y : STYLE_ENTRY_Y, null, [edge]);
          setCellStyles(source ? STYLE_EXIT_DX : STYLE_ENTRY_DX, null, [edge]);
          setCellStyles(source ? STYLE_EXIT_DY : STYLE_ENTRY_DY, null, [edge]);
          setCellStyles(
            source ? STYLE_EXIT_PERIMETER : STYLE_ENTRY_PERIMETER,
            null,
            [edge]
          );
        } else if (isSet(point)) {
          setCellStyles(source ? STYLE_EXIT_X : STYLE_ENTRY_X, point.getX(), [
            edge
          ]);
          setCellStyles(source ? STYLE_EXIT_Y : STYLE_ENTRY_Y, point.getY(), [
            edge
          ]);
          setCellStyles(
            source ? STYLE_EXIT_DX : STYLE_ENTRY_DX,
            constraint.getDx(),
            [edge]
          );
          setCellStyles(
            source ? STYLE_EXIT_DY : STYLE_ENTRY_DY,
            constraint.getDy(),
            [edge]
          );

          // Only writes 0 since 1 is default
          if (!constraint.isPerimeter()) {
            setCellStyles(
              source ? STYLE_EXIT_PERIMETER : STYLE_ENTRY_PERIMETER,
              '0',
              [edge]
            );
          } else {
            setCellStyles(
              source ? STYLE_EXIT_PERIMETER : STYLE_ENTRY_PERIMETER,
              null,
              [edge]
            );
          }
        }
      } finally {
        getModel().endUpdate();
      }
    }
  };

  const getConnectionPoint = (vertex, constraint, round = true) => {
    let point = null;
    const cp = constraint.getPoint();

    if (isSet(vertex) && isSet(cp)) {
      const bounds = getView().getPerimeterBounds(vertex);
      const cx = Point(bounds.getCenterX(), bounds.getCenterY());
      const direction = vertex.getStyle()[STYLE_DIRECTION];
      let r1 = 0;

      // Bounds need to be rotated by 90 degrees for further computation
      if (
        isSet(direction) &&
        getValue(vertex.getStyle(), STYLE_ANCHOR_POINT_DIRECTION, 1) === 1
      ) {
        if (direction === DIRECTION_NORTH) {
          r1 += 270;
        } else if (direction === DIRECTION_WEST) {
          r1 += 180;
        } else if (direction === DIRECTION_SOUTH) {
          r1 += 90;
        }

        // Bounds need to be rotated by 90 degrees for further computation
        if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
          bounds.rotate90();
        }
      }

      const scale = getView().getScale();
      point = Point(
        bounds.getX() +
          cp.getX() * bounds.getWidth() +
          constraint.getDx() * scale,
        bounds.getY() +
          cp.getY() * bounds.getHeight() +
          constraint.getDy() * scale
      );

      // Rotation for direction before projection on perimeter
      let r2 = vertex.getStyle()[STYLE_ROTATION] || 0;

      if (constraint.isPerimeter()) {
        if (r1 !== 0) {
          // Only 90 degrees steps possible here so no trig needed
          let cos = 0;
          let sin = 0;

          if (r1 === 90) {
            sin = 1;
          } else if (r1 === 180) {
            cos = -1;
          } else if (r1 === 270) {
            sin = -1;
          }

          point = getRotatedPoint(point, cos, sin, cx);
        }

        point = getView().getPerimeterPoint(vertex, point, false);
      } else {
        r2 += r1;

        if (getModel().isVertex(vertex.getCell())) {
          let flipH = vertex.style[STYLE_FLIPH] === 1;
          let flipV = vertex.style[STYLE_FLIPV] === 1;

          if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
            const temp = flipH;
            flipH = flipV;
            flipV = temp;
          }

          if (flipH) {
            point.setX(2 * bounds.getCenterX() - point.getX());
          }

          if (flipV) {
            point.setY(2 * bounds.getCenterY() - point.getY());
          }
        }
      }

      // Generic rotation after projection on perimeter
      if (r2 !== 0 && isSet(point)) {
        const rad = toRadians(r2);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        point = getRotatedPoint(point, cos, sin, cx);
      }
    }

    if (round && isSet(point)) {
      point.setX(Math.round(point.getX()));
      point.setY(Math.round(point.getY()));
    }

    return point;
  };

  const connectCell = (edge, terminal, source, constraint) => {
    const model = getModel();

    model.beginUpdate();

    try {
      const previous = model.getTerminal(edge, source);
      cellConnected(edge, terminal, source, constraint);
      fireEvent(
        EventObject(
          Event.CONNECT_CELL,
          'edge',
          edge,
          'terminal',
          terminal,
          'source',
          source,
          'previous',
          previous
        )
      );
    } finally {
      model.endUpdate();
    }

    return edge;
  };

  const cellConnected = (edge, terminal, source, constraint) => {
    const model = getModel();

    if (isSet(edge)) {
      model.beginUpdate();

      try {
        const previous = model.getTerminal(edge, source);

        // Updates the constraint
        setConnectionConstraint(edge, terminal, source, constraint);

        // Checks if the new terminal is a port, uses the ID of the port in the
        // style and the parent of the port as the actual terminal of the edge.
        if (isPortsEnabled()) {
          let id = null;

          if (isPort(terminal)) {
            id = terminal.getId();
            terminal = getTerminalForPort(terminal, source);
          }

          // Sets or resets all previous information for connecting to a child port
          const key = source ? STYLE_SOURCE_PORT : STYLE_TARGET_PORT;
          setCellStyles(key, id, [edge]);
        }

        model.setTerminal(edge, terminal, source);

        if (isResetEdgesOnConnect()) {
          resetEdge(edge);
        }

        fireEvent(
          EventObject(
            Event.CELL_CONNECTED,
            'edge',
            edge,
            'terminal',
            terminal,
            'source',
            source,
            'previous',
            previous
          )
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  const disconnectGraph = (cells) => {
    const view = getView();
    const model = getModel();

    if (isSet(cells)) {
      model.beginUpdate();

      try {
        const scale = view.getScale();
        const tr = view.getTranslate();

        // Fast lookup for finding cells in array
        const dict = Dictionary();

        for (let i = 0; i < cells.length; i++) {
          dict.put(cells[i], true);
        }

        for (let i = 0; i < cells.length; i++) {
          if (model.isEdge(cells[i])) {
            let geo = model.getGeometry(cells[i]);

            if (isSet(geo)) {
              const state = view.getState(cells[i]);
              const pstate = view.getState(model.getParent(cells[i]));

              if (isSet(state) && isSet(pstate)) {
                geo = geo.clone();

                const dx = -pstate.getOrigin().getX();
                const dy = -pstate.getOrigin().getY();
                const pts = state.getAbsolutePoints();

                const src = model.getTerminal(cells[i], true);

                if (isSet(src) && isCellDisconnectable(cells[i], src, true)) {
                  while (isSet(src) && !dict.get(src)) {
                    src = model.getParent(src);
                  }

                  if (isUnset(src)) {
                    geo.setTerminalPoint(
                      Point(
                        pts[0].getX() / scale - tr.getX() + dx,
                        pts[0].getY() / scale - tr.getY() + dy
                      ),
                      true
                    );
                    model.setTerminal(cells[i], null, true);
                  }
                }

                let trg = model.getTerminal(cells[i], false);

                if (isSet(trg) && isCellDisconnectable(cells[i], trg, false)) {
                  while (isSet(trg) && !dict.get(trg)) {
                    trg = model.getParent(trg);
                  }

                  if (isUnset(trg)) {
                    const n = pts.length - 1;
                    geo.setTerminalPoint(
                      Point(
                        pts[n].getX() / scale - tr.getX() + dx,
                        pts[n].getY() / scale - tr.getY() + dy
                      ),
                      false
                    );
                    model.setTerminal(cells[i], null, false);
                  }
                }

                model.setGeometry(cells[i], geo);
              }
            }
          }
        }
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Group: Drilldown
   */

  const getCurrentRoot = () => getView().getCurrentRoot();

  const getTranslateForRoot = (cell) => null;

  const isPort = (cell) => false;

  const getTerminalForPort = (cell, source) => getModel().getParent(cell);

  const getChildOffsetForCell = (cell) => null;

  const enterGroup = (cell = getSelectionCell()) => {
    if (isSet(cell) && isValidRoot(cell)) {
      getView().setCurrentRoot(cell);
      clearSelection();
    }
  };

  const exitGroup = () => {
    const view = getView();
    const model = getModel();
    const root = model.getRoot();
    let current = getCurrentRoot();

    if (isSet(current)) {
      let next = model.getParent(current);

      // Finds the next valid root in the hierarchy
      while (
        next !== root &&
        !isValidRoot(next) &&
        model.getParent(next) !== root
      ) {
        next = model.getParent(next);
      }

      // Clears the current root if the new root is
      // the model's root or one of the layers.
      if (next === root || model.getParent(next) === root) {
        view.setCurrentRoot(null);
      } else {
        view.setCurrentRoot(next);
      }

      const state = view.getState(current);

      // Selects the previous root in the graph
      if (isSet(state)) {
        this.setSelectionCell(current);
      }
    }
  };

  const home = () => {
    const current = getCurrentRoot();

    if (isSet(current)) {
      getView().setCurrentRoot(null);
      const state = getView().getState(current);

      if (isSet(state)) {
        setSelectionCell(current);
      }
    }
  };

  const isValidRoot = (cell) => isSet(cell);

  const getGraphBounds = () => getView().getGraphBounds();

  const getCellBounds = (cell, includeEdges, includeDescendants) => {
    const model = getModel();
    let cells = [cell];

    // Includes all connected edges
    if (includeEdges) {
      cells = cells.concat(model.getEdges(cell));
    }

    let result = getView().getBounds(cells);

    // Recursively includes the bounds of the children
    if (includeDescendants) {
      const childCount = model.getChildCount(cell);

      for (let i = 0; i < childCount; i++) {
        const tmp = getCellBounds(
          model.getChildAt(cell, i),
          includeEdges,
          true
        );

        if (isSet(result)) {
          result.add(tmp);
        } else {
          result = tmp;
        }
      }
    }

    return result;
  };

  const getBoundingBoxFromGeometry = (cells, includeEdges = false) => {
    const model = getModel();
    let result = null;

    if (isSet(cells)) {
      for (let i = 0; i < cells.length; i++) {
        if (includeEdges || model.isVertex(cells[i])) {
          // Computes the bounding box for the points in the geometry
          const geo = getCellGeometry(cells[i]);

          if (isSet(geo)) {
            let bbox = null;
            let tmp = null;

            if (model.isEdge(cells[i])) {
              const addPoint = (pt) => {
                if (isSet(pt)) {
                  if (isUnset(tmp)) {
                    tmp = Rectangle(pt.getX(), pt.getY(), 0, 0);
                  } else {
                    tmp.add(Rectangle(pt.getX(), pt.getY(), 0, 0));
                  }
                }
              };

              if (isUnset(model.getTerminal(cells[i], true))) {
                addPoint(geo.getTerminalPoint(true));
              }

              if (isUnset(model.getTerminal(cells[i], false))) {
                addPoint(geo.getTerminalPoint(false));
              }

              const pts = geo.getPoints;

              if (isSet(pts) && pts.length > 0) {
                tmp = Rectangle(pts[0].getX(), pts[0].getY(), 0, 0);

                for (var j = 1; j < pts.length; j++) {
                  addPoint(pts[j]);
                }
              }

              bbox = tmp;
            } else {
              const parent = model.getParent(cells[i]);

              if (geo.isRelative()) {
                if (
                  model.isVertex(parent) &&
                  parent !== getView().getCurrentRoot()
                ) {
                  tmp = getBoundingBoxFromGeometry([parent], false);

                  if (isSet(tmp)) {
                    bbox = Rectangle(
                      geo.getX() * tmp.getWidth(),
                      geo.getY() * tmp.getHeight(),
                      geo.getWidth(),
                      geo.getHeight()
                    );

                    if (cells.indexOf(parent) >= 0) {
                      bbox.setX(bbox.getX() + tmp.getX());
                      bbox.setY(bbox.getY() + tmp.getY());
                    }
                  }
                }
              } else {
                bbox = Rectangle.fromRectangle(geo);

                if (model.isVertex(parent) && cells.indexOf(parent) >= 0) {
                  tmp = getBoundingBoxFromGeometry([parent], false);

                  if (isSet(tmp)) {
                    bbox.setX(bbox.getX() + tmp.getX());
                    bbox.setY(bbox.getY() + tmp.getY());
                  }
                }
              }

              const offset = geo.getOffset();

              if (isSet(bbox) && isSet(offset)) {
                bbox.setX(bbox.getX() + offset.getX());
                bbox.setY(bbox.getY() + offset.getY());
              }

              const style = getCurrentCellStyle(cells[i]);

              if (isSet(bbox)) {
                const angle = getValue(style, STYLE_ROTATION, 0);

                if (angle !== 0) {
                  bbox = getBoundingBox(bbox, angle);
                }
              }
            }

            if (isSet(bbox)) {
              if (isUnset(result)) {
                result = Rectangle.fromRectangle(bbox);
              } else {
                result.add(bbox);
              }
            }
          }
        }
      }
    }

    return result;
  };

  const refresh = (cell) => {
    getView().clear(cell, isUnset(cell));
    getView().validate();
    sizeDidChange();
    fireEvent(EventObject(Event.REFRESH));
  };

  const snap = (value) => {
    if (isGridEnabled()) {
      value = Math.round(value / getGridSize()) * getGridSize();
    }

    return value;
  };

  const snapDelta = (
    delta,
    bounds,
    ignoreGrid,
    ignoreHorizontal,
    ignoreVertical
  ) => {
    const t = getView().getTranslate();
    const s = getView().getScale();

    if (!ignoreGrid && isGridEnabled()) {
      const tol = getGridSize() * s * 0.5;

      if (!ignoreHorizontal) {
        const tx =
          bounds.getX() - (snap(bounds.getX() / s - t.getX()) + t.getX()) * s;

        if (Math.abs(delta.getX() - tx) < tol) {
          delta.setX(0);
        } else {
          delta.setX(snap(delta.getX() / s) * s - tx);
        }
      }

      if (!ignoreVertical) {
        const ty =
          bounds.getY() - (snap(bounds.getY() / s - t.getY()) + t.getY()) * s;

        if (Math.abs(delta.getY() - ty) < tol) {
          delta.setY(0);
        } else {
          delta.setY(snap(delta.getY() / s) * s - ty);
        }
      }
    } else {
      const tol = 0.5 * s;

      if (!ignoreHorizontal) {
        const tx =
          bounds.getX() -
          (Math.round(bounds.getX() / s - t.getX()) + t.getX()) * s;

        if (Math.abs(delta.getX() - tx) < tol) {
          delta.setX(0);
        } else {
          delta.setX(Math.round(delta.getX() / s) * s - tx);
        }
      }

      if (!ignoreVertical) {
        const ty =
          bounds.getY() -
          (Math.round(bounds.getY() / s - t.getY()) + t.getY()) * s;

        if (Math.abs(delta.getY() - ty) < tol) {
          delta.setY(0);
        } else {
          delta.setY(Math.round(delta.getY() / s) * s - ty);
        }
      }
    }

    return delta;
  };

  const panGraph = (dx, dy) => {
    const container = getContainer();

    if (isUseScrollbarsForPanning() && hasScrollbars(container)) {
      container.scrollLeft = -dx;
      container.scrollTop = -dy;
    } else {
      const canvas = getView().getCanvas();

      // Puts everything inside the container in a DIV so that it
      // can be moved without changing the state of the container
      if (dx === 0 && dy === 0) {
        canvas.removeAttribute('transform');

        const shiftPreview1 = getShiftPreview1();
        const shiftPreview2 = getShiftPreview2();

        if (isSet(shiftPreview1)) {
          let child = shiftPreview1.firstChild;

          while (isSet(child)) {
            const next = child.nextSibling;
            container.appendChild(child);
            child = next;
          }

          if (isSet(shiftPreview1.parentNode)) {
            shiftPreview1.parentNode.removeChild(shiftPreview1);
          }

          setShiftPreview1();

          container.appendChild(canvas.parentNode);

          child = shiftPreview2.firstChild;

          while (isSet(child)) {
            const next = child.nextSibling;
            container.appendChild(child);
            child = next;
          }

          if (isSet(shiftPreview2.parentNode)) {
            shiftPreview2.parentNode.removeChild(shiftPreview2);
          }

          setShiftPreview2();
        }
      } else {
        canvas.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');

        if (isUnset(getShiftPreview1())) {
          // Needs two divs for stuff before and after the SVG element
          const shiftPreview1 = setShiftPreview1(document.createElement('div'));
          shiftPreview1.style.position = 'absolute';
          shiftPreview1.style.overflow = 'visible';

          const shiftPreview2 = setShiftPreview2(document.createElement('div'));
          shiftPreview2.style.position = 'absolute';
          shiftPreview2.style.overflow = 'visible';

          let current = shiftPreview1;
          let child = container.firstChild;

          while (isSet(child)) {
            const next = child.nextSibling;

            // SVG element is moved via transform attribute
            if (child !== canvas.parentNode) {
              current.appendChild(child);
            } else {
              current = shiftPreview2;
            }

            child = next;
          }

          // Inserts elements only if not empty
          if (isSet(shiftPreview1.firstChild)) {
            container.insertBefore(shiftPreview1, canvas.parentNode);
          }

          if (isSet(shiftPreview2.firstChild)) {
            container.appendChild(shiftPreview2);
          }
        }

        getShiftPreview1().style.left = dx + 'px';
        getShiftPreview1().style.top = dy + 'px';
        getShiftPreview2().style.left = dx + 'px';
        getShiftPreview2().style.top = dy + 'px';
      }

      setPanDx(dx);
      setPanDy(dy);

      fireEvent(EventObject(Event.PAN));
    }
  };

  const zoomIn = () => zoom(getZoomFactor());

  const zoomOut = () => zoom(1 / getZoomFactor());

  const zoomActual = () => {
    const view = getView();

    if (view.getScale() === 1) {
      view.setTranslate(0, 0);
    } else {
      view.getTranslate().setX(0);
      view.getTranslate().setY(0);

      view.setScale(1);
    }
  };

  const zoomTo = (scale, center) => zoom(scale / getView().getScale(), center);

  const center = (horizontal = true, vertical = true, cx = 0.5, cy = 0.5) => {
    const view = getView();
    const container = getContainer();
    const hasScrollbars = hasScrollbars(container);
    const padding = 2 * getBorder();
    const cw = container.clientWidth - padding;
    const ch = container.clientHeight - padding;
    const bounds = getGraphBounds();

    const t = view.getTranslate();
    const s = view.getScale();

    let dx = horizontal ? cw - bounds.getWidth() : 0;
    let dy = vertical ? ch - bounds.getHeight() : 0;

    if (!hasScrollbars) {
      view.setTranslate(
        horizontal
          ? Math.floor(t.getX() - bounds.getX() / s + (dx * cx) / s)
          : t.getX(),
        vertical
          ? Math.floor(t.getY() - bounds.getY() / s + (dy * cy) / s)
          : t.getY()
      );
    } else {
      bounds.setX(bounds.getX() - t.getX());
      bounds.setY(bounds.getY() - t.getY());

      const sw = container.scrollWidth;
      const sh = container.scrollHeight;

      if (sw > cw) {
        dx = 0;
      }

      if (sh > ch) {
        dy = 0;
      }

      view.setTranslate(
        Math.floor(dx / 2 - bounds.getX()),
        Math.floor(dy / 2 - bounds.getY())
      );
      container.scrollLeft = (sw - cw) / 2;
      container.scrollTop = (sh - ch) / 2;
    }
  };

  const zoom = (factor, center = getCenterZoom()) => {
    const view = getView();
    const container = getContainer();
    const scale = Math.round(view.getScale() * factor * 100) / 100;
    const state = view.getState(getSelectionCell());
    factor = scale / view.getScale();

    if (isKeepSelectionVisibleOnZoom() && isSet(state)) {
      const rect = Rectangle(
        state.getX() * factor,
        state.getY() * factor,
        state.getWidth() * factor,
        state.getHeight() * factor
      );

      // Refreshes the display only once if a scroll is carried out
      view.setScale(scale);

      if (!scrollRectToVisible(rect)) {
        view.revalidate();

        // Forces an event to be fired but does not revalidate again
        view.setScale(scale);
      }
    } else {
      const hasScrollbars = hasScrollbars(container);

      if (center && !hasScrollbars) {
        let dx = container.offsetWidth;
        let dy = container.offsetHeight;

        if (factor > 1) {
          const f = (factor - 1) / (scale * 2);
          dx *= -f;
          dy *= -f;
        } else {
          const f = (1 / factor - 1) / (view.getScale() * 2);
          dx *= f;
          dy *= f;
        }

        view.scaleAndTranslate(
          scale,
          view.getTranslate().getX() + dx,
          view.getTranslate().getY() + dy
        );
      } else {
        const translate = view.getTranslate();

        // Allows for changes of translate and scrollbars during setscale
        const tx = translate.getX();
        const ty = translate.getY();
        const sl = container.scrollLeft;
        const st = container.scrollTop;

        view.setScale(scale);

        if (hasScrollbars) {
          let dx = 0;
          let dy = 0;

          if (center) {
            dx = (container.offsetWidth * (factor - 1)) / 2;
            dy = (container.offsetHeight * (factor - 1)) / 2;
          }

          container.scrollLeft =
            (translate.getX() - tx) * view.scale + Math.round(sl * factor + dx);
          container.scrollTop =
            (translate.getY() - ty) * view.scale + Math.round(st * factor + dy);
        }
      }
    }
  };

  const zoomToRect = (rect) => {
    const view = getView();
    const container = getContainer();

    const scaleX = container.clientWidth / rect.getWidth();
    const scaleY = container.clientHeight / rect.getHeight();
    const aspectFactor = scaleX / scaleY;

    // Remove any overlap of the rect outside the client area
    rect.setX(Math.max(0, rect.getX()));
    rect.setY(Math.max(0, rect.getY()));
    const rectRight = Math.min(
      container.scrollWidth,
      rect.getX() + rect.getWidth()
    );
    const rectBottom = Math.min(
      container.scrollHeight,
      rect.getY() + rect.getHeight()
    );
    rect.setWidth(rectRight - rect.getX());
    rect.setHeight(rectBottom - rect.getY());

    // The selection area has to be increased to the same aspect
    // ratio as the container, centred around the centre point of the
    // original rect passed in.
    if (aspectFactor < 1.0) {
      // Height needs increasing
      const newHeight = rect.getHeight() / aspectFactor;
      const deltaHeightBuffer = (newHeight - rect.getHeight()) / 2.0;
      rect.setHeight(newHeight);

      // Assign up to half the buffer to the upper part of the rect, not crossing 0
      // put the rest on the bottom
      const upperBuffer = Math.min(rect.getY(), deltaHeightBuffer);
      rect.setY(rect.getY() - upperBuffer);

      // Check if the bottom has extended too far
      rectBottom = Math.min(
        container.scrollHeight,
        rect.getY() + rect.getHeight()
      );
      rect.setHeight(rectBottom - rect.getY());
    } else {
      // Width needs increasing
      const newWidth = rect.getWidth() * aspectFactor;
      const deltaWidthBuffer = (newWidth - rect.getWidth()) / 2.0;
      rect.setWidth(newWidth);

      // Assign up to half the buffer to the upper part of the rect, not crossing 0
      // put the rest on the bottom
      const leftBuffer = Math.min(rect.getX(), deltaWidthBuffer);
      rect.setX(rect.getX() - leftBuffer);

      // Check if the right hand side has extended too far
      rectRight = Math.min(
        container.scrollWidth,
        rect.getX() + rect.getWidth()
      );
      rect.setWidth(rectRight - rect.getX());
    }

    const scale = container.clientWidth / rect.getWidth();
    const newScale = view.getScale() * scale;

    if (!hasScrollbars(container)) {
      view.scaleAndTranslate(
        newScale,
        view.getTranslate().getX() - rect.getX() / view.getScale(),
        view.getTranslate().getY() - rect.getY() / view.getScale()
      );
    } else {
      view.setScale(newScale);
      container.scrollLeft = Math.round(rect.getX() * scale);
      container.scrollTop = Math.round(rect.getY() * scale);
    }
  };

  const scrollCellToVisible = (cell, center) => {
    const view = getView();
    const translate = view.getTranslate();
    const container = getContainer();

    const x = -translate.getX();
    const y = -translate.getY();

    const state = view.getState(cell);

    if (isSet(state)) {
      const bounds = Rectangle(
        x + state.getX(),
        y + state.getY(),
        state.getWidth(),
        state.getHeight()
      );

      if (center && isSet(container)) {
        const w = container.clientWidth;
        const h = container.clientHeight;

        bounds.setX(bounds.getCenterX() - w / 2);
        bounds.setWidth(w);
        bounds.setY(bounds.getCenterY() - h / 2);
        bounds.setHeight(h);
      }

      const tr = Point(translate.getX(), translate.getY());

      if (scrollRectToVisible(bounds)) {
        // Triggers an update via the view's event source
        const tr2 = Point(translate.getX(), translate.getY());
        translate.setX(tr.getX());
        translate.setY(tr.getY());
        setTranslate(tr2.getX(), tr2.getY());
      }
    }
  };

  const scrollRectToVisible = (rect) => {
    const view = getView();
    const translate = view.getTranslate();
    const container = getContainer();

    let isChanged = false;

    if (isSet(rect)) {
      const w = container.offsetWidth;
      const h = container.offsetHeight;

      const widthLimit = Math.min(w, rect.getWidth());
      const heightLimit = Math.min(h, rect.getHeight());

      if (hasScrollbars(container)) {
        rect.setX(rect.getX() + translate.getX());
        rect.setY(rect.getY() + translate.getY());
        let dx = container.scrollLeft - rect.getX();
        const ddx = Math.max(dx - container.scrollLeft, 0);

        if (dx > 0) {
          container.scrollLeft -= dx + 2;
        } else {
          dx =
            rect.getX() +
            widthLimit -
            container.scrollLeft -
            container.clientWidth;

          if (dx > 0) {
            container.scrollLeft += dx + 2;
          }
        }

        let dy = container.scrollTop - rect.getY();
        const ddy = Math.max(0, dy - c.scrollTop);

        if (dy > 0) {
          container.scrollTop -= dy + 2;
        } else {
          dy =
            rect.getY() +
            heightLimit -
            container.scrollTop -
            container.clientHeight;

          if (dy > 0) {
            container.scrollTop += dy + 2;
          }
        }

        if (!useScrollbarsForPanning && (ddx != 0 || ddy != 0)) {
          view.setTranslate(ddx, ddy);
        }
      } else {
        const x = -translate.getX();
        const y = -translate.getY();

        const s = view.getScale();

        if (rect.getX() + widthLimit > x + w) {
          translate.setX(
            translate.getX() - (rect.getX() + widthLimit - w - x) / s
          );
          isChanged = true;
        }

        if (rect.getY() + heightLimit > y + h) {
          translate.setY(
            translate.getY() - (rect.getY() + heightLimit - h - y) / s
          );
          isChanged = true;
        }

        if (rect.getX() < x) {
          translate.setX(translate.getX() + (x - rect.getX()) / s);
          isChanged = true;
        }

        if (rect.getY() < y) {
          translate.setY(translate.getY() + (y - rect.getY()) / s);
          isChanged = true;
        }

        if (isChanged) {
          view.refresh();

          // Repaints selection marker (ticket 18)
          if (isSet(selectionCellsHandler)) {
            selectionCellsHandler.refresh();
          }
        }
      }
    }

    return isChanged;
  };

  const getCellGeometry = (cell) => getModel().getGeometry(cell);

  const isCellVisible = (cell) => getModel.isVisible(cell);

  const isCellCollapsed = (cell) => getModel().isCollapsed(cell);

  const isCellConnectable = (cell) => getModel().isConnectable(cell);

  const isOrthogonal = (edge) => {
    const orthogonal = edge.getStyle()[STYLE_ORTHOGONAL];

    if (isSet(orthogonal)) {
      return orthogonal;
    }

    const tmp = getView().getEdgeStyle(edge);

    return (
      tmp === EdgeStyle.SegmentConnector ||
      tmp === EdgeStyle.ElbowConnector ||
      tmp === EdgeStyle.SideToSide ||
      tmp === EdgeStyle.TopToBottom ||
      tmp === EdgeStyle.EntityRelation ||
      tmp === EdgeStyle.OrthConnector
    );
  };

  const isLoop = (state) => {
    const src = state.getVisibleTerminalState(true);
    const trg = state.getVisibleTerminalState(false);

    return isSet(src) && src === trg;
  };

  const isCloneEvent = (evt) => Event.isControlDown(evt);

  const isTransparentClickEvent = (evt) => false;

  const isToggleEvent = (evt) =>
    IS_MAC ? Event.isMetaDown(evt) : Event.isControlDown(evt);

  const isGridEnabledEvent = (evt) => isSet(evt) && !Event.isAltDown(evt);

  const isConstrainedEvent = (evt) => Event.isShiftDown(evt);

  const isIgnoreTerminalEvent = (evt) => false;

  /**
   * Group: Validation
   */

  const validationAlert = (message) => alert(message);

  const isEdgeValid = (edge, source, target) =>
    isUnset(getEdgeValidationError(edge, source, target));

  const getEdgeValidationError = (edge, source, target) => {
    const model = getModel();

    if (
      isSet(edge) &&
      !isAllowDanglingEdges() &&
      (isUnset(source) || isUnset(target))
    ) {
      return '';
    }

    if (
      isSet(edge) &&
      isUnset(model.getTerminal(edge, true)) &&
      isUnset(model.getTerminal(edge, false))
    ) {
      return null;
    }

    // Checks if we're dealing with a loop
    if (!isAllowLoops() && source === target && isSet(source)) {
      return '';
    }

    // Checks if the connection is generally allowed
    if (!isValidConnection(source, target)) {
      return '';
    }

    if (isSet(source) && isSet(target)) {
      let error = '';

      // Checks if the cells are already connected
      // and adds an error message if required
      if (!isMultigraph()) {
        const tmp = model.getEdgesBetween(source, target, true);

        // Checks if the source and target are not connected by another edge
        if (tmp.length > 1 || (tmp.length === 1 && tmp[0] !== edge)) {
          error += 'alreadyConnectedResource' + '\n';
        }
      }

      // Gets the number of outgoing edges from the source
      // and the number of incoming edges from the target
      // without counting the edge being currently changed.
      const sourceOut = model.getDirectedEdgeCount(source, true, edge);
      const targetIn = model.getDirectedEdgeCount(target, false, edge);

      // Checks the change against each multiplicity rule
      if (isSet(getMultiplicities())) {
        for (let i = 0; i < getMultiplicities().length; i++) {
          const err = getMultiplicities()[i].check(
            this,
            edge,
            source,
            target,
            sourceOut,
            targetIn
          );

          if (isSet(err)) {
            error += err;
          }
        }
      }

      // Validates the source and target terminals independently
      const err = validateEdge(edge, source, target);

      if (isSet(err)) {
        error += err;
      }

      return error.length > 0 ? error : null;
    }

    return isAllowDanglingEdges() ? null : '';
  };

  const validateEdge = (edge, source, target) => null;

  const validateGraph = (cell = getModel().getRoot(), context = {}) => {
    const model = getModel();
    let isValid = true;
    const childCount = model.getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      const tmp = model.getChildAt(cell, i);
      let ctx = context;

      if (isValidRoot(tmp)) {
        ctx = {};
      }

      const warn = validateGraph(tmp, ctx);

      if (isSet(warn)) {
        setCellWarning(tmp, warn.replace(/\n/g, '<br>'));
      } else {
        setCellWarning(tmp, null);
      }

      isValid = isValid && isUnset(warn);
    }

    let warning = '';

    // Adds error for invalid children if collapsed (children invisible)
    if (isCellCollapsed(cell) && !isValid) {
      warning += 'containsValidationErrorsResource' + '\n';
    }

    // Checks edges and cells using the defined multiplicities
    if (model.isEdge(cell)) {
      warning +=
        getEdgeValidationError(
          cell,
          model.getTerminal(cell, true),
          model.getTerminal(cell, false)
        ) || '';
    } else {
      warning += getCellValidationError(cell) || '';
    }

    // Checks custom validation rules
    const err = validateCell(cell, context);

    if (isSet(err)) {
      warning += err;
    }

    // Updates the display with the warning icons
    // before any potential alerts are displayed.
    // LATER: Move this into addCellOverlay. Redraw
    // should check if overlay was added or removed.
    if (isUnset(model.getParent(cell))) {
      getView().validate();
    }

    return warning.length > 0 || !isValid ? warning : null;
  };

  const getCellValidationError = (cell) => {
    const model = getModel();
    const outCount = model.getDirectedEdgeCount(cell, true);
    const inCount = model.getDirectedEdgeCount(cell, false);
    const value = model.getValue(cell);
    const multiplicities = getMultiplicities();
    let error = '';

    if (isSet(multiplicities)) {
      for (let i = 0; i < multiplicities.length; i++) {
        const rule = multiplicities[i];

        if (
          rule.isSource() &&
          isNode(value, rule.getType(), rule.getAttr(), rule.getValue()) &&
          (outCount > rule.getMax() || outCount < rule.getMin())
        ) {
          error += rule.getCountError() + '\n';
        } else if (
          !rule.isSource() &&
          isNode(value, rule.getType(), rule.getAttr(), rule.getValue()) &&
          (inCount > rule.getMax() || inCount < rule.getMin())
        ) {
          error += rule.getCountError() + '\n';
        }
      }
    }

    return error.length > 0 ? error : null;
  };

  const validateCell = (cell, context) => null;

  const getFoldingImage = (state) => {
    if (
      isSet(state) &&
      isFoldingEnabled() &&
      !getModel().isEdge(state.getCell())
    ) {
      const tmp = isCellCollapsed(state.getCell());

      if (isCellFoldable(state.getCell(), !tmp)) {
        return tmp ? getCollapsedImage() : getExpandedImage();
      }
    }

    return null;
  };

  const convertValueToString = (cell) => {
    const value = getModel().getValue(cell);

    if (isSet(value)) {
      if (isNode(value)) {
        return value.nodeName;
      } else if (typeof value.toString === 'function') {
        return value.toString();
      }
    }

    return '';
  };

  const getLabel = (cell) => {
    let result = '';

    if (isLabelsVisible() && isSet(cell)) {
      const style = getCurrentCellStyle(cell);

      if (!getValue(style, STYLE_NOLABEL, false)) {
        result = convertValueToString(cell);
      }
    }

    return result;
  };

  const isHtmlLabel = (cell) => isHtmlLabels();

  const isWrapping = (cell) =>
    getCurrentCellStyle(cell)[STYLE_WHITE_SPACE] === 'wrap';

  const isLabelClipped = (cell) =>
    getCurrentCellStyle(cell)[STYLE_OVERFLOW] === 'hidden';

  const getTooltip = (state, node, x, y) => {
    let tip = null;

    if (isSet(state)) {
      // Checks if the mouse is over the folding icon
      if (
        isSet(state.getControl()) &&
        (node === state.getControl().getNode() ||
          node.parentNode === state.getControl().getNode())
      ) {
        tip = 'collapseExpandResource';
        tip = htmlEntities(tip).replace(/\\n/g, '<br>');
      }

      if (isUnset(tip) && isSet(state.getOverlays())) {
        state.getOverlays().visit((id, shape) => {
          // LATER: Exit loop if tip is not null
          if (
            isUnset(tip) &&
            (node === shape.getNode() || node.parentNode === shape.getNode())
          ) {
            tip = shape.getOverlay().toString();
          }
        });
      }

      if (isUnset(tip)) {
        const handler = selectionCellsHandler.getHandler(state.getCell());

        if (isSet(handler) && typeof handler.getTooltipForNode === 'function') {
          tip = handler.getTooltipForNode(node);
        }
      }

      if (isUnset(tip)) {
        tip = getTooltipForCell(state.getCell());
      }
    }

    return tip;
  };

  const getTooltipForCell = (cell) => {
    let tip = null;

    if (isSet(cell) && isSet(cell.getTooltip)) {
      tip = cell.getTooltip();
    } else {
      tip = convertValueToString(cell);
    }

    return tip;
  };

  const getLinkForCell = (cell) => null;

  const getCursorForMouseEvent = (mE) => getCursorForCell(mE.getCell());

  const getCursorForCell = (cell) => null;

  const getStartSize = (swimlane, ignoreState) => {
    const result = Rectangle();
    const style = getCurrentCellStyle(swimlane, ignoreState);
    const size = parseInt(getValue(style, STYLE_STARTSIZE, DEFAULT_STARTSIZE));

    if (getValue(style, STYLE_HORIZONTAL, true)) {
      result.setHeight(size);
    } else {
      result.setWidth(size);
    }

    return result;
  };

  const getSwimlaneDirection = (style) => {
    const dir = getValue(style, STYLE_DIRECTION, DIRECTION_EAST);
    const flipH = getValue(style, STYLE_FLIPH, 0) === 1;
    const flipV = getValue(style, STYLE_FLIPV, 0) === 1;
    const h = getValue(style, STYLE_HORIZONTAL, true);
    let n = h ? 0 : 3;

    if (dir === DIRECTION_NORTH) {
      n--;
    } else if (dir === DIRECTION_WEST) {
      n += 2;
    } else if (dir === DIRECTION_SOUTH) {
      n += 1;
    }

    const mod = mod(n, 2);

    if (flipH && mod === 1) {
      n += 2;
    }

    if (flipV && mod === 0) {
      n += 2;
    }

    return [DIRECTION_NORTH, DIRECTION_EAST, DIRECTION_SOUTH, DIRECTION_WEST][
      mod(n, 4)
    ];
  };

  const getActualStartSize = (swimlane, ignoreState) => {
    const result = Rectangle();

    if (isSwimlane(swimlane, ignoreState)) {
      const style = getCurrentCellStyle(swimlane, ignoreState);
      const size = parseInt(
        getValue(style, STYLE_STARTSIZE, DEFAULT_STARTSIZE)
      );
      const dir = getSwimlaneDirection(style);

      if (dir === DIRECTION_NORTH) {
        result.setY(size);
      } else if (dir === DIRECTION_WEST) {
        result.setX(size);
      } else if (dir === DIRECTION_SOUTH) {
        result.setHeight(size);
      } else {
        result.setWidth(size);
      }
    }

    return result;
  };

  const getImage = (state) => state?.style?.[STYLE_IMAGE];

  const isTransparentState = (state) => {
    let result = false;

    if (isSet(state)) {
      const stroke = getValue(state.getStyle(), STYLE_STROKECOLOR, NONE);
      const fill = getValue(state.getStyle(), STYLE_FILLCOLOR, NONE);

      result = stroke === NONE && fill === NONE && isUnset(getImage(state));
    }

    return result;
  };

  const getVerticalAlign = (state) =>
    state?.style?.[STYLE_VERTICAL_ALIGN] || ALIGN_MIDDLE;

  const getIndicatorColor = (state) => state?.style?.[STYLE_INDICATOR_COLOR];

  const getIndicatorGradientColor = (state) =>
    state?.style?.[STYLE_INDICATOR_GRADIENTCOLOR];

  const getIndicatorShape = (state) => state?.style?.[STYLE_INDICATOR_SHAPE];

  const getIndicatorImage = (state) => state?.style?.[STYLE_INDICATOR_IMAGE];

  const isSwimlane = (cell, ignoreState) => {
    if (
      isSet(cell) &&
      getModel().getParent(cell) !== getModel().getRoot() &&
      !getModel().isEdge(cell)
    ) {
      return (
        getCurrentCellStyle(cell, ignoreState)[STYLE_SHAPE] === SHAPE_SWIMLANE
      );
    }

    return false;
  };

  /**
   * Group: Graph behaviour
   */

  const isCellLocked = (cell) => {
    const geometry = getModel().getGeometry(cell);

    return (
      isCellsLocked() ||
      (isSet(geometry) && getModel().isVertex(cell) && geometry.isRelative())
    );
  };

  const getCloneableCells = (cells) =>
    getModel().filterCells(cells, (cell) => isCellsCloneable(cell));

  const isCellCloneable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return isCellsCloneable() && style[STYLE_CLONEABLE] !== 0;
  };

  const getExportableCells = (cells) =>
    getModel().filterCells(cells, (cell) => canExportCell(cell));

  const canExportCell = (cell) => isExportEnabled();

  const getImportableCells = (cells) =>
    getModel().filterCells(cells, (cell) => canImportCell(cell));

  const canImportCell = (cell) => isImportEnabled();

  const isCellSelectable = (cell) => isCellsSelectable();

  const getDeletableCells = (cells) =>
    getModel().filterCells(cells, (cell) => isCellDeletable(cell));

  const isCellDeletable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return isCellsDeletable() && style[STYLE_DELETABLE] !== 0;
  };

  const isLabelMovable = (cell) =>
    !isCellLocked(cell) &&
    ((getModel().isEdge(cell) && isEdgeLabelsMovable()) ||
      (getModel().isVertex(cell) && isVertexLabelsMovable()));

  const isCellRotatable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return style[STYLE_ROTATABLE] !== 0;
  };

  const getMovableCells = (cells) =>
    getModel().filterCells(cells, (cell) => isCellMovable(cell));

  const isCellMovable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return (
      isCellsMovable() && !isCellLocked(cell) && style[STYLE_MOVABLE] !== 0
    );
  };

  const isCellResizable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return (
      isCellsResizable() &&
      !isCellLocked(cell) &&
      getValue(style, STYLE_RESIZABLE, '1') !== '0'
    );
  };

  const isCellBendable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return (
      isCellsBendable() && !isCellLocked(cell) && style[STYLE_BENDABLE] !== 0
    );
  };

  const isCellEditable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return (
      isCellsEditable() && !isCellLocked(cell) && style[STYLE_EDITABLE] !== 0
    );
  };

  const isCellDisconnectable = (cell, terminal, source) =>
    isCellsDisconnectable() && !isCellLocked(cell);

  const isValidSource = (cell) =>
    (isUnset(cell) && isAllowDanglingEdges()) ||
    (isSet(cell) &&
      (!getModel().isEdge(cell) || isConnectableEdges()) &&
      isCellConnectable(cell));

  const isValidTarget = isValidSource(cell);

  const isValidConnection = (source, target) =>
    isValidSource(source) && isValidTarget(target);

  const setConnectable = (connectable) =>
    getConnectionHandler().setEnabled(connectable);

  const isConnectable = () => getConnectionHandler().isEnabled();

  const setTooltips = (enabled) => getTooltipHandler().setEnabled(enabled);

  const setPanning = (enabled) =>
    getPanningHandler().setPanningEnabled(enabled);

  const isEditing = (cell) => {
    if (isSet(getCellEditor())) {
      const editingCell = getCellEditor().getEditingCell();

      return isUnset(cell) ? isSet(editingCell) : cell === editingCell;
    }

    return false;
  };

  const isAutoSizeCell = (cell) => {
    const style = getCurrentCellStyle(cell);

    return isAutoSizeCells() || style[STYLE_AUTOSIZE] === 1;
  };

  const isExtendParent = (cell) =>
    !getModel().isEdge(cell) && isExtendParents();

  const isConstrainChild = (cell) =>
    isConstrainChildren() && !getModel().isEdge(getModel().getParent(cell));

  const getOverlap = (cell) =>
    isAllowOverlapParent(cell) ? getDefaultOverlap() : 0;

  const isAllowOverlapParent = (cell) => false;

  const getFoldableCells = (cells, collapse) =>
    getModel().filterCells(cells, (cell) => isCellFoldable(cell, collapse));

  const isCellFoldable = (cell, collapse) => {
    const style = getCurrentCellStyle(cell);

    return getModel().getChildCount(cell) > 0 && style[STYLE_FOLDABLE] !== 0;
  };

  const isValidDropTarget = (cell, cells, evt) =>
    isSet(cell) &&
    ((isSplitEnabled() && isSplitTarget(cell, cells, evt)) ||
      (!getModel().isEdge(cell) &&
        (isSwimlane(cell) ||
          (getModel().getChildCount(cell) > 0 && !isCellCollapsed(cell)))));

  const isSplitTarget = (target, cells, evt) => {
    const model = getModel();

    if (
      model.isEdge(target) &&
      isSet(cells) &&
      cells.length == 1 &&
      isCellConnectable(cells[0]) &&
      isUnset(
        getEdgeValidationError(
          target,
          model.getTerminal(target, true),
          cells[0]
        )
      )
    ) {
      const src = model.getTerminal(target, true);
      const trg = model.getTerminal(target, false);

      return (
        !model.isAncestor(cells[0], src) && !model.isAncestor(cells[0], trg)
      );
    }

    return false;
  };

  const getDropTarget = (cells, evt, cell, clone) => {
    const model = getModel();

    if (!isSwimlaneNesting()) {
      for (let i = 0; i < cells.length; i++) {
        if (isSwimlane(cells[i])) {
          return null;
        }
      }
    }

    const pt = convertPoint(
      getContainer(),
      Event.getClientX(evt),
      Event.getClientY(evt)
    );
    pt.setX(pt.getX() - getPanDx());
    pt.setY(pt.getY() - getPanDy());
    const swimlane = getSwimlaneAt(pt.getX(), pt.getY());

    if (isUnset(cell)) {
      cell = swimlane;
    } else if (isSet(swimlane)) {
      // Checks if the cell is an ancestor of the swimlane
      // under the mouse and uses the swimlane in that case
      let tmp = model.getParent(swimlane);

      while (isSet(tmp) && isSwimlane(tmp) && tmp !== cell) {
        tmp = model.getParent(tmp);
      }

      if (tmp === cell) {
        cell = swimlane;
      }
    }

    while (
      isSet(cell) &&
      !isValidDropTarget(cell, cells, evt) &&
      !model.isLayer(cell)
    ) {
      cell = model.getParent(cell);
    }

    // Checks if parent is dropped into child if not cloning
    if (isUnset(clone) || !clone) {
      let parent = cell;

      while (isSet(parent) && cells.indexOf(parent) < 0) {
        parent = model.getParent(parent);
      }
    }

    return !model.isLayer(cell) && isUnset(parent) ? cell : null;
  };
};
