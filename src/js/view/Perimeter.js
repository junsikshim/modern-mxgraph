/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import {
  DIRECTION_EAST,
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  STYLE_DIRECTION
} from '../util/Constants';
import Point from '../util/Point';

/**
 * Class: Perimeter
 *
 * Provides various perimeter functions to be used in a style
 * as the value of <STYLE_PERIMETER>. Perimeters for
 * rectangle, circle, rhombus and triangle are available.
 *
 * Example:
 *
 * (code)
 * <add as="perimeter">mxPerimeter.RectanglePerimeter</add>
 * (end)
 *
 * Or programmatically:
 *
 * (code)
 * style[STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
 * (end)
 *
 * When adding new perimeter functions, it is recommended to use the
 * mxPerimeter-namespace as follows:
 *
 * (code)
 * mxPerimeter.CustomPerimeter = function (bounds, vertex, next, orthogonal)
 * {
 *   const x = 0; // Calculate x-coordinate
 *   const y = 0; // Calculate y-coordainte
 *
 *   return Point(x, y);
 * }
 * (end)
 *
 * The new perimeter should then be registered in the <mxStyleRegistry> as follows:
 * (code)
 * mxStyleRegistry.putValue('customPerimeter', mxPerimeter.CustomPerimeter);
 * (end)
 *
 * The custom perimeter above can now be used in a specific vertex as follows:
 *
 * (code)
 * model.setStyle(vertex, 'perimeter=customPerimeter');
 * (end)
 *
 * Note that the key of the <mxStyleRegistry> entry for the function should
 * be used in string values, unless <mxGraphView.allowEval> is true, in
 * which case you can also use mxPerimeter.CustomPerimeter for the value in
 * the cell style above.
 *
 * Or it can be used for all vertices in the graph as follows:
 *
 * (code)
 * const style = graph.getStylesheet().getDefaultVertexStyle();
 * style[STYLE_PERIMETER] = mxPerimeter.CustomPerimeter;
 * (end)
 *
 * Note that the object can be used directly when programmatically setting
 * the value, but the key in the <mxStyleRegistry> should be used when
 * setting the value via a key, value pair in a cell style.
 *
 * The parameters are explained in <RectanglePerimeter>.
 */
const Perimeter = {
  /**
   * Function: RectanglePerimeter
   *
   * Describes a rectangular perimeter for the given bounds.
   *
   * Parameters:
   *
   * bounds - <mxRectangle> that represents the absolute bounds of the
   * vertex.
   * vertex - <mxCellState> that represents the vertex.
   * next - <mxPoint> that represents the nearest neighbour point on the
   * given edge.
   * orthogonal - Boolean that specifies if the orthogonal projection onto
   * the perimeter should be returned. If this is false then the intersection
   * of the perimeter and the line between the next and the center point is
   * returned.
   */
  RectanglePerimeter: (bounds, vertex, next, orthogonal) => {
    const cx = bounds.getCenterX();
    const cy = bounds.getCenterY();
    const dx = next.getX() - cx;
    const dy = next.getY() - cy;
    const alpha = Math.atan2(dy, dx);
    const p = Point(0, 0);
    const pi = Math.PI;
    const pi2 = Math.PI / 2;
    const beta = pi2 - alpha;
    const t = Math.atan2(bounds.getHeight(), bounds.getWidth());

    if (alpha < -pi + t || alpha > pi - t) {
      // Left edge
      p.setX(bounds.getX());
      p.setY(cy - (bounds.getWidth() * Math.tan(alpha)) / 2);
    } else if (alpha < -t) {
      // Top Edge
      p.setY(bounds.getY());
      p.setX(cx - (bounds.getHeight() * Math.tan(beta)) / 2);
    } else if (alpha < t) {
      // Right Edge
      p.setX(bounds.getX() + bounds.getWidth());
      p.setY(cy + (bounds.getWidth() * Math.tan(alpha)) / 2);
    } else {
      // Bottom Edge
      p.setY(bounds.getY() + bounds.getHeight());
      p.setX(cx + (bounds.getHeight() * Math.tan(beta)) / 2);
    }

    if (orthogonal) {
      if (
        next.getX() >= bounds.getX() &&
        next.getX() <= bounds.getX() + bounds.getWidth()
      ) {
        p.setX(next.getX());
      } else if (
        next.getY() >= bounds.getY() &&
        next.getY() <= bounds.getY() + bounds.getHeight()
      ) {
        p.setY(next.getY());
      }
      if (next.getX() < bounds.getX()) {
        p.setX(bounds.getX());
      } else if (next.getX() > bounds.getX() + bounds.getWidth()) {
        p.setX(bounds.getX() + bounds.getWidth());
      }
      if (next.getY() < bounds.getY()) {
        p.setY(bounds.getY());
      } else if (next.getY() > bounds.getY() + bounds.getHeight()) {
        p.setY(bounds.getY() + bounds.getHeight());
      }
    }

    return p;
  },

  /**
   * Function: EllipsePerimeter
   *
   * Describes an elliptic perimeter. See <RectanglePerimeter>
   * for a description of the parameters.
   */
  EllipsePerimeter: (bounds, vertex, next, orthogonal) => {
    const x = bounds.getX();
    const y = bounds.getY();
    const a = bounds.getWidth() / 2;
    const b = bounds.getHeight() / 2;
    const cx = x + a;
    const cy = y + b;
    const px = next.getX();
    const py = next.getY();

    // Calculates straight line equation through
    // point and ellipse center y = d * x + h
    const dx = parseInt(px - cx);
    const dy = parseInt(py - cy);

    if (dx === 0 && dy !== 0) {
      return Point(cx, cy + (b * dy) / Math.abs(dy));
    } else if (dx === 0 && dy === 0) {
      return Point(px, py);
    }

    if (orthogonal) {
      if (py >= y && py <= y + bounds.getHeight()) {
        const ty = py - cy;
        let tx = Math.sqrt(a * a * (1 - (ty * ty) / (b * b))) || 0;

        if (px <= x) {
          tx = -tx;
        }

        return Point(cx + tx, py);
      }

      if (px >= x && px <= x + bounds.getWidth()) {
        const tx = px - cx;
        let ty = Math.sqrt(b * b * (1 - (tx * tx) / (a * a))) || 0;

        if (py <= y) {
          ty = -ty;
        }

        return Point(px, cy + ty);
      }
    }

    // Calculates intersection
    const d = dy / dx;
    const h = cy - d * cx;
    const e = a * a * d * d + b * b;
    const f = -2 * cx * e;
    const g = a * a * d * d * cx * cx + b * b * cx * cx - a * a * b * b;
    const det = Math.sqrt(f * f - 4 * e * g);

    // Two solutions (perimeter points)
    const xout1 = (-f + det) / (2 * e);
    const xout2 = (-f - det) / (2 * e);
    const yout1 = d * xout1 + h;
    const yout2 = d * xout2 + h;
    const dist1 = Math.sqrt(Math.pow(xout1 - px, 2) + Math.pow(yout1 - py, 2));
    const dist2 = Math.sqrt(Math.pow(xout2 - px, 2) + Math.pow(yout2 - py, 2));

    // Correct solution
    let xout = 0;
    let yout = 0;

    if (dist1 < dist2) {
      xout = xout1;
      yout = yout1;
    } else {
      xout = xout2;
      yout = yout2;
    }

    return Point(xout, yout);
  },

  /**
   * Function: RhombusPerimeter
   *
   * Describes a rhombus (aka diamond) perimeter. See <RectanglePerimeter>
   * for a description of the parameters.
   */
  RhombusPerimeter: (bounds, vertex, next, orthogonal) => {
    const x = bounds.getX();
    const y = bounds.getY();
    const w = bounds.getWidth();
    const h = bounds.getHeight();

    const cx = x + w / 2;
    const cy = y + h / 2;

    const px = next.getX();
    const py = next.getY();

    // Special case for intersecting the diamond's corners
    if (cx === px) {
      if (cy > py) {
        return Point(cx, y); // top
      } else {
        return Point(cx, y + h); // bottom
      }
    } else if (cy === py) {
      if (cx > px) {
        return Point(x, cy); // left
      } else {
        return Point(x + w, cy); // right
      }
    }

    let tx = cx;
    let ty = cy;

    if (orthogonal) {
      if (px >= x && px <= x + w) {
        tx = px;
      } else if (py >= y && py <= y + h) {
        ty = py;
      }
    }

    // In which quadrant will the intersection be?
    // set the slope and offset of the border line accordingly
    if (px < cx) {
      if (py < cy) {
        return intersection(px, py, tx, ty, cx, y, x, cy);
      } else {
        return intersection(px, py, tx, ty, cx, y + h, x, cy);
      }
    } else if (py < cy) {
      return intersection(px, py, tx, ty, cx, y, x + w, cy);
    } else {
      return intersection(px, py, tx, ty, cx, y + h, x + w, cy);
    }
  },

  /**
   * Function: TrianglePerimeter
   *
   * Describes a triangle perimeter. See <RectanglePerimeter>
   * for a description of the parameters.
   */
  TrianglePerimeter: (bounds, vertex, next, orthogonal) => {
    const direction = isSet(vertex) ? vertex.getStyle()[STYLE_DIRECTION] : null;
    const vertical =
      direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH;

    const x = bounds.getX();
    const y = bounds.getY();
    const w = bounds.getWidth();
    const h = bounds.getHeight();

    let cx = x + w / 2;
    let cy = y + h / 2;

    let start = Point(x, y);
    let corner = Point(x + w, cy);
    let end = Point(x, y + h);

    if (direction === DIRECTION_NORTH) {
      start = end;
      corner = Point(cx, y);
      end = Point(x + w, y + h);
    } else if (direction === DIRECTION_SOUTH) {
      corner = Point(cx, y + h);
      end = Point(x + w, y);
    } else if (direction === DIRECTION_WEST) {
      start = Point(x + w, y);
      corner = Point(x, cy);
      end = Point(x + w, y + h);
    }

    let dx = next.getX() - cx;
    let dy = next.getY() - cy;

    const alpha = vertical ? Math.atan2(dx, dy) : Math.atan2(dy, dx);
    const t = vertical ? Math.atan2(w, h) : Math.atan2(h, w);

    let base = false;

    if (direction === DIRECTION_NORTH || direction === DIRECTION_WEST) {
      base = alpha > -t && alpha < t;
    } else {
      base = alpha < -Math.PI + t || alpha > Math.PI - t;
    }

    let result = null;

    if (base) {
      if (
        orthogonal &&
        ((vertical &&
          next.getX() >= start.getX() &&
          next.getX() <= end.getX()) ||
          (!vertical &&
            next.getY() >= start.getY() &&
            next.getY() <= end.getY()))
      ) {
        if (vertical) {
          result = Point(next.getX(), start.getY());
        } else {
          result = Point(start.getX(), next.getY());
        }
      } else {
        if (direction === DIRECTION_NORTH) {
          result = Point(x + w / 2 + (h * Math.tan(alpha)) / 2, y + h);
        } else if (direction === DIRECTION_SOUTH) {
          result = Point(x + w / 2 - (h * Math.tan(alpha)) / 2, y);
        } else if (direction === DIRECTION_WEST) {
          result = Point(x + w, y + h / 2 + (w * Math.tan(alpha)) / 2);
        } else {
          result = Point(x, y + h / 2 - (w * Math.tan(alpha)) / 2);
        }
      }
    } else {
      if (orthogonal) {
        const pt = Point(cx, cy);

        if (next.getY() >= y && next.getY() <= y + h) {
          pt.setX(vertical ? cx : direction === DIRECTION_WEST ? x + w : x);
          pt.setY(next.getY());
        } else if (next.getX() >= x && next.getX() <= x + w) {
          pt.setX(next.getX());
          pt.setY(!vertical ? cy : direction == DIRECTION_NORTH ? y + h : y);
        }

        // Compute angle
        dx = next.getX() - pt.getX();
        dy = next.getY() - pt.getY();

        cx = pt.getX();
        cy = pt.getY();
      }

      if (
        (vertical && next.getX() <= x + w / 2) ||
        (!vertical && next.getY() <= y + h / 2)
      ) {
        result = intersection(
          next.getX(),
          next.getY(),
          cx,
          cy,
          start.getX(),
          start.getY(),
          corner.getX(),
          corner.getY()
        );
      } else {
        result = intersection(
          next.getX(),
          next.getY(),
          cx,
          cy,
          corner.getX(),
          corner.getY(),
          end.getX(),
          end.getY()
        );
      }
    }

    if (isUnset(result)) {
      result = Point(cx, cy);
    }

    return result;
  },

  /**
   * Function: HexagonPerimeter
   *
   * Describes a hexagon perimeter. See <RectanglePerimeter>
   * for a description of the parameters.
   */
  HexagonPerimeter: (bounds, vertex, next, orthogonal) => {
    const x = bounds.getX();
    const y = bounds.getY();
    const w = bounds.getWidth();
    const h = bounds.getHeight();

    const cx = bounds.getCenterX();
    const cy = bounds.getCenterY();
    const px = next.getX();
    const py = next.getY();
    const dx = px - cx;
    const dy = py - cy;
    const alpha = -Math.atan2(dy, dx);
    const pi = Math.PI;
    const pi2 = Math.PI / 2;

    const result = Point(cx, cy);

    const direction = isSet(vertex)
      ? getValue(vertex.getStyle(), STYLE_DIRECTION, DIRECTION_EAST)
      : DIRECTION_EAST;
    const vertical =
      direction == DIRECTION_NORTH || direction == DIRECTION_SOUTH;
    let a = Point();
    let b = Point();

    //Only consider corrects quadrants for the orthogonal case.
    if (
      (px < x && py < y) ||
      (px < x && py > y + h) ||
      (px > x + w && py < y) ||
      (px > x + w && py > y + h)
    ) {
      orthogonal = false;
    }

    if (orthogonal) {
      if (vertical) {
        //Special cases where intersects with hexagon corners
        if (px === cx) {
          if (py <= y) {
            return Point(cx, y);
          } else if (py >= y + h) {
            return Point(cx, y + h);
          }
        } else if (px < x) {
          if (py === y + h / 4) {
            return Point(x, y + h / 4);
          } else if (py === y + (3 * h) / 4) {
            return Point(x, y + (3 * h) / 4);
          }
        } else if (px > x + w) {
          if (py === y + h / 4) {
            return Point(x + w, y + h / 4);
          } else if (py === y + (3 * h) / 4) {
            return Point(x + w, y + (3 * h) / 4);
          }
        } else if (px === x) {
          if (py < cy) {
            return Point(x, y + h / 4);
          } else if (py > cy) {
            return Point(x, y + (3 * h) / 4);
          }
        } else if (px === x + w) {
          if (py < cy) {
            return Point(x + w, y + h / 4);
          } else if (py > cy) {
            return Point(x + w, y + (3 * h) / 4);
          }
        }
        if (py === y) {
          return Point(cx, y);
        } else if (py == y + h) {
          return Point(cx, y + h);
        }

        if (px < cx) {
          if (py > y + h / 4 && py < y + (3 * h) / 4) {
            a = Point(x, y);
            b = Point(x, y + h);
          } else if (py < y + h / 4) {
            a = Point(x - Math.floor(0.5 * w), y + Math.floor(0.5 * h));
            b = Point(x + w, y - Math.floor(0.25 * h));
          } else if (py > y + (3 * h) / 4) {
            a = Point(x - Math.floor(0.5 * w), y + Math.floor(0.5 * h));
            b = Point(x + w, y + Math.floor(1.25 * h));
          }
        } else if (px > cx) {
          if (py > y + h / 4 && py < y + (3 * h) / 4) {
            a = Point(x + w, y);
            b = Point(x + w, y + h);
          } else if (py < y + h / 4) {
            a = Point(x, y - Math.floor(0.25 * h));
            b = Point(x + Math.floor(1.5 * w), y + Math.floor(0.5 * h));
          } else if (py > y + (3 * h) / 4) {
            a = Point(x + Math.floor(1.5 * w), y + Math.floor(0.5 * h));
            b = Point(x, y + Math.floor(1.25 * h));
          }
        }
      } else {
        //Special cases where intersects with hexagon corners
        if (py === cy) {
          if (px <= x) {
            return Point(x, y + h / 2);
          } else if (px >= x + w) {
            return Point(x + w, y + h / 2);
          }
        } else if (py < y) {
          if (px === x + w / 4) {
            return Point(x + w / 4, y);
          } else if (px === x + (3 * w) / 4) {
            return Point(x + (3 * w) / 4, y);
          }
        } else if (py > y + h) {
          if (px === x + w / 4) {
            return Point(x + w / 4, y + h);
          } else if (px === x + (3 * w) / 4) {
            return Point(x + (3 * w) / 4, y + h);
          }
        } else if (py === y) {
          if (px < cx) {
            return Point(x + w / 4, y);
          } else if (px > cx) {
            return Point(x + (3 * w) / 4, y);
          }
        } else if (py === y + h) {
          if (px < cx) {
            return Point(x + w / 4, y + h);
          } else if (py > cy) {
            return Point(x + (3 * w) / 4, y + h);
          }
        }
        if (px === x) {
          return Point(x, cy);
        } else if (px === x + w) {
          return Point(x + w, cy);
        }

        if (py < cy) {
          if (px > x + w / 4 && px < x + (3 * w) / 4) {
            a = Point(x, y);
            b = Point(x + w, y);
          } else if (px < x + w / 4) {
            a = Point(x - Math.floor(0.25 * w), y + h);
            b = Point(x + Math.floor(0.5 * w), y - Math.floor(0.5 * h));
          } else if (px > x + (3 * w) / 4) {
            a = Point(x + Math.floor(0.5 * w), y - Math.floor(0.5 * h));
            b = Point(x + Math.floor(1.25 * w), y + h);
          }
        } else if (py > cy) {
          if (px > x + w / 4 && px < x + (3 * w) / 4) {
            a = Point(x, y + h);
            b = Point(x + w, y + h);
          } else if (px < x + w / 4) {
            a = Point(x - Math.floor(0.25 * w), y);
            b = Point(x + Math.floor(0.5 * w), y + Math.floor(1.5 * h));
          } else if (px > x + (3 * w) / 4) {
            a = Point(x + Math.floor(0.5 * w), y + Math.floor(1.5 * h));
            b = Point(x + Math.floor(1.25 * w), y);
          }
        }
      }

      let tx = cx;
      let ty = cy;

      if (px >= x && px <= x + w) {
        tx = px;

        if (py < cy) {
          ty = y + h;
        } else {
          ty = y;
        }
      } else if (py >= y && py <= y + h) {
        ty = py;

        if (px < cx) {
          tx = x + w;
        } else {
          tx = x;
        }
      }

      result = intersection(
        tx,
        ty,
        next.getX(),
        next.getY(),
        a.getX(),
        a.getY(),
        b.getX(),
        b.getY()
      );
    } else {
      if (vertical) {
        const beta = Math.atan2(h / 4, w / 2);

        //Special cases where intersects with hexagon corners
        if (alpha === beta) {
          return Point(x + w, y + Math.floor(0.25 * h));
        } else if (alpha === pi2) {
          return Point(x + Math.floor(0.5 * w), y);
        } else if (alpha === pi - beta) {
          return Point(x, y + Math.floor(0.25 * h));
        } else if (alpha === -beta) {
          return Point(x + w, y + Math.floor(0.75 * h));
        } else if (alpha === -pi2) {
          return Point(x + Math.floor(0.5 * w), y + h);
        } else if (alpha === -pi + beta) {
          return Point(x, y + Math.floor(0.75 * h));
        }

        if (alpha < beta && alpha > -beta) {
          a = Point(x + w, y);
          b = Point(x + w, y + h);
        } else if (alpha > beta && alpha < pi2) {
          a = Point(x, y - Math.floor(0.25 * h));
          b = Point(x + Math.floor(1.5 * w), y + Math.floor(0.5 * h));
        } else if (alpha > pi2 && alpha < pi - beta) {
          a = Point(x - Math.floor(0.5 * w), y + Math.floor(0.5 * h));
          b = Point(x + w, y - Math.floor(0.25 * h));
        } else if (
          (alpha > pi - beta && alpha <= pi) ||
          (alpha < -pi + beta && alpha >= -pi)
        ) {
          a = Point(x, y);
          b = Point(x, y + h);
        } else if (alpha < -beta && alpha > -pi2) {
          a = Point(x + Math.floor(1.5 * w), y + Math.floor(0.5 * h));
          b = Point(x, y + Math.floor(1.25 * h));
        } else if (alpha < -pi2 && alpha > -pi + beta) {
          a = Point(x - Math.floor(0.5 * w), y + Math.floor(0.5 * h));
          b = Point(x + w, y + Math.floor(1.25 * h));
        }
      } else {
        const beta = Math.atan2(h / 2, w / 4);

        //Special cases where intersects with hexagon corners
        if (alpha === beta) {
          return Point(x + Math.floor(0.75 * w), y);
        } else if (alpha === pi - beta) {
          return Point(x + Math.floor(0.25 * w), y);
        } else if (alpha === pi || alpha == -pi) {
          return Point(x, y + Math.floor(0.5 * h));
        } else if (alpha === 0) {
          return Point(x + w, y + Math.floor(0.5 * h));
        } else if (alpha === -beta) {
          return Point(x + Math.floor(0.75 * w), y + h);
        } else if (alpha === -pi + beta) {
          return Point(x + Math.floor(0.25 * w), y + h);
        }

        if (alpha > 0 && alpha < beta) {
          a = Point(x + Math.floor(0.5 * w), y - Math.floor(0.5 * h));
          b = Point(x + Math.floor(1.25 * w), y + h);
        } else if (alpha > beta && alpha < pi - beta) {
          a = Point(x, y);
          b = Point(x + w, y);
        } else if (alpha > pi - beta && alpha < pi) {
          a = Point(x - Math.floor(0.25 * w), y + h);
          b = Point(x + Math.floor(0.5 * w), y - Math.floor(0.5 * h));
        } else if (alpha < 0 && alpha > -beta) {
          a = Point(x + Math.floor(0.5 * w), y + Math.floor(1.5 * h));
          b = Point(x + Math.floor(1.25 * w), y);
        } else if (alpha < -beta && alpha > -pi + beta) {
          a = Point(x, y + h);
          b = Point(x + w, y + h);
        } else if (alpha < -pi + beta && alpha > -pi) {
          a = Point(x - Math.floor(0.25 * w), y);
          b = Point(x + Math.floor(0.5 * w), y + Math.floor(1.5 * h));
        }
      }

      result = intersection(
        cx,
        cy,
        next.getX(),
        next.getY(),
        a.getX(),
        a.getY(),
        b.getX(),
        b.getY()
      );
    }

    if (isUnset(result)) {
      return Point(cx, cy);
    }

    return result;
  }
};

export default Perimeter;
