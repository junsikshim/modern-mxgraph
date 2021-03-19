/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { imageBasePath } from '../Client';
import { addProp, isSet, isUnset, makeComponent } from '../Helpers';
import ImageShape from '../shape/ImageShape';
import RectangleShape from '../shape/RectangleShape';
import {
  DEFAULT_VALID_COLOR,
  HIGHLIGHT_OPACITY,
  HIGHLIGHT_SIZE,
  HIGHLIGHT_STROKEWIDTH
} from '../util/Constants';
import Image from '../util/Image';
import Rectangle from '../util/Rectangle';
import { intersects as _intersects } from '../util/Utils';

/**
 * Class: mxConstraintHandler
 *
 * Handles constraints on connection targets. This class is in charge of
 * showing fixed points when the mouse is over a vertex and handles constraints
 * to establish new connections.
 *
 * Constructor: mxConstraintHandler
 *
 * Constructs an new constraint handler.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * factoryMethod - Optional function to create the edge. The function takes
 * the source and target <mxCell> as the first and second argument and
 * returns the <mxCell> that represents the new edge.
 */
const ConstraintHandler = (graph) => {
  /**
   * Variable: pointImage
   *
   * <mxImage> to be used as the image for fixed connection points.
   */
  const [getPointImage, setPointImage] = addProp(
    Image(imageBasePath + '/point.gif', 5, 5)
  );

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: highlightColor
   *
   * Specifies the color for the highlight. Default is <mxConstants.DEFAULT_VALID_COLOR>.
   */
  const [getHighlightColor, setHighlightColor] = addProp(DEFAULT_VALID_COLOR);
  const [getFocusIcons, setFocusIcons] = addProp();
  const [getFocusHighlight, setFocusHighlight] = addProp();
  const [getCurrentConstraint, setCurrentConstraint] = addProp();
  const [getCurrentFocusArea, setCurrentFocusArea] = addProp();
  const [getCurrentPoint, setCurrentPoint] = addProp();
  const [getCurrentFocus, setCurrentFocus] = addProp();
  const [getFocusPoints, setFocusPoints] = addProp();
  const [getMouseLeaveHandler, setMouseLeaveHandler] = addProp();
  const [getConstraints, setConstraints] = addProp();

  // Adds a graph model listener to update the current focus on changes
  const [getResetHandler, setResetHandler] = addProp((sender, evt) => {
    if (
      isSet(getCurrentFocus()) &&
      isUnset(getGraph().getView().getState(getCurrentFocus().getCell()))
    ) {
      reset();
    } else {
      redraw();
    }
  });

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  const reset = () => {
    const focusIcons = getFocusIcons();

    if (isSet(focusIcons)) {
      for (let i = 0; i < focusIcons.length; i++) {
        focusIcons[i].destroy();
      }

      setFocusIcons();
    }

    const focusHighlight = getFocusHighlight();

    if (isSet(focusHighlight)) {
      focusHighlight.destroy();
      setFocusHighlight();
    }

    setCurrentConstraint();
    setCurrentFocusArea();
    setCurrentPoint();
    setCurrentFocus();
    setFocusPoints();
  };

  /**
   * Function: getTolerance
   *
   * Returns the tolerance to be used for intersecting connection points. This
   * implementation returns <mxGraph.tolerance>.
   *
   * Parameters:
   *
   * me - <mxMouseEvent> whose tolerance should be returned.
   */
  const getTolerance = (mE) => getGraph().getTolerance();

  /**
   * Function: getImageForConstraint
   *
   * Returns the tolerance to be used for intersecting connection points.
   */
  const getImageForConstraint = (state, constraint, point) => getPointImage();

  /**
   * Function: isEventIgnored
   *
   * Returns true if the given <mxMouseEvent> should be ignored in <update>. This
   * implementation always returns false.
   */
  const isEventIgnored = (mE, source) => false;

  /**
   * Function: isStateIgnored
   *
   * Returns true if the given state should be ignored. This always returns false.
   */
  const isStateIgnored = (state, source) => false;

  /**
   * Function: destroyIcons
   *
   * Destroys the <focusIcons> if they exist.
   */
  const destroyIcons = () => {
    const focusIcons = getFocusIcons();

    if (isSet(focusIcons)) {
      for (let i = 0; i < focusIcons.length; i++) {
        focusIcons[i].destroy();
      }

      setFocusIcons();
      setFocusPoints();
    }
  };

  /**
   * Function: destroyFocusHighlight
   *
   * Destroys the <focusHighlight> if one exists.
   */
  const destroyFocusHighlight = () => {
    if (isSet(getFocusHighlight())) {
      getFocusHighlight().destroy();
      setFocusHighlight();
    }
  };

  /**
   * Function: isKeepFocusEvent
   *
   * Returns true if the current focused state should not be changed for the given event.
   * This returns true if shift and alt are pressed.
   */
  const isKeepFocusEvent = (mE) => Event.isShiftDown(mE.getEvent());

  /**
   * Function: getCellForEvent
   *
   * Returns the cell for the given event.
   */
  const getCellForEvent = (mE, point) => {
    const graph = getGraph();
    let cell = mE.getCell();

    // Gets cell under actual point if different from event location
    if (
      isUnset(cell) &&
      isSet(point) &&
      (mE.getGraphX() !== point.getX() || mE.getGraphY() !== point.getY())
    ) {
      cell = graph.getCellAt(point.getX(), point.getY());
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

    return graph.isCellLocked(cell) ? undefined : cell;
  };

  /**
   * Function: update
   *
   * Updates the state of this handler based on the given <mxMouseEvent>.
   * Source is a boolean indicating if the cell is a source or target.
   */
  const update = (mE, source, existingEdge, point) => {
    const graph = getGraph();

    if (isEnabled() && !isEventIgnored(mE)) {
      // Lazy installation of mouseleave handler
      if (isUnset(getMouseLeaveHandler()) && isSet(graph.getContainer())) {
        setMouseLeaveHandler(() => reset());

        Event.addListener(
          graph.getContainer(),
          'mouseleave',
          getResetHandler()
        );
      }

      const tol = getTolerance(mE);
      const x = isSet(point) ? point.getX() : mE.getGraphX();
      const y = isSet(point) ? point.getY() : mE.getGraphY();
      const grid = Rectangle(x - tol, y - tol, 2 * tol, 2 * tol);
      const mouse = Rectangle(
        mE.getGraphX() - tol,
        mE.getGraphY() - tol,
        2 * tol,
        2 * tol
      );
      const state = graph.getView().getState(getCellForEvent(mE, point));

      // Keeps focus icons visible while over vertex bounds and no other cell under mouse or shift is pressed
      if (
        !isKeepFocusEvent(mE) &&
        (isUnset(getCurrentFocusArea()) ||
          isUnset(getCurrentFocus()) ||
          isSet(state) ||
          !graph.getModel().isVertex(getCurrentFocus().getCell()) ||
          !_intersects(getCurrentFocusArea(), mouse)) &&
        state !== getCurrentFocus()
      ) {
        setCurrentFocusArea();
        setCurrentFocus();
        setFocus(mE, state, source);
      }

      setCurrentConstraint();
      setCurrentPoint();
      let minDistSq;

      if (
        isSet(getFocusIcons()) &&
        isSet(getConstraints()) &&
        (isUnset(state) || getCurrentFocus() === state)
      ) {
        const cx = mouse.getCenterX();
        const cy = mouse.getCenterY();
        const focusIcons = getFocusIcons();

        for (let i = 0; i < focusIcons.length; i++) {
          const dx = cx - focusIcons[i].getBounds().getCenterX();
          const dy = cy - focusIcons[i].getBounds().getCenterY();
          let tmp = dx * dx + dy * dy;

          if (
            (intersects(focusIcons[i], mouse, source, existingEdge) ||
              (isSet(point) &&
                intersects(focusIcons[i], grid, source, existingEdge))) &&
            (isUnset(minDistSq) || tmp < minDistSq)
          ) {
            setCurrentConstraint(getConstraints()[i]);
            setCurrentPoint(getFocusPoints()[i]);
            minDistSq = tmp;

            tmp = focusIcons[i].getBounds().clone();
            tmp.grow(HIGHLIGHT_SIZE + 1);
            tmp.setWidth(tmp.getWidth() - 1);
            tmp.setHeight(tmp.getHeight() - 1);

            if (isUnset(getFocusHighlight())) {
              const hl = createHighlightShape();
              hl.setPointerEvents(false);

              hl.init(graph.getView().getOverlayPane());
              setFocusHighlight(hl);

              const getState = () =>
                isSet(getCurrentFocus()) ? getCurrentFocus() : state;

              Event.redirectMouseEvents(hl.getNode(), graph, getState);
            }

            getFocusHighlight().setBounds(tmp);
            getFocusHighlight().redraw();
          }
        }
      }

      if (isUnset(getCurrentConstraint())) {
        destroyFocusHighlight();
      }
    } else {
      setCurrentConstraint();
      setCurrentFocus();
      setCurrentPoint();
    }
  };

  /**
   * Function: redraw
   *
   * Transfers the focus to the given state as a source or target terminal. If
   * the handler is not enabled then the outline is painted, but the constraints
   * are ignored.
   */
  const redraw = () => {
    const currentFocus = getCurrentFocus();
    const constraints = getConstraints();
    const focusIcons = getFocusIcons();

    if (isSet(currentFocus) && isSet(constraints) && isSet(focusIcons)) {
      const state = getGraph().getView().getState(currentFocus.getCell());
      setCurrentFocus(state);
      setCurrentFocusArea(
        Rectangle(
          state.getX(),
          state.getY(),
          state.getWidth(),
          state.getHeight()
        )
      );

      for (let i = 0; i < constraints.length; i++) {
        const cp = getGraph().getConnectionPoint(state, constraints[i]);
        const img = getImageForConstraint(state, constraints[i], cp);

        const bounds = Rectangle(
          Math.round(cp.getX() - img.getWidth() / 2),
          Math.round(cp.getY() - img.getHeight() / 2),
          img.getWidth(),
          img.getHeight()
        );
        focusIcons[i].setBounds(bounds);
        focusIcons[i].redraw();
        getCurrentFocusArea().add(focusIcons[i].getBounds());
        getFocusPoints()[i] = cp;
      }
    }
  };

  /**
   * Function: setFocus
   *
   * Transfers the focus to the given state as a source or target terminal. If
   * the handler is not enabled then the outline is painted, but the constraints
   * are ignored.
   */
  const setFocus = (mE, state, source) => {
    const graph = getGraph();
    const constraints = setConstraints(
      isSet(state) &&
        !isStateIgnored(state, source) &&
        graph.isCellConnectable(state.getCell())
        ? isEnabled()
          ? graph.getAllConnectionConstraints(state, source) || []
          : []
        : undefined
    );

    // Only uses cells which have constraints
    if (isSet(constraints)) {
      setCurrentFocus(state);
      setCurrentFocusArea(
        Rectangle(
          state.getX(),
          state.getY(),
          state.getWidth(),
          state.getHeight()
        )
      );

      if (isSet(getFocusIcons())) {
        for (let i = 0; i < getFocusIcons().length; i++) {
          getFocusIcons()[i].destroy();
        }

        setFocusIcons();
        setFocusPoints();
      }

      setFocusPoints([]);
      setFocusIcons([]);

      for (let i = 0; i < constraints.length; i++) {
        const cp = graph.getConnectionPoint(state, constraints[i]);
        const img = getImageForConstraint(state, constraints[i], cp);

        const src = img.getSrc();
        const bounds = Rectangle(
          Math.round(cp.getX() - img.getWidth() / 2),
          Math.round(cp.getY() - img.getHeight() / 2),
          img.getWidth(),
          img.getHeight()
        );
        const icon = ImageShape(bounds, src);
        icon.setPreserveImageAspect(false);
        icon.init(graph.getView().getDecoratorPane());

        // Move the icon behind all other overlays
        if (isSet(icon.getNode().previousSibling)) {
          icon
            .getNode()
            .parentNode.insertBefore(
              icon.getNode(),
              icon.getNode().parentNode.firstChild
            );
        }

        const getState = () =>
          isSet(getCurrentFocus()) ? getCurrentFocus() : state;

        icon.redraw();

        Event.redirectMouseEvents(icon.getNode(), graph, getState);
        getCurrentFocusArea().add(icon.getBounds());
        getFocusIcons().push(icon);
        getFocusPoints().push(cp);
      }

      getCurrentFocusArea().grow(getTolerance(mE));
    } else {
      destroyIcons();
      destroyFocusHighlight();
    }
  };

  /**
   * Function: createHighlightShape
   *
   * Create the shape used to paint the highlight.
   *
   * Returns true if the given icon intersects the given point.
   */
  const createHighlightShape = () => {
    const hl = RectangleShape(
      undefined,
      getHighlightColor(),
      getHighlightColor(),
      HIGHLIGHT_STROKEWIDTH
    );
    hl.setOpacity(HIGHLIGHT_OPACITY);

    return hl;
  };

  /**
   * Function: intersects
   *
   * Returns true if the given icon intersects the given rectangle.
   */
  const intersects = (icon, mouse, source, existingEdge) =>
    _intersects(icon.getBounds(), mouse);

  /**
   * Function: destroy
   *
   * Destroy this handler.
   */
  const destroy = () => {
    const graph = getGraph();
    const resetHandler = getResetHandler();

    reset();

    if (isSet(resetHandler)) {
      graph.getModel().removeListener(resetHandler);
      graph.getView().removeListener(resetHandler);
      graph.removeListener(resetHandler);
      setResetHandler();
    }

    if (isSet(getMouseLeaveHandler()) && isSet(graph.getContainer())) {
      Event.removeListener(
        graph.getContainer(),
        'mouseleave',
        getMouseLeaveHandler()
      );
      setMouseLeaveHandler();
    }
  };

  const me = {
    getPointImage,
    setPointImage,
    getGraph,
    setGraph,

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
    getHighlightColor,
    setHighlightColor,
    reset,
    getTolerance,
    getImageForConstraint,
    isEventIgnored,
    isStateIgnored,
    destroyIcons,
    destroyFocusHighlight,
    isKeepFocusEvent,
    getCellForEvent,
    update,
    redraw,
    setFocus,
    createHighlightShape,
    intersects,
    getCurrentConstraint,
    setCurrentConstraint,
    getCurrentFocus,
    setCurrentFocus,
    getCurrentFocusArea,
    setCurrentFocusArea,
    getCurrentPoint,
    setCurrentPoint,
    destroy
  };

  const resetHandler = getResetHandler();

  graph.getModel().addListener(Event.CHANGE, resetHandler);
  graph.getView().addListener(Event.SCALE_AND_TRANSLATE, resetHandler);
  graph.getView().addListener(Event.TRANSLATE, resetHandler);
  graph.getView().addListener(Event.SCALE, resetHandler);
  graph.addListener(Event.ROOT, resetHandler);

  return me;
};

export default makeComponent(ConstraintHandler);
