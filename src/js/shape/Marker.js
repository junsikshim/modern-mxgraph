/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

/**
 * Variable: markers
 *
 * Maps from markers names to functions to paint the markers.
 */
const markers = [];

/**
 * Class: mxMarker
 *
 * A static class that implements all markers for VML and SVG using a
 * registry. NOTE: The signatures in this class will change.
 */
const Marker = {
  /**
   * Function: addMarker
   *
   * Adds a factory method that updates a given endpoint and returns a
   * function to paint the marker onto the given canvas.
   */
  addMarker: (type, funct) => (markers[type] = funct),

  /**
   * Function: createMarker
   *
   * Returns a function to paint the given marker.
   */
  createMarker: (
    canvas,
    shape,
    type,
    pe,
    unitX,
    unitY,
    size,
    source,
    sw,
    filled
  ) => {
    const funct = markers[type];

    return isSet(funct)
      ? funct(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
      : undefined;
  }
};

/**
 * Adds the classic and block marker factory method.
 */
(() => {
  const createArrow = (widthFactor = 2) => {
    return (
      canvas,
      shape,
      type,
      pe,
      unitX,
      unitY,
      size,
      source,
      sw,
      filled
    ) => {
      // The angle of the forward facing arrow sides against the x axis is
      // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
      // only half the strokewidth is processed ).
      const endOffsetX = unitX * sw * 1.118;
      const endOffsetY = unitY * sw * 1.118;

      unitX = unitX * (size + sw);
      unitY = unitY * (size + sw);

      const pt = pe.clone();
      pt.setX(pt.getX() - endOffsetX);
      pt.setY(pt.getY() - endOffsetY);

      const f =
        type !== ARROW_CLASSIC && type !== ARROW_CLASSIC_THIN ? 1 : 3 / 4;
      pe.setX(pe.getX() + (-unitX * f - endOffsetX));
      pe.setY(pe.getY() + (-unitY * f - endOffsetY));

      return () => {
        canvas.begin();
        canvas.moveTo(pt.getX(), pt.getY());
        canvas.lineTo(
          pt.getX() - unitX - unitY / widthFactor,
          pt.getY() - unitY + unitX / widthFactor
        );

        if (type === ARROW_CLASSIC || type === ARROW_CLASSIC_THIN) {
          canvas.lineTo(
            pt.getX() - (unitX * 3) / 4,
            pt.getY() - (unitY * 3) / 4
          );
        }

        canvas.lineTo(
          pt.getX() + unitY / widthFactor - unitX,
          pt.getY() - unitY - unitX / widthFactor
        );
        canvas.close();

        if (filled) {
          canvas.fillAndStroke();
        } else {
          canvas.stroke();
        }
      };
    };
  };

  Marker.addMarker('classic', createArrow(2));
  Marker.addMarker('classicThin', createArrow(3));
  Marker.addMarker('block', createArrow(2));
  Marker.addMarker('blockThin', createArrow(3));

  const createOpenArrow = (widthFactor = 2) => (
    canvas,
    shape,
    type,
    pe,
    unitX,
    unitY,
    size,
    source,
    sw,
    filled
  ) => {
    // The angle of the forward facing arrow sides against the x axis is
    // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
    // only half the strokewidth is processed ).
    const endOffsetX = unitX * sw * 1.118;
    const endOffsetY = unitY * sw * 1.118;

    unitX = unitX * (size + sw);
    unitY = unitY * (size + sw);

    const pt = pe.clone();
    pt.setX(pt.getX() - endOffsetX);
    pt.setY(pt.getY() - endOffsetY);

    pe.setX(pe.getX() + -endOffsetX * 2);
    pe.setY(pe.getY() + -endOffsetY * 2);

    return () => {
      canvas.begin();
      canvas.moveTo(
        pt.getX() - unitX - unitY / widthFactor,
        pt.getY() - unitY + unitX / widthFactor
      );
      canvas.lineTo(pt.getX(), pt.getY());
      canvas.lineTo(
        pt.getX() + unitY / widthFactor - unitX,
        pt.getY() - unitY - unitX / widthFactor
      );
      canvas.stroke();
    };
  };

  Marker.addMarker('open', createOpenArrow(2));
  Marker.addMarker('openThin', createOpenArrow(3));

  Marker.addMarker(
    'oval',
    (canvas, shape, type, pe, unitX, unitY, size, source, sw, filled) => {
      const a = size / 2;

      const pt = pe.clone();
      pe.setX(pe.getX() - unitX * a);
      pe.setY(pe.getY() - unitY * a);

      return () => {
        canvas.ellipse(pt.getX() - a, pt.getY() - a, size, size);

        if (filled) {
          canvas.fillAndStroke();
        } else {
          canvas.stroke();
        }
      };
    }
  );

  const diamond = (
    canvas,
    shape,
    type,
    pe,
    unitX,
    unitY,
    size,
    source,
    sw,
    filled
  ) => {
    // The angle of the forward facing arrow sides against the x axis is
    // 45 degrees, 1/sin(45) = 1.4142 / 2 = 0.7071 ( / 2 allows for
    // only half the strokewidth is processed ). Or 0.9862 for thin diamond.
    // Note these values and the tk variable below are dependent, update
    // both together (saves trig hard coding it).
    const swFactor = type === ARROW_DIAMOND ? 0.7071 : 0.9862;
    const endOffsetX = unitX * sw * swFactor;
    const endOffsetY = unitY * sw * swFactor;

    unitX = unitX * (size + sw);
    unitY = unitY * (size + sw);

    const pt = pe.clone();
    pt.setX(pt.getX() - endOffsetX);
    pt.setY(pt.getY() - endOffsetY);

    pe.setX(pe.getX() + (-unitX - endOffsetX));
    pe.setY(pe.getY() + (-unitY - endOffsetY));

    // thickness factor for diamond
    const tk = type === ARROW_DIAMOND ? 2 : 3.4;

    return () => {
      canvas.begin();
      canvas.moveTo(pt.getX(), pt.getY());
      canvas.lineTo(
        pt.getX() - unitX / 2 - unitY / tk,
        pt.getY() + unitX / tk - unitY / 2
      );
      canvas.lineTo(pt.getX() - unitX, pt.getY() - unitY);
      canvas.lineTo(
        pt.getX() - unitX / 2 + unitY / tk,
        pt.getY() - unitY / 2 - unitX / tk
      );
      canvas.close();

      if (filled) {
        canvas.fillAndStroke();
      } else {
        canvas.stroke();
      }
    };
  };

  Marker.addMarker('diamond', diamond);
  Marker.addMarker('diamondThin', diamond);
})();

export default Marker;
