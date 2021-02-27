/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

/* Variable: values
 *
 * Maps from strings to objects.
 */
const values = [];

/**
 * Class: StyleRegistry
 *
 * Singleton class that acts as a global converter from string to object values
 * in a style. This is currently only used to perimeters and edge styles.
 */
const StyleRegistry = {
  /**
   * Function: putValue
   *
   * Puts the given object into the registry under the given name.
   */
  putValue: (name, obj) => (values[name] = obj),

  /**
   * Function: getValue
   *
   * Returns the value associated with the given name.
   */
  getValue: (name) => values[name],

  /**
   * Function: getName
   *
   * Returns the name for the given value.
   */
  gameName: (value) => {
    for (const key in values) {
      if (values[key] === value) {
        return key;
      }
    }

    return null;
  }
};

StyleRegistry.putValue(EDGESTYLE_ELBOW, EdgeStyle.ElbowConnector);
StyleRegistry.putValue(EDGESTYLE_ENTITY_RELATION, EdgeStyle.EntityRelation);
StyleRegistry.putValue(EDGESTYLE_LOOP, EdgeStyle.Loop);
StyleRegistry.putValue(EDGESTYLE_SIDETOSIDE, EdgeStyle.SideToSide);
StyleRegistry.putValue(EDGESTYLE_TOPTOBOTTOM, EdgeStyle.TopToBottom);
StyleRegistry.putValue(EDGESTYLE_ORTHOGONAL, EdgeStyle.OrthConnector);
StyleRegistry.putValue(EDGESTYLE_SEGMENT, EdgeStyle.SegmentConnector);

StyleRegistry.putValue(PERIMETER_ELLIPSE, Perimeter.EllipsePerimeter);
StyleRegistry.putValue(PERIMETER_RECTANGLE, Perimeter.RectanglePerimeter);
StyleRegistry.putValue(PERIMETER_RHOMBUS, Perimeter.RhombusPerimeter);
StyleRegistry.putValue(PERIMETER_TRIANGLE, Perimeter.TrianglePerimeter);
StyleRegistry.putValue(PERIMETER_HEXAGON, Perimeter.HexagonPerimeter);
