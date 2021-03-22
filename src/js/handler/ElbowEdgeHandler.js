/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import {
  addProp,
  createWithOverrides,
  extendFrom,
  isSet,
  isUnset,
  makeComponent
} from '../Helpers';
import {
  CURSOR_TERMINAL_HANDLE,
  EDGESTYLE_ELBOW,
  EDGESTYLE_TOPTOBOTTOM,
  ELBOW_VERTICAL,
  HANDLE_SIZE,
  STYLE_EDGE
} from '../util/Constants';
import Point from '../util/Point';
import EdgeStyle from '../view/EdgeStyle';
import EdgeHandler from './EdgeHandler';

/**
 * Class: ElbowEdgeHandler
 *
 * Graph event handler that reconnects edges and modifies control points and
 * the edge label location. Uses <mxTerminalMarker> for finding and
 * highlighting new source and target vertices. This handler is automatically
 * created in <mxGraph.createHandler>. It extends <mxEdgeHandler>.
 *
 * Constructor: mxEdgeHandler
 *
 * Constructs an edge handler for the specified <mxCellState>.
 *
 * Parameters:
 *
 * state - <mxCellState> of the cell to be modified.
 */
const ElbowEdgeHandler = (state) => {
  /**
   * Specifies if a double click on the middle handle should call
   * <mxGraph.flipEdge>. Default is true.
   */
  const [isFlipEnabled, setFlipEnabled] = addProp(true);

  /**
   * Function: createBends
   *
   * Overrides <mxEdgeHandler.createBends> to create custom bends.
   */
  const createBends = () => {
    const bends = [];

    // Source
    const bend = _edgeHandler.createHandleShape(0);
    _edgeHandler.initBend(bend);
    bend.setCursor(CURSOR_TERMINAL_HANDLE);
    bends.push(bend);

    // Virtual
    bends.push(
      this.createVirtualBend((evt) => {
        if (!Event.isConsumed(evt) && isFlipEnabled()) {
          _edgeHandler
            .getGraph()
            .flipEdge(_edgeHandler.getState().getCell(), evt);
          Event.consume(evt);
        }
      })
    );

    _edgeHandler.getPoints().push(Point(0, 0));

    // Target
    bend = _edgeHandler.createHandleShape(2);
    _edgeHandler.initBend(bend);
    bend.setCursor(CURSOR_TERMINAL_HANDLE);
    bends.push(bend);

    return bends;
  };

  /**
   * Function: createVirtualBend
   *
   * Creates a virtual bend that supports double clicking and calls
   * <mxGraph.flipEdge>.
   */
  const createVirtualBend = (dblClickHandler) => {
    const bend = _edgeHandler.createHandleShape();
    _edgeHandler.initBend(bend, dblClickHandler);

    bend.setCursor(getCursorForBend());

    if (
      !_edgeHandler.getGraph().isCellBendable(_edgeHandler.getState().getCell())
    ) {
      bend.getNode().style.display = 'none';
    }

    return bend;
  };

  /**
   * Function: getCursorForBend
   *
   * Returns the cursor to be used for the bend.
   */
  const getCursorForBend = () => {
    const state = _edgeHandler.getState();
    const style = state.getStyle();

    return style[STYLE_EDGE] === EdgeStyle.TopToBottom ||
      style[STYLE_EDGE] === EDGESTYLE_TOPTOBOTTOM ||
      ((style[STYLE_EDGE] === EdgeStyle.ElbowConnector ||
        style[STYLE_EDGE] === EDGESTYLE_ELBOW) &&
        style[STYLE_ELBOW] === ELBOW_VERTICAL)
      ? 'row-resize'
      : 'col-resize';
  };

  /**
   * Function: getTooltipForNode
   *
   * Returns the tooltip for the given node.
   */
  const getTooltipForNode = (node) => {
    let tip;
    const bends = _edgeHandler.getBends();

    if (
      isSet(bends) &&
      isSet(bends[1]) &&
      (node === bends[1].getNode() || node.parentNode === bends[1].getNode())
    ) {
      tip = 'doubleClickOrientation';
    }

    return tip;
  };

  /**
   * Function: convertPoint
   *
   * Converts the given point in-place from screen to unscaled, untranslated
   * graph coordinates and applies the grid.
   *
   * Parameters:
   *
   * point - <mxPoint> to be converted.
   * gridEnabled - Boolean that specifies if the grid should be applied.
   */
  const convertPoint = (point, gridEnabled) => {
    const graph = _edgeHandler.getGraph();
    const scale = graph.getView().getScale();
    const tr = graph.getView().getTranslate();
    const origin = _edgeHandler.getState().getOrigin();

    if (gridEnabled) {
      point.setX(graph.snap(point.getX()));
      point.setY(graph.snap(point.getY()));
    }

    point.setX(Math.round(point.getX() / scale - tr.getX() - origin.getX()));
    point.setY(Math.round(point.getY() / scale - tr.getY() - origin.getY()));

    return point;
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
    const graph = _edgeHandler.getGraph();
    const state = _edgeHandler.getState();
    const g = graph.getModel().getGeometry(state.getCell());
    const pts = state.getAbsolutePoints();
    let pt;

    // Keeps the virtual bend on the edge shape
    if (pts.length > 1) {
      p0 = pts[1];
      pe = pts[pts.length - 2];
    } else if (isSet(g.getPoints()) && g.getPoints().length > 0) {
      pt = pts[0];
    }

    if (isUnset(pt)) {
      pt = Point(
        p0.getX() + (pe.getX() - p0.getX()) / 2,
        p0.getY() + (pe.getY() - p0.getY()) / 2
      );
    } else {
      pt = Point(
        graph.getView().getScale() *
          (pt.getX() +
            graph.getView().getTranslate().getX() +
            state.getOrigin().getX()),
        graph.getView().getScale() *
          (pt.getY() +
            graph.getView().getTranslate().getY() +
            state.getOrigin().getY())
      );
    }

    // Makes handle slightly bigger if the yellow  label handle
    // exists and intersects this green handle
    const bends = _edgeHandler.getBends();
    const b = bends[1].getBounds();
    const w = b.getWidth();
    const h = b.getHeight();
    const bounds = Rectangle(
      Math.round(pt.getX() - w / 2),
      Math.round(pt.getY() - h / 2),
      w,
      h
    );

    if (_edgeHandler.isManageLabelHandle()) {
      _edgeHandler.checkLabelHandle(bounds);
    } else if (
      isUnset(getHandleImage()) &&
      _edgeHandler.getLabelShape().isVisible() &&
      intersects(bounds, _edgeHandler.getLabelShape().getBounds())
    ) {
      w = HANDLE_SIZE + 3;
      h = HANDLE_SIZE + 3;
      bounds = Rectangle(
        Math.floor(pt.getX() - w / 2),
        Math.floor(pt.getY() - h / 2),
        w,
        h
      );
    }

    bends[1].setBounds(bounds);
    bends[1].redraw();

    if (_edgeHandler.isManageLabelHandle()) {
      _edgeHandler.checkLabelHandle(bends[1].getBounds());
    }
  };

  const me = {
    isFlipEnabled,
    setFlipEnabled,
    createBends,
    createVirtualBend,
    getCursorForBend,
    getTooltipForNode,
    convertPoint,
    redrawInnerBends
  };

  // Extends EdgeHandler.
  const _edgeHandler = EdgeHandler(state);
  extendFrom(_edgeHandler)(me);

  return me;
};

export default makeComponent(ElbowEdgeHandler);
