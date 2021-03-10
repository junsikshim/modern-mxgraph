/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet } from '../Helpers';
import {
  DEFAULT_VALID_COLOR,
  HIGHLIGHT_OPACITY,
  HIGHLIGHT_STROKEWIDTH,
  STYLE_ROTATION
} from '../util/Constants';
import Event from '../util/Event';

/**
 * Class: CellHighlight
 *
 * A helper class to highlight cells. Here is an example for a given cell.
 *
 * (code)
 * var highlight = new mxCellHighlight(graph, '#ff0000', 2);
 * highlight.highlight(graph.view.getState(cell)));
 * (end)
 *
 * Constructor: CellHighlight
 *
 * Constructs a cell highlight.
 */
const CellHighlight = (
  graph,
  highlightColor = DEFAULT_VALID_COLOR,
  strokeWidth = HIGHLIGHT_STROKEWIDTH,
  dashed = false
) => {
  /**
   * Variable: keepOnTop
   *
   * Specifies if the highlights should appear on top of everything
   * else in the overlay pane. Default is false.
   */
  const [isKeepOnTop, setKeepOnTop] = addProp(false);

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  const [getGraph, setGraph] = addProp(graph);

  /**
   * Variable: state
   *
   * Reference to the <mxCellState>.
   */
  const [getState, setState] = addProp();

  /**
   * Variable: spacing
   *
   * Specifies the spacing between the highlight for vertices and the vertex.
   * Default is 2.
   */
  const [getSpacing, setSpacing] = addProp(2);

  /**
   * Variable: resetHandler
   *
   * Holds the handler that automatically invokes reset if the highlight
   * should be hidden.
   */
  const [getResetHandler, setResetHandler] = addProp(() => hide());
  const [getShape, setShape] = addProp();
  const [getStrokeWidth, setStrokeWidth] = addProp(strokeWidth);
  const [getHighlightColor, _setHighlightColor] = addProp(highlightColor);
  const [isDashed, setDashed] = addProp(dashed);
  const [getOpacity, setOpacity] = addProp(HIGHLIGHT_OPACITY);
  const [getRepaintHandler, setRepaintHandler] = addProp(() => {
    // Updates reference to state
    if (isSet(getState())) {
      const tmp = getGraph().getView().getState(getState().getCell());

      if (isUnset(tmp)) {
        hide();
      } else {
        setState(tmp);
        repaint();
      }
    }
  });

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
    _setHighlightColor(color);

    if (isSet(getShape())) {
      getShape().setStroke(color);
    }
  };

  /**
   * Function: drawHighlight
   *
   * Creates and returns the highlight shape for the given state.
   */
  const drawHighlight = () => {
    const shape = setShape(createShape());
    const node = shape.getNode();
    repaint();

    if (!isKeepOnTop() && node.parentNode.firstChild !== node) {
      node.parentNode.insertBefore(node, node.parentNode.firstChild);
    }
  };

  /**
   * Function: createShape
   *
   * Creates and returns the highlight shape for the given state.
   */
  const createShape = () => {
    const graph = getGraph();
    const shape = graph.getCellRenderer().createShape(getState());

    shape.setSvgStrokeTolerance(graph.getTolerance());
    shape.setPoints(getState().getAbsolutePoints());
    shape.apply(getState());
    shape.setStroke(getHighlightColor());
    shape.setOpacity(getOpacity());
    shape.setDashed(isDashed());
    shape.setShadow(false);

    shape.init(graph.getView().getOverlayPane());
    Event.redirectMouseEvents(shape.getNode(), graph, getState());

    shape.svgPointerEvents = 'stroke';

    return shape;
  };

  /**
   * Function: repaint
   *
   * Updates the highlight after a change of the model or view.
   */
  const repaint = () => {
    const state = getState();
    const shape = getShape();

    if (isSet(state) && isSet(shape)) {
      shape.setScale(state.getView().getScale());

      if (getGraph().getModel().isEdge(state.getCell())) {
        shape.setStrokeWidth(getStrokeWidth());
        shape.setPoints(state.getAbsolutePoints());
        shape.setOutline(false);
      } else {
        shape.setBounds(
          Rectangle(
            state.getX() - getSpacing(),
            state.getY() - getSpacing(),
            state.getWidth() + 2 * getSpacing(),
            state.getHeight() + 2 * getSpacing()
          )
        );
        shape.setRotation(Number(state.getStyle()[STYLE_ROTATION] || '0'));
        shape.setStrokeWidth(getStrokeWidth() / state.getView().getScale());
        shape.setOutline(true);
      }

      // Uses cursor from shape in highlight
      if (isSet(state.getShape())) {
        shape.setCursor(state.getShape().getCursor());
      }

      shape.redraw();
    }
  };

  /**
   * Function: hide
   *
   * Resets the state of the cell marker.
   */
  const hide = () => highlight();

  /**
   * Function: mark
   *
   * Marks the <markedState> and fires a <mark> event.
   */
  const highlight = (state) => {
    if (getState() !== state) {
      if (isSet(getShape())) {
        getShape().destroy();
        setShape();
      }

      setState(state);

      if (isSet(getState())) {
        drawHighlight();
      }
    }
  };

  /**
   * Function: isHighlightAt
   *
   * Returns true if this highlight is at the given position.
   */
  const isHighlightAt = (x, y) => {
    let hit = false;

    // Quirks mode is currently not supported as it used a different coordinate system
    if (isSet(getShape()) && isSet(document.elementFromPoint)) {
      let elt = document.elementFromPoint(x, y);

      while (isSet(elt)) {
        if (elt === getShape().getNode()) {
          hit = true;
          break;
        }

        elt = elt.parentNode;
      }
    }

    return hit;
  };

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  const destroy = () => {
    const graph = getGraph();
    graph.getView().removeListener(getResetHandler());
    graph.getView().removeListener(getRepaintHandler());
    graph.getModel().removeListener(getRepaintHandler());

    if (isSet(getShape())) {
      getShape().destroy();
      setShape();
    }
  };

  const me = {
    setHighlightColor,
    drawHighlight,
    createShape,

    /**
     * Function: getStrokeWidth
     *
     * Returns the stroke width.
     */
    getStrokeWidth,
    repaint,
    hide,
    highlight,
    isHighlightAt,
    destroy
  };

  graph.getView().addListener(Event.SCALE, getRepaintHandler());
  graph.getView().addListener(Event.TRANSLATE, getRepaintHandler());
  graph.getView().addListener(Event.SCALE_AND_TRANSLATE, getRepaintHandler());
  graph.getModel().addListener(Event.CHANGE, getRepaintHandler());

  return me;
};

export default CellHighlight;
