/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet, isUnset, makeComponent, noop } from '../Helpers';
import Ellipse from '../shape/Ellipse';
import ImageShape from '../shape/ImageShape';
import RectangleShape from '../shape/RectangleShape';
import {
  CURSOR_LABEL_HANDLE,
  CURSOR_MOVABLE_VERTEX,
  HANDLE_FILLCOLOR,
  HANDLE_SIZE,
  HANDLE_STROKECOLOR,
  LABEL_HANDLE_FILLCOLOR,
  LABEL_HANDLE_SIZE,
  STYLE_ASPECT,
  STYLE_ROTATION,
  VERTEX_SELECTION_COLOR,
  VERTEX_SELECTION_DASHED,
  VERTEX_SELECTION_STROKEWIDTH
} from '../util/Constants';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import { getRotatedPoint, intersects, mod, toRadians } from '../util/Utils';

/**
 * Class: VertexHandler
 *
 * Event handler for resizing cells. This handler is automatically created in
 * <mxGraph.createHandler>.
 *
 * Constructor: VertexHandler
 *
 * Constructs an event handler that allows to resize vertices
 * and groups.
 *
 * Parameters:
 *
 * state - <mxCellState> of the cell to be resized.
 */
const VertexHandler = (state) => {
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
   * Variable: singleSizer
   *
   * Specifies if only one sizer handle at the bottom, right corner should be
   * used. Default is false.
   */
  const [isSingleSizer, setSingleSizer] = addProp(false);

  /**
   * Variable: index
   *
   * Holds the index of the current handle.
   */
  const [getIndex, setIndex] = addProp();

  /**
   * Variable: allowHandleBoundsCheck
   *
   * Specifies if the bounds of handles should be used for hit-detection in IE or
   * if <tolerance> > 0. Default is true.
   */
  const [isAllowHandleBoundsCheck, setAllowHandleBoundsCheck] = addProp(true);

  /**
   * Variable: handleImage
   *
   * Optional <mxImage> to be used as handles. Default is null.
   */
  const [getHandleImage, setHandleImage] = addProp();

  /**
   * Variable: handlesVisible
   *
   * If handles are currently visible.
   */
  const [isHandlesVisible, _setHandlesVisible] = addProp(true);

  /**
   * Variable: tolerance
   *
   * Optional tolerance for hit-detection in <getHandleForEvent>. Default is 0.
   */
  const [getTolerance, setTolerance] = addProp(0);
  const [isInTolerance, setInTolerance] = addProp(true);

  /**
   * Variable: rotationEnabled
   *
   * Specifies if a rotation handle should be visible. Default is false.
   */
  const [isRotationEnabled, setRotationEnabled] = addProp(false);

  /**
   * Variable: parentHighlightEnabled
   *
   * Specifies if the parent should be highlighted if a child cell is selected.
   * Default is false.
   */
  const [isParentHighlightEnabled, setParentHighlightEnabled] = addProp(false);

  /**
   * Variable: rotationRaster
   *
   * Specifies if rotation steps should be "rasterized" depening on the distance
   * to the handle. Default is true.
   */
  const [isRotationRaster, setRotationRaster] = addProp(true);

  /**
   * Variable: rotationCursor
   *
   * Specifies the cursor for the rotation handle. Default is 'crosshair'.
   */
  const [getRotationCursor, setRotationCursor] = addProp('crosshair');

  /**
   * Variable: livePreview
   *
   * Specifies if resize should change the cell in-place. This is an experimental
   * feature for non-touch devices. Default is false.
   */
  const [isLivePreview, setLivePreview] = addProp(false);
  const [isLivePreviewActive, setLivePreviewActive] = addProp(false);

  /**
   * Variable: movePreviewToFront
   *
   * Specifies if the live preview should be moved to the front.
   */
  const [isMovePreviewToFront, setMovePreviewToFront] = addProp(false);

  /**
   * Variable: manageSizers
   *
   * Specifies if sizers should be hidden and spaced if the vertex is small.
   * Default is false.
   */
  const [isManageSizers, setManageSizers] = addProp(false);

  /**
   * Variable: constrainGroupByChildren
   *
   * Specifies if the size of groups should be constrained by the children.
   * Default is false.
   */
  const [isConstrainGroupByChildren, setConstraintGroupByChildren] = addProp(
    false
  );

  /**
   * Variable: rotationHandleVSpacing
   *
   * Vertical spacing for rotation icon. Default is -16.
   */
  const [getRotationHandleVSpacing, setRotationHandleVSpacing] = addProp(-16);

  /**
   * Variable: horizontalOffset
   *
   * The horizontal offset for the handles. This is updated in <redrawHandles>
   * if <manageSizers> is true and the sizers are offset horizontally.
   */
  const [getHorizontalOffset, setHorizontalOffset] = addProp(0);

  /**
   * Variable: verticalOffset
   *
   * The horizontal offset for the handles. This is updated in <redrawHandles>
   * if <manageSizers> is true and the sizers are offset vertically.
   */
  const [getVerticalOffset, setVerticalOffset] = addProp(0);
  const [_getSelectionBounds, setSelectionBounds] = addProp();
  const [getSelectionBorder, setSelectionBorder] = addProp();
  const [getBounds, setBounds] = addProp();
  const [getSizers, setSizers] = addProp();
  const [getLabelShape, setLabelShape] = addProp();
  const [getMinBounds, setMinBounds] = addProp();
  const [getCustomHandles, setCustomHandles] = addProp();
  const [getX0, setX0] = addProp();
  const [getY0, setY0] = addProp();
  const [getStartX, setStartX] = addProp();
  const [getStartY, setStartY] = addProp();
  const [getChildOffsetX, setChildOffsetX] = addProp();
  const [getChildOffsetY, setChildOffsetY] = addProp();
  const [getCurrentAlpha, setCurrentAlpha] = addProp();
  const [getPreview, setPreview] = addProp();
  const [getGhostPreview, setGhostPreview] = addProp();
  const [getEdgeHandlers, setEdgeHandlers] = addProp();
  const [getUnscaledBounds, setUnscaledBounds] = addProp();
  const [getParentHighlight, setParentHighlight] = addProp();
  const [getRotationShape, setRotationShape] = addProp();
  const [getParentState, setParentState] = addProp();
  const [getEscapeHandler, setEscapeHandler] = addProp((sender, evt) => {
    if (isLivePreview() && isSet(getIndex())) {
      const state = getState();

      // Redraws the live preview
      state.getView().getGraph().getCellRenderer().redraw(state, true);

      // Redraws connected edges
      state.getView().invalidate(state.getCell());
      state.setInvalid(false);
      state.getView().validate();
    }

    reset();
  });

  /**
   * Function: init
   *
   * Initializes the shapes required for this vertex handler.
   */
  const init = () => {
    const state = getState();
    const graph = setGraph(state.getView().getGraph());

    const sb = setSelectionBounds(getSelectionBounds(state));
    const bounds = setBounds(
      Rectangle(sb.getX(), sb.getY(), sb.getWidth(), sb.getHeight())
    );
    const border = setSelectionBorder(createSelectionShape(bounds));
    border.setPointerEvents(false);
    border.setRotation(Number(state.getStyle()[STYLE_ROTATION] || '0'));
    border.init(graph.getView().getOverlayPane());
    Event.redirectMouseEvents(border.getNode(), graph, state);

    if (graph.isCellMovable(state.getCell())) {
      border.setCursor(CURSOR_MOVABLE_VERTEX);
    }

    const { getMaxCells } = getGraph().getGraphHandler();

    // Adds the sizer handles
    if (getMaxCells() <= 0 || graph.getSelectionCount() < getMaxCells()) {
      const cell = state.getCell();
      const resizable = graph.isCellResizable(cell);
      const sizers = setSizers([]);

      if (
        resizable ||
        (graph.isLabelMovable(cell) &&
          state.getWidth() >= 2 &&
          state.getHeight() >= 2)
      ) {
        let i = 0;

        if (resizable) {
          if (!isSingleSizer()) {
            sizers.push(createSizer('nw-resize', i++));
            sizers.push(createSizer('n-resize', i++));
            sizers.push(createSizer('ne-resize', i++));
            sizers.push(createSizer('w-resize', i++));
            sizers.push(createSizer('e-resize', i++));
            sizers.push(createSizer('sw-resize', i++));
            sizers.push(createSizer('s-resize', i++));
          }

          sizers.push(createSizer('se-resize', i++));
        }

        const geo = graph.getModel().getGeometry(cell);

        if (
          isSet(geo) &&
          !geo.isRelative() &&
          !graph.isSwimlane(cell) &&
          graph.isLabelMovable(cell)
        ) {
          // Marks this as the label handle for getHandleForEvent
          setLabelShape(
            createSizer(
              CURSOR_LABEL_HANDLE,
              Event.LABEL_HANDLE,
              LABEL_HANDLE_SIZE,
              LABEL_HANDLE_FILLCOLOR
            )
          );
          sizers.push(getLabelShape());
        }
      } else if (
        graph.isCellMovable(cell) &&
        !graph.isCellResizable(cell) &&
        state.getWidth() < 2 &&
        state.getHeight() < 2
      ) {
        setLabelShape(
          createSizer(
            CURSOR_MOVABLE_VERTEX,
            Event.LABEL_HANDLE,
            null,
            LABEL_HANDLE_FILLCOLOR
          )
        );
        sizers.push(getLabelShape());
      }
    }

    // Adds the rotation handler
    if (isRotationHandleVisible()) {
      setRotationShape(
        createSizer(
          getRotationCursor(),
          Event.ROTATION_HANDLE,
          HANDLE_SIZE + 3,
          HANDLE_FILLCOLOR
        )
      );
      sizers.push(getRotationShape());
    }

    setCustomHandles(createCustomHandles());
    redraw();

    if (isConstrainGroupByChildren()) {
      updateMinBounds();
    }
  };

  /**
   * Function: isRotationHandleVisible
   *
   * Returns true if the rotation handle should be showing.
   */
  const isRotationHandleVisible = () => {
    const graph = getGraph();
    const { getMaxCells } = graph.getGraphHandler();

    return (
      graph.isEnabled() &&
      isRotationEnabled() &&
      graph.isCellRotatable(getState().getCell()) &&
      (getMaxCells() <= 0 || graph.getSelectionCount() < getMaxCells())
    );
  };

  /**
   * Function: isConstrainedEvent
   *
   * Returns true if the aspect ratio if the cell should be maintained.
   */
  const isConstrainedEvent = (mE) =>
    Event.isShiftDown(mE.getEvent()) ||
    getState().getStyle()[STYLE_ASPECT] === 'fixed';

  /**
   * Function: isCenteredEvent
   *
   * Returns true if the center of the vertex should be maintained during the resize.
   */
  const isCenteredEvent = (state, mE) => false;

  /**
   * Function: createCustomHandles
   *
   * Returns an array of custom handles. This implementation returns null.
   */
  const createCustomHandles = () => undefined;

  /**
   * Function: updateMinBounds
   *
   * Initializes the shapes required for this vertex handler.
   */
  const updateMinBounds = () => {
    const graph = getGraph();
    const state = getState();
    const children = graph.getChildCells(state.getCell());

    if (children.length > 0) {
      const mb = setMinBounds(graph.getView().getBounds(children));

      if (isSet(getMinBounds())) {
        const s = state.getView().getScale();
        const t = state.getView().getTranslate();

        mb.setX(mb.getX() - state.getX());
        mb.setY(mb.getY() - state.getY());
        mb.setX(mb.getX() / s);
        mb.setY(mb.getY() / s);
        mb.setWidth(mb.getWidth() / s);
        mb.setHeight(mb.getHeight() / s);
        setX0(state.getX() / s - t.getX());
        setY0(state.getY() / s - t.getY());
      }
    }
  };

  /**
   * Function: getSelectionBounds
   *
   * Returns the mxRectangle that defines the bounds of the selection
   * border.
   */
  const getSelectionBounds = (state) =>
    Rectangle(
      Math.round(state.getX()),
      Math.round(state.getY()),
      Math.round(state.getWidth()),
      Math.round(state.getHeight())
    );

  /**
   * Function: createParentHighlightShape
   *
   * Creates the shape used to draw the selection border.
   */
  const createParentHighlightShape = (bounds) => createSelectionShape(bounds);

  /**
   * Function: createSelectionShape
   *
   * Creates the shape used to draw the selection border.
   */
  const createSelectionShape = (bounds) => {
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
   * Function: getSelectionColor
   *
   * Returns <mxConstants.VERTEX_SELECTION_COLOR>.
   */
  const getSelectionColor = () => VERTEX_SELECTION_COLOR;

  /**
   * Function: getSelectionStrokeWidth
   *
   * Returns <mxConstants.VERTEX_SELECTION_STROKEWIDTH>.
   */
  const getSelectionStrokeWidth = () => VERTEX_SELECTION_STROKEWIDTH;

  /**
   * Function: isSelectionDashed
   *
   * Returns <mxConstants.VERTEX_SELECTION_DASHED>.
   */
  const isSelectionDashed = () => VERTEX_SELECTION_DASHED;

  /**
   * Function: createSizer
   *
   * Creates a sizer handle for the specified cursor and index and returns
   * the new <mxRectangleShape> that represents the handle.
   */
  const createSizer = (cursor, index, size = HANDLE_SIZE, fillColor) => {
    const graph = getGraph();
    const state = getState();
    const bounds = Rectangle(0, 0, size, size);
    const sizer = createSizerShape(bounds, index, fillColor);

    sizer.init(graph.getView().getOverlayPane());

    Event.redirectMouseEvents(sizer.getNode(), graph, state);

    if (graph.isEnabled()) {
      sizer.setCursor(cursor);
    }

    if (!isSizerVisible(index)) {
      sizer.setVisible(false);
    }

    return sizer;
  };

  /**
   * Function: isSizerVisible
   *
   * Returns true if the sizer for the given index is visible.
   * This returns true for all given indices.
   */
  const isSizerVisible = (index) => true;

  /**
   * Function: createSizerShape
   *
   * Creates the shape used for the sizer handle for the specified bounds an
   * index. Only images and rectangles should be returned if support for HTML
   * labels with not foreign objects is required.
   */
  const createSizerShape = (bounds, index, fillColor) => {
    const handleImage = getHandleImage();

    if (isSet(handleImage)) {
      bounds = Rectangle(
        bounds.getX(),
        bounds.getY(),
        handleImage.getWidth(),
        handleImage.getHeight()
      );
      const shape = ImageShape(bounds, handleImage.getSrc());

      // Allows HTML rendering of the images
      shape.setPreserveImageAspect(false);

      return shape;
    } else if (index === Event.ROTATION_HANDLE) {
      return Ellipse(bounds, fillColor || HANDLE_FILLCOLOR, HANDLE_STROKECOLOR);
    } else {
      return RectangleShape(
        bounds,
        fillColor || HANDLE_FILLCOLOR,
        HANDLE_STROKECOLOR
      );
    }
  };

  /**
   * Function: createBounds
   *
   * Helper method to create an <mxRectangle> around the given centerpoint
   * with a width and height of 2*s or 6, if no s is given.
   */
  const moveSizerTo = (shape, x, y) => {
    if (isSet(shape)) {
      shape.getBounds().setX(Math.floor(x - shape.getBounds().getWidth() / 2));
      shape.getBounds().setY(Math.floor(y - shape.getBounds().getHeight() / 2));

      // Fixes visible inactive handles in VML
      if (isSet(shape.getNode()) && shape.getNode().style.display !== 'none') {
        shape.redraw();
      }
    }
  };

  /**
   * Function: getHandleForEvent
   *
   * Returns the index of the handle for the given event. This returns the index
   * of the sizer from where the event originated or <mxEvent.LABEL_INDEX>.
   */
  const getHandleForEvent = (mE) => {
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

    const checkShape = (shape) => {
      const st =
        isSet(shape) &&
        shape.constructor !== ImageShape &&
        isAllowHandleBoundsCheck()
          ? shape.getStrokeWidth() + shape.getSvgStrokeTolerance()
          : undefined;
      const real = isSet(st)
        ? Rectangle(
            mE.getGraphX() - Math.floor(st / 2),
            mE.getGraphY() - Math.floor(st / 2),
            st,
            st
          )
        : hit;

      return (
        isSet(shape) &&
        (mE.isSource(shape) ||
          (isSet(real) &&
            intersects(shape.getBounds(), real) &&
            shape.getNode().style.display !== 'none' &&
            shape.getNode().style.visibility !== 'hidden'))
      );
    };

    if (checkShape(getRotationShape())) {
      return Event.ROTATION_HANDLE;
    } else if (checkShape(getLabelShape())) {
      return Event.LABEL_HANDLE;
    }

    if (isSet(getSizers())) {
      for (let i = 0; i < getSizers().length; i++) {
        if (checkShape(getSizers()[i])) {
          return i;
        }
      }
    }

    const customHandles = getCustomHandles();

    if (isSet(customHandles) && isCustomHandleEvent(mE)) {
      // Inverse loop order to match display order
      for (let i = customHandles.length - 1; i >= 0; i--) {
        if (checkShape(customHandles[i].getShape())) {
          // LATER: Return reference to active shape
          return Event.CUSTOM_HANDLE - i;
        }
      }
    }

    return null;
  };

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
   * Handles the event if a handle has been clicked. By consuming the
   * event all subsequent events of the gesture are redirected to this
   * handler.
   */
  const mouseDown = (sender, mE) => {
    if (!mE.isConsumed() && getGraph().isEnabled()) {
      const handle = getHandleForEvent(mE);

      if (isSet(handle)) {
        start(mE.getGraphX(), mE.getGraphY(), handle);
        mE.consume();
      }
    }
  };

  /**
   * Function: isLivePreviewBorder
   *
   * Called if <livePreview> is enabled to check if a border should be painted.
   * This implementation returns true if the shape is transparent.
   */
  const isLivePreviewBorder = () =>
    isSet(getState().getShape()) &&
    isUnset(getState().getShape().getFill()) &&
    isUnset(getState().getShape().getStroke());

  /**
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  const start = (x, y, index) => {
    const graph = getGraph();
    const state = getState();

    if (isSet(getSelectionBorder())) {
      setLivePreviewActive(
        isLivePreview() && graph.getModel().getChildCount(state.getCell()) === 0
      );
      setInTolerance(true);
      setChildOffsetX(0);
      setChildOffsetY(0);
      setIndex(index);
      setStartX(x);
      setStartY(y);

      if (getIndex() <= Event.CUSTOM_HANDLE && isGhostPreview()) {
        setGhostPreview(createGhostPreview());
      } else {
        // Saves reference to parent state
        const model = state.getView().getGraph().getModel();
        const parent = model.getParent(state.getCell());

        if (
          state.getView().getCurrentRoot() !== parent &&
          (model.isVertex(parent) || model.isEdge(parent))
        ) {
          setParentState(state.getView().getGraph().getView().getState(parent));
        }

        // Creates a preview that can be on top of any HTML label
        getSelectionBorder().getNode().style.display =
          index === Event.ROTATION_HANDLE ? 'inline' : 'none';

        // Creates the border that represents the new bounds
        if (!isLivePreviewActive() || isLivePreviewBorder()) {
          setPreview(createSelectionShape(getBounds()));

          if (
            !(Number(state.getStyle()[STYLE_ROTATION] || '0') !== 0) &&
            isSet(state.getText()) &&
            state.getText().getNode().parentNode === graph.getContainer()
          ) {
            getPreview().init(graph.getContainer());
          } else {
            getPreview().init(graph.getView().getOverlayPane());
          }
        }

        if (index === Event.ROTATION_HANDLE) {
          // With the rotation handle in a corner, need the angle and distance
          const pos = getRotationHandlePosition();

          const dx = pos.getX() - state.getCenterX();
          const dy = pos.getY() - state.getCenterY();

          setStartAngle(
            dx !== 0 ? (Math.atan(dy / dx) * 180) / Math.PI + 90 : 0
          );
          setStartDist(Math.sqrt(dx * dx + dy * dy));
        }

        // Prepares the handles for live preview
        if (isLivePreviewActive()) {
          hideSizers();

          if (index === Event.ROTATION_HANDLE) {
            getRotationShape().getNode().style.display = '';
          } else if (index === Event.LABEL_HANDLE) {
            getLabelShape().getNode().style.display = '';
          } else if (isSet(getSizers()) && isSet(getSizers()[index])) {
            getSizers()[index].getNode().style.display = '';
          } else if (
            index <= Event.CUSTOM_HANDLE &&
            isSet(getCustomHandles())
          ) {
            getCustomHandles()[Event.CUSTOM_HANDLE - index].setVisible(true);
          }

          // Gets the array of connected edge handlers for redrawing
          const edges = graph.getEdges(state.getCell());
          setEdgeHandlers([]);

          for (let i = 0; i < edges.length; i++) {
            const handler = graph
              .getSelectionCellsHandler()
              .getHandler(edges[i]);

            if (isSet(handler)) {
              getEdgeHandlers().push(handler);
            }
          }
        }
      }
    }
  };

  /**
   * Function: createGhostPreview
   *
   * Starts the handling of the mouse gesture.
   */
  const createGhostPreview = () => {
    const shape = getGraph().getCellRenderer().createShape(getState());
    shape.init(getGraph().getView().getOverlayPane());
    shape.setScale(getState().getView().getScale());
    shape.setBounds(getBounds());
    shape.setOutline(true);

    return shape;
  };

  /**
   * Function: setHandlesVisible
   */
  const setHandlesVisible = (visible) => {
    _setHandlesVisible(visible);

    if (isSet(getSizers())) {
      for (let i = 0; i < getSizers().length; i++) {
        getSizers()[i].getNode().style.display = visible ? '' : 'none';
      }
    }

    if (isSet(getCustomHandles())) {
      for (let i = 0; i < getCustomHandles().length; i++) {
        getCustomHandles()[i].setVisible(visible);
      }
    }
  };

  /**
   * Function: hideSizers
   *
   * Hides all sizers except.
   *
   * Starts the handling of the mouse gesture.
   */
  const hideSizers = () => setHandlesVisible(false);

  /**
   * Function: checkTolerance
   *
   * Checks if the coordinates for the given event are within the
   * <mxGraph.tolerance>. If the event is a mouse event then the tolerance is
   * ignored.
   */
  const checkTolerance = (mE) => {
    if (isInTolerance() && isSet(getStartX()) && isSet(getStartY())) {
      const tolerance = getGraph().getTolerance();

      if (
        Event.isMouseEvent(mE.getEvent()) ||
        Math.abs(mE.getGraphX() - getStartX()) > tolerance ||
        Math.abs(mE.getGraphY() - getStartY()) > tolerance
      ) {
        setInTolerance(false);
      }
    }
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
  const removeHint = noop;

  /**
   * Function: roundAngle
   *
   * Hook for rounding the angle. This uses Math.round.
   */
  const roundAngle = (angle) => Math.round(angle * 10) / 10;

  /**
   * Function: roundLength
   *
   * Hook for rounding the unscaled width or height. This uses Math.round.
   */
  const roundLength = (length) => Math.round(length * 100) / 100;

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the preview.
   */
  const mouseMove = (sender, mE) => {
    const index = getIndex();

    if (!mE.isConsumed() && isSet(index)) {
      // Checks tolerance for ignoring single clicks
      checkTolerance(mE);

      if (!isInTolerance()) {
        if (index <= Event.CUSTOM_HANDLE) {
          const customHandles = getCustomHandles();

          if (isSet(customHandles)) {
            customHandles[Event.CUSTOM_HANDLE - index].processEvent(mE);
            customHandles[Event.CUSTOM_HANDLE - index].setActive(true);

            const ghostPreview = getGhostPreview();

            if (isSet(ghostPreview)) {
              ghostPreview.apply(getState());
              ghostPreview.setStrokeWidth(
                getSelectionStrokeWidth() /
                  ghostPreview.getScale() /
                  ghostPreview.getScale()
              );
              ghostPreview.setDashed(isSelectionDashed());
              ghostPreview.setStroke(getSelectionColor());
              ghostPreview.redraw();

              if (isSet(getSelectionBounds())) {
                getSelectionBorder().getNode().style.display = 'none';
              }
            } else {
              if (isMovePreviewToFront()) {
                moveToFront();
              }

              customHandles[Event.CUSTOM_HANDLE - index].positionChanged();
            }
          }
        } else if (index === Event.LABEL_HANDLE) {
          moveLabel(mE);
        } else {
          if (index === Event.ROTATION_HANDLE) {
            rotateVertex(mE);
          } else {
            resizeVertex(mE);
          }

          updateHint(mE);
        }
      }

      mE.consume();
    }
    // Workaround for disabling the connect highlight when over handle
    else if (!getGraph().isMouseDown() && isSet(getHandleForEvent(mE))) {
      mE.consume(false);
    }
  };

  /**
   * Function: isGhostPreview
   *
   * Returns true if a ghost preview should be used for custom handles.
   */
  const isGhostPreview = () =>
    getState()
      .getView()
      .getGraph()
      .getModel()
      .getChildCount(getState().getCell()) > 0;

  /**
   * Function: moveLabel
   *
   * Moves the label.
   */
  const moveLabel = (mE) => {
    const graph = getGraph();
    const point = Point(mE.getGraphX(), mE.getGraphY());
    const tr = graph.getView().getTranslate();
    const scale = graph.getView().getScale();

    if (graph.isGridEnabledEvent(mE.getEvent())) {
      point.setX(
        (graph.snap(point.getX() / scale - tr.getX()) + tr.getX()) * scale
      );
      point.setY(
        (graph.snap(point.getY() / scale - tr.getY()) + tr.getY()) * scale
      );
    }

    const sizers = getSizers();
    const index = isSet(getRotationShape())
      ? sizers.length - 2
      : sizers.length - 1;
    moveSizerTo(sizers[index], point.getX(), point.getY());
  };

  /**
   * Function: rotateVertex
   *
   * Rotates the vertex.
   */
  const rotateVertex = (mE) => {
    const state = getState();
    const point = Point(mE.getGraphX(), mE.getGraphY());
    const dx = state.getX() + state.getWidth() / 2 - point.getX();
    const dy = state.getY() + state.getHeight() / 2 - point.getY();
    setCurrentAlpha(
      dx !== 0 ? (Math.atan(dy / dx) * 180) / Math.PI + 90 : dy < 0 ? 180 : 0
    );

    if (dx > 0) {
      setCurrentAlpha(getCurrentAlpha() - 180);
    }

    setCurrentAlpha(getCurrentAlpha() - getStartAngle());

    // Rotation raster
    if (isRotationRaster() && getGraph().isGridEnabledEvent(mE.getEvent())) {
      const dx = point.getX() - state.getCenterX();
      const dy = point.getY() - state.getCenterY();
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist - getStartDist() < 2) {
        raster = 15;
      } else if (dist - getStartDist() < 25) {
        raster = 5;
      } else {
        raster = 1;
      }

      setCurrentAlpha(Math.round(getCurrentAlpha() / raster) * raster);
    } else {
      setCurrentAlpha(roundAngle(getCurrentAlpha()));
    }

    getSelectionBorder().setRotation(getCurrentAlpha());
    getSelectionBorder().redraw();

    if (isLivePreviewActive()) {
      redrawHandles();
    }
  };

  /**
   * Function: resizeVertex
   *
   * Risizes the vertex.
   */
  const resizeVertex = (mE) => {
    const graph = getGraph();
    const state = getState();
    const ct = Point(state.getCenterX(), state.getCenterY());
    const alpha = toRadians(state.getStyle()[STYLE_ROTATION] || '0');
    const point = Point(mE.getGraphX(), mE.getGraphY());
    const tr = graph.getView().getTranslate();
    const scale = graph.getView().getScale();
    let cos = Math.cos(-alpha);
    let sin = Math.sin(-alpha);

    let dx = point.getX() - getStartX();
    let dy = point.getY() - getStartY();

    // Rotates vector for mouse gesture
    const tx = cos * dx - sin * dy;
    const ty = sin * dx + cos * dy;

    dx = tx;
    dy = ty;

    const geo = graph.getCellGeometry(state.getCell());
    const unscaledBounds = setUnscaledBounds(
      union(
        geo,
        dx / scale,
        dy / scale,
        getIndex(),
        graph.isGridEnabledEvent(mE.getEvent()),
        1,
        Point(0, 0),
        isConstrainedEvent(mE),
        isCenteredEvent(state, mE)
      )
    );
    const parentState = getParentState();

    // Keeps vertex within maximum graph or parent bounds
    if (!geo.isRelative()) {
      let max = graph.getMaximumGraphBounds();

      // Handles child cells
      if (isSet(max) && isSet(parentState)) {
        max = Rectangle.fromRectangle(max);

        max.setX(max.getX() - (parentState.getX() - tr.getX() * scale) / scale);
        max.setY(max.getY() - (parentState.getY() - tr.getY() * scale) / scale);
      }

      if (graph.isConstrainChild(state.getCell())) {
        let tmp = graph.getCellContainmentArea(state.getCell());

        if (isSet(tmp)) {
          const overlap = graph.getOverlap(state.getCell());

          if (overlap > 0) {
            tmp = Rectangle.fromRectangle(tmp);

            tmp.setX(tmp.getX() - tmp.getWidth() * overlap);
            tmp.setY(tmp.getY() - tmp.getHeight() * overlap);
            tmp.setWidth(tmp.getWidth() + 2 * tmp.getWidth() * overlap);
            tmp.setHeight(tmp.getHeight() + 2 * tmp.getHeight() * overlap);
          }

          if (isUnset(max)) {
            max = tmp;
          } else {
            max = Rectangle.fromRectangle(max);
            max.intersect(tmp);
          }
        }
      }

      if (isSet(max)) {
        if (unscaledBounds.getX() < max.getX()) {
          unscaledBounds.setWidth(
            unscaledBounds.getWidth() - (max.getX() - unscaledBounds.getX())
          );
          unscaledBounds.setX(max.getX());
        }

        if (unscaledBounds.getY() < max.getY()) {
          unscaledBounds.setHeight(
            unscaledBounds.getHeight() - (max.getY() - unscaledBounds.getY())
          );
          unscaledBounds.setY(max.getY());
        }

        if (
          unscaledBounds.getX() + unscaledBounds.getWidth() >
          max.getX() + max.getWidth()
        ) {
          unscaledBounds.setWidth(
            unscaledBounds.getWidth() -
              (unscaledBounds.getX() +
                unscaledBounds.getWidth() -
                max.getX() -
                max.getWidth())
          );
        }

        if (
          unscaledBounds.getY() + unscaledBounds.getHeight() >
          max.getY() + max.getHeight()
        ) {
          unscaledBounds.setHeight(
            unscaledBounds.getHeight() -
              (unscaledBounds.getY() +
                unscaledBounds.getHeight() -
                max.getY() -
                max.getHeight())
          );
        }
      }
    }

    const old = getBounds();
    const bounds = setBounds(
      Rectangle(
        (isSet(parentState) ? parentState.getX() : tr.getX() * scale) +
          unscaledBounds.getX() * scale,
        (isSet(parentState) ? parentState.getY() : tr.getY() * scale) +
          unscaledBounds.getY() * scale,
        unscaledBounds.getWidth() * scale,
        unscaledBounds.getHeight() * scale
      )
    );

    if (geo.isRelative() && isSet(parentState)) {
      bounds.setX(bounds.getX() + (state.getX() - parentState.getX()));
      bounds.setY(bounds.getY() + (state.getY() - parentState.getY()));
    }

    cos = Math.cos(alpha);
    sin = Math.sin(alpha);

    const c2 = Point(bounds.getCenterX(), bounds.getCenterY());

    dx = c2.getX() - ct.getX();
    dy = c2.getY() - ct.getY();

    const dx2 = cos * dx - sin * dy;
    const dy2 = sin * dx + cos * dy;

    const dx3 = dx2 - dx;
    const dy3 = dy2 - dy;

    const dx4 = bounds.getX() - state.getX();
    const dy4 = bounds.getY() - state.getY();

    const dx5 = cos * dx4 - sin * dy4;
    const dy5 = sin * dx4 + cos * dy4;

    bounds.setX(bounds.getX() + dx3);
    bounds.setY(bounds.getY() + dy3);

    // Rounds unscaled bounds to int
    unscaledBounds.setX(roundLength(unscaledBounds.getX() + dx3 / scale));
    unscaledBounds.setY(roundLength(unscaledBounds.getY() + dy3 / scale));
    unscaledBounds.setWidth(roundLength(unscaledBounds.getWidth()));
    unscaledBounds.setHeight(roundLength(unscaledBounds.getHeight()));

    // Shifts the children according to parent offset
    if (!graph.isCellCollapsed(state.getCell()) && (dx3 !== 0 || dy3 !== 0)) {
      setChildOffsetX(state.getX() - bounds.getX() + dx5);
      setChildOffsetY(state.getY() - bounds.getY() + dy5);
    } else {
      setChildOffsetX(0);
      setChildOffsetY(0);
    }

    if (!old.equals(bounds)) {
      if (isLivePreviewActive()) {
        updateLivePreview(mE);
      }

      if (isSet(getPreview())) {
        drawPreview();
      } else {
        updateParentHighlight();
      }
    }
  };

  /**
   * Function: updateLivePreview
   *
   * Repaints the live preview.
   */
  const updateLivePreview = (mE) => {
    const graph = getGraph();
    const state = getState();
    // TODO: Apply child offset to children in live preview
    const scale = graph.getView().getScale();
    const tr = graph.getView().getTranslate();

    // Saves current state
    const tempState = state.clone();

    // Temporarily changes size and origin
    state.setX(getBounds().getX());
    state.setY(getBounds().getY());
    state.setOrigin(
      Point(state.getX() / scale - tr.getX(), state.getY() / scale - tr.getY())
    );
    state.setWidth(getBounds().getWidth());
    state.setHeight(getBounds().getHeight());

    // Redraws cell and handles
    const off = state.getAbsoluteOffset();
    off = Point(off.getX(), off.getY());

    // Required to store and reset absolute offset for updating label position
    state.getAbsoluteOffset().setX(0);
    state.getAbsoluteOffset().setY(0);
    const geo = graph.getCellGeometry(state.getCell());

    if (isSet(geo)) {
      const offset = geo.offset;

      if (isSet(offset) && !geo.isRelative()) {
        state
          .getAbsoluteOffset()
          .setX(state.getView().getScale() * offset.getX());
        state
          .getAbsoluteOffset()
          .setY(state.getView().getScale() * offset.getY());
      }

      state.getView().updateVertexLabelOffset(state);
    }

    // Draws the live preview
    state.getView().getGraph().getCellRenderer().redraw(state, true);

    // Redraws connected edges TODO: Include child edges
    state.getView().invalidate(state.getCell());
    state.setInvalid(false);
    state.getView().validate();
    redrawHandles();

    // Moves live preview to front
    if (isMovePreviewToFront()) {
      moveToFront();
    }

    // Hides folding icon
    if (isSet(state.getControl()) && isSet(state.getControl().getNode())) {
      state.getControl().getNode().style.visibility = 'hidden';
    }

    // Restores current state
    state.setState(tempState);
  };

  /**
   * Function: moveToFront
   *
   * Handles the event by applying the changes to the geometry.
   */
  const moveToFront = () => {
    const text = getState().getText();
    const shape = getState().getShape();

    if (
      (isSet(text) &&
        isSet(text.getNode()) &&
        isSet(text.getNode().nextSibling)) ||
      (isSet(shape) &&
        isSet(shape.getNode()) &&
        isSet(shape.getNode().nextSibling) &&
        (isUnset(text) || shape.getNode().nextSibling !== text.getNode()))
    ) {
      if (isSet(shape) && isSet(shape.getNode())) {
        shape.getNode().parentNode.appendChild(shape.getNode());
      }

      if (isSet(text) && isSet(text.getNode())) {
        text.getNode().parentNode.appendChild(text.getNode());
      }
    }
  };

  /**
   * Function: mouseUp
   *
   * Handles the event by applying the changes to the geometry.
   */
  const mouseUp = (sender, mE) => {
    const graph = getGraph();
    const state = getState();

    if (isSet(getIndex()) && isSet(state)) {
      const point = Point(mE.getGraphX(), mE.getGraphY());
      const index = getIndex();
      setIndex();

      if (isUnset(getGhostPreview())) {
        // Required to restore order in case of no change
        state.getView().invalidate(state.getCell(), false, false);
        state.getView().validate();
      }

      graph.getModel().beginUpdate();

      try {
        if (index <= Event.CUSTOM_HANDLE) {
          const customHandles = getCustomHandles();

          if (isSet(customHandles)) {
            // Creates style before changing cell state
            const style = state
              .getView()
              .getGraph()
              .getCellStyle(state.getCell());

            customHandles[Event.CUSTOM_HANDLE - index].setActive(false);
            customHandles[Event.CUSTOM_HANDLE - index].execute(mE);

            // Sets style and apply on shape to force repaint and
            // check if execute has removed custom handles
            if (
              isSet(customHandles) &&
              isSet(customHandles[Event.CUSTOM_HANDLE - index])
            ) {
              state.setStyle(style);
              customHandles[Event.CUSTOM_HANDLE - index].positionChanged();
            }
          }
        } else if (index === Event.ROTATION_HANDLE) {
          if (isSet(getCurrentAlpha())) {
            const delta =
              getCurrentAlpha() - (state.getStyle()[STYLE_ROTATION] || 0);

            if (delta !== 0) {
              rotateCell(state.getCell(), delta);
            }
          } else {
            rotateClick();
          }
        } else {
          const gridEnabled = graph.isGridEnabledEvent(mE.getEvent());
          const alpha = toRadians(state.getStyle()[STYLE_ROTATION] || '0');
          const cos = Math.cos(-alpha);
          const sin = Math.sin(-alpha);

          let dx = point.getX() - getStartX();
          let dy = point.getY() - getStartY();

          // Rotates vector for mouse gesture
          const tx = cos * dx - sin * dy;
          const ty = sin * dx + cos * dy;

          dx = tx;
          dy = ty;

          const s = graph.getView().getScale();
          const recurse = isRecursiveResize(state, mE);
          resizeCell(
            state.getCell(),
            roundLength(dx / s),
            roundLength(dy / s),
            index,
            gridEnabled,
            isConstrainedEvent(mE),
            recurse
          );
        }
      } finally {
        graph.getModel().endUpdate();
      }

      mE.consume();
      reset();
      redrawHandles();
    }
  };

  /**
   * Function: isRecursiveResize
   *
   * Returns the recursiveResize of the give state.
   *
   * Parameters:
   *
   * state - the given <mxCellState>. This implementation takes
   * the value of this state.
   * me - the mouse event.
   */
  const isRecursiveResize = (state, mE) =>
    getGraph().isRecursiveResize(getState());

  /**
   * Function: rotateClick
   *
   * Hook for subclassers to implement a single click on the rotation handle.
   * This code is executed as part of the model transaction. This implementation
   * is empty.
   */
  const rotateClick = noop;

  /**
   * Function: rotateCell
   *
   * Rotates the given cell and its children by the given angle in degrees.
   *
   * Parameters:
   *
   * cell - <mxCell> to be rotated.
   * angle - Angle in degrees.
   */
  const rotateCell = (cell, angle, parent) => {
    const graph = getGraph();

    if (angle !== 0) {
      const model = graph.getModel();

      if (model.isVertex(cell) || model.isEdge(cell)) {
        if (!model.isEdge(cell)) {
          const style = graph.getCurrentCellStyle(cell);
          const total = (style[STYLE_ROTATION] || 0) + angle;
          graph.setCellStyles(STYLE_ROTATION, total, [cell]);
        }

        const geo = graph.getCellGeometry(cell);

        if (isSet(geo)) {
          const pgeo = graph.getCellGeometry(parent);

          if (isSet(pgeo) && !model.isEdge(parent)) {
            geo = geo.clone();
            geo.rotate(angle, Point(pgeo.getWidth() / 2, pgeo.getHeight() / 2));
            model.setGeometry(cell, geo);
          }

          if (
            (model.isVertex(cell) && !geo.isRelative()) ||
            model.isEdge(cell)
          ) {
            // Recursive rotation
            const childCount = model.getChildCount(cell);

            for (let i = 0; i < childCount; i++) {
              rotateCell(model.getChildAt(cell, i), angle, cell);
            }
          }
        }
      }
    }
  };

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  const reset = () => {
    const state = getState();
    const sizers = getSizers();
    const index = getIndex();

    if (
      isSet(sizers) &&
      isSet(index) &&
      isSet(sizers[index]) &&
      sizers[index].getNode().style.display == 'none'
    ) {
      sizers[index].getNode().style.display = '';
    }

    setCurrentAlpha();
    setInTolerance();
    setIndex();

    // TODO: Reset and redraw cell states for live preview
    if (isSet(getPreview())) {
      getPreview().destroy();
      setPreview();
    }

    if (isSet(getGhostPreview())) {
      getGhostPreview().destroy();
      setGhostPreview();
    }

    if (isLivePreviewActive() && isSet(sizers)) {
      for (let i = 0; i < sizers.length; i++) {
        if (isSet(sizers[i])) {
          sizers[i].getNode().style.display = '';
        }
      }

      // Shows folding icon
      if (isSet(state.getControl()) && isSet(state.getControl().getNode())) {
        state.getControl().getNode().style.visibility = '';
      }
    }

    const customHandles = getCustomHandles();

    if (isSet(customHandles)) {
      for (let i = 0; i < customHandles.length; i++) {
        if (customHandles[i].isActive()) {
          customHandles[i].setActive(false);
          customHandles[i].reset();
        } else {
          customHandles[i].setVisible(true);
        }
      }
    }

    // Checks if handler has been destroyed
    if (isSet(getSelectionBorder())) {
      getSelectionBorder().getNode().style.display = 'inline';
      const sb = setSelectionBounds(getSelectionBounds(state));
      setBounds(Rectangle(sb.getX(), sb.getY(), sb.getWidth(), sb.getHeight()));
      drawPreview();
    }

    removeHint();
    redrawHandles();
    setEdgeHandlers();
    _setHandlesVisible(true);
    setUnscaledBounds();
    setLivePreviewActive(false);
  };

  /**
   * Function: resizeCell
   *
   * Uses the given vector to change the bounds of the given cell
   * in the graph using <mxGraph.resizeCell>.
   */
  const resizeCell = (
    cell,
    dx,
    dy,
    index,
    gridEnabled,
    constrained,
    recurse
  ) => {
    const graph = getGraph();
    const geo = graph.getModel().getGeometry(cell);

    if (isSet(geo)) {
      if (index === Event.LABEL_HANDLE) {
        const alpha = -toRadians(getState().getStyle()[STYLE_ROTATION] || '0');
        const cos = Math.cos(alpha);
        const sin = Math.sin(alpha);
        const scale = graph.getView().getScale();
        const pt = getRotatedPoint(
          Point(
            Math.round(
              (getLabelShape().getBounds().getCenterX() - getStartX()) / scale
            ),
            Math.round(
              (getLabelShape().getBounds().getCenterY() - getStartY()) / scale
            )
          ),
          cos,
          sin
        );

        geo = geo.clone();

        if (isUnset(geo.getOffset())) {
          geo.setOffset(pt);
        } else {
          const offset = geo.getOffset();
          offset.setX(offset.getX() + pt.getX());
          offset.setY(offset.getY() + pt.getY());
        }

        graph.getModel().setGeometry(cell, geo);
      } else if (isSet(getUnscaledBounds())) {
        const scale = graph.getView().getScale();

        if (getChildOffsetX() !== 0 || getChildOffsetY() !== 0) {
          moveChildren(
            cell,
            Math.round(getChildOffsetX() / scale),
            Math.round(getChildOffsetY() / scale)
          );
        }

        graph.resizeCell(cell, getUnscaledBounds(), recurse);
      }
    }
  };

  /**
   * Function: moveChildren
   *
   * Moves the children of the given cell by the given vector.
   */
  const moveChildren = (cell, dx, dy) => {
    const model = getGraph().getModel();
    const childCount = model.getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      const child = model.getChildAt(cell, i);
      const geo = getGraph().getCellGeometry(child);

      if (isSet(geo)) {
        geo = geo.clone();
        geo.translate(dx, dy);
        model.setGeometry(child, geo);
      }
    }
  };

  /**
   * Function: union
   *
   * Returns the union of the given bounds and location for the specified
   * handle index.
   *
   * To override this to limit the size of vertex via a minWidth/-Height style,
   * the following code can be used.
   *
   * (code)
   * var vertexHandlerUnion = mxVertexHandler.prototype.union;
   * mxVertexHandler.prototype.union = function(bounds, dx, dy, index, gridEnabled, scale, tr, constrained)
   * {
   *   var result = vertexHandlerUnion.apply(this, arguments);
   *
   *   result.width = Math.max(result.width, mxUtils.getNumber(this.state.style, 'minWidth', 0));
   *   result.height = Math.max(result.height, mxUtils.getNumber(this.state.style, 'minHeight', 0));
   *
   *   return result;
   * };
   * (end)
   *
   * The minWidth/-Height style can then be used as follows:
   *
   * (code)
   * graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30, 'minWidth=100;minHeight=100;');
   * (end)
   *
   * To override this to update the height for a wrapped text if the width of a vertex is
   * changed, the following can be used.
   *
   * (code)
   * var mxVertexHandlerUnion = mxVertexHandler.prototype.union;
   * mxVertexHandler.prototype.union = function(bounds, dx, dy, index, gridEnabled, scale, tr, constrained)
   * {
   *   var result = mxVertexHandlerUnion.apply(this, arguments);
   *   var s = this.state;
   *
   *   if (this.graph.isHtmlLabel(s.cell) && (index == 3 || index == 4) &&
   *       s.text != null && s.style[mxConstants.STYLE_WHITE_SPACE] == 'wrap')
   *   {
   *     var label = this.graph.getLabel(s.cell);
   *     var fontSize = mxUtils.getNumber(s.style, mxConstants.STYLE_FONTSIZE, mxConstants.DEFAULT_FONTSIZE);
   *     var ww = result.width / s.view.scale - s.text.spacingRight - s.text.spacingLeft
   *
   *     result.height = mxUtils.getSizeForString(label, fontSize, s.style[mxConstants.STYLE_FONTFAMILY], ww).height;
   *   }
   *
   *   return result;
   * };
   * (end)
   */
  const union = (
    bounds,
    dx,
    dy,
    index,
    gridEnabled = true,
    scale,
    tr,
    constrained,
    centered
  ) => {
    const graph = getGraph();

    gridEnabled = gridEnabled && graph.isGridEnabled();

    if (isSingleSizer()) {
      let x = bounds.getX() + bounds.getWidth() + dx;
      let y = bounds.getY() + bounds.getHeight() + dy;

      if (gridEnabled) {
        x = graph.snap(x / scale) * scale;
        y = graph.snap(y / scale) * scale;
      }

      const rect = Rectangle(bounds.getX(), bounds.getY(), 0, 0);
      rect.add(Rectangle(x, y, 0, 0));

      return rect;
    } else {
      const w0 = bounds.getWidth();
      const h0 = bounds.getHeight();
      let left = bounds.getX() - tr.getX() * scale;
      let right = left + w0;
      let top = bounds.getY() - tr.getY() * scale;
      let bottom = top + h0;

      const cx = left + w0 / 2;
      const cy = top + h0 / 2;

      if (index > 4 /* Bottom Row */) {
        bottom = bottom + dy;

        if (gridEnabled) {
          bottom = graph.snap(bottom / scale) * scale;
        } else {
          bottom = Math.round(bottom / scale) * scale;
        }
      } else if (index < 3 /* Top Row */) {
        top = top + dy;

        if (gridEnabled) {
          top = graph.snap(top / scale) * scale;
        } else {
          top = Math.round(top / scale) * scale;
        }
      }

      if (index === 0 || index === 3 || index === 5 /* Left */) {
        left += dx;

        if (gridEnabled) {
          left = graph.snap(left / scale) * scale;
        } else {
          left = Math.round(left / scale) * scale;
        }
      } else if (index === 2 || index === 4 || index === 7 /* Right */) {
        right += dx;

        if (gridEnabled) {
          right = graph.snap(right / scale) * scale;
        } else {
          right = Math.round(right / scale) * scale;
        }
      }

      const width = right - left;
      const height = bottom - top;

      if (constrained) {
        const geo = graph.getCellGeometry(getState().getCell());

        if (isSet(geo)) {
          const aspect = geo.getWidth() / geo.getHeight();

          if (index === 1 || index === 2 || index === 7 || index === 6) {
            width = height * aspect;
          } else {
            height = width / aspect;
          }

          if (index === 0) {
            left = right - width;
            top = bottom - height;
          }
        }
      }

      if (centered) {
        width += width - w0;
        height += height - h0;

        const cdx = cx - (left + width / 2);
        const cdy = cy - (top + height / 2);

        left += cdx;
        top += cdy;
        right += cdx;
        bottom += cdy;
      }

      // Flips over left side
      if (width < 0) {
        left += width;
        width = Math.abs(width);
      }

      // Flips over top side
      if (height < 0) {
        top += height;
        height = Math.abs(height);
      }

      const result = Rectangle(
        left + tr.getX() * scale,
        top + tr.getY() * scale,
        width,
        height
      );

      const minBounds = getMinBounds();

      if (isSet(minBounds)) {
        result.setWidth(
          Math.max(
            result.getWidth(),
            minBounds.getX() * scale +
              minBounds.getWidth() * scale +
              Math.max(0, getX0() * scale - result.getX())
          )
        );
        result.setHeight(
          Math.max(
            result.getHeight(),
            minBounds.getY() * scale +
              minBounds.getHeight() * scale +
              Math.max(0, getY0() * scale - result.getY())
          )
        );
      }

      return result;
    }
  };

  /**
   * Function: redraw
   *
   * Redraws the handles and the preview.
   */
  const redraw = (ignoreHandles) => {
    const sb = setSelectionBounds(getSelectionBounds(getState()));
    setBounds(Rectangle(sb.getX(), sb.getY(), sb.getWidth(), sb.getHeight()));
    drawPreview();

    if (!ignoreHandles) {
      redrawHandles();
    }
  };

  /**
   * Function: getHandlePadding
   *
   * Returns the padding to be used for drawing handles for the current <bounds>.
   */
  const getHandlePadding = () => {
    // KNOWN: Tolerance depends on event type (eg. 0 for mouse events)
    const result = Point(0, 0);
    const tol = getTolerance();
    const sizers = getSizers();

    if (
      isSet(sizers) &&
      sizers.length > 0 &&
      isSet(sizers[0]) &&
      (getBounds().getWidth() <
        2 * sizers[0].getBounds().getWidth() + 2 * tol ||
        getBounds().getHeight() <
          2 * sizers[0].getBounds().getHeight() + 2 * tol)
    ) {
      tol /= 2;

      result.setX(sizers[0].getBounds().getWidth() + tol);
      result.setY(sizers[0].getBounds().getHeight() + tol);
    }

    return result;
  };

  /**
   * Function: getSizerBounds
   *
   * Returns the bounds used to paint the resize handles.
   */
  const getSizerBounds = () => getBounds();

  /**
   * Function: redrawHandles
   *
   * Redraws the handles. To hide certain handles the following code can be used.
   *
   * (code)
   * mxVertexHandler.prototype.redrawHandles = function()
   * {
   *   mxVertexHandlerRedrawHandles.apply(this, arguments);
   *
   *   if (this.sizers != null && this.sizers.length > 7)
   *   {
   *     this.sizers[1].node.style.display = 'none';
   *     this.sizers[6].node.style.display = 'none';
   *   }
   * };
   * (end)
   */
  const redrawHandles = () => {
    const state = getState();
    const s = getSizerBounds();
    const tol = getTolerance();
    setHorizontalOffset(0);
    setVerticalOffset(0);

    const customHandles = getCustomHandles();

    if (isSet(customHandles)) {
      for (let i = 0; i < customHandles.length; i++) {
        const temp = customHandles[i].getShape().getNode().style.display;
        customHandles[i].redraw();
        customHandles[i].getShape().getNode().style.display = temp;

        // Hides custom handles during text editing
        customHandles[i].getShape().getNode().style.visibility =
          isHandlesVisible() && isCustomHandleVisible(customHandles[i])
            ? ''
            : 'hidden';
      }
    }

    const sizers = getSizers();

    if (isSet(sizers) && sizers.length > 0 && isSet(sizers[0])) {
      if (isUnset(getIndex()) && isManageSizers() && sizers.length >= 8) {
        // KNOWN: Tolerance depends on event type (eg. 0 for mouse events)
        const padding = getHandlePadding();
        setHorizontalOffset(padding.getX());
        setVerticalOffset(padding.getY());

        if (getHorizontalOffset() !== 0 || getVerticalOffset() !== 0) {
          s = Rectangle(s.getX(), s.getY(), s.getWidth(), s.getHeight());

          s.setX(s.getX() - getHorizontalOffset() / 2);
          s.setWidth(s.getWidth() + getHorizontalOffset());
          s.setY(s.getY() - getVerticalOffset() / 2);
          s.setHeight(s.getHeight() + getVerticalOffset());
        }

        if (sizers.length >= 8) {
          if (
            s.getWidth() < 2 * sizers[0].getBounds().getWidth() + 2 * tol ||
            s.getHeight() < 2 * sizers[0].getBounds().getHeight() + 2 * tol
          ) {
            sizers[0].node.style.display = 'none';
            sizers[2].node.style.display = 'none';
            sizers[5].node.style.display = 'none';
            sizers[7].node.style.display = 'none';
          } else if (isHandlesVisible()) {
            sizers[0].node.style.display = '';
            sizers[2].node.style.display = '';
            sizers[5].node.style.display = '';
            sizers[7].node.style.display = '';
          }
        }
      }

      const r = s.getX() + s.getWidth();
      const b = s.getY() + s.getHeight();

      if (isSingleSizer()) {
        moveSizerTo(sizers[0], r, b);
      } else {
        const cx = s.getX() + s.getWidth() / 2;
        const cy = s.getY() + s.getHeight() / 2;

        if (sizers.length >= 8) {
          const crs = [
            'nw-resize',
            'n-resize',
            'ne-resize',
            'e-resize',
            'se-resize',
            's-resize',
            'sw-resize',
            'w-resize'
          ];

          const alpha = toRadians(state.getStyle()[STYLE_ROTATION] || '0');
          const cos = Math.cos(alpha);
          const sin = Math.sin(alpha);

          const da = Math.round((alpha * 4) / Math.PI);

          const ct = Point(s.getCenterX(), s.getCenterY());
          let pt = getRotatedPoint(Point(s.getX(), s.getY()), cos, sin, ct);

          moveSizerTo(sizers[0], pt.getX(), pt.getY());
          sizers[0].setCursor(crs[mod(0 + da, crs.length)]);

          pt.setX(cx);
          pt.setY(s.getY());
          pt = getRotatedPoint(pt, cos, sin, ct);

          moveSizerTo(sizers[1], pt.getX(), pt.getY());
          sizers[1].setCursor(crs[mod(1 + da, crs.length)]);

          pt.setX(r);
          pt.setY(s.getY());
          pt = getRotatedPoint(pt, cos, sin, ct);

          moveSizerTo(sizers[2], pt.getX(), pt.getY());
          sizers[2].setCursor(crs[mod(2 + da, crs.length)]);

          pt.setX(s.getX());
          pt.setY(cy);
          pt = getRotatedPoint(pt, cos, sin, ct);

          moveSizerTo(sizers[3], pt.getX(), pt.getY());
          sizers[3].setCursor(crs[mod(7 + da, crs.length)]);

          pt.setX(r);
          pt.setY(cy);
          pt = getRotatedPoint(pt, cos, sin, ct);

          moveSizerTo(sizers[4], pt.getX(), pt.getY());
          sizers[4].setCursor(crs[mod(3 + da, crs.length)]);

          pt.setX(s.getX());
          pt.setY(b);
          pt = getRotatedPoint(pt, cos, sin, ct);

          moveSizerTo(sizers[5], pt.getX(), pt.getY());
          sizers[5].setCursor(crs[mod(6 + da, crs.length)]);

          pt.setX(cx);
          pt.setY(b);
          pt = getRotatedPoint(pt, cos, sin, ct);

          moveSizerTo(sizers[6], pt.getX(), pt.getY());
          sizers[6].setCursor(crs[mod(5 + da, crs.length)]);

          pt.setX(r);
          pt.setY(b);
          pt = getRotatedPoint(pt, cos, sin, ct);

          moveSizerTo(sizers[7], pt.getX(), pt.getY());
          sizers[7].setCursor(crs[mod(4 + da, crs.length)]);

          pt.setX(cx + state.getAbsoluteOffset().getX());
          pt.setY(cy + state.getAbsoluteOffset().getY());
          pt = getRotatedPoint(pt, cos, sin, ct);
          moveSizerTo(sizers[8], pt.getX(), pt.getY());
        } else if (state.getWidth() >= 2 && state.getHeight() >= 2) {
          moveSizerTo(
            sizers[0],
            cx + state.getAbsoluteOffset().getX(),
            cy + state.getAbsoluteOffset().getY()
          );
        } else {
          moveSizerTo(sizers[0], state.getX(), state.getY());
        }
      }
    }

    if (isSet(getRotationShape())) {
      const alpha = toRadians(
        isSet(getCurrentAlpha)
          ? getCurrentAlpha()
          : state.getStyle()[STYLE_ROTATION] || '0'
      );
      const cos = Math.cos(alpha);
      const sin = Math.sin(alpha);

      const ct = Point(state.getCenterX(), state.getCenterY());
      const pt = getRotatedPoint(getRotationHandlePosition(), cos, sin, ct);

      if (isSet(getRotationShape().getNode())) {
        moveSizerTo(getRotationShape(), pt.getX(), pt.getY());

        // Hides rotation handle during text editing
        rotationShape.getNode().style.visibility =
          state.getView().getGraph().isEditing() || !isHandlesVisible()
            ? 'hidden'
            : '';
      }
    }

    if (isSet(getSelectionBorder())) {
      getSelectionBorder().setRotation(
        Number(state.getStyle()[STYLE_ROTATION] || '0')
      );
    }

    if (isSet(getEdgeHandlers())) {
      for (let i = 0; i < getEdgeHandlers().length; i++) {
        getEdgeHandlers()[i].redraw();
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
   * Function: getRotationHandlePosition
   *
   * Returns an <mxPoint> that defines the rotation handle position.
   */
  const getRotationHandlePosition = () =>
    Point(
      getBounds().getX() + getBounds().getWidth() / 2,
      getBounds().getY() + getRotationHandleVSpacing()
    );

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
   * Function: drawPreview
   *
   * Redraws the preview.
   */
  const drawPreview = () => {
    const preview = getPreview();

    if (isSet(preview)) {
      const bounds = preview.setBounds(getBounds());

      if (preview.getNode().parentNode === getGraph().getContainer()) {
        bounds.setWidth(Math.max(0, bounds.getWidth() - 1));
        bounds.setHeight(Math.max(0, bounds.getHeight() - 1));
      }

      preview.setRotation(Number(getState().getStyle()[STYLE_ROTATION] || '0'));
      preview.redraw();
    }

    getSelectionBorder().setBounds(getSelectionBorderBounds());
    getSelectionBorder().redraw();
    updateParentHighlight();
  };

  /**
   * Function: getSelectionBorderBounds
   *
   * Returns the bounds for the selection border.
   */
  const getSelectionBorderBounds = () => getBounds();

  /**
   * Function: isDestroyed
   *
   * Returns true if this handler was destroyed or not initialized.
   */
  const isDestroyed = () => isUnset(getSelectionBorder());

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  const destroy = () => {
    if (isSet(getEscapeHandler())) {
      getState().getView().getGraph().removeListener(getEscapeHandler());
      setEscapeHandler();
    }

    if (isSet(getPreview())) {
      getPreview().destroy();
      setPreview();
    }

    if (isSet(getParentHighlight())) {
      const parent = getGraph().getModel().getParent(getState().getCell());
      const pstate = getGraph().getView().getState(parent);

      if (
        isSet(pstate) &&
        pstate.getParentHighlight() === getParentHighlight()
      ) {
        pstate.setParentHighlight();
      }

      getParentHighlight().destroy();
      setParentHighlight();
    }

    if (isSet(getGhostPreview())) {
      getGhostPreview().destroy();
      setGhostPreview();
    }

    if (isSet(getSelectionBorder())) {
      getSelectionBorder().destroy();
      setSelectionBorder();
    }

    setLabelShape();
    removeHint();

    if (isSet(getSizers())) {
      for (let i = 0; i < getSizers().length; i++) {
        getSizers()[i].destroy();
      }

      setSizers();
    }

    if (isSet(getCustomHandles())) {
      for (let i = 0; i < getCustomHandles().length; i++) {
        getCustomHandles()[i].destroy();
      }

      setCustomHandles();
    }
  };

  const me = {
    init,
    isRotationHandleVisible,
    isConstrainedEvent,
    isCenteredEvent,
    createCustomHandles,
    updateMinBounds,
    getSelectionBounds,
    createParentHighlightShape,
    createSelectionShape,
    getSelectionColor,
    getSelectionStrokeWidth,
    isSelectionDashed,
    createSizer,
    isSizerVisible,
    createSizerShape,
    moveSizerTo,
    getHandleForEvent,
    isCustomHandleEvent,
    mouseDown,
    isLivePreviewBorder,
    start,
    createGhostPreview,
    setHandlesVisible,
    hideSizers,
    checkTolerance,
    updateHint,
    removeHint,
    roundAngle,
    roundLength,
    mouseMove,
    isGhostPreview,
    moveLabel,
    rotateVertex,
    resizeVertex,
    updateLivePreview,
    moveToFront,
    mouseUp,
    isRecursiveResize,
    rotateClick,
    rotateCell,
    reset,
    resizeCell,
    moveChildren,
    union,
    redraw,
    getHandlePadding,
    getSizerBounds,
    redrawHandles,
    isCustomHandleVisible,
    getRotationHandlePosition,
    isParentHighlightVisible,
    updateParentHighlight,
    drawPreview,
    getSelectionBorderBounds,
    isDestroyed,
    getState,
    getIndex,
    setIndex,
    destroy
  };

  init();

  getState().getView().getGraph().addListener(Event.ESCAPE, getEscapeHandler());

  return me;
};

export default makeComponent(VertexHandler);
