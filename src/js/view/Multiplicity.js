/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet } from '../Helpers';
import { isNode } from '../util/Utils';

/**
 * Class: Multiplicity
 *
 * Defines invalid connections along with the error messages that they produce.
 * To add or remove rules on a graph, you must add/remove instances of this
 * class to <mxGraph.multiplicities>.
 *
 * Example:
 *
 * (code)
 * graph.multiplicities.push(new mxMultiplicity(
 *   true, 'rectangle', null, null, 0, 2, ['circle'],
 *   'Only 2 targets allowed',
 *   'Only circle targets allowed'));
 * (end)
 *
 * Defines a rule where each rectangle must be connected to no more than 2
 * circles and no other types of targets are allowed.
 *
 * Constructor: Multiplicity
 *
 * Instantiate class mxMultiplicity in order to describe allowed
 * connections in a graph. Not all constraints can be enforced while
 * editing, some must be checked at validation time. The <countError> and
 * <typeError> are treated as resource keys in <mxResources>.
 *
 * Parameters:
 *
 * source - Boolean indicating if this rule applies to the source or target
 * terminal.
 * type - Type of the source or target terminal that this rule applies to.
 * See <type> for more information.
 * attr - Optional attribute name to match the source or target terminal.
 * value - Optional attribute value to match the source or target terminal.
 * min - Minimum number of edges for this rule. Default is 1.
 * max - Maximum number of edges for this rule. n means infinite. Default
 * is n.
 * validNeighbors - Array of types of the opposite terminal for which this
 * rule applies.
 * countError - Error to be displayed for invalid number of edges.
 * typeError - Error to be displayed for invalid opposite terminals.
 * validNeighborsAllowed - Optional boolean indicating if the array of
 * opposite types should be valid or invalid.
 */
const Multiplicities = (
  source,
  type,
  attr,
  value,
  min = 0,
  max = 'n',
  validNeighbors,
  countError,
  typeError,
  validNeighborsAllowed = true
) => {
  /**
   * Variable: type
   *
   * Defines the type of the source or target terminal. The type is a string
   * passed to <mxUtils.isNode> together with the source or target vertex
   * value as the first argument.
   */
  const [getType, setType] = addProp(type);

  /**
   * Variable: attr
   *
   * Optional string that specifies the attributename to be passed to
   * <mxUtils.isNode> to check if the rule applies to a cell.
   */
  const [getAttr, setAttr] = addProp(attr);

  /**
   * Variable: value
   *
   * Optional string that specifies the value of the attribute to be passed
   * to <mxUtils.isNode> to check if the rule applies to a cell.
   */
  const [getValue, setValue] = addProp(value);

  /**
   * Variable: source
   *
   * Boolean that specifies if the rule is applied to the source or target
   * terminal of an edge.
   */
  const [getSource, setSource] = addProp(source);

  /**
   * Variable: min
   *
   * Defines the minimum number of connections for which this rule applies.
   * Default is 0.
   */
  const [getMin, setMin] = addProp(min);

  /**
   * Variable: max
   *
   * Defines the maximum number of connections for which this rule applies.
   * A value of 'n' means unlimited times. Default is 'n'.
   */
  const [getMax, setMax] = addProp(max);

  /**
   * Variable: validNeighbors
   *
   * Holds an array of strings that specify the type of neighbor for which
   * this rule applies. The strings are used in <mxCell.is> on the opposite
   * terminal to check if the rule applies to the connection.
   */
  const [getValidNeighbors, setValidNeighbors] = addProp(validNeighbors);

  /**
   * Variable: validNeighborsAllowed
   *
   * Boolean indicating if the list of validNeighbors are those that are allowed
   * for this rule or those that are not allowed for this rule.
   */
  const [isValidNeighborsAllowed, setValidNeighborsAllowed] = addProp(
    validNeighborsAllowed
  );

  /**
   * Variable: countError
   *
   * Holds the localized error message to be displayed if the number of
   * connections for which the rule applies is smaller than <min> or greater
   * than <max>.
   */
  const [getCountError, setCountError] = addProp(countError);

  /**
   * Variable: typeError
   *
   * Holds the localized error message to be displayed if the type of the
   * neighbor for a connection does not match the rule.
   */
  const [getTypeError, setTypeError] = addProp(typeError);

  /**
   * Function: check
   *
   * Checks the multiplicity for the given arguments and returns the error
   * for the given connection or null if the multiplicity does not apply.
   *
   * Parameters:
   *
   * graph - Reference to the enclosing <mxGraph> instance.
   * edge - <mxCell> that represents the edge to validate.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * sourceOut - Number of outgoing edges from the source terminal.
   * targetIn - Number of incoming edges for the target terminal.
   */
  const check = (graph, edge, source, target, sourceOut, targetIn) => {
    let error = '';

    if (
      (getSource() && checkTerminal(graph, source, edge)) ||
      (!getSource() && checkTerminal(graph, target, edge))
    ) {
      if (
        isSet(getCountError()) &&
        ((getSource() && (getMax() === 0 || sourceOut >= getMax())) ||
          (!getSource() && (getMax() === 0 || targetIn >= getMax())))
      ) {
        error += getCountError() + '\n';
      }

      if (
        isSet(getValidNeighbors()) &&
        isSet(getTypeError()) &&
        getValidNeighbors().length > 0
      ) {
        const isValid = checkNeighbors(graph, edge, source, target);

        if (!isValid) {
          error += getTypeError() + '\n';
        }
      }
    }

    return error.length > 0 ? error : null;
  };

  /**
   * Function: checkNeighbors
   *
   * Checks if there are any valid neighbours in <validNeighbors>. This is only
   * called if <validNeighbors> is a non-empty array.
   */
  const checkNeighbors = (graph, edge, source, target) => {
    const sourceValue = graph.getModel().getValue(source);
    const targetValue = graph.getModel().getValue(target);
    let isValid = !isValidNeighborsAllowed();
    const valid = getValidNeighbors();

    for (let j = 0; j < valid.length; j++) {
      if (getSource() && checkType(graph, targetValue, valid[j])) {
        isValid = isValidNeighborsAllowed();
        break;
      } else if (!getSource() && checkType(graph, sourceValue, valid[j])) {
        isValid = isValidNeighborsAllowed();
        break;
      }
    }

    return isValid;
  };

  /**
   * Function: checkTerminal
   *
   * Checks the given terminal cell and returns true if this rule applies. The
   * given cell is the source or target of the given edge, depending on
   * <source>. This implementation uses <checkType> on the terminal's value.
   */
  const checkTerminal = (graph, terminal, edge) => {
    const value = graph.getModel().getValue(terminal);

    return checkType(graph, value, getType(), getAttr(), getValue());
  };

  /**
   * Function: checkType
   *
   * Checks the type of the given value.
   */
  const checkType = (graph, value, type, attr, attrValue) => {
    if (isSet(value)) {
      if (!isNaN(value.nodeType)) {
        // Checks if value is a DOM node
        return isNode(value, type, attr, attrValue);
      } else {
        return value === type;
      }
    }

    return false;
  };

  const me = {
    check,
    checkNeighbors,
    checkTerminal,
    checkType
  };

  return me;
};

export default Multiplicities;
