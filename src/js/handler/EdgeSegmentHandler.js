/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { createWithOverrides, isSet, isUnset, makeComponent } from '../Helpers';
import { CURSOR_TERMINAL_HANDLE } from '../util/Constants';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import { contains, setOpacity } from '../util/Utils';
import EdgeHandler from './EdgeHandler';
import ElbowEdgeHandler from './ElbowEdgeHandler';

const EdgeSegmentHandler = (state) => {
  /**
   * Function: getCurrentPoints
   *
   * Returns the current absolute points.
   */
  const getCurrentPoints = () => {
    const pts = _elbowEdgeHandler.getState().getAbsolutePoints();

    if (isSet(pts)) {
      // Special case for straight edges where we add a virtual middle handle for moving the edge
      const tol = Math.max(
        1,
        _elbowEdgeHandler.getGraph().getView().getScale()
      );

      if (
        pts.length === 2 ||
        (pts.length === 3 &&
          ((Math.abs(pts[0].getX() - pts[1].getX()) < tol &&
            Math.abs(pts[1].getX() - pts[2].getX()) < tol) ||
            (Math.abs(pts[0].getY() - pts[1].getY()) < tol &&
              Math.abs(pts[1].getY() - pts[2].getY()) < tol)))
      ) {
        const cx =
          pts[0].getX() + (pts[pts.length - 1].getX() - pts[0].getX()) / 2;
        const cy =
          pts[0].getY() + (pts[pts.length - 1].getY() - pts[0].getY()) / 2;

        pts = [pts[0], Point(cx, cy), Point(cx, cy), pts[pts.length - 1]];
      }
    }

    return pts;
  };

  /**
   * Function: getPreviewPoints
   *
   * Updates the given preview state taking into account the state of the constraint handler.
   */
  const getPreviewPoints = (point) => {
    const _handler = _elbowEdgeHandler;
    const state = _handler.getState();

    if (_handler.isSource() || _handler.isTarget()) {
      return _handler.getPreviewPoints(point);
    } else {
      const pts = _handler.getCurrentPoints();
      let last = _handler.convertPoint(pts[0].clone(), false);
      point = _handler.convertPoint(point.clone(), false);
      const result = [];

      for (let i = 1; i < pts.length; i++) {
        const pt = _handler.convertPoint(pts[i].clone(), false);

        if (i === _handler.getIndex()) {
          if (Math.round(last.getX() - pt.getX()) === 0) {
            last.setX(point.getX());
            pt.setX(point.getX());
          }

          if (Math.round(last.getY() - pt.getY()) === 0) {
            last.setY(point.getY());
            pt.setY(point.getY());
          }
        }

        if (i < pts.length - 1) {
          result.push(pt);
        }

        last = pt;
      }

      // Replaces single point that intersects with source or target
      if (result.length === 1) {
        const source = state.getVisibleTerminalState(true);
        const target = state.getVisibleTerminalState(false);
        const scale = state.getView().getScale();
        const tr = state.getView().getTranslate();

        const x = result[0].getX() * scale + tr.getX();
        const y = result[0].getY() * scale + tr.getY();

        if (
          (isSet(source) && contains(source, x, y)) ||
          (isSet(target) && contains(target, x, y))
        ) {
          result = [point, point];
        }
      }

      return result;
    }
  };

  /**
   * Function: updatePreviewState
   *
   * Overridden to perform optimization of the edge style result.
   */
  const updatePreviewState = (edge, point, terminalState, mE) => {
    _edgeHandler._updatePreviewState(edge, point, terminalState, mE);

    const _handler = _elbowEdgeHandler;

    // Checks and corrects preview by running edge style again
    if (!_handler.isSource() && !_handler.isTarget()) {
      point = _handler.convertPoint(point.clone(), false);
      const pts = edge.getAbsolutePoints();
      let pt0 = pts[0];
      let pt1 = pts[1];

      let result = [];

      for (let i = 2; i < pts.length; i++) {
        const pt2 = pts[i];

        // Merges adjacent segments only if more than 2 to allow for straight edges
        if (
          (Math.round(pt0.getX() - pt1.getX()) !== 0 ||
            Math.round(pt1.getX() - pt2.getX()) !== 0) &&
          (Math.round(pt0.getY() - pt1.getY()) !== 0 ||
            Math.round(pt1.getY() - pt2.getY()) !== 0)
        ) {
          result.push(_handler.convertPoint(pt1.clone(), false));
        }

        pt0 = pt1;
        pt1 = pt2;
      }

      const graph = _handler.getGraph();
      const state = _handler.getState();
      const source = state.getVisibleTerminalState(true);
      const target = state.getVisibleTerminalState(false);
      const rpts = state.getAbsolutePoints();

      // A straight line is represented by 3 handles
      if (
        result.length === 0 &&
        (Math.round(pts[0].getX() - pts[pts.length - 1].getX()) === 0 ||
          Math.round(pts[0].getY() - pts[pts.length - 1].getY()) === 0)
      ) {
        result = [point, point];
      }
      // Handles special case of transitions from straight vertical to routed
      else if (
        pts.length === 5 &&
        result.length === 2 &&
        isSet(source) &&
        isSet(target) &&
        isSet(rpts) &&
        Math.round(rpts[0].getX() - rpts[rpts.length - 1].getX()) == 0
      ) {
        const view = graph.getView();
        const scale = view.getScale();
        const tr = view.getTranslate();

        let y0 = view.getRoutingCenterY(source) / scale - tr.getY();

        // Use fixed connection point y-coordinate if one exists
        const sc = graph.getConnectionConstraint(edge, source, true);

        if (isSet(sc)) {
          const pt = graph.getConnectionPoint(source, sc);

          if (isSet(pt)) {
            _handler.convertPoint(pt, false);
            y0 = pt.getY();
          }
        }

        let ye = view.getRoutingCenterY(target) / scale - tr.getY();

        // Use fixed connection point y-coordinate if one exists
        const tc = graph.getConnectionConstraint(edge, target, false);

        if (tc) {
          const pt = graph.getConnectionPoint(target, tc);

          if (isSet(pt)) {
            _handler.convertPoint(pt, false);
            ye = pt.getY();
          }
        }

        result = [Point(point.getX(), y0), Point(point.getX(), ye)];
      }

      _handler.setPoints(result);

      // LATER: Check if points and result are different
      edge.getView().updateFixedTerminalPoints(edge, source, target);
      edge.getView().updatePoints(edge, _handler.getPoints(), source, target);
      edge.getView().updateFloatingTerminalPoints(edge, source, target);
    }
  };

  /**
   * Overriden to merge edge segments.
   */
  const connect = (edge, terminal, isSource, isClone, mE) => {
    const _handler = _elbowEdgeHandler;
    const model = _handler.getGraph().getModel();
    const geo = model.getGeometry(edge);
    let result;

    // Merges adjacent edge segments
    if (isSet(geo) && isSet(geo.getPoints()) && geo.getPoints().length > 0) {
      const pts = _handler.getAbsPoints();
      let pt0 = pts[0];
      let pt1 = pts[1];
      result = [];

      for (let i = 2; i < pts.length; i++) {
        const pt2 = pts[i];

        // Merges adjacent segments only if more than 2 to allow for straight edges
        if (
          (Math.round(pt0.getX() - pt1.getX()) !== 0 ||
            Math.round(pt1.getX() - pt2.getX()) !== 0) &&
          (Math.round(pt0.getY() - pt1.getY()) !== 0 ||
            Math.round(pt1.getY() - pt2.getY()) !== 0)
        ) {
          result.push(_handler.convertPoint(pt1.clone(), false));
        }

        pt0 = pt1;
        pt1 = pt2;
      }
    }

    model.beginUpdate();

    try {
      if (isSet(result)) {
        let geo = model.getGeometry(edge);

        if (isSet(geo)) {
          geo = geo.clone();
          geo.setPoints(result);

          model.setGeometry(edge, geo);
        }
      }

      edge = _edgeHandler.connect(edge, terminal, isSource, isClone, mE);
    } finally {
      model.endUpdate();
    }

    return edge;
  };

  /**
   * Function: getTooltipForNode
   *
   * Returns no tooltips.
   */
  const getTooltipForNode = (node) => {};

  /**
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  const start = (x, y, index) => {
    const _handler = _elbowEdgeHandler;

    _edgeHandler._start(x, y, index);

    if (
      isSet(_handler.getBends()) &&
      isSet(_handler.getBends()[index]) &&
      !_handler.isSource() &&
      !_handler.isTarget()
    ) {
      setOpacity(_handler.getBends()[index].getNode(), 100);
    }
  };

  /**
   * Function: createBends
   *
   * Adds custom bends for the center of each segment.
   */
  const createBends = () => {
    const _handler = _elbowEdgeHandler;
    const bends = [];

    // Source
    let bend = _handler.createHandleShape(0);
    _handler.initBend(bend);
    bend.setCursor(CURSOR_TERMINAL_HANDLE);
    bends.push(bend);

    const pts = _handler.getCurrentPoints();

    // Waypoints (segment handles)
    if (_handler.getGraph().isCellBendable(_handler.getState().getCell())) {
      if (isUnset(_handler.getPoints())) {
        _handler.setPoints([]);
      }

      for (let i = 0; i < pts.length - 1; i++) {
        bend = _handler.createVirtualBend();
        bends.push(bend);
        let horizontal = Math.round(pts[i].getX() - pts[i + 1].getX()) === 0;

        // Special case where dy is 0 as well
        if (
          Math.round(pts[i].getY() - pts[i + 1].getY()) === 0 &&
          i < pts.length - 2
        ) {
          horizontal = Math.round(pts[i].getX() - pts[i + 2].getX()) === 0;
        }

        bend.setCursor(horizontal ? 'col-resize' : 'row-resize');
        _handler.getPoints().push(Point(0, 0));
      }
    }

    // Target
    bend = _handler.createHandleShape(pts.length);
    _handler.initBend(bend);
    bend.setCursor(CURSOR_TERMINAL_HANDLE);
    bends.push(bend);

    return bends;
  };

  /**
   * Function: redraw
   *
   * Overridden to invoke <refresh> before the redraw.
   */
  const redraw = () => {
    _elbowEdgeHandler.refresh();
    _edgeHandler._redraw();
  };

  /**
   * Function: redrawInnerBends
   *
   * Updates the position of the custom bends.
   */
  const redrawInnerBends = (p0, pe) => {
    const _handler = _elbowEdgeHandler;

    if (_handler.getGraph().isCellBendable(_handler.getState().getCell())) {
      const pts = _handler.getCurrentPoints();

      if (isSet(pts) && pts.length > 1) {
        let straight = false;

        // Puts handle in the center of straight edges
        if (
          pts.length === 4 &&
          Math.round(pts[1].getX() - pts[2].getX()) === 0 &&
          Math.round(pts[1].getY() - pts[2].getY()) === 0
        ) {
          straight = true;

          if (Math.round(pts[0].getY() - pts[pts.length - 1].getY()) === 0) {
            const cx =
              pts[0].getX() + (pts[pts.length - 1].getX() - pts[0].getX()) / 2;
            pts[1] = Point(cx, pts[1].getY());
            pts[2] = Point(cx, pts[2].getY());
          } else {
            const cy =
              pts[0].getY() + (pts[pts.length - 1].getY() - pts[0].getY()) / 2;
            pts[1] = Point(pts[1].getX(), cy);
            pts[2] = Point(pts[2].getX(), cy);
          }
        }

        const bends = _handler.getBends();

        for (let i = 0; i < pts.length - 1; i++) {
          if (isSet(bends[i + 1])) {
            const p0 = pts[i];
            const pe = pts[i + 1];
            const pt = Point(
              p0.getX() + (pe.getX() - p0.getX()) / 2,
              p0.getY() + (pe.getY() - p0.getY()) / 2
            );
            const b = bends[i + 1].getBounds();
            bends[i + 1].setBounds(
              Rectangle(
                Math.floor(pt.getX() - b.getWidth() / 2),
                Math.floor(pt.getY() - b.getHeight() / 2),
                b.getWidth(),
                b.getHeight()
              )
            );
            bends[i + 1].redraw();

            if (_handler.isManageLabelHandle()) {
              _handler.checkLabelHandle(bends[i + 1].getBounds());
            }
          }
        }

        if (straight) {
          setOpacity(bends[1].getNode(), _handler.getVirtualBendOpacity());
          setOpacity(bends[3].getNode(), _handler.getVirtualBendOpacity());
        }
      }
    }
  };

  const _edgeHandler = createWithOverrides({
    getPreviewPoints,
    updatePreviewState,
    start,
    createBends,
    redrawInnerBends,
    ...EdgeSegmentHandler.getOverrides()
  })(EdgeHandler)(state);

  const _elbowEdgeHandler = createWithOverrides({
    getPreviewPoints,
    updatePreviewState,
    start,
    createBends,
    redrawInnerBends,
    ...EdgeSegmentHandler.getOverrides()
  })(ElbowEdgeHandler)(state);

  const me = {
    ..._elbowEdgeHandler,
    getCurrentPoints,
    getPreviewPoints,
    updatePreviewState,
    connect,
    getTooltipForNode,
    start,
    createBends,
    redraw,
    redrawInnerBends
  };

  return me;
};

export default makeComponent(EdgeSegmentHandler);
