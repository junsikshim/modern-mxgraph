/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet, isUnset } from '../Helpers';
import ImageShape from '../shape/ImageShape';
import { NS_SVG, STYLE_ROTATION } from '../util/Constants';
import Dictionary from '../util/Dictionary';
import Event from '../util/Event';
import EventObject from '../util/EventObject';
import EventSource from '../util/EventSource';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import UndoableEdit from '../util/UndoableEdit';
import {
  getCurrentStyle,
  getRotatedPoint,
  getValue,
  ptSegDistSq,
  toRadians
} from '../util/Utils';
import CellState from './CellState';

/**
 * Class: mxGraphView
 *
 * Extends <mxEventSource> to implement a view for a graph. This class is in
 * charge of computing the absolute coordinates for the relative child
 * geometries, the points for perimeters and edge styles and keeping them
 * cached in <mxCellStates> for faster retrieval. The states are updated
 * whenever the model or the view state (translate, scale) changes. The scale
 * and translate are honoured in the bounds.
 *
 * Event: mxEvent.UNDO
 *
 * Fires after the root was changed in <setCurrentRoot>. The <code>edit</code>
 * property contains the <mxUndoableEdit> which contains the
 * <mxCurrentRootChange>.
 *
 * Event: mxEvent.SCALE_AND_TRANSLATE
 *
 * Fires after the scale and translate have been changed in <scaleAndTranslate>.
 * The <code>scale</code>, <code>previousScale</code>, <code>translate</code>
 * and <code>previousTranslate</code> properties contain the new and previous
 * scale and translate, respectively.
 *
 * Event: mxEvent.SCALE
 *
 * Fires after the scale was changed in <setScale>. The <code>scale</code> and
 * <code>previousScale</code> properties contain the new and previous scale.
 *
 * Event: mxEvent.TRANSLATE
 *
 * Fires after the translate was changed in <setTranslate>. The
 * <code>translate</code> and <code>previousTranslate</code> properties contain
 * the new and previous value for translate.
 *
 * Event: mxEvent.DOWN and mxEvent.UP
 *
 * Fire if the current root is changed by executing an <mxCurrentRootChange>.
 * The event name depends on the location of the root in the cell hierarchy
 * with respect to the current root. The <code>root</code> and
 * <code>previous</code> properties contain the new and previous root,
 * respectively.
 *
 * Constructor: mxGraphView
 *
 * Constructs a new view for the given <mxGraph>.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
const GraphView = (graph) => {
  // Extends EventSource.
  const { fireEvent, addListener } = EventSource();

  /**
   * Variable: captureDocumentGesture
   *
   * Specifies if a gesture should be captured when it goes outside of the
   * graph container. Default is true.
   */
  const [isCaptureDocumentGesture, setCaptureDocumentGesture] = addProp(true);

  /**
   * Variable: rendering
   *
   * Specifies if shapes should be created, updated and destroyed using the
   * methods of <mxCellRenderer> in <graph>. Default is true.
   */
  const [isRendering, setRendering] = addProp(true);

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: currentRoot
   *
   * <mxCell> that acts as the root of the displayed cell hierarchy.
   */
  const [getCurrentRoot, _setCurrentRoot] = addProp();

  /**
   * Variable: graphBounds
   *
   * <mxRectangle> that caches the scales, translated bounds of the current view.
   */
  const [getGraphBounds, setGraphBounds] = addProp(Rectangle());

  /**
   * Variable: scale
   *
   * Specifies the scale. Default is 1 (100%).
   */
  const [getScale, _setScale] = addProp(1);

  /**
   * Variable: translate
   *
   * <mxPoint> that specifies the current translation. Default is a new
   * empty <mxPoint>.
   */
  const [getTranslate, _setTranslate] = addProp(Point());

  /**
   * Variable: states
   *
   * <mxDictionary> that maps from cell IDs to <mxCellStates>.
   */
  const [getStates, setStates] = addProp(Dictionary());

  /**
   * Variable: updateStyle
   *
   * Specifies if the style should be updated in each validation step. If this
   * is false then the style is only updated if the state is created or if the
   * style of the cell was changed. Default is false.
   */
  const [isUpdateStyle, setUpdateStyle] = addProp(false);

  /**
   * Variable: lastNode
   *
   * During validation, this contains the last DOM node that was processed.
   */
  const [getLastNode, setLastNode] = addProp();

  /**
   * Variable: lastHtmlNode
   *
   * During validation, this contains the last HTML DOM node that was processed.
   */
  const [getLastHtmlNode, setLastHtmlNode] = addProp();

  /**
   * Variable: lastForegroundNode
   *
   * During validation, this contains the last edge's DOM node that was processed.
   */
  const [getLastForegroundNode, setLastForegroundNode] = addProp();

  /**
   * Variable: lastForegroundHtmlNode
   *
   * During validation, this contains the last edge HTML DOM node that was processed.
   */
  const [getLastForegroundHtmlNode, setLastForegroundHtmlNode] = addProp();
  const [getCanvas, setCanvas] = addProp();
  const [getBackgroundPane, setBackgroundPane] = addProp();
  const [getDrawPane, setDrawPane] = addProp();
  const [getOverlayPane, setOverlayPane] = addProp();
  const [getDecoratorPane, setDecoratorPane] = addProp();
  const [getMoveHandler, setMoveHandler] = addProp();
  const [getEndHandler, setEndHandler] = addProp();
  const [getBackgroundImage, setBackgroundImage] = addProp();
  const [getBackgroundPageShape, setBackgroundPageShape] = addProp();

  /**
   * Function: getBounds
   *
   * Returns the union of all <mxCellStates> for the given array of <mxCells>.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounds should be returned.
   */
  const getBounds = (cells) => {
    let result = null;

    if (isSet(cells) && cells.length > 0) {
      const model = getGraph().getModel();

      for (let i = 0; i < cells.length; i++) {
        if (model.isVertex(cells[i]) || model.isEdge(cells[i])) {
          const state = getState(cells[i]);

          if (isSet(state)) {
            if (isUnset(result)) {
              result = Rectangle.fromRectangle(state);
            } else {
              result.add(state);
            }
          }
        }
      }
    }

    return result;
  };

  /**
   * Function: setCurrentRoot
   *
   * Sets and returns the current root and fires an <undo> event before
   * calling <mxGraph.sizeDidChange>.
   *
   * Parameters:
   *
   * root - <mxCell> that specifies the root of the displayed cell hierarchy.
   */
  const setCurrentRoot = (root) => {
    if (getCurrentRoot() !== root) {
      const change = CurrentRootChange(me, root);
      change.execute();
      const edit = UndoableEdit(me, true);
      edit.add(change);
      fireEvent(EventObject(Event.UNDO, 'edit', edit));
      getGraph().sizeDidChange();
    }

    return root;
  };

  /**
   * Function: scaleAndTranslate
   *
   * Sets the scale and translation and fires a <scale> and <translate> event
   * before calling <revalidate> followed by <mxGraph.sizeDidChange>.
   *
   * Parameters:
   *
   * scale - Decimal value that specifies the new scale (1 is 100%).
   * dx - X-coordinate of the translation.
   * dy - Y-coordinate of the translation.
   */
  const scaleAndTranslate = (scale, dx, dy) => {
    const translate = getTranslate();
    const previousScale = getScale();
    const previousTranslate = Point(translate.getX(), translate.getY());

    if (
      getScale() !== scale ||
      translate.getX() !== dx ||
      translate.getY() !== dy
    ) {
      setScale(scale);

      translate.setX(dx);
      translate.setY(dy);

      if (isEventsEnabled()) {
        viewStateChanged();
      }
    }

    fireEvent(
      EventObject(
        Event.SCALE_AND_TRANSLATE,
        'scale',
        scale,
        'previousScale',
        previousScale,
        'translate',
        translate,
        'previousTranslate',
        previousTranslate
      )
    );
  };

  /**
   * Function: setScale
   *
   * Sets the scale and fires a <scale> event before calling <revalidate> followed
   * by <mxGraph.sizeDidChange>.
   *
   * Parameters:
   *
   * value - Decimal value that specifies the new scale (1 is 100%).
   */
  const setScale = (value) => {
    const previousScale = getScale();

    if (getScale() !== value) {
      setScale(value);

      if (isEventsEnabled()) {
        viewStateChanged();
      }
    }

    fireEvent(
      EventObject(Event.SCALE, 'scale', value, 'previousScale', previousScale)
    );
  };

  /**
   * Function: setTranslate
   *
   * Sets the translation and fires a <translate> event before calling
   * <revalidate> followed by <mxGraph.sizeDidChange>. The translation is the
   * negative of the origin.
   *
   * Parameters:
   *
   * dx - X-coordinate of the translation.
   * dy - Y-coordinate of the translation.
   */
  const setTranslate = (dx, dy) => {
    const translate = getTranslate();
    const previousTranslate = Point(translate.getX(), translate.getY());

    if (translate.getX() !== dx || translate.getY() !== dy) {
      translate.setX(dx);
      translate.setY(dy);

      if (isEventsEnabled()) {
        viewStateChanged();
      }
    }

    fireEvent(
      EventObject(
        Event.TRANSLATE,
        'translate',
        translate,
        'previousTranslate',
        previousTranslate
      )
    );
  };

  /**
   * Function: viewStateChanged
   *
   * Invoked after <scale> and/or <translate> has changed.
   */
  const viewStateChanged = () => {
    revalidate();
    getGraph().sizeDidChange();
  };

  /**
   * Function: refresh
   *
   * Clears the view if <currentRoot> is not null and revalidates.
   */
  const refresh = () => {
    if (isSet(getCurrentRoot())) clear();

    revalidate();
  };

  /**
   * Function: revalidate
   *
   * Revalidates the complete view with all cell states.
   */
  const revalidate = () => {
    invalidate();
    validate();
  };

  /**
   * Function: clear
   *
   * Removes the state of the given cell and all descendants if the given
   * cell is not the current root.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> for which the state should be removed. Default
   * is the root of the model.
   * force - Boolean indicating if the current root should be ignored for
   * recursion.
   */
  const clear = (cell, force = false, recurse = true) => {
    const model = getGraph().getModel();
    cell = cell || model.getRoot();

    removeState(cell);

    if (recurse && (force || cell !== getCurrentRoot())) {
      const childCount = model.getChildCount(cell);

      for (let i = 0; i < childCount; i++) {
        clear(model.getChildAt(cell, i), force);
      }
    } else {
      invalidate(cell);
    }
  };

  /**
   * Function: invalidate
   *
   * Invalidates the state of the given cell, all its descendants and
   * connected edges.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> to be invalidated. Default is the root of the
   * model.
   */
  const invalidate = (cell, recurse = true, includeEdges = true) => {
    const model = getGraph().getModel();
    cell = cell || model.getRoot();

    const state = getState(cell);

    if (isSet(state)) {
      state.setInvalid(true);
    }

    // Avoids infinite loops for invalid graphs
    if (!cell.invalidating) {
      cell.invalidating = true;

      // Recursively invalidates all descendants
      if (recurse) {
        const childCount = model.getChildCount(cell);

        for (let i = 0; i < childCount; i++) {
          const child = model.getChildAt(cell, i);
          invalidate(child, recurse, includeEdges);
        }
      }

      // Propagates invalidation to all connected edges
      if (includeEdges) {
        const edgeCount = model.getEdgeCount(cell);

        for (let i = 0; i < edgeCount; i++) {
          invalidate(model.getEdgeAt(cell, i), recurse, includeEdges);
        }
      }

      delete cell.invalidating;
    }
  };

  /**
   * Function: validate
   *
   * Calls <validateCell> and <validateCellState> and updates the <graphBounds>
   * using <getBoundingBox>. Finally the background is validated using
   * <validateBackground>.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> to be used as the root of the validation.
   * Default is <currentRoot> or the root of the model.
   */
  const validate = (cell) => {
    resetValidationState();

    const graphBounds = getBoundingBox(
      validateCellState(
        validateCell(
          cell ||
            (isSet(getCurrentRoot())
              ? getCurrentRoot()
              : getGraph().getModel().getRoot())
        )
      )
    );
    setGraphBounds(isSet(graphBounds) ? graphBounds : getEmptyBounds());
    validateBackground();

    resetValidationState();
  };

  /**
   * Function: getEmptyBounds
   *
   * Returns the bounds for an empty graph. This returns a rectangle at
   * <translate> with the size of 0 x 0.
   */
  const getEmptyBounds = () =>
    Rectangle(
      getTranslate().getX() * getScale(),
      getTranslate().getY() * getScale()
    );

  /**
   * Function: getBoundingBox
   *
   * Returns the bounding box of the shape and the label for the given
   * <mxCellState> and its children if recurse is true.
   *
   * Parameters:
   *
   * state - <mxCellState> whose bounding box should be returned.
   * recurse - Optional boolean indicating if the children should be included.
   * Default is true.
   */
  const getBoundingBox = (state, recurse = true) => {
    let bbox;

    if (isSet(state)) {
      const text = state.getText();

      if (isSet(state.getShape()) && isSet(state.getShape().getBoundingBox())) {
        bbox = state.getShape().getBoundingBox().clone();
      }

      // Adds label bounding box to graph bounds
      if (isSet(text) && isSet(text.getBoundingBox())) {
        if (isSet(bbox)) {
          bbox.add(text.getBoundingBox());
        } else {
          bbox = text.getBoundingBox().clone();
        }
      }

      if (recurse) {
        const model = getGraph().getModel();
        const childCount = model.getChildCount(state.getCell());

        for (let i = 0; i < childCount; i++) {
          const bounds = getBoundingBox(
            getState(model.getChildAt(state.getCell(), i))
          );

          if (isSet(bounds)) {
            if (isUnset(bbox)) {
              bbox = bounds;
            } else {
              bbox.add(bounds);
            }
          }
        }
      }
    }

    return bbox;
  };

  /**
   * Function: createBackgroundPageShape
   *
   * Creates and returns the shape used as the background page.
   *
   * Parameters:
   *
   * bounds - <mxRectangle> that represents the bounds of the shape.
   */
  const createBackgroundPageShape = (bounds) =>
    RectangleShape(bounds, 'white', 'black');

  /**
   * Function: validateBackground
   *
   * Calls <validateBackgroundImage> and <validateBackgroundPage>.
   */
  const validateBackground = () => {
    validateBackgroundImage();
    validateBackgroundPage();
  };

  /**
   * Function: validateBackgroundImage
   *
   * Validates the background image.
   */
  const validateBackgroundImage = () => {
    const bg = getGraph().getBackgroundImage();

    if (isSet(bg)) {
      if (
        isUnset(getBackgroundImage()) ||
        getBackgroundImage().getImage() !== bg.getSrc()
      ) {
        if (isSet(getBackgroundImage())) {
          getBackgroundImage().destroy();
        }

        const bounds = Rectangle(0, 0, 1, 1);

        const backgroundImage = ImageShape(bounds, bg.getSrc());
        setBackgroundImage(backgroundImage);
        backgroundImage.init(getBackgroundPane());
        backgroundImage.redraw();
      }

      redrawBackgroundImage(backgroundImage, bg);
    } else if (isSet(getBackgroundImage())) {
      getBackgroundImage().destroy();
      setBackgroundImage(null);
    }
  };

  /**
   * Function: validateBackgroundPage
   *
   * Validates the background page.
   */
  const validateBackgroundPage = () => {
    if (getGraph().isPageVisible()) {
      const bounds = getBackgroundPageBounds();

      if (isUnset(getBackgroundPageShape())) {
        const backgroundPageShape = createBackgroundPageShape(bounds);
        setBackgroundPageShape(backgroundPageShape);
        backgroundPageShape.setScale(getScale());
        backgroundPageShape.setShadow(true);
        backgroundPageShape.init(getBackgroundPane());
        backgroundPageShape.redraw();

        // Adds listener for double click handling on background
        if (getGraph().isNativeDblClickEnabled()) {
          Event.addListener(backgroundPageShape.node, 'dblclick', (evt) =>
            getGraph().dblClick(evt)
          );
        }

        // Adds basic listeners for graph event dispatching outside of the
        // container and finishing the handling of a single gesture
        Event.addGestureListeners(
          backgroundPageShape.getNode(),
          (evt) => getGraph().fireMouseEvent(Event.MOUSE_DOWN, MouseEvent(evt)),

          (evt) => {
            const graph = getGraph();

            // Hides the tooltip if mouse is outside container
            if (
              isSet(graph.getTooltipHandler()) &&
              graph.getTooltipHandler().isHideOnHover()
            ) {
              graph.getTooltipHandler().hide();
            }

            if (graph.isMouseDown() && !Event.isConsumed(evt)) {
              graph.fireMouseEvent(Event.MOUSE_MOVE, MouseEvent(evt));
            }
          },
          (evt) => getGraph().fireMouseEvent(Event.MOUSE_UP, MouseEvent(evt))
        );
      } else {
        backgroundPageShape.setScale(getScale());
        backgroundPageShape.setBounds(bounds);
        backgroundPageShape.redraw();
      }
    } else if (isSet(getBackgroundPageShape())) {
      getBackgroundPageShape().destroy();
      setBackgroundPageShape(null);
    }
  };

  /**
   * Function: getBackgroundPageBounds
   *
   * Returns the bounds for the background page.
   */
  const getBackgroundPageBounds = () => {
    const fmt = getGraph().getPageFormat();
    const scale = getScale();
    const translate = getTranslate();
    const ps = scale * getGraph().getPageScale();
    const bounds = Rectangle(
      scale * translate.getX(),
      scale * translate.getY(),
      fmt.getWidth() * ps,
      fmt.getHeight() * ps
    );

    return bounds;
  };

  /**
   * Function: redrawBackgroundImage
   *
   * Updates the bounds and redraws the background image.
   *
   * Example:
   *
   * If the background image should not be scaled, this can be replaced with
   * the following.
   *
   * (code)
   * mxGraphView.prototype.redrawBackground = function(backgroundImage, bg)
   * {
   *   backgroundImage.bounds.x = this.translate.x;
   *   backgroundImage.bounds.y = this.translate.y;
   *   backgroundImage.bounds.width = bg.width;
   *   backgroundImage.bounds.height = bg.height;
   *
   *   backgroundImage.redraw();
   * };
   * (end)
   *
   * Parameters:
   *
   * backgroundImage - <mxImageShape> that represents the background image.
   * bg - <mxImage> that specifies the image and its dimensions.
   */
  const redrawBackgroundImage = (backgroundImage, bg) => {
    const scale = getScale();

    backgroundImage.setScale(scale);
    backgroundImage.getBounds().setX(scale * getTranslate().getX());
    backgroundImage.getBounds().setY(scale * getTranslate().getY());
    backgroundImage.getBounds().setWidth(scale * bg.getWidth());
    backgroundImage.getBounds().setHeight(scale * bg.getHeight());

    backgroundImage.redraw();
  };

  /**
   * Function: validateCell
   *
   * Recursively creates the cell state for the given cell if visible is true and
   * the given cell is visible. If the cell is not visible but the state exists
   * then it is removed using <removeState>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose <mxCellState> should be created.
   * visible - Optional boolean indicating if the cell should be visible. Default
   * is true.
   */
  const validateCell = (cell, visible = true) => {
    if (isSet(cell)) {
      visible = visible && getGraph().isCellVisible(cell);
      const state = getState(cell, visible);

      if (isSet(state) && !visible) {
        removeState(cell);
      } else {
        const model = getGraph().getModel();
        const childCount = model.getChildCount(cell);

        for (let i = 0; i < childCount; i++) {
          validateCell(
            model.getChildAt(cell, i),
            visible && (!isCellCollapsed(cell) || cell === getCurrentRoot())
          );
        }
      }
    }

    return cell;
  };

  /**
   * Function: validateCellState
   *
   * Validates and repaints the <mxCellState> for the given <mxCell>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose <mxCellState> should be validated.
   * recurse - Optional boolean indicating if the children of the cell should be
   * validated. Default is true.
   */
  const validateCellState = (cell, recurse = true) => {
    let state = null;

    if (isSet(cell)) {
      state = getState(cell);

      if (isSet(state)) {
        const model = getGraph().getModel();

        if (state.isInvalid()) {
          state.setInvalid(false);

          if (isUnset(state.getStyle()) || state.isInvalidStyle()) {
            state.setStyle(getGraph().getCellStyle(state.getCell()));
            state.setInvalidStyle(false);
          }

          if (cell !== getCurrentRoot()) {
            validateCellState(model.getParent(cell), false);
          }

          state.setVisibleTerminalState(
            validateCellState(getVisibleTerminal(cell, true), false),
            true
          );
          state.setVisibleTerminalState(
            validateCellState(getVisibleTerminal(cell, false), false),
            false
          );

          updateCellState(state);

          // Repaint happens immediately after the cell is validated
          if (cell !== getCurrentRoot() && !state.isInvalid()) {
            getGraph().getCellRenderer().redraw(state, false, isRendering());

            // Handles changes to invertex paintbounds after update of rendering shape
            state.updateCachedBounds();
          }
        }

        if (recurse && !state.isInvalid()) {
          // Updates order in DOM if recursively traversing
          if (isSet(state.getShape())) {
            stateValidated(state);
          }

          const childCount = model.getChildCount(cell);

          for (let i = 0; i < childCount; i++) {
            validateCellState(model.getChildAt(cell, i));
          }
        }
      }
    }

    return state;
  };

  /**
   * Function: updateCellState
   *
   * Updates the given <mxCellState>.
   *
   * Parameters:
   *
   * state - <mxCellState> to be updated.
   */
  const updateCellState = (state) => {
    state.getAbsoluteOffset().setX(0);
    state.getAbsoluteOffset().setY(0);
    state.getOrigin().setX(0);
    state.getOrigin().setY(0);
    state.setLength(0);

    if (state.getCell() !== getCurrentRoot()) {
      const model = getGraph().getModel();
      const pState = getState(model.getParent(state.getCell()));
      const origin = state.getOrigin();

      if (isSet(pState) && pState.getCell() !== getCurrentRoot()) {
        origin.setX(origin.getX() + pState.getOrigin().getX());
        origin.setY(origin.getY() + pState.getOrigin().getY());
      }

      const offset = getGraph().getChildOffsetForCell(state.getCell());

      if (isSet(offset)) {
        origin.setX(origin.getX() + offset.getX());
        origin.setY(origin.getY() + offset.getY());
      }

      const geo = getGraph().getCellGeometry(state.getCell());
      const stateOrigin = state.getOrigin();
      const scale = getScale();
      const translate = getTranslate();

      if (isSet(geo)) {
        if (!model.isEdge(state.getCell())) {
          offset = isSet(geo.offset) ? geo.offset : Point();

          if (geo.relative && isSet(pState)) {
            if (model.isEdge(pState.getCell())) {
              const origin = getPoint(pState, geo);

              if (isSet(origin)) {
                stateOrigin.setX(
                  stateOrigin.getX() +
                    origin.getX() / scale -
                    pState.getOrigin().getX() -
                    translate.getX()
                );
                stateOrigin.setY(
                  stateOrigin.getY() +
                    origin.getY() / scale -
                    pState.getOrigin().getY() -
                    translate.getY()
                );
              }
            } else {
              stateOrigin.setX(
                stateOrigin.getX() +
                  geo.getX() * pState.getUnscaledWidth() +
                  offset.getX()
              );
              stateOrigin.setY(
                stateOrigin.getY() +
                  geo.getY() * pState.getUnscaledHeight() +
                  offset.getY()
              );
            }
          } else {
            state.getAbsoluteOffset().setX(scale * offset.getX());
            state.getAbsoluteOffset().setY(scale * offset.getY());
            stateOrigin.setX(stateOrigin.getX() + geo.getX());
            stateOrigin.setY(stateOrigin.getY() + geo.getY());
          }
        }

        state.setX(scale * (translate.getX() + stateOrigin.getX()));
        state.setY(scale * (translate.getY() + stateOrigin.getY()));
        state.setWidth(scale * geo.getWidth());
        state.setUnscaledWidth(geo.getWidth());
        state.setHeight(scale * geo.getHeight());
        state.setUnscaledHeight(geo.getHeight());

        if (model.isVertex(state.getCell())) {
          updateVertexState(state, geo);
        }

        if (model.isEdge(state.getCell())) {
          updateEdgeState(state, geo);
        }
      }
    }

    state.updateCachedBounds();
  };

  /**
   * Function: isCellCollapsed
   *
   * Returns true if the children of the given cell should not be visible in the
   * view. This implementation uses <mxGraph.isCellVisible> but it can be
   * overidden to use a separate condition.
   */
  const isCellCollapsed = (cell) => getGraph().isCellCollapsed(cell);

  /**
   * Function: updateVertexState
   *
   * Validates the given cell state.
   */
  const updateVertexState = (state, geo) => {
    const model = getGraph().getModel();
    const pState = getState(model.getParent(state.getCell()));

    if (geo.isRelative() && isSet(pState) && !model.isEdge(pState.getCell())) {
      const alpha = toRadians(pState.getStyle()[STYLE_ROTATION] || '0');

      if (alpha !== 0) {
        const cos = Math.cos(alpha);
        const sin = Math.sin(alpha);

        const ct = Point(state.getCenterX(), state.getCenterY());
        const cx = Point(pState.getCenterX(), pState.getCenterY());
        const pt = getRotatedPoint(ct, cos, sin, cx);
        state.setX(pt.getX() - state.getWidth() / 2);
        state.setY(pt.getY() - state.getHeight() / 2);
      }
    }

    updateVertexLabelOffset(state);
  };

  /**
   * Function: updateEdgeState
   *
   * Validates the given cell state.
   */
  const updateEdgeState = (state, geo) => {
    const source = state.getVisibleTerminalState(true);
    const target = state.getVisibleTerminalState(false);

    // This will remove edges with no terminals and no terminal points
    // as such edges are invalid and produce NPEs in the edge styles.
    // Also removes connected edges that have no visible terminals.
    if (
      (isSet(getGraph().getModel().getTerminal(state.getCell(), true)) &&
        isUnset(source)) ||
      (isUnset(source) && isUnset(geo.getTerminalPoint(true))) ||
      (isSet(getGraph().getModel().getTerminal(state.cell, false)) &&
        isUnset(target)) ||
      (isUnset(target) && isUnset(geo.getTerminalPoint(false)))
    ) {
      clear(state.getCell(), true);
    } else {
      updateFixedTerminalPoints(state, source, target);
      updatePoints(state, geo.getPoints(), source, target);
      updateFloatingTerminalPoints(state, source, target);

      const pts = state.getAbsolutePoints();

      if (
        state.getCell() !== getCurrentRoot() &&
        (isUnset(pts) ||
          pts.length < 2 ||
          isUnset(pts[0]) ||
          isUnset(pts[pts.length - 1]))
      ) {
        // This will remove edges with invalid points from the list of states in the view.
        // Happens if the one of the terminals and the corresponding terminal point is null.
        clear(state.getCell(), true);
      } else {
        updateEdgeBounds(state);
        updateEdgeLabelOffset(state);
      }
    }
  };

  /**
   * Function: updateVertexLabelOffset
   *
   * Updates the absoluteOffset of the given vertex cell state. This takes
   * into account the label position styles.
   *
   * Parameters:
   *
   * state - <mxCellState> whose absolute offset should be updated.
   */
  const updateVertexLabelOffset = (state) => {
    const absoluteOffset = state.getAbsoluteOffset();
    const h = getValue(state.getStyle(), STYLE_LABEL_POSITION, ALIGN_CENTER);

    if (h === ALIGN_LEFT) {
      let lw = getValue(state.getStyle(), STYLE_LABEL_WIDTH, null);

      if (isSet(lw)) {
        lw *= getScale();
      } else {
        lw = state.getWidth();
      }

      absoluteOffset.setX(absoluteOffset.getX() + lw);
    } else if (h === ALIGN_RIGHT) {
      absoluteOffset.setX(absoluteOffset.getX() + state.getWidth());
    } else if (h === ALIGN_CENTER) {
      const lw = getValue(state.getStyle(), STYLE_LABEL_WIDTH, null);

      if (isSet(lw)) {
        // Aligns text block with given width inside the vertex width
        const align = getValue(state.getStyle(), STYLE_ALIGN, ALIGN_CENTER);
        let dx = 0;

        if (align === ALIGN_CENTER) {
          dx = 0.5;
        } else if (align === ALIGN_RIGHT) {
          dx = 1;
        }

        if (dx !== 0) {
          absoluteOffset.setX(
            absoluteOffset.getX() - (lw * getScale() - state.getWidth()) * dx
          );
        }
      }
    }

    const v = getValue(
      state.getStyle(),
      STYLE_VERTICAL_LABEL_POSITION,
      ALIGN_MIDDLE
    );

    if (v === ALIGN_TOP) {
      absoluteOffset.setY(absoluteOffset.getY() - state.getHeight());
    } else if (v === ALIGN_BOTTOM) {
      absoluteOffset.setY(absoluteOffset.getY() + state.getHeight());
    }
  };

  /**
   * Function: resetValidationState
   *
   * Resets the current validation state.
   */
  const resetValidationState = () => {
    setLastNode();
    setLastHtmlNode();
    setLastForegroundNode();
    setLastForegroundHtmlNode();
  };

  /**
   * Function: stateValidated
   *
   * Invoked when a state has been processed in <validatePoints>. This is used
   * to update the order of the DOM nodes of the shape.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the cell state.
   */
  const stateValidated = (state) => {
    const graph = getGraph();
    const model = graph.getModel();
    const fg =
      (model.isEdge(state.getCell()) && graph.isKeepEdgesInForeground()) ||
      (model.isVertex(state.getCell()) && graph.isKeepEdgesInBackground());
    const htmlNode = fg
      ? getLastForegroundHtmlNode() || getLastHtmlNode()
      : getLastHtmlNode();
    const node = fg ? getLastForegroundNode() || getLastNode() : getLastNode();
    const result = graph
      .getCellRenderer()
      .insertStateAfter(state, node, htmlNode);

    if (fg) {
      setLastForegroundHtmlNode(result[1]);
      setLastForegroundNode(result[0]);
    } else {
      setLastHtmlNode(result[1]);
      setLastNode(result[0]);
    }
  };

  /**
   * Function: updateFixedTerminalPoints
   *
   * Sets the initial absolute terminal points in the given state before the edge
   * style is computed.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose initial terminal points should be updated.
   * source - <mxCellState> which represents the source terminal.
   * target - <mxCellState> which represents the target terminal.
   */
  const updateFixedTerminalPoints = (edge, source, target) => {
    updateFixedTerminalPoint(
      edge,
      source,
      true,
      getGraph().getConnectionConstraint(edge, source, true)
    );
    updateFixedTerminalPoint(
      edge,
      target,
      false,
      getGraph().getConnectionConstraint(edge, target, false)
    );
  };

  /**
   * Function: updateFixedTerminalPoint
   *
   * Sets the fixed source or target terminal point on the given edge.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose terminal point should be updated.
   * terminal - <mxCellState> which represents the actual terminal.
   * source - Boolean that specifies if the terminal is the source.
   * constraint - <mxConnectionConstraint> that specifies the connection.
   */
  const updateFixedTerminalPoint = (edge, terminal, source, constraint) =>
    edge.setAbsoluteTerminalPoint(
      getFixedTerminalPoint(edge, terminal, source, constraint),
      source
    );

  /**
   * Function: getFixedTerminalPoint
   *
   * Returns the fixed source or target terminal point for the given edge.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose terminal point should be returned.
   * terminal - <mxCellState> which represents the actual terminal.
   * source - Boolean that specifies if the terminal is the source.
   * constraint - <mxConnectionConstraint> that specifies the connection.
   */
  const getFixedTerminalPoint = (edge, terminal, source, constraint) => {
    let pt = null;

    if (isSet(constraint)) {
      pt = getGraph().getConnectionPoint(terminal, constraint, false); // FIXME Rounding introduced bugs when calculating label positions -> , getGraph().isOrthogonal(edge));
    }

    if (isUnset(pt) && isUnset(terminal)) {
      const s = getScale();
      const tr = getTranslate();
      const orig = edge.getOrigin();
      const geo = getGraph().getCellGeometry(edge.getCell());
      pt = geo.getTerminalPoint(source);

      if (isSet(pt)) {
        pt = Point(
          s * (tr.getX() + pt.getX() + orig.getX()),
          s * (tr.getY() + pt.getY() + orig.getY())
        );
      }
    }

    return pt;
  };

  /**
   * Function: updateBoundsFromStencil
   *
   * Updates the bounds of the given cell state to reflect the bounds of the stencil
   * if it has a fixed aspect and returns the previous bounds as an <mxRectangle> if
   * the bounds have been modified or null otherwise.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose bounds should be updated.
   */
  const updateBoundsFromStencil = (state) => {
    let previous = null;

    if (
      isSet(state) &&
      isSet(state.getShape()) &&
      isSet(state.getShape().getStencil()) &&
      state.getShape().getStencil().getAspect() === 'fixed'
    ) {
      previous = Rectangle.fromRectangle(state);
      const asp = state
        .getShape()
        .getStencil()
        .computeAspect(
          state.getStyle(),
          state.getX(),
          state.getY(),
          state.getWidth(),
          state.getHeight()
        );
      state.setRect(
        asp.getX(),
        asp.getY(),
        state.getShape().getStencil().getW0() * asp.getWidth(),
        state.getShape().getStencil().getH0() * asp.getHeight()
      );
    }

    return previous;
  };

  /**
   * Function: updatePoints
   *
   * Updates the absolute points in the given state using the specified array
   * of <mxPoints> as the relative points.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose absolute points should be updated.
   * points - Array of <mxPoints> that constitute the relative points.
   * source - <mxCellState> that represents the source terminal.
   * target - <mxCellState> that represents the target terminal.
   */
  const updatePoints = (edge, points, source, target) => {
    if (isSet(edge)) {
      const pts = [];
      pts.push(edge.getAbsolutePoints()[0]);
      const edgeStyle = getEdgeStyle(edge, points, source, target);

      if (isSet(edgeStyle)) {
        const src = getTerminalPort(edge, source, true);
        const trg = getTerminalPort(edge, target, false);

        // Uses the stencil bounds for routing and restores after routing
        const srcBounds = updateBoundsFromStencil(src);
        const trgBounds = updateBoundsFromStencil(trg);

        edgeStyle(edge, src, trg, points, pts);

        // Restores previous bounds
        if (isSet(srcBounds)) {
          src.setRect(
            srcBounds.getX(),
            srcBounds.getY(),
            srcBounds.getWidth(),
            srcBounds.getHeight()
          );
        }

        if (isSet(trgBounds)) {
          trg.setRect(
            trgBounds.getX(),
            trgBounds.getY(),
            trgBounds.getWidth(),
            trgBounds.getHeight()
          );
        }
      } else if (isSet(points)) {
        for (let i = 0; i < points.length; i++) {
          if (isSet(points[i])) {
            const pt = clone(points[i]);
            pts.push(transformControlPoint(edge, pt));
          }
        }
      }

      const tmp = edge.getAbsolutePoints();
      pts.push(tmp[tmp.length - 1]);

      edge.setAbsolutePoints(pts);
    }
  };

  /**
   * Function: transformControlPoint
   *
   * Transforms the given control point to an absolute point.
   */
  const transformControlPoint = (state, pt, ignoreScale) => {
    if (isSet(state) && isSet(pt)) {
      const orig = state.getOrigin();
      const scale = ignoreScale ? 1 : getScale();
      const translate = getTranslate();

      return Point(
        scale * (pt.getX() + translate.getX() + orig.getX()),
        scale * (pt.getY() + translate.getY() + orig.getY())
      );
    }

    return null;
  };

  /**
   * Function: isLoopStyleEnabled
   *
   * Returns true if the given edge should be routed with <mxGraph.defaultLoopStyle>
   * or the <mxConstants.STYLE_LOOP> defined for the given edge. This implementation
   * returns true if the given edge is a loop and does not have connections constraints
   * associated.
   */
  const isLoopStyleEnabled = (edge, points, source, target) => {
    const sc = getGraph().getConnectionConstraint(edge, source, true);
    const tc = getGraph().getConnectionConstraint(edge, target, false);

    if (
      (isUnset(points) || points.length < 2) &&
      (!getValue(edge.getStyle(), STYLE_ORTHOGONAL_LOOP, false) ||
        isUnset(sc) ||
        (isUnset(sc.point) && (isUnset(tc) || isUnset(tc.point))))
    ) {
      return isSet(source) && source === target;
    }

    return false;
  };

  /**
   * Function: getEdgeStyle
   *
   * Returns the edge style function to be used to render the given edge state.
   */
  const getEdgeStyle = (edge, points, source, target) => {
    let edgeStyle = isLoopStyleEnabled(edge, points, source, target)
      ? getValue(edge.getStyle(), STYLE_LOOP, getGraph().getDefaultLoopStyle())
      : !getValue(edge.getStyle(), STYLE_NOEDGESTYLE, false)
      ? edge.getStyle()[STYLE_EDGE]
      : null;

    // Converts string values to objects
    if (typeof edgeStyle === 'string') {
      edgeStyle = StyleRegistry.getValue(edgeStyle);
    }

    if (typeof edgeStyle === 'function') {
      return edgeStyle;
    }

    return null;
  };

  /**
   * Function: updateFloatingTerminalPoints
   *
   * Updates the terminal points in the given state after the edge style was
   * computed for the edge.
   *
   * Parameters:
   *
   * state - <mxCellState> whose terminal points should be updated.
   * source - <mxCellState> that represents the source terminal.
   * target - <mxCellState> that represents the target terminal.
   */
  const updateFloatingTerminalPoints = (state, source, target) => {
    const pts = state.getAbsolutePoints();
    const p0 = pts[0];
    const pe = pts[pts.length - 1];

    if (isUnset(pe) && isSet(target)) {
      updateFloatingTerminalPoint(state, target, source, false);
    }

    if (isUnset(p0) && isSet(source)) {
      updateFloatingTerminalPoint(state, source, target, true);
    }
  };

  /**
   * Function: updateFloatingTerminalPoint
   *
   * Updates the absolute terminal point in the given state for the given
   * start and end state, where start is the source if source is true.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose terminal point should be updated.
   * start - <mxCellState> for the terminal on "this" side of the edge.
   * end - <mxCellState> for the terminal on the other side of the edge.
   * source - Boolean indicating if start is the source terminal state.
   */
  const updateFloatingTerminalPoint = (edge, start, end, source) =>
    edge.setAbsoluteTerminalPoint(
      getFloatingTerminalPoint(edge, start, end, source),
      source
    );

  /**
   * Function: getFloatingTerminalPoint
   *
   * Returns the floating terminal point for the given edge, start and end
   * state, where start is the source if source is true.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose terminal point should be returned.
   * start - <mxCellState> for the terminal on "this" side of the edge.
   * end - <mxCellState> for the terminal on the other side of the edge.
   * source - Boolean indicating if start is the source terminal state.
   */
  const getFloatingTerminalPoint = (edge, start, end, source) => {
    start = getTerminalPort(edge, start, source);
    let next = getNextPoint(edge, end, source);

    const orth = getGraph().isOrthogonal(edge);
    const alpha = toRadians(Number(start.style[STYLE_ROTATION] || '0'));
    const center = Point(start.getCenterX(), start.getCenterY());

    if (alpha !== 0) {
      const cos = Math.cos(-alpha);
      const sin = Math.sin(-alpha);
      next = getRotatedPoint(next, cos, sin, center);
    }

    let border = parseFloat(edge.getStyle()[STYLE_PERIMETER_SPACING] || 0);
    border += parseFloat(
      edge.getStyle()[
        source ? STYLE_SOURCE_PERIMETER_SPACING : STYLE_TARGET_PERIMETER_SPACING
      ] || 0
    );
    let pt = getPerimeterPoint(start, next, alpha === 0 && orth, border);

    if (alpha !== 0) {
      const cos = Math.cos(alpha);
      const sin = Math.sin(alpha);
      pt = getRotatedPoint(pt, cos, sin, center);
    }

    return pt;
  };

  /**
   * Function: getTerminalPort
   *
   * Returns an <mxCellState> that represents the source or target terminal or
   * port for the given edge.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the state of the edge.
   * terminal - <mxCellState> that represents the terminal.
   * source - Boolean indicating if the given terminal is the source terminal.
   */
  const getTerminalPort = (state, terminal, source) => {
    const key = source ? STYLE_SOURCE_PORT : STYLE_TARGET_PORT;
    const id = getValue(state.getStyle(), key);

    if (isSet(id)) {
      const tmp = getState(getGraph().getModel().getCell(id));

      // Only uses ports where a cell state exists
      if (isSet(tmp)) {
        terminal = tmp;
      }
    }

    return terminal;
  };

  /**
   * Function: getPerimeterPoint
   *
   * Returns an <mxPoint> that defines the location of the intersection point between
   * the perimeter and the line between the center of the shape and the given point.
   *
   * Parameters:
   *
   * terminal - <mxCellState> for the source or target terminal.
   * next - <mxPoint> that lies outside of the given terminal.
   * orthogonal - Boolean that specifies if the orthogonal projection onto
   * the perimeter should be returned. If this is false then the intersection
   * of the perimeter and the line between the next and the center point is
   * returned.
   * border - Optional border between the perimeter and the shape.
   */
  const getPerimeterPoint = (terminal, next, orthogonal, border) => {
    let point = null;

    if (isSet(terminal)) {
      const perimeter = getPerimeterFunction(terminal);

      if (isSet(perimeter) && isSet(next)) {
        const bounds = getPerimeterBounds(terminal, border);

        if (bounds.getWidth() > 0 || bounds.getHeight() > 0) {
          point = Point(next.getX(), next.getY());
          let flipH = false;
          let flipV = false;

          if (getGraph().getModel().isVertex(terminal.getCell())) {
            flipH = getValue(terminal.getStyle(), STYLE_FLIPH, false);
            flipV = getValue(terminal.getStyle(), STYLE_FLIPV, false);

            if (flipH) {
              point.setX(2 * bounds.getCenterX() - point.getX());
            }

            if (flipV) {
              point.setY(2 * bounds.getCenterY() - point.getY());
            }
          }

          point = perimeter(bounds, terminal, point, orthogonal);

          if (isSet(point)) {
            if (flipH) {
              point.setX(2 * bounds.getCenterX() - point.getX());
            }

            if (flipV) {
              point.setY(2 * bounds.getCenterY() - point.getY());
            }
          }
        }
      }

      if (isUnset(point)) {
        point = getPoint(terminal);
      }
    }

    return point;
  };

  /**
   * Function: getRoutingCenterX
   *
   * Returns the x-coordinate of the center point for automatic routing.
   */
  const getRoutingCenterX = (state) => {
    const f = isSet(state.getStyle())
      ? parseFloat(state.getStyle()[STYLE_ROUTING_CENTER_X]) || 0
      : 0;

    return state.getCenterX() + f * state.getWidth();
  };

  /**
   * Function: getRoutingCenterY
   *
   * Returns the y-coordinate of the center point for automatic routing.
   */
  const getRoutingCenterY = (state) => {
    const f = isSet(state.getStyle())
      ? parseFloat(state.getStyle()[STYLE_ROUTING_CENTER_Y]) || 0
      : 0;

    return state.getCenterY() + f * state.getHeight();
  };

  /**
   * Function: getPerimeterBounds
   *
   * Returns the perimeter bounds for the given terminal, edge pair as an
   * <mxRectangle>.
   *
   * If you have a model where each terminal has a relative child that should
   * act as the graphical endpoint for a connection from/to the terminal, then
   * this method can be replaced as follows:
   *
   * (code)
   * var oldGetPerimeterBounds = mxGraphView.prototype.getPerimeterBounds;
   * mxGraphView.prototype.getPerimeterBounds = function(terminal, edge, isSource)
   * {
   *   var model = this.graph.getModel();
   *   var childCount = model.getChildCount(terminal.cell);
   *
   *   if (childCount > 0)
   *   {
   *     var child = model.getChildAt(terminal.cell, 0);
   *     var geo = model.getGeometry(child);
   *
   *     if (geo != null &&
   *         geo.relative)
   *     {
   *       var state = this.getState(child);
   *
   *       if (state != null)
   *       {
   *         terminal = state;
   *       }
   *     }
   *   }
   *
   *   return oldGetPerimeterBounds.apply(this, arguments);
   * };
   * (end)
   *
   * Parameters:
   *
   * terminal - <mxCellState> that represents the terminal.
   * border - Number that adds a border between the shape and the perimeter.
   */
  const getPerimeterBounds = (terminal, border = 0) => {
    if (isSet(terminal)) {
      border += parseFloat(terminal.getStyle()[STYLE_PERIMETER_SPACING] || 0);
    }

    return terminal.getPerimeterBounds(border * getScale());
  };

  /**
   * Function: getPerimeterFunction
   *
   * Returns the perimeter function for the given state.
   */
  const getPerimeterFunction = (state) => {
    let perimeter = state.getStyle()[STYLE_PERIMETER];

    // Converts string values to objects
    if (typeof perimeter === 'string') {
      perimeter = StyleRegistry.getValue(perimeter);
    }

    if (typeof perimeter === 'function') {
      return perimeter;
    }

    return null;
  };

  /**
   * Function: getNextPoint
   *
   * Returns the nearest point in the list of absolute points or the center
   * of the opposite terminal.
   *
   * Parameters:
   *
   * edge - <mxCellState> that represents the edge.
   * opposite - <mxCellState> that represents the opposite terminal.
   * source - Boolean indicating if the next point for the source or target
   * should be returned.
   */
  const getNextPoint = (edge, opposite, source) => {
    const pts = edge.getAbsolutePoints();
    let point = null;

    if (isSet(pts) && pts.length >= 2) {
      const count = pts.length;
      point = pts[source ? Math.min(1, count - 1) : Math.max(0, count - 2)];
    }

    if (isUnset(point) && isSet(opposite)) {
      point = Point(opposite.getCenterX(), opposite.getCenterY());
    }

    return point;
  };

  /**
   * Function: getVisibleTerminal
   *
   * Returns the nearest ancestor terminal that is visible. The edge appears
   * to be connected to this terminal on the display. The result of this method
   * is cached in <mxCellState.getVisibleTerminalState>.
   *
   * Parameters:
   *
   * edge - <mxCell> whose visible terminal should be returned.
   * source - Boolean that specifies if the source or target terminal
   * should be returned.
   */
  const getVisibleTerminal = (edge, source) => {
    const model = getGraph().getModel();
    const result = model.getTerminal(edge, source);
    let best = result;

    while (isSet(result) && result !== getCurrentRoot()) {
      if (!getGraph().isCellVisible(best) || isCellCollapsed(result)) {
        best = result;
      }

      result = model.getParent(result);
    }

    // Checks if the result is valid for the current view state
    if (
      isSet(best) &&
      (!model.contains(best) ||
        model.getParent(best) === model.getRoot() ||
        best === getCurrentRoot())
    ) {
      best = null;
    }

    return best;
  };

  /**
   * Function: updateEdgeBounds
   *
   * Updates the given state using the bounding box of t
   * he absolute points.
   * Also updates <mxCellState.terminalDistance>, <mxCellState.length> and
   * <mxCellState.segments>.
   *
   * Parameters:
   *
   * state - <mxCellState> whose bounds should be updated.
   */
  const updateEdgeBounds = (state) => {
    const points = state.absolutePoints;
    const p0 = points[0];
    const pe = points[points.length - 1];

    if (!p0.equals(pe)) {
      const dx = pe.getX() - p0.getX();
      const dy = pe.getY() - p0.getY();
      state.terminalDistance = Math.sqrt(dx * dx + dy * dy);
    } else {
      state.terminalDistance = 0;
    }

    let length = 0;
    const segments = [];
    let pt = p0;

    if (isSet(pt)) {
      let minX = pt.getX();
      let minY = pt.getY();
      let maxX = minX;
      let maxY = minY;

      for (let i = 1; i < points.length; i++) {
        const tmp = points[i];

        if (isSet(tmp)) {
          const dx = pt.getX() - tmp.getX();
          const dy = pt.getY() - tmp.getY();

          const segment = Math.sqrt(dx * dx + dy * dy);
          segments.push(segment);
          length += segment;

          pt = tmp;

          minX = Math.min(pt.getX(), minX);
          minY = Math.min(pt.getY(), minY);
          maxX = Math.max(pt.getX(), maxX);
          maxY = Math.max(pt.getY(), maxY);
        }
      }

      state.setLength(length);
      state.setSegments(segments);

      const markerSize = 1; // TODO: include marker size

      state.setX(minX);
      state.setY(minY);
      state.setWidth(Math.max(markerSize, maxX - minX));
      state.setHeight(Math.max(markerSize, maxY - minY));
    }
  };

  /**
   * Function: getPoint
   *
   * Returns the absolute point on the edge for the given relative
   * <mxGeometry> as an <mxPoint>. The edge is represented by the given
   * <mxCellState>.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the state of the parent edge.
   * geometry - <mxGeometry> that represents the relative location.
   */
  const getPoint = (state, geometry) => {
    let x = state.getCenterX();
    let y = state.getCenterY();

    if (isSet(state.segments) && (isUnset(geometry) || geometry.isRelative())) {
      const gx = isSet(geometry) ? geometry.getX() / 2 : 0;
      const pointCount = state.getAbsolutePoints().length;
      const dist = Math.round((gx + 0.5) * state.getLength());
      const segment = state.getSegments()[0];
      let length = 0;
      let index = 1;

      while (dist >= Math.round(length + segment) && index < pointCount - 1) {
        length += segment;
        segment = state.getSegments()[index++];
      }

      const factor = segment === 0 ? 0 : (dist - length) / segment;
      const p0 = state.getAbsolutePoints()[index - 1];
      const pe = state.getAbsolutePoints()[index];

      if (isSet(p0) && isSet(pe)) {
        let gy = 0;
        let offsetX = 0;
        let offsetY = 0;

        if (isSet(geometry)) {
          gy = geometry.getY();
          const offset = geometry.getOffset();

          if (isSet(offset)) {
            offsetX = offset.getX();
            offsetY = offset.getY();
          }
        }

        const dx = pe.getX() - p0.getX();
        const dy = pe.getY() - p0.getY();
        const nx = segment == 0 ? 0 : dy / segment;
        const ny = segment == 0 ? 0 : dx / segment;

        x = p0.getX() + dx * factor + (nx * gy + offsetX) * getScale();
        y = p0.getY() + dy * factor - (ny * gy - offsetY) * getScale();
      }
    } else if (isSet(geometry)) {
      const offset = geometry.getOffset();

      if (isSet(offset)) {
        x += offset.getX();
        y += offset.getY();
      }
    }

    return Point(x, y);
  };

  /**
   * Function: getRelativePoint
   *
   * Gets the relative point that describes the given, absolute label
   * position for the given edge state.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the state of the parent edge.
   * x - Specifies the x-coordinate of the absolute label location.
   * y - Specifies the y-coordinate of the absolute label location.
   */
  const getRelativePoint = (edgeState, x, y) => {
    const model = getGraph().getModel();
    const geometry = model.getGeometry(edgeState.getCell());

    if (isSet(geometry)) {
      const pointCount = edgeState.getAbsolutePoints().length;

      if (geometry.isRelative() && pointCount > 1) {
        const totalLength = edgeState.getLength();
        const segments = edgeState.getSegments();

        // Works out which line segment the point of the label is closest to
        const p0 = edgeState.getAbsolutePoints()[0];
        const pe = edgeState.getAbsolutePoints()[1];
        let minDist = ptSegDistSq(
          p0.getX(),
          p0.getY(),
          pe.getX(),
          pe.getY(),
          x,
          y
        );
        let length = 0;
        let index = 0;
        let tmp = 0;

        for (let i = 2; i < pointCount; i++) {
          p0 = pe;
          pe = edgeState.getAbsolutePoints()[i];
          const dist = ptSegDistSq(
            p0.getX(),
            p0.getY(),
            pe.getX(),
            pe.getY(),
            x,
            y
          );
          tmp += segments[i - 2];

          if (dist <= minDist) {
            minDist = dist;
            index = i - 1;
            length = tmp;
          }
        }

        const seg = segments[index];
        p0 = edgeState.getAbsolutePoints()[index];
        pe = edgeState.getAbsolutePoints()[index + 1];

        const x2 = p0.getX();
        const y2 = p0.getY();

        const x1 = pe.getX();
        const y1 = pe.getY();

        let px = x;
        let py = y;

        const xSegment = x2 - x1;
        const ySegment = y2 - y1;

        px -= x1;
        py -= y1;
        let projlenSq = 0;

        px = xSegment - px;
        py = ySegment - py;
        const dotprod = px * xSegment + py * ySegment;

        if (dotprod <= 0.0) {
          projlenSq = 0;
        } else {
          projlenSq =
            (dotprod * dotprod) / (xSegment * xSegment + ySegment * ySegment);
        }

        let projlen = Math.sqrt(projlenSq);

        if (projlen > seg) {
          projlen = seg;
        }

        let yDistance = Math.sqrt(
          ptSegDistSq(p0.getX(), p0.getY(), pe.getX(), pe.getY(), x, y)
        );
        const direction = relativeCcw(
          p0.getX(),
          p0.getY(),
          pe.getX(),
          pe.getY(),
          x,
          y
        );

        if (direction == -1) {
          yDistance = -yDistance;
        }

        // Constructs the relative point for the label
        return Point(
          ((totalLength / 2 - length - projlen) / totalLength) * -2,
          yDistance / getScale()
        );
      }
    }

    return Point();
  };

  /**
   * Function: updateEdgeLabelOffset
   *
   * Updates <mxCellState.absoluteOffset> for the given state. The absolute
   * offset is normally used for the position of the edge label. Is is
   * calculated from the geometry as an absolute offset from the center
   * between the two endpoints if the geometry is absolute, or as the
   * relative distance between the center along the line and the absolute
   * orthogonal distance if the geometry is relative.
   *
   * Parameters:
   *
   * state - <mxCellState> whose absolute offset should be updated.
   */
  const updateEdgeLabelOffset = (state) => {
    const points = state.getAbsolutePoints();

    points.setX(state.getCenterX());
    points.setY(state.getCenterY());

    if (isSet(points) && points.length > 0 && isSet(state.getSegments())) {
      const geometry = getGraph().getCellGeometry(state.getCell());

      if (geometry.isRelative()) {
        const offset = getPoint(state, geometry);

        if (isSet(offset)) {
          state.setAbsoluteOffset(offset);
        }
      } else {
        const p0 = points[0];
        const pe = points[points.length - 1];

        if (isSet(p0) && isSet(pe)) {
          const dx = pe.getX() - p0.getX();
          const dy = pe.getY() - p0.getY();
          let x0 = 0;
          let y0 = 0;

          const off = geometry.getOffset();

          if (isSet(off)) {
            x0 = off.getX();
            y0 = off.getY();
          }

          const x = p0.getX() + dx / 2 + x0 * getScale();
          const y = p0.getY() + dy / 2 + y0 * getScale();

          points.setX(x);
          points.setY(y);
        }
      }
    }
  };

  /**
   * Function: getState
   *
   * Returns the <mxCellState> for the given cell. If create is true, then
   * the state is created if it does not yet exist.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the <mxCellState> should be returned.
   * create - Optional boolean indicating if a new state should be created
   * if it does not yet exist. Default is false.
   */
  const getState = (cell, create = false) => {
    let state;

    if (isSet(cell)) {
      state = getStates().get(cell);

      if (
        create &&
        (isUnset(state) || isUpdateStyle()) &&
        getGraph().isCellVisible(cell)
      ) {
        if (isUnset(state)) {
          state = createState(cell);
          getStates().put(cell, state);
        } else {
          state.setStyle(getGraph().getCellStyle(cell));
        }
      }
    }

    return state;
  };

  /**
   * Function: getCellStates
   *
   * Returns the <mxCellStates> for the given array of <mxCells>. The array
   * contains all states that are not null, that is, the returned array may
   * have less elements than the given array. If no argument is given, then
   * this returns <states>.
   */
  const getCellStates = (cells) => {
    if (isUnset(cells)) {
      return getStates();
    } else {
      const result = [];

      for (let i = 0; i < cells.length; i++) {
        const state = getState(cells[i]);

        if (isSet(state)) {
          result.push(state);
        }
      }

      return result;
    }
  };

  /**
   * Function: removeState
   *
   * Removes and returns the <mxCellState> for the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the <mxCellState> should be removed.
   */
  const removeState = (cell) => {
    let state = null;

    if (isSet(cell)) {
      state = getStates().remove(cell);

      if (isSet(state)) {
        getGraph().getCellRenderer().destroy(state);
        state.setInvalid(true);
        state.destroy();
      }
    }

    return state;
  };

  /**
   * Function: createState
   *
   * Creates and returns an <mxCellState> for the given cell and initializes
   * it using <mxCellRenderer.initialize>.
   *
   * Parameters:
   *
   * cell - <mxCell> for which a new <mxCellState> should be created.
   */
  const createState = (cell) =>
    CellState(me, cell, getGraph().getCellStyle(cell));

  /**
   * Function: isContainerEvent
   *
   * Returns true if the event origin is one of the drawing panes or
   * containers of the view.
   */
  const isContainerEvent = (evt) => {
    const source = Event.getSource(evt);

    return (
      source === getGraph().getContainer() ||
      source.getParentNode() === getBackgroundPane() ||
      (isSet(source.getParentNode()) &&
        source.getParentNode().parentNode === getBackgroundPane()) ||
      source === getCanvas().getParentNode() ||
      source === getCanvas() ||
      source === getBackgroundPane() ||
      source === getDrawPane() ||
      source === getOverlayPane() ||
      source === getDecoratorPane()
    );
  };

  /**
   * Function: isScrollEvent
   *
   * Returns true if the event origin is one of the scrollbars of the
   * container in IE. Such events are ignored.
   */
  const isScrollEvent = (evt) => {
    const container = getGraph().getContainer();
    const offset = getOffset(container);
    const pt = Point(evt.clientX - offset.getX(), evt.clientY - offset.getY());

    const outWidth = container.offsetWidth;
    const inWidth = container.clientWidth;

    if (
      outWidth > inWidth &&
      pt.getX() > inWidth + 2 &&
      pt.getX() <= outWidth
    ) {
      return true;
    }

    const outHeight = container.offsetHeight;
    const inHeight = container.clientHeight;

    if (
      outHeight > inHeight &&
      pt.getY() > inHeight + 2 &&
      pt.getY() <= outHeight
    ) {
      return true;
    }

    return false;
  };

  /**
   * Function: init
   *
   * Initializes the graph event dispatch loop for the specified container
   * and invokes <create> to create the required DOM nodes for the display.
   */
  const init = () => {
    installListeners();

    createSvg();
  };

  /**
   * Function: installListeners
   *
   * Installs the required listeners in the container.
   */
  const installListeners = () => {
    const graph = getGraph();
    const container = graph.getContainer();

    if (isSet(container)) {
      // Support for touch device gestures (eg. pinch to zoom)
      // Double-tap handling is implemented in mxGraph.fireMouseEvent
      if (Client.IS_TOUCH) {
        Event.addListener(container, 'gesturestart', (evt) => {
          graph.fireGestureEvent(evt);
          Event.consume(evt);
        });

        Event.addListener(container, 'gesturechange', (evt) => {
          graph.fireGestureEvent(evt);
          Event.consume(evt);
        });

        Event.addListener(container, 'gestureend', (evt) => {
          graph.fireGestureEvent(evt);
          Event.consume(evt);
        });
      }

      // Fires event only for one pointer per gesture
      let pointerId = null;

      // Adds basic listeners for graph event dispatching
      Event.addGestureListeners(
        container,
        (evt) => {
          // Condition to avoid scrollbar events starting a rubberband selection
          if (
            isContainerEvent(evt) &&
            ((!Client.IS_IE &&
              !Client.IS_IE11 &&
              !Client.IS_GC &&
              !Client.IS_OP &&
              !Client.IS_SF) ||
              !isScrollEvent(evt))
          ) {
            graph.fireMouseEvent(Event.MOUSE_DOWN, MouseEvent(evt));
            pointerId = evt.pointerId;
          }
        },
        (evt) => {
          if (
            isContainerEvent(evt) &&
            (isUnset(pointerId) || evt.pointerId == pointerId)
          ) {
            graph.fireMouseEvent(Event.MOUSE_MOVE, MouseEvent(evt));
          }
        },
        (evt) => {
          if (isContainerEvent(evt)) {
            graph.fireMouseEvent(Event.MOUSE_UP, MouseEvent(evt));
          }

          pointerId = null;
        }
      );

      // Adds listener for double click handling on background, this does always
      // use native event handler, we assume that the DOM of the background
      // does not change during the double click
      Event.addListener(container, 'dblclick', (evt) => {
        if (isContainerEvent(evt)) {
          graph.dblClick(evt);
        }
      });

      // Workaround for touch events which started on some DOM node
      // on top of the container, in which case the cells under the
      // mouse for the move and up events are not detected.
      const getState = (evt) => {
        let state = null;

        // Workaround for touch events which started on some DOM node
        // on top of the container, in which case the cells under the
        // mouse for the move and up events are not detected.
        if (Client.IS_TOUCH) {
          const x = Event.getClientX(evt);
          const y = Event.getClientY(evt);

          // Dispatches the drop event to the graph which
          // consumes and executes the source function
          const pt = convertPoint(container, x, y);
          state = graph
            .getView()
            .getState(graph.getCellAt(pt.getX(), pt.getY()));
        }

        return state;
      };

      // Adds basic listeners for graph event dispatching outside of the
      // container and finishing the handling of a single gesture
      // Implemented via graph event dispatch loop to avoid duplicate events
      // in Firefox and Chrome
      graph.addMouseListener({
        mouseDown: function (sender, me) {
          graph.popupMenuHandler.hideMenu();
        },
        mouseMove: function () {},
        mouseUp: function () {}
      });

      setMoveHandler((evt) => {
        // Hides the tooltip if mouse is outside container
        if (
          isSet(graph.tooltipHandler) &&
          graph.tooltipHandler.isHideOnHover()
        ) {
          graph.tooltipHandler.hide();
        }

        if (
          isCaptureDocumentGesture() &&
          graph.isMouseDown() &&
          isSet(graph.getContainer()) &&
          !isContainerEvent(evt) &&
          graph.getContainer().style.display !== 'none' &&
          graph.getContainer().style.visibility !== 'hidden' &&
          !Event.isConsumed(evt)
        ) {
          graph.fireMouseEvent(
            Event.MOUSE_MOVE,
            MouseEvent(evt, getState(evt))
          );
        }
      });

      setEndHandler((evt) => {
        if (
          isCaptureDocumentGesture() &&
          graph.isMouseDown() &&
          isSet(graph.getContainer()) &&
          !isContainerEvent(evt) &&
          graph.getContainer().style.display !== 'none' &&
          graph.getContainer().style.visibility !== 'hidden'
        ) {
          graph.fireMouseEvent(Event.MOUSE_UP, MouseEvent(evt));
        }
      });

      Event.addGestureListeners(
        document,
        null,
        getMoveHandler(),
        getEndHandler()
      );
    }
  };

  /**
   * Function: createSvg
   *
   * Creates and returns the DOM nodes for the SVG display.
   */
  const createSvg = () => {
    const container = getGraph().getContainer();
    const canvas = document.createElementNS(NS_SVG, 'g');
    setCanvas(canvas);

    // For background image
    setBackgroundPane(document.createElementNS(NS_SVG, 'g'));
    canvas.appendChild(getBackgroundPane());

    // Adds two layers (background is early feature)
    setDrawPane(document.createElementNS(NS_SVG, 'g'));
    canvas.appendChild(getDrawPane());

    setOverlayPane(document.createElementNS(NS_SVG, 'g'));
    canvas.appendChild(getOverlayPane());

    setDecoratorPane(document.createElementNS(NS_SVG, 'g'));
    canvas.appendChild(getDecoratorPane());

    const root = document.createElementNS(NS_SVG, 'svg');
    root.style.left = '0px';
    root.style.top = '0px';
    root.style.width = '100%';
    root.style.height = '100%';

    // NOTE: In standards mode, the SVG must have block layout
    // in order for the container DIV to not show scrollbars.
    root.style.display = 'block';
    root.appendChild(canvas);

    // Workaround for scrollbars in IE11 and below
    if (Client.IS_IE || Client.IS_IE11) {
      root.style.overflow = 'hidden';
    }

    if (isSet(container)) {
      container.appendChild(root);
      updateContainerStyle(container);
    }
  };

  /**
   * Function: updateContainerStyle
   *
   * Updates the style of the container after installing the SVG DOM elements.
   */
  const updateContainerStyle = (container) => {
    // Workaround for offset of container
    const style = getCurrentStyle(container);

    if (isSet(style) && style.position === 'static') {
      container.style.position = 'relative';
    }

    // Disables built-in pan and zoom in IE10 and later
    if (Client.IS_POINTER) {
      container.style.touchAction = 'none';
    }
  };

  /**
   * Function: destroy
   *
   * Destroys the view and all its resources.
   */
  const destroy = () => {
    let root = isSet(getCanvas()) ? getCanvas().ownerSVGElement : null;

    if (isUnset(root)) {
      root = getCanvas();
    }

    if (isSet(root) && isSet(root.parentNode)) {
      clear(getCurrentRoot(), true);
      Event.removeGestureListeners(
        document,
        null,
        getMoveHandler(),
        getEndHandler()
      );
      Event.release(getGraph().getContainer());
      root.parentNode.removeChild(root);

      setMoveHandler();
      setEndHandler();
      setCanvas();
      setBackgroundPane();
      setDrawPane();
      setOverlayPane();
      setDecoratorPane();
    }
  };

  const me = {
    addListener,

    /**
     * Function: getGraphBounds
     *
     * Returns <graphBounds>.
     */
    getGraphBounds,

    /**
     * Function: setGraphBounds
     *
     * Sets <graphBounds>.
     */
    setGraphBounds,
    getBounds,
    setCurrentRoot,
    scaleAndTranslate,

    /**
     * Function: getScale
     *
     * Returns the <scale>.
     */
    getScale,
    setScale,

    /**
     * Function: getTranslate
     *
     * Returns the <translate>.
     */
    getTranslate,
    setTranslate,
    viewStateChanged,
    refresh,
    revalidate,
    clear,
    invalidate,
    validate,
    getEmptyBounds,
    getBoundingBox,
    createBackgroundPageShape,
    validateBackground,
    validateBackgroundImage,
    validateBackgroundPage,
    getBackgroundPageBounds,
    redrawBackgroundImage,
    validateCell,
    validateCellState,
    updateCellState,
    isCellCollapsed,
    updateVertexState,
    updateEdgeState,
    updateVertexLabelOffset,
    resetValidationState,
    stateValidated,
    updateFixedTerminalPoints,
    updateFixedTerminalPoint,
    getFixedTerminalPoint,
    updateBoundsFromStencil,
    updatePoints,
    transformControlPoint,
    isLoopStyleEnabled,
    getEdgeStyle,
    updateFloatingTerminalPoints,
    updateFloatingTerminalPoint,
    getFloatingTerminalPoint,
    getTerminalPort,
    getPerimeterPoint,
    getRoutingCenterX,
    getRoutingCenterY,
    getPerimeterBounds,
    getPerimeterFunction,
    getNextPoint,
    getVisibleTerminal,
    updateEdgeBounds,
    getPoint,
    getRelativePoint,
    updateEdgeLabelOffset,
    getState,

    /**
     * Function: isRendering
     *
     * Returns <rendering>.
     */
    isRendering,

    /**
     * Function: setRendering
     *
     * Sets <rendering>.
     */
    setRendering,

    /**
     * Function: getStates
     *
     * Returns <states>.
     */
    getStates,

    /**
     * Function: setStates
     *
     * Sets <states>.
     */
    setStates,
    getCellStates,
    removeState,
    createState,

    /**
     * Function: getCanvas
     *
     * Returns the DOM node that contains the background-, draw- and
     * overlay- and decoratorpanes.
     */
    getCanvas,

    /**
     * Function: getBackgroundPane
     *
     * Returns the DOM node that represents the background layer.
     */
    getBackgroundPane,

    /**
     * Function: getDrawPane
     *
     * Returns the DOM node that represents the main drawing layer.
     */
    getDrawPane,

    /**
     * Function: getOverlayPane
     *
     * Returns the DOM node that represents the layer above the drawing layer.
     */
    getOverlayPane,

    /**
     * Function: getDecoratorPane
     *
     * Returns the DOM node that represents the topmost drawing layer.
     */
    getDecoratorPane,
    isContainerEvent,
    isScrollEvent,
    init,
    installListeners,
    createSvg,
    updateContainerStyle,
    getGraph,
    getCurrentRoot,
    destroy
  };

  return me;
};

/**
 * Class: CurrentRootChange
 *
 * Action to change the current root in a view.
 *
 * Constructor: CurrentRootChange
 *
 * Constructs a change of the current root in the given view.
 */
const CurrentRootChange = (view, root) => {
  const [getView, setView] = addProp(view);
  const [getRoot, setRoot] = addProp(root);
  const [getPrevious, setPrevious] = addProp(root);
  const [isUp, setUp] = addProp(isUnset(root));

  /**
   * Function: execute
   *
   * Changes the current root of the view.
   */
  const execute = () => {
    const view = getView();
    const tmp = view.getCurrentRoot();
    view.setCurrentRoot(getPrevious());
    setPrevious(tmp);

    const translate = view
      .getGraph()
      .getTranslateForRoot(view.getCurrentRoot());

    if (isSet(translate)) {
      view.setTranslate(Point(-translate.getX(), -translate.getY()));
    }

    if (isUp()) {
      view.clear(view.getCurrentRoot(), true);
      view.validate();
    } else {
      view.refresh();
    }

    const name = isUp() ? Event.UP : Event.DOWN;
    view.fireEvent(
      EventObject(
        name,
        'root',
        view.getCurrentRoot(),
        'previous',
        getPrevious()
      )
    );
    setUp(!isUp());
  };

  if (isUp()) {
    let tmp = getView().getCurrentRoot();
    const model = getView().getGraph().getModel();

    while (isSet(tmp)) {
      if (tmp === root) {
        setUp(true);
        break;
      }

      tmp = model.getParent(tmp);
    }
  }

  return {
    execute
  };
};

export default GraphView;
