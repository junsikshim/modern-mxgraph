/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { isSet, isUnset } from '../Helpers';
import {
  DEFAULT_MARKERSIZE,
  DIRECTION_EAST,
  DIRECTION_MASK_ALL,
  DIRECTION_MASK_EAST,
  DIRECTION_MASK_NONE,
  DIRECTION_MASK_NORTH,
  DIRECTION_MASK_SOUTH,
  DIRECTION_MASK_WEST,
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  DIRECTION_WEST,
  ENTITY_SEGMENT,
  NONE,
  STYLE_DIRECTION,
  STYLE_ENDARROW,
  STYLE_ENDSIZE,
  STYLE_JETTY_SIZE,
  STYLE_ROTATION,
  STYLE_SEGMENT,
  STYLE_SOURCE_JETTY_SIZE,
  STYLE_STARTARROW,
  STYLE_STARTSIZE,
  STYLE_TARGET_JETTY_SIZE
} from '../util/Constants';
import Point from '../util/Point';
import {
  contains,
  getPortConstraints,
  getValue,
  reversePortConstraints
} from '../util/Utils';
import CellState from './CellState';

/**
 * Class: EdgeStyle
 *
 * Provides various edge styles to be used as the values for
 * <mxConstants.STYLE_EDGE> in a cell style.
 *
 * Example:
 *
 * (code)
 * var style = stylesheet.getDefaultEdgeStyle();
 * style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
 * (end)
 *
 * Sets the default edge style to <ElbowConnector>.
 *
 * Custom edge style:
 *
 * To write a custom edge style, a function must be added to the mxEdgeStyle
 * object as follows:
 *
 * (code)
 * mxEdgeStyle.MyStyle = function(state, source, target, points, result)
 * {
 *   if (source != null && target != null)
 *   {
 *     var pt = new mxPoint(target.getCenterX(), source.getCenterY());
 *
 *     if (mxUtils.contains(source, pt.x, pt.y))
 *     {
 *       pt.y = source.y + source.height;
 *     }
 *
 *     result.push(pt);
 *   }
 * };
 * (end)
 *
 * In the above example, a right angle is created using a point on the
 * horizontal center of the target vertex and the vertical center of the source
 * vertex. The code checks if that point intersects the source vertex and makes
 * the edge straight if it does. The point is then added into the result array,
 * which acts as the return value of the function.
 *
 * The new edge style should then be registered in the <mxStyleRegistry> as follows:
 * (code)
 * mxStyleRegistry.putValue('myEdgeStyle', mxEdgeStyle.MyStyle);
 * (end)
 *
 * The custom edge style above can now be used in a specific edge as follows:
 *
 * (code)
 * model.setStyle(edge, 'edgeStyle=myEdgeStyle');
 * (end)
 *
 * Note that the key of the <mxStyleRegistry> entry for the function should
 * be used in string values, unless <mxGraphView.allowEval> is true, in
 * which case you can also use mxEdgeStyle.MyStyle for the value in the
 * cell style above.
 *
 * Or it can be used for all edges in the graph as follows:
 *
 * (code)
 * var style = graph.getStylesheet().getDefaultEdgeStyle();
 * style[mxConstants.STYLE_EDGE] = mxEdgeStyle.MyStyle;
 * (end)
 *
 * Note that the object can be used directly when programmatically setting
 * the value, but the key in the <mxStyleRegistry> should be used when
 * setting the value via a key, value pair in a cell style.
 */
const EdgeStyle = {
  /**
   * Function: EntityRelation
   *
   * Implements an entity relation style for edges (as used in database
   * schema diagrams). At the time the function is called, the result
   * array contains a placeholder (null) for the first absolute point,
   * that is, the point where the edge and source terminal are connected.
   * The implementation of the style then adds all intermediate waypoints
   * except for the last point, that is, the connection point between the
   * edge and the target terminal. The first ant the last point in the
   * result array are then replaced with mxPoints that take into account
   * the terminal's perimeter and next point on the edge.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the edge to be updated.
   * source - <mxCellState> that represents the source terminal.
   * target - <mxCellState> that represents the target terminal.
   * points - List of relative control points.
   * result - Array of <mxPoints> that represent the actual points of the
   * edge.
   */
  EntityRelation: (state, source, target, points, result) => {
    const view = state.getView();
    const graph = view.getGraph();
    const segment =
      getValue(state.getStyle(), STYLE_SEGMENT, ENTITY_SEGMENT) *
      view.getScale();

    const pts = state.getAbsolutePoints();
    const p0 = pts[0];
    const pe = pts[pts.length - 1];

    let isSourceLeft = false;

    if (isSet(source)) {
      const sourceGeometry = graph.getCellGeometry(source.getCell());

      if (sourceGeometry.isRelative()) {
        isSourceLeft = sourceGeometry.getX() <= 0.5;
      } else if (isSet(target)) {
        isSourceLeft =
          (isSet(pe) ? pe.getX() : target.getX() + target.getWidth()) <
          (isSet(p0) ? p0.getX() : source.getX());
      }
    }

    if (isSet(p0)) {
      source = CellState();
      source.setX(p0.getX());
      source.setY(p0.getY());
    } else if (isSet(source)) {
      const constraint = getPortConstraints(
        source,
        state,
        true,
        DIRECTION_MASK_NONE
      );

      if (
        constraint !== DIRECTION_MASK_NONE &&
        constraint !== DIRECTION_MASK_WEST + DIRECTION_MASK_EAST
      ) {
        isSourceLeft = constraint === DIRECTION_MASK_WEST;
      }
    } else {
      return;
    }

    let isTargetLeft = true;

    if (isSet(target)) {
      const targetGeometry = graph.getCellGeometry(target.getCell());

      if (targetGeometry.isRelative()) {
        isTargetLeft = targetGeometry.getX() <= 0.5;
      } else if (isSet(source)) {
        isTargetLeft =
          (isSet(p0) ? p0.getX() : source.getX() + source.getWidth()) <
          (isSet(pe) ? pe.getX() : target.getX());
      }
    }

    if (isSet(pe)) {
      target = CellState();
      target.setX(pe.getX());
      target.setY(pe.getY());
    } else if (isSet(target)) {
      const constraint = getPortConstraints(
        target,
        state,
        false,
        DIRECTION_MASK_NONE
      );

      if (
        constraint !== DIRECTION_MASK_NONE &&
        constraint !== DIRECTION_MASK_WEST + DIRECTION_MASK_EAST
      ) {
        isTargetLeft = constraint === DIRECTION_MASK_WEST;
      }
    }

    if (isSet(source) && isSet(target)) {
      const x0 = isSourceLeft
        ? source.getX()
        : source.getX() + source.getWidth();
      const y0 = view.getRoutingCenterY(source);

      const xe = isTargetLeft
        ? target.getX()
        : target.getX() + target.getWidth();
      const ye = view.getRoutingCenterY(target);

      const seg = segment;

      let dx = isSourceLeft ? -seg : seg;
      const dep = Point(x0 + dx, y0);

      dx = isTargetLeft ? -seg : seg;
      const arr = Point(xe + dx, ye);

      // Adds intermediate points if both go out on same side
      if (isSourceLeft === isTargetLeft) {
        const x = isSourceLeft
          ? Math.min(x0, xe) - segment
          : Math.max(x0, xe) + segment;

        result.push(Point(x, y0));
        result.push(Point(x, ye));
      } else if (dep.getX() < arr.getX() === isSourceLeft) {
        const midY = y0 + (ye - y0) / 2;

        result.push(dep);
        result.push(Point(dep.getX(), midY));
        result.push(Point(arr.getX(), midY));
        result.push(arr);
      } else {
        result.push(dep);
        result.push(arr);
      }
    }
  },

  /**
   * Function: Loop
   *
   * Implements a self-reference, aka. loop.
   */
  Loop: (state, source, target, points, result) => {
    const pts = state.getAbsolutePoints();

    const p0 = pts[0];
    const pe = pts[pts.length - 1];

    if (isSet(p0) && isSet(pe)) {
      if (isSet(points) && points.length > 0) {
        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          pt = state.getView().transformControlPoint(state, pt);
          result.push(Point(pt.getX(), pt.getY()));
        }
      }

      return;
    }

    if (isSet(source)) {
      const view = state.getView();
      const graph = view.getGraph();
      let pt = isSet(points) && points.length > 0 ? points[0] : undefined;

      if (isSet(pt)) {
        pt = view.transformControlPoint(state, pt);

        if (contains(source, pt.getX(), pt.getY())) {
          pt = undefined;
        }
      }

      let x = 0;
      let dx = 0;
      let y = 0;
      let dy = 0;

      const seg =
        getValue(state.getStyle(), STYLE_SEGMENT, graph.getGridSize()) *
        view.getScale();
      const dir = getValue(state.getStyle(), STYLE_DIRECTION, DIRECTION_WEST);

      if (dir === DIRECTION_NORTH || dir === DIRECTION_SOUTH) {
        x = view.getRoutingCenterX(source);
        dx = seg;
      } else {
        y = view.getRoutingCenterY(source);
        dy = seg;
      }

      if (
        isUnset(pt) ||
        pt.getX() < source.getX() ||
        pt.getX() > source.getX() + source.getWidth()
      ) {
        if (isSet(pt)) {
          x = pt.getX();
          dy = Math.max(Math.abs(y - pt.getY()), dy);
        } else {
          if (dir === DIRECTION_NORTH) {
            y = source.getY() - 2 * dx;
          } else if (dir === DIRECTION_SOUTH) {
            y = source.getY() + source.getHeight() + 2 * dx;
          } else if (dir === DIRECTION_EAST) {
            x = source.getX() - 2 * dy;
          } else {
            x = source.getX() + source.getWidth() + 2 * dy;
          }
        }
      } else if (isSet(pt)) {
        x = view.getRoutingCenterX(source);
        dx = Math.max(Math.abs(x - pt.getX()), dy);
        y = pt.getY();
        dy = 0;
      }

      result.push(Point(x - dx, y - dy));
      result.push(Point(x + dx, y + dy));
    }
  },

  /**
   * Function: ElbowConnector
   *
   * Uses either <SideToSide> or <TopToBottom> depending on the horizontal
   * flag in the cell style. <SideToSide> is used if horizontal is true or
   * unspecified. See <EntityRelation> for a description of the
   * parameters.
   */
  ElbowConnector: (state, source, target, points, result) => {
    let pt = isSet(points) && points.length > 0 ? points[0] : undefined;

    let vertical = false;
    let horizontal = false;

    if (isSet(source) && isSet(target)) {
      if (isSet(pt)) {
        const left = Math.min(source.getX(), target.getX());
        const right = Math.max(
          source.getX() + source.getWidth(),
          target.getX() + target.getWidth()
        );

        const top = Math.min(source.getY(), target.getY());
        const bottom = Math.max(
          source.getY() + source.getHeight(),
          target.getY() + target.getHeight()
        );

        pt = state.view.transformControlPoint(state, pt);

        vertical = pt.getY() < top || pt.getY() > bottom;
        horizontal = pt.getX() < left || pt.getX() > right;
      } else {
        const left = Math.max(source.getX(), target.getX());
        const right = Math.min(
          source.getX() + source.getWidth(),
          target.getX() + target.getWidth()
        );

        vertical = left === right;

        if (!vertical) {
          const top = Math.max(source.getY(), target.getY());
          const bottom = Math.min(
            source.getY() + source.getHeight(),
            target.getY() + target.getHeight()
          );

          horizontal = top === bottom;
        }
      }
    }

    if (
      !horizontal &&
      (vertical || state.style[STYLE_ELBOW] === ELBOW_VERTICAL)
    ) {
      EdgeStyle.TopToBottom(state, source, target, points, result);
    } else {
      EdgeStyle.SideToSide(state, source, target, points, result);
    }
  },

  /**
   * Function: SideToSide
   *
   * Implements a vertical elbow edge. See <EntityRelation> for a description
   * of the parameters.
   */
  SideToSide: (state, source, target, points, result) => {
    const view = state.getView();
    let pt = isSet(points) && points.length > 0 ? points[0] : undefined;
    const pts = state.getAbsolutePoints();
    const p0 = pts[0];
    const pe = pts[pts.length - 1];

    if (isSet(pt)) {
      pt = view.transformControlPoint(state, pt);
    }

    if (isSet(p0)) {
      source = CellState();
      source.setX(p0.getX());
      source.setY(p0.getY());
    }

    if (isSet(pe)) {
      target = CellState();
      target.setX(pe.getX());
      target.setY(pe.getY());
    }

    if (isSet(source) && isSet(target)) {
      const l = Math.max(source.getX(), target.getX());
      const r = Math.min(
        source.getX() + source.getWidth(),
        target.getX() + target.getWidth()
      );

      const x = isSet(pt) ? pt.getX() : Math.round(r + (l - r) / 2);

      let y1 = view.getRoutingCenterY(source);
      let y2 = view.getRoutingCenterY(target);

      if (isSet(pt)) {
        if (
          pt.getY() >= source.getY() &&
          pt.getY() <= source.getY() + source.getHeight()
        ) {
          y1 = pt.getY();
        }

        if (
          pt.getY() >= target.getY() &&
          pt.getY() <= target.getY() + target.getHeight()
        ) {
          y2 = pt.getY();
        }
      }

      if (!contains(target, x, y1) && !contains(source, x, y1)) {
        result.push(Point(x, y1));
      }

      if (!contains(target, x, y2) && !contains(source, x, y2)) {
        result.push(Point(x, y2));
      }

      if (result.length === 1) {
        if (isSet(pt)) {
          if (
            !contains(target, x, pt.getY()) &&
            !contains(source, x, pt.getY())
          ) {
            result.push(Point(x, pt.getY()));
          }
        } else {
          const t = Math.max(source.getY(), target.getY());
          const b = Math.min(
            source.getY() + source.getHeight(),
            target.getY() + target.getHeight()
          );

          result.push(Point(x, t + (b - t) / 2));
        }
      }
    }
  },

  /**
   * Function: TopToBottom
   *
   * Implements a horizontal elbow edge. See <EntityRelation> for a
   * description of the parameters.
   */
  TopToBottom: (state, source, target, points, result) => {
    const view = state.getView();
    let pt = isSet(points) && points.length > 0 ? points[0] : undefined;
    const pts = state.getAbsolutePoints();
    const p0 = pts[0];
    const pe = pts[pts.length - 1];

    if (isSet(pt)) {
      pt = view.transformControlPoint(state, pt);
    }

    if (isSet(p0)) {
      source = CellState();
      source.setX(p0.getX());
      source.setY(p0.getY());
    }

    if (isSet(pe)) {
      target = CellState();
      target.setX(pe.getX());
      target.getY(pe.getY());
    }

    if (isSet(source) && isSet(target)) {
      const t = Math.max(source.getY(), target.getY());
      const b = Math.min(
        source.getY() + source.getHeight(),
        target.getY() + target.getHeight()
      );

      let x = view.getRoutingCenterX(source);

      if (
        isSet(pt) &&
        pt.getX() >= source.getX() &&
        pt.getX() <= source.getX() + source.getWidth()
      ) {
        x = pt.getX();
      }

      const y = isSet(pt) ? pt.getY() : Math.round(b + (t - b) / 2);

      if (!contains(target, x, y) && !contains(source, x, y)) {
        result.push(Point(x, y));
      }

      if (
        isSet(pt) &&
        pt.getX() >= target.getX() &&
        pt.getX() <= target.getX() + target.getWidth()
      ) {
        x = pt.getX();
      } else {
        x = view.getRoutingCenterX(target);
      }

      if (!contains(target, x, y) && !contains(source, x, y)) {
        result.push(Point(x, y));
      }

      if (result.length === 1) {
        if (isSet(pt) && result.length === 1) {
          if (
            !contains(target, pt.getX(), y) &&
            !contains(source, pt.getX(), y)
          ) {
            result.push(Point(pt.getX(), y));
          }
        } else {
          const l = Math.max(source.getX(), target.getX());
          const r = Math.min(
            source.getX() + source.getWidth(),
            target.getX() + target.getWidth()
          );

          result.push(Point(l + (r - l) / 2, y));
        }
      }
    }
  },

  /**
   * Function: SegmentConnector
   *
   * Implements an orthogonal edge style. Use <mxEdgeSegmentHandler>
   * as an interactive handler for this style.
   *
   * state - <mxCellState> that represents the edge to be updated.
   * sourceScaled - <mxCellState> that represents the source terminal.
   * targetScaled - <mxCellState> that represents the target terminal.
   * controlHints - List of relative control points.
   * result - Array of <mxPoints> that represent the actual points of the
   * edge.
   *
   */
  SegmentConnector: (
    state,
    sourceScaled,
    targetScaled,
    controlHints,
    result
  ) => {
    const view = state.getView();
    const scale = view.getScale();

    // Creates array of all way- and terminalpoints
    const pts = EdgeStyle.scalePointArray(state.getAbsolutePoints(), scale);
    const source = EdgeStyle.scaleCellState(sourceScaled, scale);
    const target = EdgeStyle.scaleCellState(targetScaled, scale);
    const tol = 1;

    // Whether the first segment outgoing from the source end is horizontal
    let lastPushed = result.length > 0 ? result[0] : undefined;
    let horizontal = true;
    let hint;

    // Adds waypoints only if outside of tolerance
    const pushPoint = (pt) => {
      pt.setX(Math.round(pt.getX() * scale * 10) / 10);
      pt.setY(Math.round(pt.getY() * scale * 10) / 10);

      if (
        isUnset(lastPushed) ||
        Math.abs(lastPushed.getX() - pt.getX()) >= tol ||
        Math.abs(lastPushed.getY() - pt.getY()) >= Math.max(1, scale)
      ) {
        result.push(pt);
        lastPushed = pt;
      }

      return lastPushed;
    };

    // Adds the first point
    let pt = pts[0];
    let pe;

    if (isUnset(pt) && isSet(source)) {
      pt = Point(
        view.getRoutingCenterX(source),
        view.getRoutingCenterY(source)
      );
    } else if (isSet(pt)) {
      pt = pt.clone();
    }

    const lastInx = pts.length - 1;

    // Adds the waypoints
    if (isSet(controlHints) && controlHints.length > 0) {
      // Converts all hints and removes nulls
      const hints = [];

      for (let i = 0; i < controlHints.length; i++) {
        const tmp = view.transformControlPoint(state, controlHints[i], true);

        if (isSet(tmp)) {
          hints.push(tmp);
        }
      }

      if (hints.length === 0) {
        return;
      }

      // Aligns source and target hint to fixed points
      if (isSet(pt) && isSet(hints[0])) {
        if (Math.abs(hints[0].getX() - pt.getX()) < tol) {
          hints[0].setX(pt.getX());
        }

        if (Math.abs(hints[0].getY() - pt.getY()) < tol) {
          hints[0].setY(pt.getY());
        }
      }

      pe = pts[lastInx];

      if (isSet(pe) && isSet(hints[hints.length - 1])) {
        if (Math.abs(hints[hints.length - 1].getX() - pe.getX()) < tol) {
          hints[hints.length - 1].setX(pe.getX());
        }

        if (Math.abs(hints[hints.length - 1].getY() - pe.getY()) < tol) {
          hints[hints.length - 1].setY(pe.getY());
        }
      }

      hint = hints[0];

      let currentTerm = source;
      let currentPt = pts[0];
      let hozChan = false;
      let vertChan = false;
      let currentHint = hint;

      if (isSet(currentPt)) {
        currentTerm = undefined;
      }

      // Check for alignment with fixed points and with channels
      // at source and target segments only
      for (let i = 0; i < 2; i++) {
        const fixedVertAlign =
          isSet(currentPt) && currentPt.getX() === currentHint.getX();
        const fixedHozAlign =
          isSet(currentPt) && currentPt.getY() === currentHint.getY();

        const inHozChan =
          isSet(currentTerm) &&
          currentHint.getY() >= currentTerm.getY() &&
          currentHint.getY() <= currentTerm.getY() + currentTerm.getHeight();
        const inVertChan =
          isSet(currentTerm) &&
          currentHint.getX() >= currentTerm.getX() &&
          currentHint.getX() <= currentTerm.getX() + currentTerm.getWidth();

        hozChan = fixedHozAlign || (isUnset(currentPt) && inHozChan);
        vertChan = fixedVertAlign || (isUnset(currentPt) && inVertChan);

        // If the current hint falls in both the hor and vert channels in the case
        // of a floating port, or if the hint is exactly co-incident with a
        // fixed point, ignore the source and try to work out the orientation
        // from the target end
        if (
          i === 0 &&
          ((hozChan && vertChan) || (fixedVertAlign && fixedHozAlign))
        ) {
        } else {
          if (
            isSet(currentPt) &&
            !fixedHozAlign &&
            !fixedVertAlign &&
            (inHozChan || inVertChan)
          ) {
            horizontal = inHozChan ? false : true;
            break;
          }

          if (vertChan || hozChan) {
            horizontal = hozChan;

            if (i === 1) {
              // Work back from target end
              horizontal = hints.length % 2 === 0 ? hozChan : vertChan;
            }

            break;
          }
        }

        currentTerm = target;
        currentPt = pts[lastInx];

        if (isSet(currentPt)) {
          currentTerm = undefined;
        }

        currentHint = hints[hints.length - 1];

        if (fixedVertAlign && fixedHozAlign) {
          hints = hints.slice(1);
        }
      }

      if (
        horizontal &&
        ((isSet(pts[0]) && pts[0].getY() !== hint.getY()) ||
          (isUnset(pts[0]) &&
            isSet(source) &&
            (hint.getY() < source.getY() ||
              hint.getY() > source.getY() + source.getHeight())))
      ) {
        pushPoint(Point(pt.getX(), hint.getY()));
      } else if (
        !horizontal &&
        ((isSet(pts[0]) && pts[0].getX() !== hint.getX()) ||
          (isUnset(pts[0]) &&
            isSet(source) &&
            (hint.getX() < source.getX() ||
              hint.getX() > source.getX() + source.getWidth())))
      ) {
        pushPoint(Point(hint.getX(), pt.getY()));
      }

      if (horizontal) {
        pt.setY(hint.getY());
      } else {
        pt.setX(hint.getX());
      }

      for (let i = 0; i < hints.length; i++) {
        horizontal = !horizontal;
        hint = hints[i];

        if (horizontal) {
          pt.setY(hint.getY());
        } else {
          pt.setX(hint.getX());
        }

        pushPoint(pt.clone());
      }
    } else {
      hint = pt;
      // FIXME: First click in connect preview toggles orientation
      horizontal = true;
    }

    // Adds the last point
    pt = pts[lastInx];

    if (isUnset(pt) && isSet(target)) {
      pt = Point(
        view.getRoutingCenterX(target),
        view.getRoutingCenterY(target)
      );
    }

    if (isSet(pt)) {
      if (isSet(hint)) {
        if (
          horizontal &&
          ((isSet(pts[lastInx]) && pts[lastInx].getY() !== hint.getY()) ||
            (isUnset(pts[lastInx]) &&
              isSet(target) &&
              (hint.getY() < target.getY() ||
                hint.getY() > target.getY() + target.getHeight())))
        ) {
          pushPoint(Point(pt.getX(), hint.getY()));
        } else if (
          !horizontal &&
          ((isSet(pts[lastInx]) && pts[lastInx].getX() !== hint.getX()) ||
            (isUnset(pts[lastInx]) &&
              isSet(target) &&
              (hint.getX() < target.getX() ||
                hint.getX() > target.getX() + target.getWidth())))
        ) {
          pushPoint(Point(hint.getX(), pt.getY()));
        }
      }
    }

    // Removes bends inside the source terminal for floating ports
    if (isUnset(pts[0]) && isSet(source)) {
      while (
        result.length > 1 &&
        isSet(result[1]) &&
        contains(source, result[1].getX(), result[1].getY())
      ) {
        result.splice(1, 1);
      }
    }

    // Removes bends inside the target terminal
    if (isUnset(pts[lastInx]) && isSet(target)) {
      while (
        result.length > 1 &&
        isSet(result[result.length - 1]) &&
        contains(
          target,
          result[result.length - 1].getX(),
          result[result.length - 1].getY()
        )
      ) {
        result.splice(result.length - 1, 1);
      }
    }

    // Removes last point if inside tolerance with end point
    if (
      isSet(pe) &&
      isSet(result[result.length - 1]) &&
      Math.abs(pe.getX() - result[result.length - 1].getX()) <= tol &&
      Math.abs(pe.getY() - result[result.length - 1].getY()) <= tol
    ) {
      result.splice(result.length - 1, 1);

      // Lines up second last point in result with end point
      if (isSet(result[result.length - 1])) {
        if (Math.abs(result[result.length - 1].getX() - pe.getX()) < tol) {
          result[result.length - 1].setX(pe.getX());
        }

        if (Math.abs(result[result.length - 1].getY() - pe.getY()) < tol) {
          result[result.length - 1].setY(pe.getY());
        }
      }
    }
  },

  orthBuffer: 10,

  orthPointsFallback: true,

  dirVectors: [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 0]
  ],

  wayPoints1: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ],

  routePatterns: [
    [
      [513, 2308, 2081, 2562],
      [513, 1090, 514, 2184, 2114, 2561],
      [513, 1090, 514, 2564, 2184, 2562],
      [513, 2308, 2561, 1090, 514, 2568, 2308]
    ],
    [
      [514, 1057, 513, 2308, 2081, 2562],
      [514, 2184, 2114, 2561],
      [514, 2184, 2562, 1057, 513, 2564, 2184],
      [514, 1057, 513, 2568, 2308, 2561]
    ],
    [
      [1090, 514, 1057, 513, 2308, 2081, 2562],
      [2114, 2561],
      [1090, 2562, 1057, 513, 2564, 2184],
      [1090, 514, 1057, 513, 2308, 2561, 2568]
    ],
    [
      [2081, 2562],
      [1057, 513, 1090, 514, 2184, 2114, 2561],
      [1057, 513, 1090, 514, 2184, 2562, 2564],
      [1057, 2561, 1090, 514, 2568, 2308]
    ]
  ],

  inlineRoutePatterns: [
    [undefined, [2114, 2568], undefined, undefined],
    [undefined, [514, 2081, 2114, 2568], undefined, undefined],
    [undefined, [2114, 2561], undefined, undefined],
    [[2081, 2562], [1057, 2114, 2568], [2184, 2562], undefined]
  ],
  vertexSeperations: [],

  limits: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],

  LEFT_MASK: 32,

  TOP_MASK: 64,

  RIGHT_MASK: 128,

  BOTTOM_MASK: 256,

  LEFT: 1,

  TOP: 2,

  RIGHT: 4,

  BOTTOM: 8,

  // TODO remove magic numbers
  SIDE_MASK: 480,
  //EdgeStyle.LEFT_MASK | EdgeStyle.TOP_MASK | EdgeStyle.RIGHT_MASK
  //| EdgeStyle.BOTTOM_MASK,

  CENTER_MASK: 512,

  SOURCE_MASK: 1024,

  TARGET_MASK: 2048,

  VERTEX_MASK: 3072,

  getJettySize: (state, isSource) => {
    const style = state.getStyle();
    let value = getValue(
      style,
      isSource ? STYLE_SOURCE_JETTY_SIZE : STYLE_TARGET_JETTY_SIZE,
      getValue(style, STYLE_JETTY_SIZE, EdgeStyle.orthBuffer)
    );

    if (value === 'auto') {
      // Computes the automatic jetty size
      const type = getValue(
        style,
        isSource ? STYLE_STARTARROW : STYLE_ENDARROW,
        NONE
      );

      if (type !== NONE) {
        const size = getNumber(
          style,
          isSource ? STYLE_STARTSIZE : STYLE_ENDSIZE,
          DEFAULT_MARKERSIZE
        );
        value =
          Math.max(
            2,
            Math.ceil((size + EdgeStyle.orthBuffer) / EdgeStyle.orthBuffer)
          ) * EdgeStyle.orthBuffer;
      } else {
        value = 2 * EdgeStyle.orthBuffer;
      }
    }

    return value;
  },

  /**
   * Function: scalePointArray
   *
   * Scales an array of <mxPoint>
   *
   * Parameters:
   *
   * points - array of <mxPoint> to scale
   * scale - the scaling to divide by
   *
   */
  scalePointArray: (points, scale) => {
    const result = [];

    if (isSet(points)) {
      for (let i = 0; i < points.length; i++) {
        if (isSet(points[i])) {
          const pt = Point(
            Math.round((points[i].getX() / scale) * 10) / 10,
            Math.round((points[i].getY() / scale) * 10) / 10
          );
          result[i] = pt;
        } else {
          result[i] = undefined;
        }
      }
    } else {
      result = undefined;
    }

    return result;
  },

  /**
   * Function: scaleCellState
   *
   * Scales an <mxCellState>
   *
   * Parameters:
   *
   * state - <mxCellState> to scale
   * scale - the scaling to divide by
   *
   */
  scaleCellState: (state, scale) => {
    let result;

    if (isSet(state)) {
      result = state.clone();
      result.setRect(
        Math.round((state.getX() / scale) * 10) / 10,
        Math.round((state.getY() / scale) * 10) / 10,
        Math.round((state.getWidth() / scale) * 10) / 10,
        Math.round((state.getHeight() / scale) * 10) / 10
      );
    } else {
      result = undefined;
    }

    return result;
  },

  /**
   * Function: OrthConnector
   *
   * Implements a local orthogonal router between the given
   * cells.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the edge to be updated.
   * sourceScaled - <mxCellState> that represents the source terminal.
   * targetScaled - <mxCellState> that represents the target terminal.
   * controlHints - List of relative control points.
   * result - Array of <mxPoints> that represent the actual points of the
   * edge.
   *
   */
  OrthConnector: (state, sourceScaled, targetScaled, controlHints, result) => {
    const graph = state.getView().getGraph();
    const scale = state.getView().getScale();

    const pts = EdgeStyle.scalePointArray(state.getAbsolutePoints(), scale);
    const source = EdgeStyle.scaleCellState(sourceScaled, scale);
    const target = EdgeStyle.scaleCellState(targetScaled, scale);

    const sourceEdge = isUnset(source)
      ? false
      : graph.getModel().isEdge(source.getCell());
    const targetEdge = isUnset(target)
      ? false
      : graph.getModel().isEdge(target.getCell());

    const p0 = pts[0];
    const pe = pts[pts.length - 1];

    const sourceX = isSet(source) ? source.getX() : p0.getX();
    const sourceY = isSet(source) ? source.getY() : p0.getY();
    const sourceWidth = isSet(source) ? source.getWidth() : 0;
    const sourceHeight = isSet(source) ? source.getHeight() : 0;

    const targetX = isSet(target) ? target.getX() : pe.getX();
    const targetY = isSet(target) ? target.getY() : pe.getY();
    const targetWidth = isSet(target) ? target.getWidth() : 0;
    const targetHeight = isSet(target) ? target.getHeight() : 0;

    let sourceBuffer = EdgeStyle.getJettySize(state, true);
    let targetBuffer = EdgeStyle.getJettySize(state, false);

    // Workaround for loop routing within buffer zone
    if (isSet(source) && target === source) {
      targetBuffer = Math.max(sourceBuffer, targetBuffer);
      sourceBuffer = targetBuffer;
    }

    const totalBuffer = targetBuffer + sourceBuffer;
    let tooShort = false;

    // Checks minimum distance for fixed points and falls back to segment connector
    if (isSet(p0) && isSet(pe)) {
      const dx = pe.getX() - p0.getX();
      const dy = pe.getY() - p0.getY();

      tooShort = dx * dx + dy * dy < totalBuffer * totalBuffer;
    }

    if (
      tooShort ||
      (EdgeStyle.orthPointsFallback &&
        isSet(controlHints) &&
        controlHints.length > 0) ||
      sourceEdge ||
      targetEdge
    ) {
      EdgeStyle.SegmentConnector(
        state,
        sourceScaled,
        targetScaled,
        controlHints,
        result
      );

      return;
    }

    // Determine the side(s) of the source and target vertices
    // that the edge may connect to
    // portConstraint [source, target]
    const portConstraint = [DIRECTION_MASK_ALL, DIRECTION_MASK_ALL];
    let rotation = 0;

    if (isSet(source)) {
      portConstraint[0] = getPortConstraints(
        source,
        state,
        true,
        DIRECTION_MASK_ALL
      );
      rotation = getValue(source.getStyle(), STYLE_ROTATION, 0);

      if (rotation !== 0) {
        const newRect = getBoundingBox(
          Rectangle(sourceX, sourceY, sourceWidth, sourceHeight),
          rotation
        );
        sourceX = newRect.getX();
        sourceY = newRect.getY();
        sourceWidth = newRect.getWidth();
        sourceHeight = newRect.getHeight();
      }
    }

    if (isSet(target)) {
      portConstraint[1] = getPortConstraints(
        target,
        state,
        false,
        DIRECTION_MASK_ALL
      );
      rotation = getValue(target.getStyle(), STYLE_ROTATION, 0);

      if (rotation !== 0) {
        const newRect = getBoundingBox(
          Rectangle(targetX, targetY, targetWidth, targetHeight),
          rotation
        );
        targetX = newRect.getX();
        targetY = newRect.getY();
        targetWidth = newRect.getWidth();
        targetHeight = newRect.getHeight();
      }
    }

    const dir = [0, 0];

    // Work out which faces of the vertices present against each other
    // in a way that would allow a 3-segment connection if port constraints
    // permitted.
    // geo -> [source, target] [x, y, width, height]
    const geo = [
      [sourceX, sourceY, sourceWidth, sourceHeight],
      [targetX, targetY, targetWidth, targetHeight]
    ];
    const buffer = [sourceBuffer, targetBuffer];

    for (let i = 0; i < 2; i++) {
      EdgeStyle.limits[i][1] = geo[i][0] - buffer[i];
      EdgeStyle.limits[i][2] = geo[i][1] - buffer[i];
      EdgeStyle.limits[i][4] = geo[i][0] + geo[i][2] + buffer[i];
      EdgeStyle.limits[i][8] = geo[i][1] + geo[i][3] + buffer[i];
    }

    // Work out which quad the target is in
    const sourceCenX = geo[0][0] + geo[0][2] / 2.0;
    const sourceCenY = geo[0][1] + geo[0][3] / 2.0;
    const targetCenX = geo[1][0] + geo[1][2] / 2.0;
    const targetCenY = geo[1][1] + geo[1][3] / 2.0;

    const dx = sourceCenX - targetCenX;
    const dy = sourceCenY - targetCenY;

    let quad = 0;

    // 0 | 1
    // -----
    // 3 | 2

    if (dx < 0) {
      if (dy < 0) {
        quad = 2;
      } else {
        quad = 1;
      }
    } else {
      if (dy <= 0) {
        quad = 3;

        // Special case on x = 0 and negative y
        if (dx === 0) {
          quad = 2;
        }
      }
    }

    // Check for connection constraints
    let currentTerm;

    if (isSet(source)) {
      currentTerm = p0;
    }

    const constraint = [
      [0.5, 0.5],
      [0.5, 0.5]
    ];

    for (let i = 0; i < 2; i++) {
      if (isSet(currentTerm)) {
        constraint[i][0] = (currentTerm.getX() - geo[i][0]) / geo[i][2];

        if (Math.abs(currentTerm.getX() - geo[i][0]) <= 1) {
          dir[i] = DIRECTION_MASK_WEST;
        } else if (Math.abs(currentTerm.getX() - geo[i][0] - geo[i][2]) <= 1) {
          dir[i] = DIRECTION_MASK_EAST;
        }

        constraint[i][1] = (currentTerm.getY() - geo[i][1]) / geo[i][3];

        if (Math.abs(currentTerm.getY() - geo[i][1]) <= 1) {
          dir[i] = DIRECTION_MASK_NORTH;
        } else if (Math.abs(currentTerm.getY() - geo[i][1] - geo[i][3]) <= 1) {
          dir[i] = DIRECTION_MASK_SOUTH;
        }
      }

      currentTerm = undefined;

      if (isSet(target)) {
        currentTerm = pe;
      }
    }

    const sourceTopDist = geo[0][1] - (geo[1][1] + geo[1][3]);
    const sourceLeftDist = geo[0][0] - (geo[1][0] + geo[1][2]);
    const sourceBottomDist = geo[1][1] - (geo[0][1] + geo[0][3]);
    const sourceRightDist = geo[1][0] - (geo[0][0] + geo[0][2]);

    EdgeStyle.vertexSeperations[1] = Math.max(sourceLeftDist - totalBuffer, 0);
    EdgeStyle.vertexSeperations[2] = Math.max(sourceTopDist - totalBuffer, 0);
    EdgeStyle.vertexSeperations[4] = Math.max(
      sourceBottomDist - totalBuffer,
      0
    );
    EdgeStyle.vertexSeperations[3] = Math.max(sourceRightDist - totalBuffer, 0);

    //======================================================================
    // Start of source and target direction determination

    // Work through the preferred orientations by relative positioning
    // of the vertices and list them in preferred and available order

    const dirPref = [];
    const horPref = [];
    const vertPref = [];

    horPref[0] =
      sourceLeftDist >= sourceRightDist
        ? DIRECTION_MASK_WEST
        : DIRECTION_MASK_EAST;
    vertPref[0] =
      sourceTopDist >= sourceBottomDist
        ? DIRECTION_MASK_NORTH
        : DIRECTION_MASK_SOUTH;

    horPref[1] = reversePortConstraints(horPref[0]);
    vertPref[1] = reversePortConstraints(vertPref[0]);

    const preferredHorizDist =
      sourceLeftDist >= sourceRightDist ? sourceLeftDist : sourceRightDist;
    const preferredVertDist =
      sourceTopDist >= sourceBottomDist ? sourceTopDist : sourceBottomDist;

    const prefOrdering = [
      [0, 0],
      [0, 0]
    ];
    let preferredOrderSet = false;

    // If the preferred port isn't available, switch it
    for (let i = 0; i < 2; i++) {
      if (dir[i] !== 0x0) {
        continue;
      }

      if ((horPref[i] & portConstraint[i]) === 0) {
        horPref[i] = reversePortConstraints(horPref[i]);
      }

      if ((vertPref[i] & portConstraint[i]) === 0) {
        vertPref[i] = reversePortConstraints(vertPref[i]);
      }

      prefOrdering[i][0] = vertPref[i];
      prefOrdering[i][1] = horPref[i];
    }

    if (preferredVertDist > 0 && preferredHorizDist > 0) {
      // Possibility of two segment edge connection
      if (
        (horPref[0] & portConstraint[0]) > 0 &&
        (vertPref[1] & portConstraint[1]) > 0
      ) {
        prefOrdering[0][0] = horPref[0];
        prefOrdering[0][1] = vertPref[0];
        prefOrdering[1][0] = vertPref[1];
        prefOrdering[1][1] = horPref[1];
        preferredOrderSet = true;
      } else if (
        (vertPref[0] & portConstraint[0]) > 0 &&
        (horPref[1] & portConstraint[1]) > 0
      ) {
        prefOrdering[0][0] = vertPref[0];
        prefOrdering[0][1] = horPref[0];
        prefOrdering[1][0] = horPref[1];
        prefOrdering[1][1] = vertPref[1];
        preferredOrderSet = true;
      }
    }

    if (preferredVertDist > 0 && !preferredOrderSet) {
      prefOrdering[0][0] = vertPref[0];
      prefOrdering[0][1] = horPref[0];
      prefOrdering[1][0] = vertPref[1];
      prefOrdering[1][1] = horPref[1];
      preferredOrderSet = true;
    }

    if (preferredHorizDist > 0 && !preferredOrderSet) {
      prefOrdering[0][0] = horPref[0];
      prefOrdering[0][1] = vertPref[0];
      prefOrdering[1][0] = horPref[1];
      prefOrdering[1][1] = vertPref[1];
      preferredOrderSet = true;
    }

    // The source and target prefs are now an ordered list of
    // the preferred port selections
    // If the list contains gaps, compact it

    for (let i = 0; i < 2; i++) {
      if (dir[i] !== 0x0) {
        continue;
      }

      if ((prefOrdering[i][0] & portConstraint[i]) === 0) {
        prefOrdering[i][0] = prefOrdering[i][1];
      }

      dirPref[i] = prefOrdering[i][0] & portConstraint[i];
      dirPref[i] |= (prefOrdering[i][1] & portConstraint[i]) << 8;
      dirPref[i] |= (prefOrdering[1 - i][i] & portConstraint[i]) << 16;
      dirPref[i] |= (prefOrdering[1 - i][1 - i] & portConstraint[i]) << 24;

      if ((dirPref[i] & 0xf) === 0) {
        dirPref[i] = dirPref[i] << 8;
      }

      if ((dirPref[i] & 0xf00) === 0) {
        dirPref[i] = (dirPref[i] & 0xf) | (dirPref[i] >> 8);
      }

      if ((dirPref[i] & 0xf0000) === 0) {
        dirPref[i] = (dirPref[i] & 0xffff) | ((dirPref[i] & 0xf000000) >> 8);
      }

      dir[i] = dirPref[i] & 0xf;

      if (
        portConstraint[i] === DIRECTION_MASK_WEST ||
        portConstraint[i] === DIRECTION_MASK_NORTH ||
        portConstraint[i] === DIRECTION_MASK_EAST ||
        portConstraint[i] === DIRECTION_MASK_SOUTH
      ) {
        dir[i] = portConstraint[i];
      }
    }

    //======================================================================
    // End of source and target direction determination

    let sourceIndex = dir[0] === DIRECTION_MASK_EAST ? 3 : dir[0];
    let targetIndex = dir[1] === DIRECTION_MASK_EAST ? 3 : dir[1];

    sourceIndex -= quad;
    targetIndex -= quad;

    if (sourceIndex < 1) {
      sourceIndex += 4;
    }

    if (targetIndex < 1) {
      targetIndex += 4;
    }

    const routePattern =
      EdgeStyle.routePatterns[sourceIndex - 1][targetIndex - 1];

    EdgeStyle.wayPoints1[0][0] = geo[0][0];
    EdgeStyle.wayPoints1[0][1] = geo[0][1];

    switch (dir[0]) {
      case DIRECTION_MASK_WEST:
        EdgeStyle.wayPoints1[0][0] -= sourceBuffer;
        EdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3];
        break;
      case DIRECTION_MASK_SOUTH:
        EdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2];
        EdgeStyle.wayPoints1[0][1] += geo[0][3] + sourceBuffer;
        break;
      case DIRECTION_MASK_EAST:
        EdgeStyle.wayPoints1[0][0] += geo[0][2] + sourceBuffer;
        EdgeStyle.wayPoints1[0][1] += constraint[0][1] * geo[0][3];
        break;
      case DIRECTION_MASK_NORTH:
        EdgeStyle.wayPoints1[0][0] += constraint[0][0] * geo[0][2];
        EdgeStyle.wayPoints1[0][1] -= sourceBuffer;
        break;
    }

    let currentIndex = 0;

    // Orientation, 0 horizontal, 1 vertical
    let lastOrientation =
      (dir[0] & (DIRECTION_MASK_EAST | DIRECTION_MASK_WEST)) > 0 ? 0 : 1;
    const initialOrientation = lastOrientation;
    let currentOrientation = 0;

    for (let i = 0; i < routePattern.length; i++) {
      const nextDirection = routePattern[i] & 0xf;

      // Rotate the index of this direction by the quad
      // to get the real direction
      let directionIndex =
        nextDirection === DIRECTION_MASK_EAST ? 3 : nextDirection;

      directionIndex += quad;

      if (directionIndex > 4) {
        directionIndex -= 4;
      }

      const direction = EdgeStyle.dirVectors[directionIndex - 1];

      currentOrientation = directionIndex % 2 > 0 ? 0 : 1;
      // Only update the current index if the point moved
      // in the direction of the current segment move,
      // otherwise the same point is moved until there is
      // a segment direction change
      if (currentOrientation !== lastOrientation) {
        currentIndex++;
        // Copy the previous way point into the new one
        // We can't base the new position on index - 1
        // because sometime elbows turn out not to exist,
        // then we'd have to rewind.
        EdgeStyle.wayPoints1[currentIndex][0] =
          EdgeStyle.wayPoints1[currentIndex - 1][0];
        EdgeStyle.wayPoints1[currentIndex][1] =
          EdgeStyle.wayPoints1[currentIndex - 1][1];
      }

      const tar = (routePattern[i] & EdgeStyle.TARGET_MASK) > 0;
      const sou = (routePattern[i] & EdgeStyle.SOURCE_MASK) > 0;
      let side = (routePattern[i] & EdgeStyle.SIDE_MASK) >> 5;
      side = side << quad;

      if (side > 0xf) {
        side = side >> 4;
      }

      const center = (routePattern[i] & EdgeStyle.CENTER_MASK) > 0;

      if ((sou || tar) && side < 9) {
        let limit = 0;
        const souTar = sou ? 0 : 1;

        if (center && currentOrientation === 0) {
          limit = geo[souTar][0] + constraint[souTar][0] * geo[souTar][2];
        } else if (center) {
          limit = geo[souTar][1] + constraint[souTar][1] * geo[souTar][3];
        } else {
          limit = EdgeStyle.limits[souTar][side];
        }

        if (currentOrientation === 0) {
          const lastX = EdgeStyle.wayPoints1[currentIndex][0];
          const deltaX = (limit - lastX) * direction[0];

          if (deltaX > 0) {
            EdgeStyle.wayPoints1[currentIndex][0] += direction[0] * deltaX;
          }
        } else {
          const lastY = EdgeStyle.wayPoints1[currentIndex][1];
          const deltaY = (limit - lastY) * direction[1];

          if (deltaY > 0) {
            EdgeStyle.wayPoints1[currentIndex][1] += direction[1] * deltaY;
          }
        }
      } else if (center) {
        // Which center we're travelling to depend on the current direction
        EdgeStyle.wayPoints1[currentIndex][0] +=
          direction[0] *
          Math.abs(EdgeStyle.vertexSeperations[directionIndex] / 2);
        EdgeStyle.wayPoints1[currentIndex][1] +=
          direction[1] *
          Math.abs(EdgeStyle.vertexSeperations[directionIndex] / 2);
      }

      if (
        currentIndex > 0 &&
        EdgeStyle.wayPoints1[currentIndex][currentOrientation] ===
          EdgeStyle.wayPoints1[currentIndex - 1][currentOrientation]
      ) {
        currentIndex--;
      } else {
        lastOrientation = currentOrientation;
      }
    }

    for (let i = 0; i <= currentIndex; i++) {
      if (i === currentIndex) {
        // Last point can cause last segment to be in
        // same direction as jetty/approach. If so,
        // check the number of points is consistent
        // with the relative orientation of source and target
        // jx. Same orientation requires an even
        // number of turns (points), different requires
        // odd.
        const targetOrientation =
          (dir[1] & (DIRECTION_MASK_EAST | DIRECTION_MASK_WEST)) > 0 ? 0 : 1;
        const sameOrient = targetOrientation === initialOrientation ? 0 : 1;

        // (currentIndex + 1) % 2 is 0 for even number of points,
        // 1 for odd
        if (sameOrient !== (currentIndex + 1) % 2) {
          // The last point isn't required
          break;
        }
      }

      result.push(
        Point(
          Math.round(EdgeStyle.wayPoints1[i][0] * scale * 10) / 10,
          Math.round(EdgeStyle.wayPoints1[i][1] * scale * 10) / 10
        )
      );
    }

    // Removes duplicates
    let index = 1;

    while (index < result.length) {
      if (
        isUnset(result[index - 1]) ||
        isUnset(result[index]) ||
        result[index - 1].getX() !== result[index].getX() ||
        result[index - 1].getY() !== result[index].getY()
      ) {
        index++;
      } else {
        result.splice(index, 1);
      }
    }
  },

  getRoutePattern: (dir, quad, dx, dy) => {
    let sourceIndex = dir[0] === DIRECTION_MASK_EAST ? 3 : dir[0];
    let targetIndex = dir[1] === DIRECTION_MASK_EAST ? 3 : dir[1];

    sourceIndex -= quad;
    targetIndex -= quad;

    if (sourceIndex < 1) {
      sourceIndex += 4;
    }
    if (targetIndex < 1) {
      targetIndex += 4;
    }

    let result = routePatterns[sourceIndex - 1][targetIndex - 1];

    if (dx === 0 || dy === 0) {
      if (isSet(inlineRoutePatterns[sourceIndex - 1][targetIndex - 1])) {
        result = inlineRoutePatterns[sourceIndex - 1][targetIndex - 1];
      }
    }

    return result;
  }
};

export default EdgeStyle;
