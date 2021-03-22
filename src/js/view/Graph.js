/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import {
  imageBasePath,
  IS_FF,
  IS_GC,
  IS_IE,
  IS_IE11,
  IS_MAC,
  IS_OP,
  IS_SF,
  IS_TOUCH
} from '../Client';
import ConnectionHandler from '../handler/ConnectionHandler';
import EdgeHandler from '../handler/EdgeHandler';
import EdgeSegmentHandler from '../handler/EdgeSegmentHandler';
import ElbowEdgeHandler from '../handler/ElbowEdgeHandler';
import GraphHandler from '../handler/GraphHandler';
import PanningHandler from '../handler/PanningHandler';
import PopupMenuHandler from '../handler/PopupMenuHandler';
import SelectionCellsHandler from '../handler/SelectionCellsHandler';
import TooltipHandler from '../handler/TooltipHandler';
import VertexHandler from '../handler/VertexHandler';
import { addProp, isSet, isUnset, makeComponent } from '../Helpers';
import Cell from '../model/Cell';
import ChildChange from '../model/change/ChildChange';
import GeometryChange from '../model/change/GeometryChange';
import RootChange from '../model/change/RootChange';
import StyleChange from '../model/change/StyleChange';
import TerminalChange from '../model/change/TerminalChange';
import ValueChange from '../model/change/ValueChange';
import Geometry from '../model/Geometry';
import GraphModel from '../model/GraphModel';
import RectangleShape from '../shape/RectangleShape';
import {
  ALIGN_MIDDLE,
  DEFAULT_STARTSIZE,
  DIRECTION_EAST,
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  DIRECTION_WEST,
  NONE,
  PAGE_FORMAT_A4_PORTRAIT,
  SHAPE_LABEL,
  SHAPE_SWIMLANE,
  STYLE_AUTOSIZE,
  STYLE_BENDABLE,
  STYLE_DIRECTION,
  STYLE_EDITABLE,
  STYLE_ENTRY_DX,
  STYLE_ENTRY_DY,
  STYLE_ENTRY_PERIMETER,
  STYLE_ENTRY_X,
  STYLE_ENTRY_Y,
  STYLE_EXIT_DX,
  STYLE_EXIT_DY,
  STYLE_EXIT_PERIMETER,
  STYLE_EXIT_X,
  STYLE_EXIT_Y,
  STYLE_FILLCOLOR,
  STYLE_FLIPH,
  STYLE_FLIPV,
  STYLE_FOLDABLE,
  STYLE_HORIZONTAL,
  STYLE_IMAGE,
  STYLE_IMAGE_HEIGHT,
  STYLE_IMAGE_WIDTH,
  STYLE_INDICATOR_GRADIENTCOLOR,
  STYLE_MOVABLE,
  STYLE_NOLABEL,
  STYLE_ORTHOGONAL,
  STYLE_OVERFLOW,
  STYLE_POINTER_EVENTS,
  STYLE_RESIZABLE,
  STYLE_ROTATION,
  STYLE_SHAPE,
  STYLE_SOURCE_PORT,
  STYLE_STARTSIZE,
  STYLE_TARGET_PORT,
  STYLE_VERTICAL_ALIGN,
  STYLE_WHITE_SPACE
} from '../util/Constants';
import Dictionary from '../util/Dictionary';
import Event from '../util/Event';
import EventObject from '../util/EventObject';
import EventSource from '../util/EventSource';
import Image from '../util/Image';
import Point from '../util/Point';
import Rectangle from '../util/Rectangle';
import {
  findNearestSegment,
  hasScrollbars,
  parseCssNumber,
  sortCells,
  setCellStyles as _setCellStyles,
  convertPoint,
  getValue,
  isNode,
  ptSegDistSq,
  toRadians,
  contains
} from '../util/Utils';
import CellEditor from './CellEditor';
import CellRenderer from './CellRenderer';
import ConnectionConstraint from './ConnectionConstraint';
import EdgeStyle from './EdgeStyle';
import GraphSelectionModel from './GraphSelectionModel';
import GraphView from './GraphView';
import Stylesheet from './Stylesheet';

/**
 * Class: Graph
 *
 * Extends <mxEventSource> to implement a graph component for
 * the browser. This is the main class of the package. To activate
 * panning and connections use <setPanning> and <setConnectable>.
 * For rubberband selection you must create a new instance of
 * <mxRubberband>. The following listeners are added to
 * <mouseListeners> by default:
 *
 * - <tooltipHandler>: <mxTooltipHandler> that displays tooltips
 * - <panningHandler>: <mxPanningHandler> for panning and popup menus
 * - <connectionHandler>: <mxConnectionHandler> for creating connections
 * - <graphHandler>: <mxGraphHandler> for moving and cloning cells
 *
 * These listeners will be called in the above order if they are enabled.
 *
 * Background Images:
 *
 * To display a background image, set the image, image width and
 * image height using <setBackgroundImage>. If one of the
 * above values has changed then the <view>'s <mxGraphView.validate>
 * should be invoked.
 *
 * Cell Images:
 *
 * To use images in cells, a shape must be specified in the default
 * vertex style (or any named style). Possible shapes are
 * <mxConstants.SHAPE_IMAGE> and <mxConstants.SHAPE_LABEL>.
 * The code to change the shape used in the default vertex style,
 * the following code is used:
 *
 * (code)
 * var style = graph.getStylesheet().getDefaultVertexStyle();
 * style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
 * (end)
 *
 * For the default vertex style, the image to be displayed can be
 * specified in a cell's style using the <mxConstants.STYLE_IMAGE>
 * key and the image URL as a value, for example:
 *
 * (code)
 * image=http://www.example.com/image.gif
 * (end)
 *
 * For a named style, the the stylename must be the first element
 * of the cell style:
 *
 * (code)
 * stylename;image=http://www.example.com/image.gif
 * (end)
 *
 * A cell style can have any number of key=value pairs added, divided
 * by a semicolon as follows:
 *
 * (code)
 * [stylename;|key=value;]
 * (end)
 *
 * Labels:
 *
 * The cell labels are defined by <getLabel> which uses <convertValueToString>
 * if <labelsVisible> is true. If a label must be rendered as HTML markup, then
 * <isHtmlLabel> should return true for the respective cell. If all labels
 * contain HTML markup, <htmlLabels> can be set to true. NOTE: Enabling HTML
 * labels carries a possible security risk (see the section on security in
 * the manual).
 *
 * If wrapping is needed for a label, then <isHtmlLabel> and <isWrapping> must
 * return true for the cell whose label should be wrapped. See <isWrapping> for
 * an example.
 *
 * If clipping is needed to keep the rendering of a HTML label inside the
 * bounds of its vertex, then <isClipping> should return true for the
 * respective cell.
 *
 * By default, edge labels are movable and vertex labels are fixed. This can be
 * changed by setting <edgeLabelsMovable> and <vertexLabelsMovable>, or by
 * overriding <isLabelMovable>.
 *
 * In-place Editing:
 *
 * In-place editing is started with a doubleclick or by typing F2.
 * Programmatically, <edit> is used to check if the cell is editable
 * (<isCellEditable>) and call <startEditingAtCell>, which invokes
 * <mxCellEditor.startEditing>. The editor uses the value returned
 * by <getEditingValue> as the editing value.
 *
 * After in-place editing, <labelChanged> is called, which invokes
 * <mxGraphModel.setValue>, which in turn calls
 * <mxGraphModel.valueForCellChanged> via <mxValueChange>.
 *
 * The event that triggers in-place editing is passed through to the
 * <cellEditor>, which may take special actions depending on the type of the
 * event or mouse location, and is also passed to <getEditingValue>. The event
 * is then passed back to the event processing functions which can perform
 * specific actions based on the trigger event.
 *
 * Tooltips:
 *
 * Tooltips are implemented by <getTooltip>, which calls <getTooltipForCell>
 * if a cell is under the mousepointer. The default implementation checks if
 * the cell has a getTooltip function and calls it if it exists. Hence, in order
 * to provide custom tooltips, the cell must provide a getTooltip function, or
 * one of the two above functions must be overridden.
 *
 * Typically, for custom cell tooltips, the latter function is overridden as
 * follows:
 *
 * (code)
 * graph.getTooltipForCell = function(cell)
 * {
 *   var label = this.convertValueToString(cell);
 *   return 'Tooltip for '+label;
 * }
 * (end)
 *
 * When using a config file, the function is overridden in the mxGraph section
 * using the following entry:
 *
 * (code)
 * <add as="getTooltipForCell"><![CDATA[
 *   function(cell)
 *   {
 *     var label = this.convertValueToString(cell);
 *     return 'Tooltip for '+label;
 *   }
 * ]]></add>
 * (end)
 *
 * "this" refers to the graph in the implementation, so for example to check if
 * a cell is an edge, you use this.getModel().isEdge(cell)
 *
 * For replacing the default implementation of <getTooltipForCell> (rather than
 * replacing the function on a specific instance), the following code should be
 * used after loading the JavaScript files, but before creating a new mxGraph
 * instance using <mxGraph>:
 *
 * (code)
 * mxGraph.prototype.getTooltipForCell = function(cell)
 * {
 *   var label = this.convertValueToString(cell);
 *   return 'Tooltip for '+label;
 * }
 * (end)
 *
 * Shapes & Styles:
 *
 * The implementation of new shapes is demonstrated in the examples. We'll assume
 * that we have implemented a custom shape with the name BoxShape which we want
 * to use for drawing vertices. To use this shape, it must first be registered in
 * the cell renderer as follows:
 *
 * (code)
 * mxCellRenderer.registerShape('box', BoxShape);
 * (end)
 *
 * The code registers the BoxShape constructor under the name box in the cell
 * renderer of the graph. The shape can now be referenced using the shape-key in
 * a style definition. (The cell renderer contains a set of additional shapes,
 * namely one for each constant with a SHAPE-prefix in <mxConstants>.)
 *
 * Styles are a collection of key, value pairs and a stylesheet is a collection
 * of named styles. The names are referenced by the cellstyle, which is stored
 * in <mxCell.style> with the following format: [stylename;|key=value;]. The
 * string is resolved to a collection of key, value pairs, where the keys are
 * overridden with the values in the string.
 *
 * When introducing a new shape, the name under which the shape is registered
 * must be used in the stylesheet. There are three ways of doing this:
 *
 *   - By changing the default style, so that all vertices will use the new
 * 		shape
 *   - By defining a new style, so that only vertices with the respective
 * 		cellstyle will use the new shape
 *   - By using shape=box in the cellstyle's optional list of key, value pairs
 * 		to be overridden
 *
 * In the first case, the code to fetch and modify the default style for
 * vertices is as follows:
 *
 * (code)
 * var style = graph.getStylesheet().getDefaultVertexStyle();
 * style[mxConstants.STYLE_SHAPE] = 'box';
 * (end)
 *
 * The code takes the default vertex style, which is used for all vertices that
 * do not have a specific cellstyle, and modifies the value for the shape-key
 * in-place to use the new BoxShape for drawing vertices. This is done by
 * assigning the box value in the second line, which refers to the name of the
 * BoxShape in the cell renderer.
 *
 * In the second case, a collection of key, value pairs is created and then
 * added to the stylesheet under a new name. In order to distinguish the
 * shapename and the stylename we'll use boxstyle for the stylename:
 *
 * (code)
 * var style = new Object();
 * style[mxConstants.STYLE_SHAPE] = 'box';
 * style[mxConstants.STYLE_STROKECOLOR] = '#000000';
 * style[mxConstants.STYLE_FONTCOLOR] = '#000000';
 * graph.getStylesheet().putCellStyle('boxstyle', style);
 * (end)
 *
 * The code adds a new style with the name boxstyle to the stylesheet. To use
 * this style with a cell, it must be referenced from the cellstyle as follows:
 *
 * (code)
 * var vertex = graph.insertVertex(parent, null, 'Hello, World!', 20, 20, 80, 20,
 * 				'boxstyle');
 * (end)
 *
 * To summarize, each new shape must be registered in the <mxCellRenderer> with
 * a unique name. That name is then used as the value of the shape-key in a
 * default or custom style. If there are multiple custom shapes, then there
 * should be a separate style for each shape.
 *
 * Inheriting Styles:
 *
 * For fill-, stroke-, gradient-, font- and indicatorColors special keywords
 * can be used. The inherit keyword for one of these colors will inherit the
 * color for the same key from the parent cell. The swimlane keyword does the
 * same, but inherits from the nearest swimlane in the ancestor hierarchy.
 * Finally, the indicated keyword will use the color of the indicator as the
 * color for the given key.
 *
 * Scrollbars:
 *
 * The <containers> overflow CSS property defines if scrollbars are used to
 * display the graph. For values of 'auto' or 'scroll', the scrollbars will
 * be shown. Note that the <resizeContainer> flag is normally not used
 * together with scrollbars, as it will resize the container to match the
 * size of the graph after each change.
 *
 * Multiplicities and Validation:
 *
 * To control the possible connections in mxGraph, <getEdgeValidationError> is
 * used. The default implementation of the function uses <multiplicities>,
 * which is an array of <mxMultiplicity>. Using this class allows to establish
 * simple multiplicities, which are enforced by the graph.
 *
 * The <mxMultiplicity> uses <mxCell.is> to determine for which terminals it
 * applies. The default implementation of <mxCell.is> works with DOM nodes (XML
 * nodes) and checks if the given type parameter matches the nodeName of the
 * node (case insensitive). Optionally, an attributename and value can be
 * specified which are also checked.
 *
 * <getEdgeValidationError> is called whenever the connectivity of an edge
 * changes. It returns an empty string or an error message if the edge is
 * invalid or null if the edge is valid. If the returned string is not empty
 * then it is displayed as an error message.
 *
 * <mxMultiplicity> allows to specify the multiplicity between a terminal and
 * its possible neighbors. For example, if any rectangle may only be connected
 * to, say, a maximum of two circles you can add the following rule to
 * <multiplicities>:
 *
 * (code)
 * graph.multiplicities.push(new mxMultiplicity(
 *   true, 'rectangle', null, null, 0, 2, ['circle'],
 *   'Only 2 targets allowed',
 *   'Only shape targets allowed'));
 * (end)
 *
 * This will display the first error message whenever a rectangle is connected
 * to more than two circles and the second error message if a rectangle is
 * connected to anything but a circle.
 *
 * For certain multiplicities, such as a minimum of 1 connection, which cannot
 * be enforced at cell creation time (unless the cell is created together with
 * the connection), mxGraph offers <validate> which checks all multiplicities
 * for all cells and displays the respective error messages in an overlay icon
 * on the cells.
 *
 * If a cell is collapsed and contains validation errors, a respective warning
 * icon is attached to the collapsed cell.
 *
 * Auto-Layout:
 *
 * For automatic layout, the <getLayout> hook is provided in <mxLayoutManager>.
 * It can be overridden to return a layout algorithm for the children of a
 * given cell.
 *
 * Unconnected edges:
 *
 * The default values for all switches are designed to meet the requirements of
 * general diagram drawing applications. A very typical set of settings to
 * avoid edges that are not connected is the following:
 *
 * (code)
 * graph.setAllowDanglingEdges(false);
 * graph.setDisconnectOnMove(false);
 * (end)
 *
 * Setting the <cloneInvalidEdges> switch to true is optional. This switch
 * controls if edges are inserted after a copy, paste or clone-drag if they are
 * invalid. For example, edges are invalid if copied or control-dragged without
 * having selected the corresponding terminals and allowDanglingEdges is
 * false, in which case the edges will not be cloned if the switch is false.
 *
 * Output:
 *
 * To produce an XML representation for a diagram, the following code can be
 * used.
 *
 * (code)
 * var enc = new mxCodec(mxUtils.createXmlDocument());
 * var node = enc.encode(graph.getModel());
 * (end)
 *
 * This will produce an XML node than can be handled using the DOM API or
 * turned into a string representation using the following code:
 *
 * (code)
 * var xml = mxUtils.getXml(node);
 * (end)
 *
 * To obtain a formatted string, mxUtils.getPrettyXml can be used instead.
 *
 * This string can now be stored in a local persistent storage (for example
 * using Google Gears) or it can be passed to a backend using mxUtils.post as
 * follows. The url variable is the URL of the Java servlet, PHP page or HTTP
 * handler, depending on the server.
 *
 * (code)
 * var xmlString = encodeURIComponent(mxUtils.getXml(node));
 * mxUtils.post(url, 'xml='+xmlString, function(req)
 * {
 *   // Process server response using req of type mxXmlRequest
 * });
 * (end)
 *
 * Input:
 *
 * To load an XML representation of a diagram into an existing graph object
 * mxUtils.load can be used as follows. The url variable is the URL of the Java
 * servlet, PHP page or HTTP handler that produces the XML string.
 *
 * (code)
 * var xmlDoc = mxUtils.load(url).getXml();
 * var node = xmlDoc.documentElement;
 * var dec = new mxCodec(node.ownerDocument);
 * dec.decode(node, graph.getModel());
 * (end)
 *
 * For creating a page that loads the client and a diagram using a single
 * request please refer to the deployment examples in the backends.
 *
 * Functional dependencies:
 *
 * (see images/callgraph.png)
 *
 * Resources:
 *
 * resources/graph - Language resources for mxGraph
 *
 * Group: Events
 *
 * Event: mxEvent.ROOT
 *
 * Fires if the root in the model has changed. This event has no properties.
 *
 * Event: mxEvent.ALIGN_CELLS
 *
 * Fires between begin- and endUpdate in <alignCells>. The <code>cells</code>
 * and <code>align</code> properties contain the respective arguments that were
 * passed to <alignCells>.
 *
 * Event: mxEvent.FLIP_EDGE
 *
 * Fires between begin- and endUpdate in <flipEdge>. The <code>edge</code>
 * property contains the edge passed to <flipEdge>.
 *
 * Event: mxEvent.ORDER_CELLS
 *
 * Fires between begin- and endUpdate in <orderCells>. The <code>cells</code>
 * and <code>back</code> properties contain the respective arguments that were
 * passed to <orderCells>.
 *
 * Event: mxEvent.CELLS_ORDERED
 *
 * Fires between begin- and endUpdate in <cellsOrdered>. The <code>cells</code>
 * and <code>back</code> arguments contain the respective arguments that were
 * passed to <cellsOrdered>.
 *
 * Event: mxEvent.GROUP_CELLS
 *
 * Fires between begin- and endUpdate in <groupCells>. The <code>group</code>,
 * <code>cells</code> and <code>border</code> arguments contain the respective
 * arguments that were passed to <groupCells>.
 *
 * Event: mxEvent.UNGROUP_CELLS
 *
 * Fires between begin- and endUpdate in <ungroupCells>. The <code>cells</code>
 * property contains the array of cells that was passed to <ungroupCells>.
 *
 * Event: mxEvent.REMOVE_CELLS_FROM_PARENT
 *
 * Fires between begin- and endUpdate in <removeCellsFromParent>. The
 * <code>cells</code> property contains the array of cells that was passed to
 * <removeCellsFromParent>.
 *
 * Event: mxEvent.ADD_CELLS
 *
 * Fires between begin- and endUpdate in <addCells>. The <code>cells</code>,
 * <code>parent</code>, <code>index</code>, <code>source</code> and
 * <code>target</code> properties contain the respective arguments that were
 * passed to <addCells>.
 *
 * Event: mxEvent.CELLS_ADDED
 *
 * Fires between begin- and endUpdate in <cellsAdded>. The <code>cells</code>,
 * <code>parent</code>, <code>index</code>, <code>source</code>,
 * <code>target</code> and <code>absolute</code> properties contain the
 * respective arguments that were passed to <cellsAdded>.
 *
 * Event: mxEvent.REMOVE_CELLS
 *
 * Fires between begin- and endUpdate in <removeCells>. The <code>cells</code>
 * and <code>includeEdges</code> arguments contain the respective arguments
 * that were passed to <removeCells>.
 *
 * Event: mxEvent.CELLS_REMOVED
 *
 * Fires between begin- and endUpdate in <cellsRemoved>. The <code>cells</code>
 * argument contains the array of cells that was removed.
 *
 * Event: mxEvent.SPLIT_EDGE
 *
 * Fires between begin- and endUpdate in <splitEdge>. The <code>edge</code>
 * property contains the edge to be splitted, the <code>cells</code>,
 * <code>newEdge</code>, <code>dx</code> and <code>dy</code> properties contain
 * the respective arguments that were passed to <splitEdge>.
 *
 * Event: mxEvent.TOGGLE_CELLS
 *
 * Fires between begin- and endUpdate in <toggleCells>. The <code>show</code>,
 * <code>cells</code> and <code>includeEdges</code> properties contain the
 * respective arguments that were passed to <toggleCells>.
 *
 * Event: mxEvent.FOLD_CELLS
 *
 * Fires between begin- and endUpdate in <foldCells>. The
 * <code>collapse</code>, <code>cells</code> and <code>recurse</code>
 * properties contain the respective arguments that were passed to <foldCells>.
 *
 * Event: mxEvent.CELLS_FOLDED
 *
 * Fires between begin- and endUpdate in cellsFolded. The
 * <code>collapse</code>, <code>cells</code> and <code>recurse</code>
 * properties contain the respective arguments that were passed to
 * <cellsFolded>.
 *
 * Event: mxEvent.UPDATE_CELL_SIZE
 *
 * Fires between begin- and endUpdate in <updateCellSize>. The
 * <code>cell</code> and <code>ignoreChildren</code> properties contain the
 * respective arguments that were passed to <updateCellSize>.
 *
 * Event: mxEvent.RESIZE_CELLS
 *
 * Fires between begin- and endUpdate in <resizeCells>. The <code>cells</code>
 * and <code>bounds</code> properties contain the respective arguments that
 * were passed to <resizeCells>.
 *
 * Event: mxEvent.CELLS_RESIZED
 *
 * Fires between begin- and endUpdate in <cellsResized>. The <code>cells</code>
 * and <code>bounds</code> properties contain the respective arguments that
 * were passed to <cellsResized>.
 *
 * Event: mxEvent.MOVE_CELLS
 *
 * Fires between begin- and endUpdate in <moveCells>. The <code>cells</code>,
 * <code>dx</code>, <code>dy</code>, <code>clone</code>, <code>target</code>
 * and <code>event</code> properties contain the respective arguments that
 * were passed to <moveCells>.
 *
 * Event: mxEvent.CELLS_MOVED
 *
 * Fires between begin- and endUpdate in <cellsMoved>. The <code>cells</code>,
 * <code>dx</code>, <code>dy</code> and <code>disconnect</code> properties
 * contain the respective arguments that were passed to <cellsMoved>.
 *
 * Event: mxEvent.CONNECT_CELL
 *
 * Fires between begin- and endUpdate in <connectCell>. The <code>edge</code>,
 * <code>terminal</code> and <code>source</code> properties contain the
 * respective arguments that were passed to <connectCell>.
 *
 * Event: mxEvent.CELL_CONNECTED
 *
 * Fires between begin- and endUpdate in <cellConnected>. The
 * <code>edge</code>, <code>terminal</code> and <code>source</code> properties
 * contain the respective arguments that were passed to <cellConnected>.
 *
 * Event: mxEvent.REFRESH
 *
 * Fires after <refresh> was executed. This event has no properties.
 *
 * Event: mxEvent.CLICK
 *
 * Fires in <click> after a click event. The <code>event</code> property
 * contains the original mouse event and <code>cell</code> property contains
 * the cell under the mouse or null if the background was clicked.
 *
 * Event: mxEvent.DOUBLE_CLICK
 *
 * Fires in <dblClick> after a double click. The <code>event</code> property
 * contains the original mouse event and the <code>cell</code> property
 * contains the cell under the mouse or null if the background was clicked.
 *
 * Event: mxEvent.GESTURE
 *
 * Fires in <fireGestureEvent> after a touch gesture. The <code>event</code>
 * property contains the original gesture end event and the <code>cell</code>
 * property contains the optional cell associated with the gesture.
 *
 * Event: mxEvent.TAP_AND_HOLD
 *
 * Fires in <tapAndHold> if a tap and hold event was detected. The <code>event</code>
 * property contains the initial touch event and the <code>cell</code> property
 * contains the cell under the mouse or null if the background was clicked.
 *
 * Event: mxEvent.FIRE_MOUSE_EVENT
 *
 * Fires in <fireMouseEvent> before the mouse listeners are invoked. The
 * <code>eventName</code> property contains the event name and the
 * <code>event</code> property contains the <mxMouseEvent>.
 *
 * Event: mxEvent.SIZE
 *
 * Fires after <sizeDidChange> was executed. The <code>bounds</code> property
 * contains the new graph bounds.
 *
 * Event: mxEvent.START_EDITING
 *
 * Fires before the in-place editor starts in <startEditingAtCell>. The
 * <code>cell</code> property contains the cell that is being edited and the
 * <code>event</code> property contains the optional event argument that was
 * passed to <startEditingAtCell>.
 *
 * Event: mxEvent.EDITING_STARTED
 *
 * Fires after the in-place editor starts in <startEditingAtCell>. The
 * <code>cell</code> property contains the cell that is being edited and the
 * <code>event</code> property contains the optional event argument that was
 * passed to <startEditingAtCell>.
 *
 * Event: mxEvent.EDITING_STOPPED
 *
 * Fires after the in-place editor stops in <stopEditing>.
 *
 * Event: mxEvent.LABEL_CHANGED
 *
 * Fires between begin- and endUpdate in <cellLabelChanged>. The
 * <code>cell</code> property contains the cell, the <code>value</code>
 * property contains the new value for the cell, the <code>old</code> property
 * contains the old value and the optional <code>event</code> property contains
 * the mouse event that started the edit.
 *
 * Event: mxEvent.ADD_OVERLAY
 *
 * Fires after an overlay is added in <addCellOverlay>. The <code>cell</code>
 * property contains the cell and the <code>overlay</code> property contains
 * the <mxCellOverlay> that was added.
 *
 * Event: mxEvent.REMOVE_OVERLAY
 *
 * Fires after an overlay is removed in <removeCellOverlay> and
 * <removeCellOverlays>. The <code>cell</code> property contains the cell and
 * the <code>overlay</code> property contains the <mxCellOverlay> that was
 * removed.
 *
 * Constructor: mxGraph
 *
 * Constructs a new mxGraph in the specified container. Model is an optional
 * mxGraphModel. If no model is provided, a new mxGraphModel instance is
 * used as the model. The container must have a valid owner document prior
 * to calling this function in Internet Explorer. RenderHint is a string to
 * affect the display performance and rendering in IE, but not in SVG-based
 * browsers. The parameter is mapped to <dialect>, which may
 * be one of <mxConstants.DIALECT_SVG> for SVG-based browsers,
 * <mxConstants.DIALECT_STRICTHTML> for fastest display mode,
 * <mxConstants.DIALECT_PREFERHTML> for faster display mode,
 * <mxConstants.DIALECT_MIXEDHTML> for fast and <mxConstants.DIALECT_VML>
 * for exact display mode (slowest). The dialects are defined in mxConstants.
 * The default values are DIALECT_SVG for SVG-based browsers and
 * DIALECT_MIXED for IE.
 *
 * The possible values for the renderingHint parameter are explained below:
 *
 * fast - The parameter is based on the fact that the display performance is
 * highly improved in IE if the VML is not contained within a VML group
 * element. The lack of a group element only slightly affects the display while
 * panning, but improves the performance by almost a factor of 2, while keeping
 * the display sufficiently accurate. This also allows to render certain shapes as HTML
 * if the display accuracy is not affected, which is implemented by
 * <mxShape.isMixedModeHtml>. This is the default setting and is mapped to
 * DIALECT_MIXEDHTML.
 * faster - Same as fast, but more expensive shapes are avoided. This is
 * controlled by <mxShape.preferModeHtml>. The default implementation will
 * avoid gradients and rounded rectangles, but more significant shapes, such
 * as rhombus, ellipse, actor and cylinder will be rendered accurately. This
 * setting is mapped to DIALECT_PREFERHTML.
 * fastest - Almost anything will be rendered in Html. This allows for
 * rectangles, labels and images. This setting is mapped to
 * DIALECT_STRICTHTML.
 * exact - If accurate panning is required and if the diagram is small (up
 * to 100 cells), then this value should be used. In this mode, a group is
 * created that contains the VML. This allows for accurate panning and is
 * mapped to DIALECT_VML.
 *
 * Example:
 *
 * To create a graph inside a DOM node with an id of graph:
 * (code)
 * var container = document.getElementById('graph');
 * var graph = new mxGraph(container);
 * (end)
 *
 * Parameters:
 *
 * container - Optional DOM node that acts as a container for the graph.
 * If this is null then the container can be initialized later using
 * <init>.
 * model - Optional <mxGraphModel> that constitutes the graph data.
 * renderHint - Optional string that specifies the display accuracy and
 * performance. Default is mxConstants.DIALECT_MIXEDHTML (for IE).
 * stylesheet - Optional <mxStylesheet> to be used in the graph.
 */
const Graph = (container, model, _, stylesheet) => {
  /**
   * Variable: mouseListeners
   *
   * Holds the mouse event listeners. See <fireMouseEvent>.
   */
  const [getMouseListeners, setMouseListeners] = addProp();

  /**
   * Variable: isMouseDown
   *
   * Holds the state of the mouse button.
   */
  const [isMouseDown, setMouseDown] = addProp(false);

  /**
   * Variable: model
   *
   * Holds the <mxGraphModel> that contains the cells to be displayed.
   */
  const [getModel, setModel] = addProp();

  /**
   * Variable: view
   *
   * Holds the <mxGraphView> that caches the <mxCellStates> for the cells.
   */
  const [getView, setView] = addProp();

  /**
   * Variable: stylesheet
   *
   * Holds the <mxStylesheet> that defines the appearance of the cells.
   *
   *
   * Example:
   *
   * Use the following code to read a stylesheet into an existing graph.
   *
   * (code)
   * var req = mxUtils.load('stylesheet.xml');
   * var root = req.getDocumentElement();
   * var dec = new mxCodec(root.ownerDocument);
   * dec.decode(root, graph.stylesheet);
   * (end)
   */
  const [getStylesheet, setStylesheet] = addProp();

  /**
   * Variable: selectionModel
   *
   * Holds the <mxGraphSelectionModel> that models the current selection.
   */
  const [getSelectionModel, setSelectionModel] = addProp();

  /**
   * Variable: cellEditor
   *
   * Holds the <mxCellEditor> that is used as the in-place editing.
   */
  const [getCellEditor, setCellEditor] = addProp();

  /**
   * Variable: cellRenderer
   *
   * Holds the <mxCellRenderer> for rendering the cells in the graph.
   */
  const [getCellRenderer, setCellRenderer] = addProp();

  /**
   * Variable: multiplicities
   *
   * An array of <mxMultiplicities> describing the allowed
   * connections in a graph.
   */
  const [getMultiplicities, setMultiplicities] = addProp();

  /**
   * Variable: gridSize
   *
   * Specifies the grid size. Default is 10.
   */
  const [getGridSize, setGridSize] = addProp(10);

  /**
   * Variable: gridEnabled
   *
   * Specifies if the grid is enabled. This is used in <snap>. Default is
   * true.
   */
  const [isGridEnabled, setGridEnabled] = addProp(true);

  /**
   * Variable: portsEnabled
   *
   * Specifies if ports are enabled. This is used in <cellConnected> to update
   * the respective style. Default is true.
   */
  const [isPortsEnabled, setPortsEnabled] = addProp(true);

  /**
   * Variable: nativeDoubleClickEnabled
   *
   * Specifies if native double click events should be detected. Default is true.
   */
  const [isNativeDblClickEnabled, setNativeDblClickEnabled] = addProp(true);

  /**
   * Variable: doubleTapEnabled
   *
   * Specifies if double taps on touch-based devices should be handled as a
   * double click. Default is true.
   */
  const [isDoubleTapEnabled, setDoubleTabEnabled] = addProp(true);

  /**
   * Variable: doubleTapTimeout
   *
   * Specifies the timeout for double taps and non-native double clicks. Default
   * is 500 ms.
   */
  const [getDoubleTapTimeout, setDoubleTapTimeout] = addProp(500);

  /**
   * Variable: doubleTapTolerance
   *
   * Specifies the tolerance for double taps and double clicks in quirks mode.
   * Default is 25 pixels.
   */
  const [getDoubleTapTolerance, setDoubleTapTolerance] = addProp(25);

  /**
   * Variable: lastTouchX
   *
   * Holds the x-coordinate of the last touch event for double tap detection.
   */
  const [getLastTouchX, setLastTouchX] = addProp(0);

  /**
   * Variable: lastTouchX
   *
   * Holds the y-coordinate of the last touch event for double tap detection.
   */
  const [getLastTouchY, setLastTouchY] = addProp(0);

  /**
   * Variable: lastTouchTime
   *
   * Holds the time of the last touch event for double click detection.
   */
  const [getLastTouchTime, setLastTouchTime] = addProp(0);

  /**
   * Variable: tapAndHoldEnabled
   *
   * Specifies if tap and hold should be used for starting connections on touch-based
   * devices. Default is true.
   */
  const [isTapAndHoldEnabled, setTapAndHoldEnabled] = addProp(true);

  /**
   * Variable: tapAndHoldDelay
   *
   * Specifies the time for a tap and hold. Default is 500 ms.
   */
  const [getTapAndHoldDelay, setTapAndHoldDelay] = addProp(500);

  /**
   * Variable: tapAndHoldInProgress
   *
   * True if the timer for tap and hold events is running.
   */
  const [isTapAndHoldInProgress, setTapAndHoldInProgress] = addProp(false);

  /**
   * Variable: tapAndHoldValid
   *
   * True as long as the timer is running and the touch events
   * stay within the given <tapAndHoldTolerance>.
   */
  const [isTapAndHoldValid, setTapAndHoldValid] = addProp(false);

  /**
   * Variable: initialTouchX
   *
   * Holds the x-coordinate of the intial touch event for tap and hold.
   */
  const [getInitialTouchX, setInitialTouchX] = addProp(0);

  /**
   * Variable: initialTouchY
   *
   * Holds the y-coordinate of the intial touch event for tap and hold.
   */
  const [getInitialTouchY, setInitialTouchY] = addProp(0);

  /**
   * Variable: tolerance
   *
   * Tolerance for a move to be handled as a single click.
   * Default is 4 pixels.
   */
  const [getTolerance, setTolerance] = addProp(4);

  /**
   * Variable: defaultOverlap
   *
   * Value returned by <getOverlap> if <isAllowOverlapParent> returns
   * true for the given cell. <getOverlap> is used in <constrainChild> if
   * <isConstrainChild> returns true. The value specifies the
   * portion of the child which is allowed to overlap the parent.
   */
  const [getDefaultOverlap, setDefaultOverlap] = addProp(0.5);

  /**
   * Variable: defaultParent
   *
   * Specifies the default parent to be used to insert new cells.
   * This is used in <getDefaultParent>. Default is null.
   */
  const [_getDefaultParent, setDefaultParent] = addProp();

  /**
   * Variable: alternateEdgeStyle
   *
   * Specifies the alternate edge style to be used if the main control point
   * on an edge is being doubleclicked. Default is null.
   */
  const [getAlternateEdgeStyle, setAlternateEdgeStyle] = addProp();

  /**
   * Variable: backgroundImage
   *
   * Specifies the <mxImage> to be returned by <getBackgroundImage>. Default
   * is null.
   *
   * Example:
   *
   * (code)
   * var img = new mxImage('http://www.example.com/maps/examplemap.jpg', 1024, 768);
   * graph.setBackgroundImage(img);
   * graph.view.validate();
   * (end)
   */
  const [getBackgroundImage, setBackgroundImage] = addProp();

  /**
   * Variable: pageVisible
   *
   * Specifies if the background page should be visible. Default is false.
   * Not yet implemented.
   */
  const [isPageVisible, setPageVisible] = addProp(false);

  /**
   * Variable: pageBreaksVisible
   *
   * Specifies if a dashed line should be drawn between multiple pages. Default
   * is false. If you change this value while a graph is being displayed then you
   * should call <sizeDidChange> to force an update of the display.
   */
  const [isPageBreaksVisible, setPageBreaksVisible] = addProp(false);

  /**
   * Variable: pageBreakColor
   *
   * Specifies the color for page breaks. Default is 'gray'.
   */
  const [getPageBreakColor, setPageBreakColor] = addProp('gray');

  /**
   * Variable: pageBreakDashed
   *
   * Specifies the page breaks should be dashed. Default is true.
   */
  const [isPageBreakDashed, setPageBreakDashed] = addProp(true);

  /**
   * Variable: minPageBreakDist
   *
   * Specifies the minimum distance for page breaks to be visible. Default is
   * 20 (in pixels).
   */
  const [getMinPageBreakDist, setMinPageBreakDist] = addProp(20);

  /**
   * Variable: preferPageSize
   *
   * Specifies if the graph size should be rounded to the next page number in
   * <sizeDidChange>. This is only used if the graph container has scrollbars.
   * Default is false.
   */
  const [isPreferPageSize, setPreferPageSize] = addProp(false);

  /**
   * Variable: pageFormat
   *
   * Specifies the page format for the background page. Default is
   * <mxConstants.PAGE_FORMAT_A4_PORTRAIT>. This is used as the default in
   * <mxPrintPreview> and for painting the background page if <pageVisible> is
   * true and the pagebreaks if <pageBreaksVisible> is true.
   */
  const [getPageFormat, setPageFormat] = addProp(PAGE_FORMAT_A4_PORTRAIT);

  /**
   * Variable: pageScale
   *
   * Specifies the scale of the background page. Default is 1.5.
   * Not yet implemented.
   */
  const [getPageScale, setPageScale] = addProp(1.5);

  /**
   * Variable: enabled
   *
   * Specifies the return value for <isEnabled>. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: escapeEnabled
   *
   * Specifies if <mxKeyHandler> should invoke <escape> when the escape key
   * is pressed. Default is true.
   */
  const [isEscapeEnabled, setEscapeEnabled] = addProp(true);

  /**
   * Variable: invokesStopCellEditing
   *
   * If true, when editing is to be stopped by way of selection changing,
   * data in diagram changing or other means stopCellEditing is invoked, and
   * changes are saved. This is implemented in a focus handler in
   * <mxCellEditor>. Default is true.
   */
  const [isInvokesStopCellEditing, setInvokesStopCellEditing] = addProp(true);

  /**
   * Variable: enterStopsCellEditing
   *
   * If true, pressing the enter key without pressing control or shift will stop
   * editing and accept the new value. This is used in <mxCellEditor> to stop
   * cell editing. Note: You can always use F2 and escape to stop editing.
   * Default is false.
   */
  const [isEnterStopsCellEditing, setEnterStopsCellEditing] = addProp(false);

  /**
   * Variable: useScrollbarsForPanning
   *
   * Specifies if scrollbars should be used for panning in <panGraph> if
   * any scrollbars are available. If scrollbars are enabled in CSS, but no
   * scrollbars appear because the graph is smaller than the container size,
   * then no panning occurs if this is true. Default is true.
   */
  const [isUseScrollBarsForPanning, setUseScrollBarsForPanning] = addProp(true);

  /**
   * Variable: exportEnabled
   *
   * Specifies the return value for <canExportCell>. Default is true.
   */
  const [isExportEnabled, setExportEnabled] = addProp(true);

  /**
   * Variable: importEnabled
   *
   * Specifies the return value for <canImportCell>. Default is true.
   */
  const [isImportEnabled, setImportEnabled] = addProp(true);

  /**
   * Variable: cellsLocked
   *
   * Specifies the return value for <isCellLocked>. Default is false.
   */
  const [isCellsLocked, setCellsLocked] = addProp(false);

  /**
   * Variable: cellsCloneable
   *
   * Specifies the return value for <isCellCloneable>. Default is true.
   */
  const [isCellsCloneable, setCellsCloneable] = addProp(true);

  /**
   * Variable: foldingEnabled
   *
   * Specifies if folding (collapse and expand via an image icon in the graph
   * should be enabled). Default is true.
   */
  const [isFoldingEnabled, setFoldingEnabled] = addProp(true);

  /**
   * Variable: cellsEditable
   *
   * Specifies the return value for <isCellEditable>. Default is true.
   */
  const [isCellsEditable, setCellsEditable] = addProp(true);

  /**
   * Variable: cellsDeletable
   *
   * Specifies the return value for <isCellDeletable>. Default is true.
   */
  const [isCellsDeletable, setCellsDeletable] = addProp(true);

  /**
   * Variable: cellsMovable
   *
   * Specifies the return value for <isCellMovable>. Default is true.
   */
  const [isCellsMovable, setCellsMovable] = addProp(true);

  /**
   * Variable: edgeLabelsMovable
   *
   * Specifies the return value for edges in <isLabelMovable>. Default is true.
   */
  const [isEdgeLabelsMovable, setEdgeLabelsMovable] = addProp(true);

  /**
   * Variable: vertexLabelsMovable
   *
   * Specifies the return value for vertices in <isLabelMovable>. Default is false.
   */
  const [isVertexLabelsMovable, setVertexLabelsMovable] = addProp(false);

  /**
   * Variable: dropEnabled
   *
   * Specifies the return value for <isDropEnabled>. Default is false.
   */
  const [isDropEnabled, setDropEnabled] = addProp(false);

  /**
   * Variable: splitEnabled
   *
   * Specifies if dropping onto edges should be enabled. This is ignored if
   * <dropEnabled> is false. If enabled, it will call <splitEdge> to carry
   * out the drop operation. Default is true.
   */
  const [isSplitEnabled, setSplitEnabled] = addProp(true);

  /**
   * Variable: cellsResizable
   *
   * Specifies the return value for <isCellResizable>. Default is true.
   */
  const [isCellsResizable, setCellsResizable] = addProp(true);

  /**
   * Variable: cellsBendable
   *
   * Specifies the return value for <isCellsBendable>. Default is true.
   */
  const [isCellsBendable, setCellsBendable] = addProp(true);

  /**
   * Variable: cellsSelectable
   *
   * Specifies the return value for <isCellSelectable>. Default is true.
   */
  const [isCellsSelectable, setCellsSelectable] = addProp(true);

  /**
   * Variable: cellsDisconnectable
   *
   * Specifies the return value for <isCellDisconntable>. Default is true.
   */
  const [isCellsDisconnectable, setCellsDisconnectable] = addProp(true);

  /**
   * Variable: autoSizeCells
   *
   * Specifies if the graph should automatically update the cell size after an
   * edit. This is used in <isAutoSizeCell>. Default is false.
   */
  const [isAutoSizeCells, setAutoSizeCells] = addProp(false);

  /**
   * Variable: autoSizeCellsOnAdd
   *
   * Specifies if autoSize style should be applied when cells are added. Default is false.
   */
  const [isAutoSizeCellsOnAdd, setAutoSizeCellsOnAdd] = addProp(false);

  /**
   * Variable: autoScroll
   *
   * Specifies if the graph should automatically scroll if the mouse goes near
   * the container edge while dragging. This is only taken into account if the
   * container has scrollbars. Default is true.
   *
   * If you need this to work without scrollbars then set <ignoreScrollbars> to
   * true. Please consult the <ignoreScrollbars> for details. In general, with
   * no scrollbars, the use of <allowAutoPanning> is recommended.
   */
  const [isAutoScroll, setAutoScroll] = addProp(true);

  /**
   * Variable: ignoreScrollbars
   *
   * Specifies if the graph should automatically scroll regardless of the
   * scrollbars. This will scroll the container using positive values for
   * scroll positions (ie usually only rightwards and downwards). To avoid
   * possible conflicts with panning, set <translateToScrollPosition> to true.
   */
  const [isIgnoreScrollbars, setIgnoreScrollbars] = addProp(false);

  /**
   * Variable: translateToScrollPosition
   *
   * Specifies if the graph should automatically convert the current scroll
   * position to a translate in the graph view when a mouseUp event is received.
   * This can be used to avoid conflicts when using <autoScroll> and
   * <ignoreScrollbars> with no scrollbars in the container.
   */
  const [isTranslateToScrollPosition, setTranslateToScrollPosition] = addProp(
    false
  );

  /**
   * Variable: timerAutoScroll
   *
   * Specifies if autoscrolling should be carried out via mxPanningManager even
   * if the container has scrollbars. This disables <scrollPointToVisible> and
   * uses <mxPanningManager> instead. If this is true then <autoExtend> is
   * disabled. It should only be used with a scroll buffer or when scollbars
   * are visible and scrollable in all directions. Default is false.
   */
  const [isTimerAutoScroll, setTimerAutoScroll] = addProp(false);

  /**
   * Variable: allowAutoPanning
   *
   * Specifies if panning via <panGraph> should be allowed to implement autoscroll
   * if no scrollbars are available in <scrollPointToVisible>. To enable panning
   * inside the container, near the edge, set <mxPanningManager.border> to a
   * positive value. Default is false.
   */
  const [isAllowAutoPanning, setAllowAutoPanning] = addProp(false);

  /**
   * Variable: autoExtend
   *
   * Specifies if the size of the graph should be automatically extended if the
   * mouse goes near the container edge while dragging. This is only taken into
   * account if the container has scrollbars. Default is true. See <autoScroll>.
   */
  const [isAutoExtend, setAutoExtend] = addProp(true);

  /**
   * Variable: maximumGraphBounds
   *
   * <mxRectangle> that specifies the area in which all cells in the diagram
   * should be placed. Uses in <getMaximumGraphBounds>. Use a width or height of
   * 0 if you only want to give a upper, left corner.
   */
  const [getMaximumGraphBounds, setMaximiumGraphBounds] = addProp();

  /**
   * Variable: minimumGraphSize
   *
   * <mxRectangle> that specifies the minimum size of the graph. This is ignored
   * if the graph container has no scrollbars. Default is null.
   */
  const [getMinimumGraphSize, setMinimumGraphSize] = addProp();

  /**
   * Variable: minimumContainerSize
   *
   * <mxRectangle> that specifies the minimum size of the <container> if
   * <resizeContainer> is true.
   */
  const [getMinimumContainerSize, setMinimumContainerSize] = addProp();

  /**
   * Variable: maximumContainerSize
   *
   * <mxRectangle> that specifies the maximum size of the container if
   * <resizeContainer> is true.
   */
  const [getMaximumContainerSize, setMaximumContainerSize] = addProp();

  /**
   * Variable: resizeContainer
   *
   * Specifies if the container should be resized to the graph size when
   * the graph size has changed. Default is false.
   */
  const [isResizeContainer, setResizeContainer] = addProp(false);

  /**
   * Variable: border
   *
   * Border to be added to the bottom and right side when the container is
   * being resized after the graph has been changed. Default is 0.
   */
  const [getBorder, setBorder] = addProp(0);

  /**
   * Variable: keepEdgesInForeground
   *
   * Specifies if edges should appear in the foreground regardless of their order
   * in the model. If <keepEdgesInForeground> and <keepEdgesInBackground> are
   * both true then the normal order is applied. Default is false.
   */
  const [isKeepEdgesInForeground, setKeepEdgesInForeground] = addProp(false);

  /**
   * Variable: keepEdgesInBackground
   *
   * Specifies if edges should appear in the background regardless of their order
   * in the model. If <keepEdgesInForeground> and <keepEdgesInBackground> are
   * both true then the normal order is applied. Default is false.
   */
  const [isKeepEdgesInBackground, setKeepEdgesInBackground] = addProp(false);

  /**
   * Variable: allowNegativeCoordinates
   *
   * Specifies if negative coordinates for vertices are allowed. Default is true.
   */
  const [isAllowNegativeCoordinates, setAllowNegativeCoordinates] = addProp(
    true
  );

  /**
   * Variable: constrainChildren
   *
   * Specifies if a child should be constrained inside the parent bounds after a
   * move or resize of the child. Default is true.
   */
  const [isConstrainChildren, setConstrainChildren] = addProp(true);

  /**
   * Variable: constrainRelativeChildren
   *
   * Specifies if child cells with relative geometries should be constrained
   * inside the parent bounds, if <constrainChildren> is true, and/or the
   * <maximumGraphBounds>. Default is false.
   */
  const [isConstrainRelativeChildren, setConstrainRelativeChildren] = addProp(
    false
  );

  /**
   * Variable: extendParents
   *
   * Specifies if a parent should contain the child bounds after a resize of
   * the child. Default is true. This has precedence over <constrainChildren>.
   */
  const [isExtendParents, setExtendParents] = addProp(true);

  /**
   * Variable: extendParentsOnAdd
   *
   * Specifies if parents should be extended according to the <extendParents>
   * switch if cells are added. Default is true.
   */
  const [isExtendParentsOnAdd, setExtendParentsOnAdd] = addProp(true);

  /**
   * Variable: extendParentsOnAdd
   *
   * Specifies if parents should be extended according to the <extendParents>
   * switch if cells are added. Default is false for backwards compatiblity.
   */
  const [isExtendParentsOnMove, setExtendParentsOnMove] = addProp(false);

  /**
   * Variable: recursiveResize
   *
   * Specifies the return value for <isRecursiveResize>. Default is
   * false for backwards compatiblity.
   */
  const [isRecursiveResize, setRecursiveResize] = addProp(false);

  /**
   * Variable: collapseToPreferredSize
   *
   * Specifies if the cell size should be changed to the preferred size when
   * a cell is first collapsed. Default is true.
   */
  const [isCollapseToPreferredSize, setCollapseToPreferredSize] = addProp(true);

  /**
   * Variable: zoomFactor
   *
   * Specifies the factor used for <zoomIn> and <zoomOut>. Default is 1.2
   * (120%).
   */
  const [getZoomFactor, setZoomFactor] = addProp(1.2);

  /**
   * Variable: keepSelectionVisibleOnZoom
   *
   * Specifies if the viewport should automatically contain the selection cells
   * after a zoom operation. Default is false.
   */
  const [isKeepSelectionVisibleOnZoom, setKeepSelectionVisibleOnZoom] = addProp(
    false
  );

  /**
   * Variable: centerZoom
   *
   * Specifies if the zoom operations should go into the center of the actual
   * diagram rather than going from top, left. Default is true.
   */
  const [isCenterZoom, setCenterZoom] = addProp(true);

  /**
   * Variable: resetViewOnRootChange
   *
   * Specifies if the scale and translate should be reset if the root changes in
   * the model. Default is true.
   */
  const [isResetViewOnRootChange, setResetViewOnRootChange] = addProp(true);

  /**
   * Variable: resetEdgesOnResize
   *
   * Specifies if edge control points should be reset after the resize of a
   * connected cell. Default is false.
   */
  const [isResetEdgesOnResize, setResetEdgesOnResize] = addProp(false);

  /**
   * Variable: resetEdgesOnMove
   *
   * Specifies if edge control points should be reset after the move of a
   * connected cell. Default is false.
   */
  const [isResetEdgesOnMove, setResetEdgesOnMove] = addProp(false);

  /**
   * Variable: resetEdgesOnConnect
   *
   * Specifies if edge control points should be reset after the the edge has been
   * reconnected. Default is true.
   */
  const [isResetEdgesOnConnect, setResetEdgesOnConnect] = addProp(true);

  /**
   * Variable: allowLoops
   *
   * Specifies if loops (aka self-references) are allowed. Default is false.
   */
  const [isAllowLoops, setAllowLoops] = addProp(false);

  /**
   * Variable: defaultLoopStyle
   *
   * <mxEdgeStyle> to be used for loops. This is a fallback for loops if the
   * <mxConstants.STYLE_LOOP> is undefined. Default is <mxEdgeStyle.Loop>.
   */
  const [getDefaultLoopStyle, setDefaultLoopStyle] = addProp(EdgeStyle.Loop);

  /**
   * Variable: multigraph
   *
   * Specifies if multiple edges in the same direction between the same pair of
   * vertices are allowed. Default is true.
   */
  const [isMultigraph, setMultigraph] = addProp(true);

  /**
   * Variable: connectableEdges
   *
   * Specifies if edges are connectable. Default is false. This overrides the
   * connectable field in edges.
   */
  const [isConnectableEdges, setConnectableEdges] = addProp(false);

  /**
   * Variable: allowDanglingEdges
   *
   * Specifies if edges with disconnected terminals are allowed in the graph.
   * Default is true.
   */
  const [isAllowDanglingEdges, setAllowDanglingEdges] = addProp(true);

  /**
   * Variable: cloneInvalidEdges
   *
   * Specifies if edges that are cloned should be validated and only inserted
   * if they are valid. Default is true.
   */
  const [isCloneInvalidEdges, setCloneInvalidEdges] = addProp(false);

  /**
   * Variable: disconnectOnMove
   *
   * Specifies if edges should be disconnected from their terminals when they
   * are moved. Default is true.
   */
  const [isDisconnectOnMove, setDisconnectOnMove] = addProp(true);

  /**
   * Variable: labelsVisible
   *
   * Specifies if labels should be visible. This is used in <getLabel>. Default
   * is true.
   */
  const [isLabelsVisible, setLabelsVisible] = addProp(true);

  /**
   * Variable: htmlLabels
   *
   * Specifies the return value for <isHtmlLabel>. Default is false.
   */
  const [isHtmlLabels, setHtmlLabels] = addProp(false);

  /**
   * Variable: swimlaneSelectionEnabled
   *
   * Specifies if swimlanes should be selectable via the content if the
   * mouse is released. Default is true.
   */
  const [isSwimlaneSelectionEnabled, setSwimlaneSelectionEnabled] = addProp(
    true
  );

  /**
   * Variable: swimlaneNesting
   *
   * Specifies if nesting of swimlanes is allowed. Default is true.
   */
  const [isSwimlaneNesting, setSwimlaneNesting] = addProp(true);

  /**
   * Variable: swimlaneIndicatorColorAttribute
   *
   * The attribute used to find the color for the indicator if the indicator
   * color is set to 'swimlane'. Default is <mxConstants.STYLE_FILLCOLOR>.
   */
  const [
    getSwimlaneIndicatorColorAttribute,
    setSwimlaneIndicatorColorAttribute
  ] = addProp(STYLE_FILLCOLOR);

  /**
   * Variable: imageBundles
   *
   * Holds the list of image bundles.
   */
  const [getImageBundles, setImageBundles] = addProp();

  /**
   * Variable: minFitScale
   *
   * Specifies the minimum scale to be applied in <fit>. Default is 0.1. Set this
   * to null to allow any value.
   */
  const [getMinFitScale, setMinFitScale] = addProp(0.1);

  /**
   * Variable: maxFitScale
   *
   * Specifies the maximum scale to be applied in <fit>. Default is 8. Set this
   * to null to allow any value.
   */
  const [getMaxFitScale, setMaxFitScale] = addProp(8);

  /**
   * Variable: panDx
   *
   * Current horizontal panning value. Default is 0.
   */
  const [getPanDx, setPanDx] = addProp(0);

  /**
   * Variable: panDy
   *
   * Current vertical panning value. Default is 0.
   */
  const [getPanDy, setPanDy] = addProp(0);

  /**
   * Variable: collapsedImage
   *
   * Specifies the <mxImage> to indicate a collapsed state.
   * Default value is mximageBasePath + '/collapsed.gif'
   */
  const [getCollapsedImage, setCollapsedImage] = addProp(
    Image(imageBasePath + '/collapsed.gif', 9, 9)
  );

  /**
   * Variable: expandedImage
   *
   * Specifies the <mxImage> to indicate a expanded state.
   * Default value is mximageBasePath + '/expanded.gif'
   */
  const [getExpandedImage, setExpandedImage] = addProp(
    Image(imageBasePath + '/expanded.gif', 9, 9)
  );

  /**
   * Variable: warningImage
   *
   * Specifies the <mxImage> for the image to be used to display a warning
   * overlay. See <setCellWarning>. Default value is mximageBasePath +
   * '/warning'.  The extension for the image depends on the platform. It is
   * '.png' on the Mac and '.gif' on all other platforms.
   */
  const [getWarningImage, setWarningImage] = addProp(
    Image(imageBasePath + '/warning.png', 16, 16)
  );
  const [getContainer, setContainer] = addProp();
  const [getShiftPreview1, setShiftPreview1] = addProp();
  const [getShiftPreview2, setShiftPreview2] = addProp();
  const [getMouseMoveRedirect, setMouseMoveRedirect] = addProp();
  const [getMouseUpRedirect, setMouseUpRedirect] = addProp();
  const [getEventSource, setEventSource] = addProp();

  // Adds a graph model listener to update the view
  const [
    getGraphModelChangeListener,
    setGraphModelChangeListener
  ] = addProp((sender, evt) =>
    graphModelChanged(evt.getProperty('edit').getChanges())
  );

  const [getTooltipHandler, setTooltipHandler] = addProp();
  const [getSelectionCellsHandler, setSelectionCellsHandler] = addProp();
  const [getConnectionHandler, setConnectionHandler] = addProp();
  const [getGraphHandler, setGraphHandler] = addProp();
  const [getPanningHandler, setPanningHandler] = addProp();
  const [getPopupMenuHandler, setPopupMenuHandler] = addProp();
  const [getHorizontalPageBreaks, setHorizontalPageBreaks] = addProp();
  const [getVerticalPageBreaks, setVerticalPageBreaks] = addProp();
  const [getLastEvent, setLastEvent] = addProp();
  const [isIgnoreMouseEvents, setIgnoreMouseEvents] = addProp(false);
  const [isMouseTrigger, setMouseTrigger] = addProp(false);

  /**
   * Function: init
   *
   * Initializes the <container> and creates the respective datastructures.
   *
   * Parameters:
   *
   * container - DOM node that will contain the graph display.
   */
  const init = (container) => {
    setContainer(container);

    // Initializes the in-place editor
    setCellEditor(createCellEditor());

    // Initializes the container using the view
    getView().init();

    // Updates the size of the container for the current graph
    sizeDidChange();

    // Hides tooltips and resets tooltip timer if mouse leaves container
    Event.addListener(container, 'mouseleave', (evt) => {
      if (
        isSet(getTooltipHandler()) &&
        isSet(getTooltipHandler().getDiv()) &&
        getTooltipHandler().getDiv() !== evt.relatedTarget
      ) {
        getTooltipHandler().hide();
      }
    });
  };

  /**
   * Function: createHandlers
   *
   * Creates the tooltip-, panning-, connection- and graph-handler (in this
   * order). This is called in the constructor before <init> is called.
   */
  const createHandlers = () => {
    setTooltipHandler(createTooltipHandler());
    getTooltipHandler().setEnabled(false);
    setSelectionCellsHandler(createSelectionCellsHandler());
    setConnectionHandler(createConnectionHandler());
    getConnectionHandler().setEnabled(false);
    setGraphHandler(createGraphHandler());
    setPanningHandler(createPanningHandler());
    getPanningHandler().setPanningEnabled(false);
    setPopupMenuHandler(createPopupMenuHandler());
  };

  /**
   * Function: createTooltipHandler
   *
   * Creates and returns a new <mxTooltipHandler> to be used in this graph.
   */
  const createTooltipHandler = () => TooltipHandler(me);

  /**
   * Function: createSelectionCellsHandler
   *
   * Creates and returns a new <mxTooltipHandler> to be used in this graph.
   */
  const createSelectionCellsHandler = () => SelectionCellsHandler(me);

  /**
   * Function: createConnectionHandler
   *
   * Creates and returns a new <mxConnectionHandler> to be used in this graph.
   */
  const createConnectionHandler = () => ConnectionHandler(me);

  /**
   * Function: createGraphHandler
   *
   * Creates and returns a new <mxGraphHandler> to be used in this graph.
   */
  const createGraphHandler = () => GraphHandler(me);

  /**
   * Function: createPanningHandler
   *
   * Creates and returns a new <mxPanningHandler> to be used in this graph.
   */
  const createPanningHandler = () => PanningHandler(me);

  /**
   * Function: createPopupMenuHandler
   *
   * Creates and returns a new <mxPopupMenuHandler> to be used in this graph.
   */
  const createPopupMenuHandler = () => PopupMenuHandler(me);

  /**
   * Function: createSelectionModel
   *
   * Creates a new <mxGraphSelectionModel> to be used in this graph.
   */
  const createSelectionModel = () => GraphSelectionModel(me);

  /**
   * Function: createStylesheet
   *
   * Creates a new <mxGraphSelectionModel> to be used in this graph.
   */
  const createStylesheet = () => Stylesheet(me);

  /**
   * Function: createGraphView
   *
   * Creates a new <mxGraphView> to be used in this graph.
   */
  const createGraphView = () => GraphView(me);

  /**
   * Function: createCellRenderer
   *
   * Creates a new <mxCellRenderer> to be used in this graph.
   */
  const createCellRenderer = () => CellRenderer(me);

  /**
   * Function: createCellEditor
   *
   * Creates a new <mxCellEditor> to be used in this graph.
   */
  const createCellEditor = () => CellEditor(me);

  /**
   * Function: getSelectionCellsForChanges
   *
   * Returns the cells to be selected for the given array of changes.
   *
   * Parameters:
   *
   * ignoreFn - Optional function that takes a change and returns true if the
   * change should be ignored.
   *
   */
  const getSelectionCellsForChanges = (changes, ignoreFn) => {
    const model = getModel();
    const dict = Dictionary();
    const cells = [];

    const addCell = (cell) => {
      if (!dict.get(cell) && model.contains(cell)) {
        if (model.isEdge(cell) || model.isVertex(cell)) {
          dict.put(cell, true);
          cells.push(cell);
        } else {
          const childCount = model.getChildCount(cell);

          for (let i = 0; i < childCount; i++) {
            addCell(model.getChildAt(cell, i));
          }
        }
      }
    };

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];

      if (
        change.constructor !== RootChange &&
        (isUnset(ignoreFn) || !ignoreFn(change))
      ) {
        let cell;

        if (change.constructor === ChildChange) {
          cell = change.getChild();
        } else if (
          isSet(change.getCell()) &&
          change.getCell().constructor === Cell
        ) {
          cell = change.getCell();
        }

        if (isSet(cell)) {
          addCell(cell);
        }
      }
    }

    return cells;
  };

  /**
   * Function: graphModelChanged
   *
   * Called when the graph model changes. Invokes <processChange> on each
   * item of the given array to update the view accordingly.
   *
   * Parameters:
   *
   * changes - Array that contains the individual changes.
   */
  const graphModelChanged = (changes) => {
    for (let i = 0; i < changes.length; i++) {
      processChange(changes[i]);
    }

    updateSelection();
    getView().validate();
    sizeDidChange();
  };

  /**
   * Function: updateSelection
   *
   * Removes selection cells that are not in the model from the selection.
   */
  const updateSelection = () => {
    const model = getModel();
    const cells = getSelectionCells();
    const removed = [];

    for (let i = 0; i < cells.length; i++) {
      if (!model.contains(cells[i]) || !isCellVisible(cells[i])) {
        removed.push(cells[i]);
      } else {
        let par = model.getParent(cells[i]);

        while (isSet(par) && par !== getView().getCurrentRoot()) {
          if (isCellCollapsed(par) || !isCellVisible(par)) {
            removed.push(cells[i]);
            break;
          }

          par = model.getParent(par);
        }
      }
    }

    removeSelectionCells(removed);
  };

  /**
   * Function: processChange
   *
   * Processes the given change and invalidates the respective cached data
   * in <view>. This fires a <root> event if the root has changed in the
   * model.
   *
   * Parameters:
   *
   * change - Object that represents the change on the model.
   */
  const processChange = (change) => {
    const view = getView();

    // Resets the view settings, removes all cells and clears
    // the selection if the root changes.
    if (change.constructor === RootChange) {
      clearSelection();
      setDefaultParent();
      removeStateForCell(change.getPrevious());

      if (isResetViewOnRootChange()) {
        view.setScale(1);
        view.getTranslate().setX(0);
        view.getTranslate().setY(0);
      }

      fireEvent(EventObject(Event.ROOT));
    }

    // Adds or removes a child to the view by online invaliding
    // the minimal required portions of the cache, namely, the
    // old and new parent and the child.
    else if (change.constructor === ChildChange) {
      const child = change.getChild();
      const newParent = getModel().getParent(child);
      view.invalidate(child, true, true);

      if (!getModel().contains(newParent) || isCellCollapsed(newParent)) {
        view.invalidate(child, true, true);
        removeStateForCell(child);

        // Handles special case of current root of view being removed
        if (view.getCurrentRoot() === child) {
          home();
        }
      }

      const previous = change.getPrevious();

      if (newParent !== previous) {
        // Refreshes the collapse/expand icons on the parents
        if (isSet(newParent)) {
          view.invalidate(newParent, false, false);
        }

        if (isSet(previous)) {
          view.invalidate(previous, false, false);
        }
      }
    }

    // Handles two special cases where the shape does not need to be
    // recreated from scratch, it only needs to be invalidated.
    else if (
      change.constructor === TerminalChange ||
      change.constructor === GeometryChange
    ) {
      // Checks if the geometry has changed to avoid unnessecary revalidation
      if (
        change.constructor === TerminalChange ||
        (isUnset(change.getPrevious()) && isSet(change.getGeometry())) ||
        (isSet(change.getPrevious()) &&
          !change.getPrevious().equals(change.getGeometry()))
      ) {
        view.invalidate(change.getCell());
      }
    }

    // Handles two special cases where only the shape, but no
    // descendants need to be recreated
    else if (change.constructor === ValueChange) {
      view.invalidate(change.getCell(), false, false);
    }

    // Requires a new mxShape in JavaScript
    else if (change.constructor === StyleChange) {
      view.invalidate(change.getCell(), true, true);
      const state = view.getState(change.getCell());

      if (isSet(state)) {
        state.setInvalidStyle(true);
      }
    }

    // Removes the state from the cache by default
    else if (isSet(change.getCell()) && change.getCell().constructor === Cell) {
      removeStateForCell(change.getCell());
    }
  };

  /**
   * Function: removeStateForCell
   *
   * Removes all cached information for the given cell and its descendants.
   * This is called when a cell was removed from the model.
   *
   * Paramters:
   *
   * cell - <mxCell> that was removed from the model.
   */
  const removeStateForCell = (cell) => {
    const childCount = getModel().getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      removeStateForCell(getModel().getChildAt(cell, i));
    }

    getView().invalidate(cell, false, true);
    getView().removeState(cell);
  };

  /**
   * Group: Overlays
   */

  /**
   * Function: addCellOverlay
   *
   * Adds an <mxCellOverlay> for the specified cell. This method fires an
   * <addoverlay> event and returns the new <mxCellOverlay>.
   *
   * Parameters:
   *
   * cell - <mxCell> to add the overlay for.
   * overlay - <mxCellOverlay> to be added for the cell.
   */
  const addCellOverlay = (cell, overlay) => {
    if (isUnset(cell.getOverlays())) {
      cell.setOverlays([]);
    }

    cell.getOverlays().push(overlay);

    const state = getView().getState(cell);

    // Immediately updates the cell display if the state exists
    if (isSet(state)) {
      getCellRenderer().redraw(state);
    }

    fireEvent(EventObject(Event.ADD_OVERLAY, 'cell', cell, 'overlay', overlay));

    return overlay;
  };

  /**
   * Function: getCellOverlays
   *
   * Returns the array of <mxCellOverlays> for the given cell or null, if
   * no overlays are defined.
   *
   * Parameters:
   *
   * cell - <mxCell> whose overlays should be returned.
   */
  const getCellOverlays = (cell) => cell.getOverlays();

  /**
   * Function: removeCellOverlay
   *
   * Removes and returns the given <mxCellOverlay> from the given cell. This
   * method fires a <removeoverlay> event. If no overlay is given, then all
   * overlays are removed using <removeOverlays>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose overlay should be removed.
   * overlay - Optional <mxCellOverlay> to be removed.
   */
  const removeCellOverlay = (cell, overlay) => {
    if (isUnset(overlay)) {
      removeCellOverlays(cell);
    } else {
      const index = cell.getOverlays().indexOf(overlay);

      if (index >= 0) {
        cell.getOverlays().splice(index, 1);

        if (cell.getOverlays().length === 0) {
          cell.setOverlays();
        }

        // Immediately updates the cell display if the state exists
        const state = getView().getState(cell);

        if (isSet(state)) {
          getCellRenderer().redraw(state);
        }

        fireEvent(
          EventObject(Event.REMOVE_OVERLAY, 'cell', cell, 'overlay', overlay)
        );
      } else {
        overlay = undefined;
      }
    }

    return overlay;
  };

  /**
   * Function: removeCellOverlays
   *
   * Removes all <mxCellOverlays> from the given cell. This method
   * fires a <removeoverlay> event for each <mxCellOverlay> and returns
   * the array of <mxCellOverlays> that was removed from the cell.
   *
   * Parameters:
   *
   * cell - <mxCell> whose overlays should be removed
   */
  const removeCellOverlays = (cell) => {
    const overlays = cell.getOverlays();

    if (isSet(overlays)) {
      cell.setOverlays();

      // Immediately updates the cell display if the state exists
      const state = getView().getState(cell);

      if (isSet(state)) {
        getCellRenderer().redraw(state);
      }

      for (let i = 0; i < overlays.length; i++) {
        fireEvent(
          EventObject(
            Event.REMOVE_OVERLAY,
            'cell',
            cell,
            'overlay',
            overlays[i]
          )
        );
      }
    }

    return overlays;
  };

  /**
   * Function: clearCellOverlays
   *
   * Removes all <mxCellOverlays> in the graph for the given cell and all its
   * descendants. If no cell is specified then all overlays are removed from
   * the graph. This implementation uses <removeCellOverlays> to remove the
   * overlays from the individual cells.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> that represents the root of the subtree to
   * remove the overlays from. Default is the root in the model.
   */
  const clearCellOverlays = (cell = getModel().getRoot()) => {
    removeCellOverlays(cell);

    // Recursively removes all overlays from the children
    const childCount = getModel().getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      const child = getModel().getChildAt(cell, i);
      clearCellOverlays(child); // recurse
    }
  };

  /**
   * Function: setCellWarning
   *
   * Creates an overlay for the given cell using the warning and image or
   * <warningImage> and returns the new <mxCellOverlay>. The warning is
   * displayed as a tooltip in a red font and may contain HTML markup. If
   * the warning is null or a zero length string, then all overlays are
   * removed from the cell.
   *
   * Example:
   *
   * (code)
   * graph.setCellWarning(cell, '<b>Warning:</b>: Hello, World!');
   * (end)
   *
   * Parameters:
   *
   * cell - <mxCell> whose warning should be set.
   * warning - String that represents the warning to be displayed.
   * img - Optional <mxImage> to be used for the overlay. Default is
   * <warningImage>.
   * isSelect - Optional boolean indicating if a click on the overlay
   * should select the corresponding cell. Default is false.
   */
  const setCellWarning = (cell, warning, img = getWarningImage(), isSelect) => {
    if (isSet(warning) && warning.length > 0) {
      // Creates the overlay with the image and warning
      const overlay = CellOverlay(
        img,
        '<font color=red>' + warning + '</font>'
      );

      // Adds a handler for single mouseclicks to select the cell
      if (isSelect) {
        overlay.addListener(Event.CLICK, () => {
          if (isEnabled()) {
            setSelectionCell(cell);
          }
        });
      }

      // Sets and returns the overlay in the graph
      return addCellOverlay(cell, overlay);
    } else {
      removeCellOverlays(cell);
    }

    return;
  };

  /**
   * Group: In-place editing
   */

  /**
   * Function: startEditing
   *
   * Calls <startEditingAtCell> using the given cell or the first selection
   * cell.
   *
   * Parameters:
   *
   * evt - Optional mouse event that triggered the editing.
   */
  const startEditing = (evt) => startEditingAtCell(undefined, evt);

  /**
   * Function: startEditingAtCell
   *
   * Fires a <startEditing> event and invokes <mxCellEditor.startEditing>
   * on <editor>. After editing was started, a <editingStarted> event is
   * fired.
   *
   * Parameters:
   *
   * cell - <mxCell> to start the in-place editor for.
   * evt - Optional mouse event that triggered the editing.
   */
  const startEditingAtCell = (cell, evt) => {
    if (isUnset(evt) || !Event.isMultiTouchEvent(evt)) {
      if (isUnset(cell)) {
        cell = getSelectionCell();

        if (isSet(cell) && !isCellEditable(cell)) {
          cell = undefined;
        }
      }

      if (isSet(cell)) {
        fireEvent(EventObject(Event.START_EDITING, 'cell', cell, 'event', evt));
        getCellEditor().startEditing(cell, evt);
        fireEvent(
          EventObject(Event.EDITING_STARTED, 'cell', cell, 'event', evt)
        );
      }
    }
  };

  /**
   * Function: getEditingValue
   *
   * Returns the initial value for in-place editing. This implementation
   * returns <convertValueToString> for the given cell. If this function is
   * overridden, then <mxGraphModel.valueForCellChanged> should take care
   * of correctly storing the actual new value inside the user object.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the initial editing value should be returned.
   * evt - Optional mouse event that triggered the editor.
   */
  const getEditingValue = (cell, evt) => convertValueToString(cell);

  /**
   * Function: stopEditing
   *
   * Stops the current editing  and fires a <editingStopped> event.
   *
   * Parameters:
   *
   * cancel - Boolean that specifies if the current editing value
   * should be stored.
   */
  const stopEditing = (cancel) => {
    getCellEditor().stopEditing(cancel);
    fireEvent(EventObject(Event.EDITING_STOPPED, 'cancel', cancel));
  };

  /**
   * Function: labelChanged
   *
   * Sets the label of the specified cell to the given value using
   * <cellLabelChanged> and fires <mxEvent.LABEL_CHANGED> while the
   * transaction is in progress. Returns the cell whose label was changed.
   *
   * Parameters:
   *
   * cell - <mxCell> whose label should be changed.
   * value - New label to be assigned.
   * evt - Optional event that triggered the change.
   */
  const labelChanged = (cell, value, evt) => {
    getModel().beginUpdate();

    try {
      const old = cell.getValue();
      cellLabelChanged(cell, value, isAutoSizeCell(cell));
      fireEvent(
        EventObject(
          Event.LABEL_CHANGED,
          'cell',
          cell,
          'value',
          value,
          'old',
          old,
          'event',
          evt
        )
      );
    } finally {
      getModel().endUpdate();
    }

    return cell;
  };

  /**
   * Function: cellLabelChanged
   *
   * Sets the new label for a cell. If autoSize is true then
   * <cellSizeUpdated> will be called.
   *
   * In the following example, the function is extended to map changes to
   * attributes in an XML node, as shown in <convertValueToString>.
   * Alternatively, the handling of this can be implemented as shown in
   * <mxGraphModel.valueForCellChanged> without the need to clone the
   * user object.
   *
   * (code)
   * var graphCellLabelChanged = graph.cellLabelChanged;
   * graph.cellLabelChanged = function(cell, newValue, autoSize)
   * {
   * 	// Cloned for correct undo/redo
   * 	var elt = cell.value.cloneNode(true);
   *  elt.setAttribute('label', newValue);
   *
   *  newValue = elt;
   *  graphCellLabelChanged.apply(this, arguments);
   * };
   * (end)
   *
   * Parameters:
   *
   * cell - <mxCell> whose label should be changed.
   * value - New label to be assigned.
   * autoSize - Boolean that specifies if <cellSizeUpdated> should be called.
   */
  const cellLabelChanged = (cell, value, autoSize) => {
    getModel().beginUpdate();
    try {
      getModel().setValue(cell, value);

      if (autoSize) {
        cellSizeUpdated(cell, false);
      }
    } finally {
      getModel().endUpdate();
    }
  };

  /**
   * Function: escape
   *
   * Processes an escape keystroke.
   *
   * Parameters:
   *
   * evt - Mouseevent that represents the keystroke.
   */
  const escape = (evt) => fireEvent(EventObject(Event.ESCAPE, 'event', evt));

  /**
   * Function: click
   *
   * Processes a singleclick on an optional cell and fires a <click> event.
   * The click event is fired initially. If the graph is enabled and the
   * event has not been consumed, then the cell is selected using
   * <selectCellForEvent> or the selection is cleared using
   * <clearSelection>. The events consumed state is set to true if the
   * corresponding <mxMouseEvent> has been consumed.
   *
   * To handle a click event, use the following code.
   *
   * (code)
   * graph.addListener(mxEvent.CLICK, function(sender, evt)
   * {
   *   var e = evt.getProperty('event'); // mouse event
   *   var cell = evt.getProperty('cell'); // cell may be null
   *
   *   if (cell != null)
   *   {
   *     // Do something useful with cell and consume the event
   *     evt.consume();
   *   }
   * });
   * (end)
   *
   * Parameters:
   *
   * me - <mxMouseEvent> that represents the single click.
   */
  const click = (mE) => {
    const evt = mE.getEvent();
    let cell = mE.getCell();
    const mxe = EventObject(Event.CLICK, 'event', evt, 'cell', cell);

    if (mE.isConsumed()) {
      mxe.consume();
    }

    fireEvent(mxe);

    if (isEnabled() && !Event.isConsumed(evt) && !mxe.isConsumed()) {
      if (isSet(cell)) {
        if (isTransparentClickEvent(evt)) {
          let active = false;

          const tmp = getCellAt(
            mE.getGraphX(),
            mE.getGraphY(),
            undefined,
            undefined,
            undefined,
            (state) => {
              const selected = isCellSelected(state.getCell());
              active = active || selected;

              return (
                !active ||
                selected ||
                (state.getCell() !== cell &&
                  getModel().isAncestor(state.getCell(), cell))
              );
            }
          );

          if (isSet(tmp)) {
            cell = tmp;
          }
        }
      } else if (isSwimlaneSelectionEnabled()) {
        cell = getSwimlaneAt(mE.getGraphX(), mE.getGraphY());

        if (isSet(cell) && (!isToggleEvent(evt) || !Event.isAltDown(evt))) {
          let temp = cell;
          const swimlanes = [];

          while (isSet(temp)) {
            temp = getModel().getParent(temp);
            const state = getView().getState(temp);

            if (isSwimlane(temp) && isSet(state)) {
              swimlanes.push(temp);
            }
          }

          // Selects ancestors for selected swimlanes
          if (swimlanes.length > 0) {
            swimlanes = swimlanes.reverse();
            swimlanes.splice(0, 0, cell);
            swimlanes.push(cell);

            for (let i = 0; i < swimlanes.length - 1; i++) {
              if (isCellSelected(swimlanes[i])) {
                cell = swimlanes[isToggleEvent(evt) ? i : i + 1];
              }
            }
          }
        }
      }

      if (isSet(cell)) {
        selectCellForEvent(cell, evt);
      } else if (!isToggleEvent(evt)) {
        clearSelection();
      }
    }
  };

  /**
   * Function: isSiblingSelected
   *
   * Returns true if any sibling of the given cell is selected.
   */
  const isSiblingSelected = (cell) => {
    const model = getModel();
    const parent = model.getParent(cell);
    const childCount = model.getChildCount(parent);

    for (let i = 0; i < childCount; i++) {
      const child = model.getChildAt(parent, i);

      if (cell !== child && isCellSelected(child)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Function: dblClick
   *
   * Processes a doubleclick on an optional cell and fires a <dblclick>
   * event. The event is fired initially. If the graph is enabled and the
   * event has not been consumed, then <edit> is called with the given
   * cell. The event is ignored if no cell was specified.
   *
   * Example for overriding this method.
   *
   * (code)
   * graph.dblClick = function(evt, cell)
   * {
   *   var mxe = new mxEventObject(mxEvent.DOUBLE_CLICK, 'event', evt, 'cell', cell);
   *   this.fireEvent(mxe);
   *
   *   if (this.isEnabled() && !mxEvent.isConsumed(evt) && !mxe.isConsumed())
   *   {
   * 	   mxUtils.alert('Hello, World!');
   *     mxe.consume();
   *   }
   * }
   * (end)
   *
   * Example listener for this event.
   *
   * (code)
   * graph.addListener(mxEvent.DOUBLE_CLICK, function(sender, evt)
   * {
   *   var cell = evt.getProperty('cell');
   *   // do something with the cell and consume the
   *   // event to prevent in-place editing from start
   * });
   * (end)
   *
   * Parameters:
   *
   * evt - Mouseevent that represents the doubleclick.
   * cell - Optional <mxCell> under the mousepointer.
   */
  const dblClick = (evt, cell) => {
    const mxe = EventObject(Event.DOUBLE_CLICK, 'event', evt, 'cell', cell);
    fireEvent(mxe);

    // Handles the event if it has not been consumed
    if (
      isEnabled() &&
      !Event.isConsumed(evt) &&
      !mxe.isConsumed() &&
      isSet(cell) &&
      isCellEditable(cell) &&
      !isEditing(cell)
    ) {
      startEditingAtCell(cell, evt);
      Event.consume(evt);
    }
  };

  /**
   * Function: tapAndHold
   *
   * Handles the <mxMouseEvent> by highlighting the <mxCellState>.
   *
   * Parameters:
   *
   * me - <mxMouseEvent> that represents the touch event.
   * state - Optional <mxCellState> that is associated with the event.
   */
  const tapAndHold = (mE) => {
    const evt = mE.getEvent();
    const mxe = EventObject(
      Event.TAP_AND_HOLD,
      'event',
      evt,
      'cell',
      mE.getCell()
    );

    // LATER: Check if event should be consumed if me is consumed
    fireEvent(mxe);

    if (mxe.isConsumed()) {
      // Resets the state of the panning handler
      getPanningHandler().setPanningTrigger(false);
    }

    // Handles the event if it has not been consumed
    if (
      isEnabled() &&
      !Event.isConsumed(evt) &&
      !mxe.isConsumed() &&
      getConnectionHandler().isEnabled()
    ) {
      const connectionHandler = getConnectionHandler();
      const marker = connectionHandler.getMarker();
      const state = getView().getState(marker.getCell(mE));

      if (isSet(state)) {
        marker.setCurrentColor(marker.getValidColor());
        marker.setMarkedState(state);
        marker.mark();

        connectionHandler.setFirst(Point(mE.getGraphX(), mE.getGraphY()));
        connectionHandler.setEdgeState(connectionHandler.createEdgeState(mE));
        connectionHandler.setPrevious(state);
        connectionHandler.fireEvent(
          EventObject(Event.START, 'state', connectionHandler.getPrevious())
        );
      }
    }
  };

  /**
   * Function: scrollPointToVisible
   *
   * Scrolls the graph to the given point, extending the graph container if
   * specified.
   */
  const scrollPointToVisible = (x, y, extend, border = 20) => {
    if (
      !isTimerAutoScroll() &&
      (isIgnoreScrollbars() || hasScrollbars(getContainer()))
    ) {
      const c = getContainer();

      if (
        x >= c.scrollLeft &&
        y >= c.scrollTop &&
        x <= c.scrollLeft + c.clientWidth &&
        y <= c.scrollTop + c.clientHeight
      ) {
        const dx = c.scrollLeft + c.clientWidth - x;

        if (dx < border) {
          const old = c.scrollLeft;
          c.scrollLeft += border - dx;

          // Automatically extends the canvas size to the bottom, right
          // if the event is outside of the canvas and the edge of the
          // canvas has been reached. Notes: Needs fix for IE.
          if (extend && old === c.scrollLeft) {
            const root = getView().getDrawPane().ownerSVGElement;
            const width = c.scrollWidth + border - dx;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            root.style.setWidth(width + 'px');

            c.scrollLeft += border - dx;
          }
        } else {
          dx = x - c.scrollLeft;

          if (dx < border) {
            c.scrollLeft -= border - dx;
          }
        }

        const dy = c.scrollTop + c.clientHeight - y;

        if (dy < border) {
          const old = c.scrollTop;
          c.scrollTop += border - dy;

          if (old === c.scrollTop && extend) {
            const root = getView().getDrawPane().ownerSVGElement;
            const height = c.scrollHeight + border - dy;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            root.style.height = height + 'px';

            c.scrollTop += border - dy;
          }
        } else {
          dy = y - c.scrollTop;

          if (dy < border) {
            c.scrollTop -= border - dy;
          }
        }
      }
    } else if (isAllowAutoPanning() && !getPanningHandler().isActive()) {
      if (isUnset(getPanningManager())) {
        setPanningManager(createPanningManager());
      }

      getPanningManager().panTo(x + getPanDx(), y + getPanDy());
    }
  };

  /**
   * Function: createPanningManager
   *
   * Creates and returns an <mxPanningManager>.
   */
  const createPanningManager = () => PanningManager(me);

  /**
   * Function: getBorderSizes
   *
   * Returns the size of the border and padding on all four sides of the
   * container. The left, top, right and bottom borders are stored in the x, y,
   * width and height of the returned <mxRectangle>, respectively.
   */
  const getBorderSizes = () => {
    const css = getCurrentStyle(getContainer());

    return Rectangle(
      parseCssNumber(css.paddingLeft) +
        (css.borderLeftStyle !== 'none'
          ? parseCssNumber(css.borderLeftWidth)
          : 0),
      parseCssNumber(css.paddingTop) +
        (css.borderTopStyle !== 'none'
          ? parseCssNumber(css.borderTopWidth)
          : 0),
      parseCssNumber(css.paddingRight) +
        (css.borderRightStyle !== 'none'
          ? parseCssNumber(css.borderRightWidth)
          : 0),
      parseCssNumber(css.paddingBottom) +
        (css.borderBottomStyle !== 'none'
          ? parseCssNumber(css.borderBottomWidth)
          : 0)
    );
  };

  /**
   * Function: getPreferredPageSize
   *
   * Returns the preferred size of the background page if <preferPageSize> is true.
   */
  const getPreferredPageSize = (bounds, width, height) => {
    const tr = getView().getTranslate();
    const fmt = getPageFormat();
    const ps = getPageScale();
    const page = Rectangle(
      0,
      0,
      Math.ceil(fmt.getWidth() * ps),
      Math.ceil(fmt.getHeight() * ps)
    );

    const hCount = isPageBreaksVisible()
      ? Math.ceil(width / page.getWidth())
      : 1;
    const vCount = isPageBreaksVisible()
      ? Math.ceil(height / page.getHeight())
      : 1;

    return Rectangle(
      0,
      0,
      hCount * page.getWidth() + 2 + tr.getX(),
      vCount * page.getHeight() + 2 + tr.getY()
    );
  };

  /**
   * Function: fit
   *
   * Scales the graph such that the complete diagram fits into <container> and
   * returns the current scale in the view. To fit an initial graph prior to
   * rendering, set <mxGraphView.rendering> to false prior to changing the model
   * and execute the following after changing the model.
   *
   * (code)
   * graph.fit();
   * graph.view.rendering = true;
   * graph.refresh();
   * (end)
   *
   * To fit and center the graph, the following code can be used.
   *
   * (code)
   * var margin = 2;
   * var max = 3;
   *
   * var bounds = graph.getGraphBounds();
   * var cw = graph.container.clientWidth - margin;
   * var ch = graph.container.clientHeight - margin;
   * var w = bounds.width / graph.view.scale;
   * var h = bounds.height / graph.view.scale;
   * var s = Math.min(max, Math.min(cw / w, ch / h));
   *
   * graph.view.scaleAndTranslate(s,
   *   (margin + cw - w * s) / (2 * s) - bounds.x / graph.view.scale,
   *   (margin + ch - h * s) / (2 * s) - bounds.y / graph.view.scale);
   * (end)
   *
   * Parameters:
   *
   * border - Optional number that specifies the border. Default is <border>.
   * keepOrigin - Optional boolean that specifies if the translate should be
   * changed. Default is false.
   * margin - Optional margin in pixels. Default is 0.
   * enabled - Optional boolean that specifies if the scale should be set or
   * just returned. Default is true.
   * ignoreWidth - Optional boolean that specifies if the width should be
   * ignored. Default is false.
   * ignoreHeight - Optional boolean that specifies if the height should be
   * ignored. Default is false.
   * maxHeight - Optional maximum height.
   */
  const fit = (
    border = getBorder(),
    keepOrigin = false,
    margin = 0,
    enabled = true,
    ignoreWidth = false,
    ignoreHeight = false,
    maxHeight
  ) => {
    const container = getContainer();
    const view = getView();

    if (isSet(container)) {
      // Adds spacing and border from css
      const cssBorder = getBorderSizes();
      let w1 =
        container.offsetWidth - cssBorder.getX() - cssBorder.getWidth() - 1;
      let h1 = isSet(maxHeight)
        ? maxHeight
        : container.offsetHeight - cssBorder.getY() - cssBorder.getHeight() - 1;
      let bounds = view.getGraphBounds();

      if (bounds.getWidth() > 0 && bounds.getHeight() > 0) {
        if (keepOrigin && isSet(bounds.getX()) && isSet(bounds.getY())) {
          bounds = bounds.clone();
          bounds.setWidth(bounds.getWidth() + bounds.getX());
          bounds.setHeight(bounds.getHeight() + bounds.getY());
          bounds.setX(0);
          bounds.setY(0);
        }

        // LATER: Use unscaled bounding boxes to fix rounding errors
        const s = view.getScale();
        let w2 = bounds.getWidth() / s;
        let h2 = bounds.getHeight() / s;

        // Fits to the size of the background image if required
        if (isSet(getBackgroundImage())) {
          w2 = Math.max(
            w2,
            getBackgroundImage().getWidth() - bounds.getX() / s
          );
          h2 = Math.max(
            h2,
            getBackgroundImage().getHeight() - bounds.getY() / s
          );
        }

        const b = (keepOrigin ? border : 2 * border) + margin + 1;

        w1 -= b;
        h1 -= b;

        let s2 = ignoreWidth
          ? h1 / h2
          : ignoreHeight
          ? w1 / w2
          : Math.min(w1 / w2, h1 / h2);

        if (isSet(getMinFitScale())) {
          s2 = Math.max(s2, getMinFitScale());
        }

        if (isSet(getMaxFitScale())) {
          s2 = Math.min(s2, getMaxFitScale());
        }

        if (enabled) {
          if (!keepOrigin) {
            if (!hasScrollbars(container)) {
              const x0 = isSet(bounds.getX())
                ? Math.floor(
                    view.getTranslate().getX() -
                      bounds.getX() / s +
                      border / s2 +
                      margin / 2
                  )
                : border;
              const y0 = isSet(bounds.getY())
                ? Math.floor(
                    view.getTranslate().getY() -
                      bounds.getY() / s +
                      border / s2 +
                      margin / 2
                  )
                : border;

              view.scaleAndTranslate(s2, x0, y0);
            } else {
              view.setScale(s2);
              const b2 = getGraphBounds();

              if (isSet(b2.getX())) {
                container.scrollLeft = b2.getX();
              }

              if (isSet(b2.getY())) {
                container.scrollTop = b2.getY();
              }
            }
          } else if (view.getScale() !== s2) {
            view.setScale(s2);
          }
        } else {
          return s2;
        }
      }
    }

    return view.getScale();
  };

  /**
   * Function: sizeDidChange
   *
   * Called when the size of the graph has changed. This implementation fires
   * a <size> event after updating the clipping region of the SVG element in
   * SVG-bases browsers.
   */
  const sizeDidChange = () => {
    const view = getView();
    const bounds = getGraphBounds();
    const scale = view.getScale();

    if (isSet(getContainer())) {
      const border = getBorder();

      let width = Math.max(0, bounds.getX()) + bounds.getWidth() + 2 * border;
      let height = Math.max(0, bounds.getY()) + bounds.getHeight() + 2 * border;

      if (isSet(getMinimumContainerSize())) {
        width = Math.max(width, getMinimumContainerSize().getWidth());
        height = Math.max(height, getMinimumContainerSize().getHeight());
      }

      if (isResizeContainer()) {
        doResizeContainer(width, height);
      }

      if (isPreferPageSize() || (!IS_IE && isPageVisible())) {
        const size = getPreferredPageSize(
          bounds,
          Math.max(1, width),
          Math.max(1, height)
        );

        if (isSet(size)) {
          width = size.getWidth() * scale;
          height = size.getHeight() * scale;
        }
      }

      if (isSet(getMinimumGraphSize())) {
        width = Math.max(width, getMinimumGraphSize().getWidth() * scale);
        height = Math.max(height, getMinimumGraphSize().getHeight() * scale);
      }

      width = Math.ceil(width);
      height = Math.ceil(height);

      const root = view.getDrawPane().ownerSVGElement;

      if (isSet(root)) {
        root.style.minWidth = Math.max(1, width) + 'px';
        root.style.minHeight = Math.max(1, height) + 'px';
        root.style.width = '100%';
        root.style.height = '100%';
      }

      updatePageBreaks(isPageBreaksVisible(), width, height);
    }

    fireEvent(EventObject(Event.SIZE, 'bounds', bounds));
  };

  /**
   * Function: doResizeContainer
   *
   * Resizes the container for the given graph width and height.
   */
  const doResizeContainer = (width, height) => {
    if (isSet(getMaximumContainerSize())) {
      width = Math.min(getMaximumContainerSize().getWidth(), width);
      height = Math.min(getMaximumContainerSize().getHeight(), height);
    }

    getContainer().style.width = Math.ceil(width) + 'px';
    getContainer().style.height = Math.ceil(height) + 'px';
  };

  /**
   * Function: updatePageBreaks
   *
   * Invokes from <sizeDidChange> to redraw the page breaks.
   *
   * Parameters:
   *
   * visible - Boolean that specifies if page breaks should be shown.
   * width - Specifies the width of the container in pixels.
   * height - Specifies the height of the container in pixels.
   */
  const updatePageBreaks = (visible, width, height) => {
    const view = getView();
    const scale = view.getScale();
    const tr = view.getTranslate();
    const fmt = getPageFormat();
    const ps = scale * getPageScale();
    const bounds = Rectangle(0, 0, fmt.getWidth() * ps, fmt.getHeight() * ps);

    const gb = Rectangle.fromRectangle(getGraphBounds());
    gb.setWidth(Math.max(1, gb.getWidth()));
    gb.setHeight(Math.max(1, gb.getHeight()));

    bounds.setX(
      Math.floor((gb.getX() - tr.getX() * scale) / bounds.getWidth()) *
        bounds.getWidth() +
        tr.getX() * scale
    );
    bounds.setY(
      Math.floor((gb.getY() - tr.getY() * scale) / bounds.getHeight()) *
        bounds.getHeight() +
        tr.getY() * scale
    );

    gb.setWidth(
      Math.ceil(
        (gb.getWidth() + (gb.getX() - bounds.getX())) / bounds.getWidth()
      ) * bounds.getWidth()
    );
    gb.setHeight(
      Math.ceil(
        (gb.getHeight() + (gb.getY() - bounds.getY())) / bounds.getHeight()
      ) * bounds.getHeight()
    );

    // Does not show page breaks if the scale is too small
    visible =
      visible &&
      Math.min(bounds.getWidth(), bounds.getHeight()) > getMinPageBreakDist();

    const horizontalCount = visible
      ? Math.ceil(gb.getHeight() / bounds.getHeight()) + 1
      : 0;
    const verticalCount = visible
      ? Math.ceil(gb.getWidth() / bounds.getWidth()) + 1
      : 0;
    const right = (verticalCount - 1) * bounds.getWidth();
    const bottom = (horizontalCount - 1) * bounds.getHeight();

    if (isUnset(getHorizontalPageBreaks()) && horizontalCount > 0) {
      setHorizontalPageBreaks([]);
    }

    if (isUnset(getVerticalPageBreaks()) && verticalCount > 0) {
      setVerticalPageBreaks([]);
    }

    const drawPageBreaks = (breaks) => {
      if (isSet(breaks)) {
        const count =
          breaks === getHorizontalPageBreaks()
            ? horizontalCount
            : verticalCount;

        for (let i = 0; i <= count; i++) {
          const pts =
            breaks === getHorizontalPageBreaks()
              ? [
                  Point(
                    Math.round(bounds.getX()),
                    Math.round(bounds.getY() + i * bounds.getHeight())
                  ),
                  Point(
                    Math.round(bounds.getX() + right),
                    Math.round(bounds.getY() + i * bounds.getHeight())
                  )
                ]
              : [
                  Point(
                    Math.round(bounds.getX() + i * bounds.getWidth()),
                    Math.round(bounds.getY())
                  ),
                  Point(
                    Math.round(bounds.getX() + i * bounds.getWidth()),
                    Math.round(bounds.getY() + bottom)
                  )
                ];

          if (isSet(breaks[i])) {
            breaks[i].setPoints(pts);
            breaks[i].redraw();
          } else {
            const pageBreak = Polyline(pts, getPageBreakColor());
            pageBreak.setPointerEvents(false);
            pageBreak.setDashed(isPageBreakDashed());
            pageBreak.init(view.getBackgroundPane());
            pageBreak.redraw();

            breaks[i] = pageBreak;
          }
        }

        for (let i = count; i < breaks.length; i++) {
          breaks[i].destroy();
        }

        breaks.splice(count, breaks.length - count);
      }
    };

    drawPageBreaks(getHorizontalPageBreaks());
    drawPageBreaks(getVerticalPageBreaks());
  };

  /**
   * Group: Cell styles
   */

  /**
   * Function: getCurrentCellStyle
   *
   * Returns the style for the given cell from the cell state, if one exists,
   * or using <getCellStyle>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose style should be returned as an array.
   * ignoreState - Optional boolean that specifies if the cell state should be ignored.
   */
  const getCurrentCellStyle = (cell, ignoreState) => {
    const state = ignoreState ? undefined : getView().getState(cell);

    return isSet(state) ? state.getStyle() : getCellStyle(cell);
  };

  /**
   * Function: getCellStyle
   *
   * Returns an array of key, value pairs representing the cell style for the
   * given cell. If no string is defined in the model that specifies the
   * style, then the default style for the cell is returned or an empty object,
   * if no style can be found. Note: You should try and get the cell state
   * for the given cell and use the cached style in the state before using
   * this method.
   *
   * Parameters:
   *
   * cell - <mxCell> whose style should be returned as an array.
   */
  const getCellStyle = (cell) => {
    const stylename = getModel().getStyle(cell);
    const stylesheet = getStylesheet();
    let style;

    // Gets the default style for the cell
    if (getModel().isEdge(cell)) {
      style = stylesheet.getDefaultEdgeStyle();
    } else {
      style = stylesheet.getDefaultVertexStyle();
    }

    // Resolves the stylename using the above as the default
    if (isSet(stylename)) {
      style = postProcessCellStyle(stylesheet.getCellStyle(stylename, style));
    }

    // Returns a non-null value if no style can be found
    if (isUnset(style)) {
      style = {};
    }

    return style;
  };

  /**
   * Function: postProcessCellStyle
   *
   * Tries to resolve the value for the image style in the image bundles and
   * turns short data URIs as defined in mxImageBundle to data URIs as
   * defined in RFC 2397 of the IETF.
   */
  const postProcessCellStyle = (style) => {
    if (isSet(style)) {
      const key = style[STYLE_IMAGE];
      let image = getImageFromBundles(key);

      if (isSet(image)) {
        style[STYLE_IMAGE] = image;
      } else {
        image = key;
      }

      // Converts short data uris to normal data uris
      if (isSet(image) && image.substring(0, 11) === 'data:image/') {
        if (image.substring(0, 20) === 'data:image/svg+xml,<') {
          // Required for FF and IE11
          image =
            image.substring(0, 19) + encodeURIComponent(image.substring(19));
        } else if (image.substring(0, 22) !== 'data:image/svg+xml,%3C') {
          const comma = image.indexOf(',');

          // Adds base64 encoding prefix if needed
          if (
            comma > 0 &&
            image.substring(comma - 7, comma + 1) !== ';base64,'
          ) {
            image =
              image.substring(0, comma) +
              ';base64,' +
              image.substring(comma + 1);
          }
        }

        style[STYLE_IMAGE] = image;
      }
    }

    return style;
  };

  /**
   * Function: setCellStyle
   *
   * Sets the style of the specified cells. If no cells are given, then the
   * selection cells are changed.
   *
   * Parameters:
   *
   * style - String representing the new style of the cells.
   * cells - Optional array of <mxCells> to set the style for. Default is the
   * selection cells.
   */
  const setCellStyle = (style, cells = getSelectionCells()) => {
    if (isSet(cells)) {
      getModel().beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          getModel().setStyle(cells[i], style);
        }
      } finally {
        getModel().endUpdate();
      }
    }
  };

  /**
   * Function: toggleCellStyle
   *
   * Toggles the boolean value for the given key in the style of the given cell
   * and returns the new value as 0 or 1. If no cell is specified then the
   * selection cell is used.
   *
   * Parameter:
   *
   * key - String representing the key for the boolean value to be toggled.
   * defaultValue - Optional boolean default value if no value is defined.
   * Default is false.
   * cell - Optional <mxCell> whose style should be modified. Default is
   * the selection cell.
   */
  const toggleCellStyle = (key, defaultValue, cell = getSelectionCell()) =>
    toggleCellStyles(key, defaultValue, [cell]);

  /**
   * Function: toggleCellStyles
   *
   * Toggles the boolean value for the given key in the style of the given cells
   * and returns the new value as 0 or 1. If no cells are specified, then the
   * selection cells are used. For example, this can be used to toggle
   * <mxConstants.STYLE_ROUNDED> or any other style with a boolean value.
   *
   * Parameter:
   *
   * key - String representing the key for the boolean value to be toggled.
   * defaultValue - Optional boolean default value if no value is defined.
   * Default is false.
   * cells - Optional array of <mxCells> whose styles should be modified.
   * Default is the selection cells.
   */
  const toggleCellStyles = (
    key,
    defaultValue = false,
    cells = getSelectionCells()
  ) => {
    let value;

    if (isSet(cells) && cells.length > 0) {
      const style = getCurrentCellStyle(cells[0]);
      value = getValue(style, key, defaultValue) ? 0 : 1;
      setCellStyles(key, value, cells);
    }

    return value;
  };

  /**
   * Function: setCellStyles
   *
   * Sets the key to value in the styles of the given cells. This will modify
   * the existing cell styles in-place and override any existing assignment
   * for the given key. If no cells are specified, then the selection cells
   * are changed. If no value is specified, then the respective key is
   * removed from the styles.
   *
   * Parameters:
   *
   * key - String representing the key to be assigned.
   * value - String representing the new value for the key.
   * cells - Optional array of <mxCells> to change the style for. Default is
   * the selection cells.
   */
  const setCellStyles = (key, value, cells = getSelectionCells()) =>
    _setCellStyles(getModel(), cells, key, value);

  /**
   * Function: toggleCellStyleFlags
   *
   * Toggles the given bit for the given key in the styles of the specified
   * cells.
   *
   * Parameters:
   *
   * key - String representing the key to toggle the flag in.
   * flag - Integer that represents the bit to be toggled.
   * cells - Optional array of <mxCells> to change the style for. Default is
   * the selection cells.
   */
  const toggleCellStyleFlags = (key, flag, cells) =>
    setCellStyleFlags(key, flag, undefined, cells);

  /**
   * Function: setCellStyleFlags
   *
   * Sets or toggles the given bit for the given key in the styles of the
   * specified cells.
   *
   * Parameters:
   *
   * key - String representing the key to toggle the flag in.
   * flag - Integer that represents the bit to be toggled.
   * value - Boolean value to be used or null if the value should be toggled.
   * cells - Optional array of <mxCells> to change the style for. Default is
   * the selection cells.
   */
  const setCellStyleFlags = (key, flag, value, cells = getSelectionCells()) => {
    if (isSet(cells) && cells.length > 0) {
      if (isUnset(value)) {
        const style = getCurrentCellStyle(cells[0]);
        const current = parseInt(style[key] || 0);
        value = !((current & flag) == flag);
      }

      setCellStyleFlags(getModel(), cells, key, flag, value);
    }
  };

  /**
   * Group: Cell alignment and orientation
   */

  /**
   * Function: alignCells
   *
   * Aligns the given cells vertically or horizontally according to the given
   * alignment using the optional parameter as the coordinate.
   *
   * Parameters:
   *
   * align - Specifies the alignment. Possible values are all constants in
   * mxConstants with an ALIGN prefix.
   * cells - Array of <mxCells> to be aligned.
   * param - Optional coordinate for the alignment.
   */
  const alignCells = (align, cells = getSelectionCells(), param) => {
    if (isSet(cells) && cells.length > 1) {
      // Finds the required coordinate for the alignment
      if (isUnset(param)) {
        for (let i = 0; i < cells.length; i++) {
          const state = getView().getState(cells[i]);

          if (isSet(state) && !getModel().isEdge(cells[i])) {
            if (isUnset(param)) {
              if (align === ALIGN_CENTER) {
                param = state.getX() + state.getWidth() / 2;
                break;
              } else if (align === ALIGN_RIGHT) {
                param = state.getX() + state.getWidth();
              } else if (align === ALIGN_TOP) {
                param = state.getY();
              } else if (align === ALIGN_MIDDLE) {
                param = state.getY() + state.getHeight() / 2;
                break;
              } else if (align === ALIGN_BOTTOM) {
                param = state.getY() + state.getHeight();
              } else {
                param = state.getX();
              }
            } else {
              if (align === ALIGN_RIGHT) {
                param = Math.max(param, state.getX() + state.getWidth());
              } else if (align === ALIGN_TOP) {
                param = Math.min(param, state.getY());
              } else if (align === ALIGN_BOTTOM) {
                param = Math.max(param, state.getY() + state.getHeight());
              } else {
                param = Math.min(param, state.getX());
              }
            }
          }
        }
      }

      // Aligns the cells to the coordinate
      if (isSet(param)) {
        const s = getView().getScale();

        getModel().beginUpdate();

        try {
          for (let i = 0; i < cells.length; i++) {
            const state = getView().getState(cells[i]);

            if (isSet(state)) {
              let geo = getCellGeometry(cells[i]);

              if (isSet(geo) && !getModel().isEdge(cells[i])) {
                geo = geo.clone();

                if (align === ALIGN_CENTER) {
                  geo.setX(
                    geo.getX() +
                      (param - state.getX() - state.getWidth() / 2) / s
                  );
                } else if (align === ALIGN_RIGHT) {
                  geo.setX(
                    geo.getX() + (param - state.getX() - state.getWidth()) / s
                  );
                } else if (align === ALIGN_TOP) {
                  geo.setY(geo.getY() + (param - state.getY()) / s);
                } else if (align === ALIGN_MIDDLE) {
                  geo.setY(
                    geo.getY() +
                      (param - state.getY() - state.getHeight() / 2) / s
                  );
                } else if (align === ALIGN_BOTTOM) {
                  geo.setY(
                    geo.getY() + (param - state.getY() - state.getHeight()) / s
                  );
                } else {
                  geo.setX(geo.getX() + (param - state.getX()) / s);
                }

                resizeCell(cells[i], geo);
              }
            }
          }

          fireEvent(
            EventObject(Event.ALIGN_CELLS, 'align', align, 'cells', cells)
          );
        } finally {
          getModel().endUpdate();
        }
      }
    }

    return cells;
  };

  /**
   * Function: flipEdge
   *
   * Toggles the style of the given edge between null (or empty) and
   * <alternateEdgeStyle>. This method fires <mxEvent.FLIP_EDGE> while the
   * transaction is in progress. Returns the edge that was flipped.
   *
   * Here is an example that overrides this implementation to invert the
   * value of <mxConstants.STYLE_ELBOW> without removing any existing styles.
   *
   * (code)
   * graph.flipEdge = function(edge)
   * {
   *   if (edge != null)
   *   {
   *     var style = this.getCurrentCellStyle(edge);
   *     var elbow = mxUtils.getValue(style, mxConstants.STYLE_ELBOW,
   *         mxConstants.ELBOW_HORIZONTAL);
   *     var value = (elbow == mxConstants.ELBOW_HORIZONTAL) ?
   *         mxConstants.ELBOW_VERTICAL : mxConstants.ELBOW_HORIZONTAL;
   *     this.setCellStyles(mxConstants.STYLE_ELBOW, value, [edge]);
   *   }
   * };
   * (end)
   *
   * Parameters:
   *
   * edge - <mxCell> whose style should be changed.
   */
  const flipEdge = (edge) => {
    const model = getModel();

    if (isSet(edge) && isSet(getAlternateEdgeStyle())) {
      model.beginUpdate();

      try {
        const style = model.getStyle(edge);

        if (isUnset(style) || style.length == 0) {
          model.setStyle(edge, getAlternateEdgeStyle());
        } else {
          model.setStyle(edge, undefined);
        }

        // Removes all existing control points
        resetEdge(edge);
        fireEvent(EventObject(Event.FLIP_EDGE, 'edge', edge));
      } finally {
        model.endUpdate();
      }
    }

    return edge;
  };

  /**
   * Function: addImageBundle
   *
   * Adds the specified <mxImageBundle>.
   */
  const addImageBundle = (bundle) => getImageBundles().push(bundle);

  /**
   * Function: removeImageBundle
   *
   * Removes the specified <mxImageBundle>.
   */
  const removeImageBundle = (bundle) => {
    const tmp = [];
    const imageBundles = getImageBundles();

    for (let i = 0; i < imageBundles.length; i++) {
      if (imageBundles[i] !== bundle) {
        tmp.push(imageBundles[i]);
      }
    }

    setImageBundles(tmp);
  };

  /**
   * Function: getImageFromBundles
   *
   * Searches all <imageBundles> for the specified key and returns the value
   * for the first match or null if the key is not found.
   */
  const getImageFromBundles = (key) => {
    const imageBundles = getImageBundles();

    if (isSet(key)) {
      for (let i = 0; i < imageBundles.length; i++) {
        const image = imageBundles[i].getImage(key);

        if (isSet(image)) {
          return image;
        }
      }
    }

    return;
  };

  /**
   * Group: Order
   */

  /**
   * Function: orderCells
   *
   * Moves the given cells to the front or back. The change is carried out
   * using <cellsOrdered>. This method fires <mxEvent.ORDER_CELLS> while the
   * transaction is in progress.
   *
   * Parameters:
   *
   * back - Boolean that specifies if the cells should be moved to back.
   * cells - Array of <mxCells> to move to the background. If null is
   * specified then the selection cells are used.
   */
  const orderCells = (back, cells) => {
    if (isUnset(cells)) {
      cells = sortCells(getSelectionCells(), true);
    }

    getModel().beginUpdate();

    try {
      cellsOrdered(cells, back);
      fireEvent(EventObject(Event.ORDER_CELLS, 'back', back, 'cells', cells));
    } finally {
      getModel().endUpdate();
    }

    return cells;
  };

  /**
   * Function: cellsOrdered
   *
   * Moves the given cells to the front or back. This method fires
   * <mxEvent.CELLS_ORDERED> while the transaction is in progress.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose order should be changed.
   * back - Boolean that specifies if the cells should be moved to back.
   */
  const cellsOrdered = (cells, back) => {
    const model = getModel();

    if (isSet(cells)) {
      model.beginUpdate();
      try {
        for (let i = 0; i < cells.length; i++) {
          const parent = model.getParent(cells[i]);

          if (back) {
            model.add(parent, cells[i], i);
          } else {
            model.add(parent, cells[i], model.getChildCount(parent) - 1);
          }
        }

        fireEvent(
          EventObject(Event.CELLS_ORDERED, 'back', back, 'cells', cells)
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Group: Grouping
   */

  /**
   * Function: groupCells
   *
   * Adds the cells into the given group. The change is carried out using
   * <cellsAdded>, <cellsMoved> and <cellsResized>. This method fires
   * <mxEvent.GROUP_CELLS> while the transaction is in progress. Returns the
   * new group. A group is only created if there is at least one entry in the
   * given array of cells.
   *
   * Parameters:
   *
   * group - <mxCell> that represents the target group. If null is specified
   * then a new group is created using <createGroupCell>.
   * border - Optional integer that specifies the border between the child
   * area and the group bounds. Default is 0.
   * cells - Optional array of <mxCells> to be grouped. If null is specified
   * then the selection cells are used.
   */
  const groupCells = (group, border, cells) => {
    const model = getModel();

    if (isUnset(cells)) {
      cells = sortCells(getSelectionCells(), true);
    }

    cells = getCellsForGroup(cells);

    if (isUnset(group)) {
      group = createGroupCell(cells);
    }

    const bounds = getBoundsForGroup(group, cells, border);

    if (cells.length > 1 && isSet(bounds)) {
      // Uses parent of group or previous parent of first child
      let parent = model.getParent(group);

      if (isUnset(parent)) {
        parent = model.getParent(cells[0]);
      }

      model.beginUpdate();

      try {
        // Checks if the group has a geometry and
        // creates one if one does not exist
        if (isUnset(getCellGeometry(group))) {
          model.setGeometry(group, Geometry());
        }

        // Adds the group into the parent
        let index = model.getChildCount(parent);
        cellsAdded(
          [group],
          parent,
          index,
          undefined,
          undefined,
          false,
          false,
          false
        );

        // Adds the children into the group and moves
        index = model.getChildCount(group);
        cellsAdded(
          cells,
          group,
          index,
          undefined,
          undefined,
          false,
          false,
          false
        );
        cellsMoved(cells, -bounds.getX(), -bounds.getY(), false, false, false);

        // Resizes the group
        cellsResized([group], [bounds], false);

        fireEvent(
          EventObject(
            Event.GROUP_CELLS,
            'group',
            group,
            'border',
            border,
            'cells',
            cells
          )
        );
      } finally {
        model.endUpdate();
      }
    }

    return group;
  };

  /**
   * Function: getCellsForGroup
   *
   * Returns the cells with the same parent as the first cell
   * in the given array.
   */
  const getCellsForGroup = (cells) => {
    const result = [];

    if (isSet(cells) && cells.length > 0) {
      const parent = getModel().getParent(cells[0]);
      result.push(cells[0]);

      // Filters selection cells with the same parent
      for (let i = 1; i < cells.length; i++) {
        if (getModel().getParent(cells[i]) === parent) {
          result.push(cells[i]);
        }
      }
    }

    return result;
  };

  /**
   * Function: getBoundsForGroup
   *
   * Returns the bounds to be used for the given group and children.
   */
  const getBoundsForGroup = (group, children, border) => {
    const result = getBoundingBoxFromGeometry(children, true);

    if (isSet(result)) {
      if (isSwimlane(group)) {
        const size = getStartSize(group);

        result.setX(result.getX() - size.getWidth());
        result.setY(result.getY() - size.getHeight());
        result.setWidth(result.getWidth() + size.getWidth());
        result.setHeight(result.getHeight() + size.getHeight());
      }

      // Adds the border
      if (isSet(border)) {
        result.setX(result.getX() - border);
        result.setY(result.getY() - border);
        result.setWidth(result.getWidth() + 2 * border);
        result.setHeight(result.getHeight() + 2 * border);
      }
    }

    return result;
  };

  /**
   * Function: createGroupCell
   *
   * Hook for creating the group cell to hold the given array of <mxCells> if
   * no group cell was given to the <group> function.
   *
   * The following code can be used to set the style of new group cells.
   *
   * (code)
   * var graphCreateGroupCell = graph.createGroupCell;
   * graph.createGroupCell = function(cells)
   * {
   *   var group = graphCreateGroupCell.apply(this, arguments);
   *   group.setStyle('group');
   *
   *   return group;
   * };
   */
  const createGroupCell = (cells) => {
    const group = Cell('');
    group.setVertex(true);
    group.setConnectable(false);

    return group;
  };

  /**
   * Function: ungroupCells
   *
   * Ungroups the given cells by moving the children the children to their
   * parents parent and removing the empty groups. Returns the children that
   * have been removed from the groups.
   *
   * Parameters:
   *
   * cells - Array of cells to be ungrouped. If null is specified then the
   * selection cells are used.
   */
  const ungroupCells = (cells = getCellsForUngroup()) => {
    const result = [];
    const model = getModel();

    if (isSet(cells) && cells.length > 0) {
      model.beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          let children = model.getChildren(cells[i]);

          if (isSet(children) && children.length > 0) {
            children = children.slice();
            const parent = model.getParent(cells[i]);
            const index = model.getChildCount(parent);

            cellsAdded(children, parent, index, undefined, undefined, true);
            result = result.concat(children);

            // Fix relative child cells
            for (let j = 0; j < children.length; j++) {
              const state = getView().getState(children[j]);
              let geo = getCellGeometry(children[j]);

              if (isSet(state) && isSet(geo) && geo.isRelative()) {
                geo = geo.clone();
                geo.setX(state.getOrigin().getX());
                geo.setY(state.getOrigin().getY());
                geo.setRelative(false);

                model.setGeometry(children[j], geo);
              }
            }
          }
        }

        removeCellsAfterUngroup(cells);
        fireEvent(EventObject(Event.UNGROUP_CELLS, 'cells', cells));
      } finally {
        model.endUpdate();
      }
    }

    return result;
  };

  /**
   * Function: getCellsForUngroup
   *
   * Returns the selection cells that can be ungrouped.
   */
  const getCellsForUngroup = () => {
    const cells = getSelectionCells();

    // Finds the cells with children
    const tmp = [];

    for (let i = 0; i < cells.length; i++) {
      if (
        getModel().isVertex(cells[i]) &&
        getModel().getChildCount(cells[i]) > 0
      ) {
        tmp.push(cells[i]);
      }
    }

    return tmp;
  };

  /**
   * Function: removeCellsAfterUngroup
   *
   * Hook to remove the groups after <ungroupCells>.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> that were ungrouped.
   */
  const removeCellsAfterUngroup = (cells) => cellsRemoved(addAllEdges(cells));

  /**
   * Function: removeCellsFromParent
   *
   * Removes the specified cells from their parents and adds them to the
   * default parent. Returns the cells that were removed from their parents.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be removed from their parents.
   */
  const removeCellsFromParent = (cells = getSelectionCells()) => {
    const model = getModel();

    model.beginUpdate();

    try {
      const parent = getDefaultParent();
      const index = model.getChildCount(parent);

      cellsAdded(cells, parent, index, undefined, undefined, true);
      fireEvent(EventObject(Event.REMOVE_CELLS_FROM_PARENT, 'cells', cells));
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  /**
   * Function: updateGroupBounds
   *
   * Updates the bounds of the given groups to include all children and returns
   * the passed-in cells. Call this with the groups in parent to child order,
   * top-most group first, the cells are processed in reverse order and cells
   * with no children are ignored.
   *
   * Parameters:
   *
   * cells - The groups whose bounds should be updated. If this is null, then
   * the selection cells are used.
   * border - Optional border to be added in the group. Default is 0.
   * moveGroup - Optional boolean that allows the group to be moved. Default
   * is false.
   * topBorder - Optional top border to be added in the group. Default is 0.
   * rightBorder - Optional top border to be added in the group. Default is 0.
   * bottomBorder - Optional top border to be added in the group. Default is 0.
   * leftBorder - Optional top border to be added in the group. Default is 0.
   */
  const updateGroupBounds = (
    cells = getSelectionCells(),
    border = 0,
    moveGroup = false,
    topBorder = 0,
    rightBorder = 0,
    bottomBorder = 0,
    leftBorder = 0
  ) => {
    const model = getModel();

    model.beginUpdate();

    try {
      for (let i = cells.length - 1; i >= 0; i--) {
        let geo = getCellGeometry(cells[i]);

        if (isSet(geo)) {
          const children = getChildCells(cells[i]);

          if (isSet(children) && children.length > 0) {
            const bounds = getBoundingBoxFromGeometry(children, true);

            if (
              isSet(bounds) &&
              bounds.getWidth() > 0 &&
              bounds.getHeight() > 0
            ) {
              // Adds the size of the title area for swimlanes
              const size = isSwimlane(cells[i])
                ? getActualStartSize(cells[i], true)
                : Rectangle();
              geo = geo.clone();

              if (moveGroup) {
                geo.setX(
                  Math.round(
                    geo.getX() +
                      bounds.getX() -
                      border -
                      size.getX() -
                      leftBorder
                  )
                );
                geo.setY(
                  Math.round(
                    geo.getY() +
                      bounds.getY() -
                      border -
                      size.getY() -
                      topBorder
                  )
                );
              }

              geo.setWidth(
                Math.round(
                  bounds.getWidth() +
                    2 * border +
                    size.getX() +
                    leftBorder +
                    rightBorder +
                    size.getWidth()
                )
              );
              geo.setHeight(
                Math.round(
                  bounds.getHeight() +
                    2 * border +
                    size.getY() +
                    topBorder +
                    bottomBorder +
                    size.getHeight()
                )
              );

              model.setGeometry(cells[i], geo);
              moveCells(
                children,
                border + size.getX() - bounds.getX() + leftBorder,
                border + size.getY() - bounds.getY() + topBorder
              );
            }
          }
        }
      }
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  /**
   * Function: getBoundingBox
   *
   * Returns the bounding box for the given array of <mxCells>. The bounding box for
   * each cell and its descendants is computed using <mxGraphView.getBoundingBox>.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounding box should be returned.
   */
  const getBoundingBox = (cells) => {
    let result;

    if (isSet(cells) && cells.length > 0) {
      for (let i = 0; i < cells.length; i++) {
        if (getModel().isVertex(cells[i]) || getModel().isEdge(cells[i])) {
          const bbox = getView().getBoundingBox(
            getView().getState(cells[i]),
            true
          );

          if (isSet(bbox)) {
            if (isUnset(result)) {
              result = Rectangle.fromRectangle(bbox);
            } else {
              result.add(bbox);
            }
          }
        }
      }
    }

    return result;
  };

  /**
   * Group: Cell cloning, insertion and removal
   */

  /**
   * Function: cloneCell
   *
   * Returns the clone for the given cell. Uses <cloneCells>.
   *
   * Parameters:
   *
   * cell - <mxCell> to be cloned.
   * allowInvalidEdges - Optional boolean that specifies if invalid edges
   * should be cloned. Default is true.
   * mapping - Optional mapping for existing clones.
   * keepPosition - Optional boolean indicating if the position of the cells should
   * be updated to reflect the lost parent cell. Default is false.
   */
  const cloneCell = (cell, allowInvalidEdges, mapping, keepPosition) =>
    cloneCells([cell], allowInvalidEdges, mapping, keepPosition)[0];

  /**
   * Function: cloneCells
   *
   * Returns the clones for the given cells. The clones are created recursively
   * using <mxGraphModel.cloneCells>. If the terminal of an edge is not in the
   * given array, then the respective end is assigned a terminal point and the
   * terminal is removed.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be cloned.
   * allowInvalidEdges - Optional boolean that specifies if invalid edges
   * should be cloned. Default is true.
   * mapping - Optional mapping for existing clones.
   * keepPosition - Optional boolean indicating if the position of the cells should
   * be updated to reflect the lost parent cell. Default is false.
   */
  const cloneCells = (
    cells,
    allowInvalidEdges = true,
    mapping,
    keepPosition
  ) => {
    const view = getView();
    const model = getModel();
    let clones;

    if (isSet(cells)) {
      // Creates a dictionary for fast lookups
      const dict = Dictionary();
      const tmp = [];

      for (let i = 0; i < cells.length; i++) {
        dict.put(cells[i], true);
        tmp.push(cells[i]);
      }

      if (tmp.length > 0) {
        const scale = view.getScale();
        const trans = view.getTranslate();
        clones = model.cloneCells(cells, true, mapping);

        for (let i = 0; i < cells.length; i++) {
          if (
            !allowInvalidEdges &&
            model.isEdge(clones[i]) &&
            getEdgeValidationError(
              clones[i],
              model.getTerminal(clones[i], true),
              isSet(model.getTerminal(clones[i], false))
            )
          ) {
            clones[i] = undefined;
          } else {
            const g = model.getGeometry(clones[i]);

            if (isSet(g)) {
              const state = view.getState(cells[i]);
              const pstate = view.getState(model.getParent(cells[i]));

              if (isSet(state) && isSet(pstate)) {
                const dx = keepPosition ? 0 : pstate.getOrigin().getX();
                const dy = keepPosition ? 0 : pstate.getOrigin().getY();

                if (model.isEdge(clones[i])) {
                  const pts = state.getAabsolutePoints();

                  if (isSet(pts)) {
                    // Checks if the source is cloned or sets the terminal point
                    let src = model.getTerminal(cells[i], true);

                    while (isSet(src) && !dict.get(src)) {
                      src = model.getParent(src);
                    }

                    if (isUnset(src) && isSet(pts[0])) {
                      g.setTerminalPoint(
                        Point(
                          pts[0].getX() / scale - trans.getX(),
                          pts[0].getY() / scale - trans.getY()
                        ),
                        true
                      );
                    }

                    // Checks if the target is cloned or sets the terminal point
                    let trg = model.getTerminal(cells[i], false);

                    while (isSet(trg) && !dict.get(trg)) {
                      trg = model.getParent(trg);
                    }

                    const n = pts.length - 1;

                    if (isUnset(trg) && isSet(pts[n])) {
                      g.setTerminalPoint(
                        Point(
                          pts[n].getX() / scale - trans.getX(),
                          pts[n].getY() / scale - trans.getY()
                        ),
                        false
                      );
                    }

                    // Translates the control points
                    const points = g.getPoints();

                    if (isSet(points)) {
                      for (let j = 0; j < points.length; j++) {
                        points[j].setX(points[j].getX() + dx);
                        points[j].setY(points[j].getY() + dy);
                      }
                    }
                  }
                } else {
                  g.translate(dx, dy);
                }
              }
            }
          }
        }
      } else {
        clones = [];
      }
    }

    return clones;
  };

  /**
   * Function: insertVertex
   *
   * Adds a new vertex into the given parent <mxCell> using value as the user
   * object and the given coordinates as the <mxGeometry> of the new vertex.
   * The id and style are used for the respective properties of the new
   * <mxCell>, which is returned.
   *
   * When adding new vertices from a mouse event, one should take into
   * account the offset of the graph container and the scale and translation
   * of the view in order to find the correct unscaled, untranslated
   * coordinates using <mxGraph.getPointForEvent> as follows:
   *
   * (code)
   * var pt = graph.getPointForEvent(evt);
   * var parent = graph.getDefaultParent();
   * graph.insertVertex(parent, null,
   * 			'Hello, World!', x, y, 220, 30);
   * (end)
   *
   * For adding image cells, the style parameter can be assigned as
   *
   * (code)
   * stylename;image=imageUrl
   * (end)
   *
   * See <mxGraph> for more information on using images.
   *
   * Parameters:
   *
   * parent - <mxCell> that specifies the parent of the new vertex.
   * id - Optional string that defines the Id of the new vertex.
   * value - Object to be used as the user object.
   * x - Integer that defines the x coordinate of the vertex.
   * y - Integer that defines the y coordinate of the vertex.
   * width - Integer that defines the width of the vertex.
   * height - Integer that defines the height of the vertex.
   * style - Optional string that defines the cell style.
   * relative - Optional boolean that specifies if the geometry is relative.
   * Default is false.
   */
  const insertVertex = (
    parent,
    id,
    value,
    x,
    y,
    width,
    height,
    style,
    relative
  ) => {
    const vertex = createVertex(
      parent,
      id,
      value,
      x,
      y,
      width,
      height,
      style,
      relative
    );

    return addCell(vertex, parent);
  };

  /**
   * Function: createVertex
   *
   * Hook method that creates the new vertex for <insertVertex>.
   */
  const createVertex = (
    parent,
    id,
    value,
    x,
    y,
    width,
    height,
    style,
    relative = false
  ) => {
    // Creates the geometry for the vertex
    const geometry = Geometry(x, y, width, height);
    geometry.setRelative(relative);

    // Creates the vertex
    const vertex = Cell(value, geometry, style);
    vertex.setId(id);
    vertex.setVertex(true);
    vertex.setConnectable(true);

    return vertex;
  };

  /**
   * Function: insertEdge
   *
   * Adds a new edge into the given parent <mxCell> using value as the user
   * object and the given source and target as the terminals of the new edge.
   * The id and style are used for the respective properties of the new
   * <mxCell>, which is returned.
   *
   * Parameters:
   *
   * parent - <mxCell> that specifies the parent of the new edge.
   * id - Optional string that defines the Id of the new edge.
   * value - JavaScript object to be used as the user object.
   * source - <mxCell> that defines the source of the edge.
   * target - <mxCell> that defines the target of the edge.
   * style - Optional string that defines the cell style.
   */
  const insertEdge = (parent, id, value, source, target, style) => {
    const edge = createEdge(parent, id, value, source, target, style);

    return addEdge(edge, parent, source, target);
  };

  /**
   * Function: createEdge
   *
   * Hook method that creates the new edge for <insertEdge>. This
   * implementation does not set the source and target of the edge, these
   * are set when the edge is added to the model.
   *
   */
  const createEdge = (parent, id, value, source, target, style) => {
    // Creates the edge
    const edge = Cell(value, Geometry(), style);
    edge.setId(id);
    edge.setEdge(true);
    edge.getGeometry().setRelative(true);

    return edge;
  };

  /**
   * Function: addEdge
   *
   * Adds the edge to the parent and connects it to the given source and
   * target terminals. This is a shortcut method. Returns the edge that was
   * added.
   *
   * Parameters:
   *
   * edge - <mxCell> to be inserted into the given parent.
   * parent - <mxCell> that represents the new parent. If no parent is
   * given then the default parent is used.
   * source - Optional <mxCell> that represents the source terminal.
   * target - Optional <mxCell> that represents the target terminal.
   * index - Optional index to insert the cells at. Default is to append.
   */
  const addEdge = (edge, parent, source, target, index) =>
    addCell(edge, parent, index, source, target);

  /**
   * Function: addCell
   *
   * Adds the cell to the parent and connects it to the given source and
   * target terminals. This is a shortcut method. Returns the cell that was
   * added.
   *
   * Parameters:
   *
   * cell - <mxCell> to be inserted into the given parent.
   * parent - <mxCell> that represents the new parent. If no parent is
   * given then the default parent is used.
   * index - Optional index to insert the cells at. Default is to append.
   * source - Optional <mxCell> that represents the source terminal.
   * target - Optional <mxCell> that represents the target terminal.
   */
  const addCell = (cell, parent, index, source, target) =>
    addCells([cell], parent, index, source, target)[0];

  /**
   * Function: addCells
   *
   * Adds the cells to the parent at the given index, connecting each cell to
   * the optional source and target terminal. The change is carried out using
   * <cellsAdded>. This method fires <mxEvent.ADD_CELLS> while the
   * transaction is in progress. Returns the cells that were added.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be inserted.
   * parent - <mxCell> that represents the new parent. If no parent is
   * given then the default parent is used.
   * index - Optional index to insert the cells at. Default is to append.
   * source - Optional source <mxCell> for all inserted cells.
   * target - Optional target <mxCell> for all inserted cells.
   * absolute - Optional boolean indicating of cells should be kept at
   * their absolute position. Default is false.
   */
  const addCells = (cells, parent, index, source, target, absolute = false) => {
    const model = getModel();

    if (isUnset(parent)) {
      parent = getDefaultParent();
    }

    if (isUnset(index)) {
      index = model.getChildCount(parent);
    }

    model.beginUpdate();

    try {
      cellsAdded(cells, parent, index, source, target, absolute, true);
      fireEvent(
        EventObject(
          Event.ADD_CELLS,
          'cells',
          cells,
          'parent',
          parent,
          'index',
          index,
          'source',
          source,
          'target',
          target
        )
      );
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  /**
   * Function: cellsAdded
   *
   * Adds the specified cells to the given parent. This method fires
   * <mxEvent.CELLS_ADDED> while the transaction is in progress.
   */
  const cellsAdded = (
    cells,
    parent,
    index,
    source,
    target,
    absolute,
    constrain,
    extend
  ) => {
    const model = getModel();

    if (isSet(cells) && isSet(parent) && isSet(index)) {
      model.beginUpdate();

      try {
        const parentState = absolute ? getView().getState(parent) : undefined;
        const o1 = isSet(parentState) ? parentState.getOrigin() : undefined;
        const zero = Point(0, 0);

        for (let i = 0; i < cells.length; i++) {
          if (isUnset(cells[i])) {
            index--;
          } else {
            const previous = model.getParent(cells[i]);

            // Keeps the cell at its absolute location
            if (isSet(o1) && cells[i] !== parent && parent !== previous) {
              const oldState = getView().getState(previous);
              const o2 = isSet(oldState) ? oldState.getOrigin() : zero;
              let geo = model.getGeometry(cells[i]);

              if (isSet(geo)) {
                const dx = o2.getX() - o1.getX();
                const dy = o2.getY() - o1.getY();

                // FIXME: Cells should always be inserted first before any other edit
                // to avoid forward references in sessions.
                geo = geo.clone();
                geo.translate(dx, dy);

                if (
                  !geo.isRelative() &&
                  model.isVertex(cells[i]) &&
                  !isAllowNegativeCoordinates()
                ) {
                  geo.setX(Math.max(0, geo.getX()));
                  geo.setY(Math.max(0, geo.getY()));
                }

                model.setGeometry(cells[i], geo);
              }
            }

            // Decrements all following indices
            // if cell is already in parent
            if (
              parent === previous &&
              index + i > model.getChildCount(parent)
            ) {
              index--;
            }

            model.add(parent, cells[i], index + i);

            if (isAutoSizeCellsOnAdd()) {
              autoSizeCell(cells[i], true);
            }

            // Extends the parent or constrains the child
            if (
              (isUnset(extend) || extend) &&
              isExtendParentsOnAdd(cells[i]) &&
              isExtendParent(cells[i])
            ) {
              extendParent(cells[i]);
            }

            // Additionally constrains the child after extending the parent
            if (isUnset(constrain) || constrain) {
              constrainChild(cells[i]);
            }

            // Sets the source terminal
            if (isSet(source)) {
              cellConnected(cells[i], source, true);
            }

            // Sets the target terminal
            if (isSet(target)) {
              cellConnected(cells[i], target, false);
            }
          }
        }

        fireEvent(
          EventObject(
            Event.CELLS_ADDED,
            'cells',
            cells,
            'parent',
            parent,
            'index',
            index,
            'source',
            source,
            'target',
            target,
            'absolute',
            absolute
          )
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Function: autoSizeCell
   *
   * Resizes the specified cell to just fit around the its label and/or children
   *
   * Parameters:
   *
   * cell - <mxCells> to be resized.
   * recurse - Optional boolean which specifies if all descendants should be
   * autosized. Default is true.
   */
  const autoSizeCell = (cell, recurse = true) => {
    const model = getModel();

    if (recurse) {
      const childCount = model.getChildCount(cell);

      for (let i = 0; i < childCount; i++) {
        autoSizeCell(model.getChildAt(cell, i));
      }
    }

    if (model.isVertex(cell) && isAutoSizeCell(cell)) {
      updateCellSize(cell);
    }
  };

  /**
   * Function: removeCells
   *
   * Removes the given cells from the graph including all connected edges if
   * includeEdges is true. The change is carried out using <cellsRemoved>.
   * This method fires <mxEvent.REMOVE_CELLS> while the transaction is in
   * progress. The removed cells are returned as an array.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to remove. If null is specified then the
   * selection cells which are deletable are used.
   * includeEdges - Optional boolean which specifies if all connected edges
   * should be removed as well. Default is true.
   */
  const removeCells = (cells, includeEdges = true) => {
    if (isUnset(cells)) {
      cells = getDeletableCells(getSelectionCells());
    }

    // Adds all edges to the cells
    if (includeEdges) {
      // FIXME: Remove duplicate cells in result or do not add if
      // in cells or descendant of cells
      cells = getDeletableCells(addAllEdges(cells));
    } else {
      cells = cells.slice();

      // Removes edges that are currently not
      // visible as those cannot be updated
      const edges = getDeletableCells(getAllEdges(cells));
      const dict = Dictionary();

      for (let i = 0; i < cells.length; i++) {
        dict.put(cells[i], true);
      }

      for (let i = 0; i < edges.length; i++) {
        if (getView().getState(isUnset(edges[i])) && !dict.get(edges[i])) {
          dict.put(edges[i], true);
          cells.push(edges[i]);
        }
      }
    }

    getModel().beginUpdate();

    try {
      cellsRemoved(cells);
      fireEvent(
        EventObject(
          Event.REMOVE_CELLS,
          'cells',
          cells,
          'includeEdges',
          includeEdges
        )
      );
    } finally {
      getModel().endUpdate();
    }

    return cells;
  };

  /**
   * Function: cellsRemoved
   *
   * Removes the given cells from the model. This method fires
   * <mxEvent.CELLS_REMOVED> while the transaction is in progress.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to remove.
   */
  const cellsRemoved = (cells) => {
    const model = getModel();

    if (isSet(cells) && cells.length > 0) {
      const scale = getView().getScale();
      const tr = getView().getTranslate();

      model.beginUpdate();

      try {
        // Creates hashtable for faster lookup
        const dict = Dictionary();

        for (let i = 0; i < cells.length; i++) {
          dict.put(cells[i], true);
        }

        for (let i = 0; i < cells.length; i++) {
          // Disconnects edges which are not being removed
          const edges = getAllEdges([cells[i]]);

          const disconnectTerminal = (edge, source) => {
            let geo = model.getGeometry(edge);

            if (isSet(geo)) {
              // Checks if terminal is being removed
              const terminal = model.getTerminal(edge, source);
              let connected = false;
              let tmp = terminal;

              while (isSet(tmp)) {
                if (cells[i] === tmp) {
                  connected = true;
                  break;
                }

                tmp = model.getParent(tmp);
              }

              if (connected) {
                geo = geo.clone();
                const state = getView().getState(edge);

                if (isSet(state) && isSet(state.getAbsolutePoints())) {
                  const pts = state.getAbsolutePoints();
                  const n = source ? 0 : pts.length - 1;

                  geo.setTerminalPoint(
                    Point(
                      pts[n].getX() / scale - tr.getX() - state.origin.getX(),
                      pts[n].getY() / scale - tr.getY() - state.origin.getY()
                    ),
                    source
                  );
                } else {
                  // Fallback to center of terminal if routing
                  // points are not available to add new point
                  // KNOWN: Should recurse to find parent offset
                  // of edge for nested groups but invisible edges
                  // should be removed in removeCells step
                  const tstate = getView().getState(terminal);

                  if (isSet(tstate)) {
                    geo.setTerminalPoint(
                      Point(
                        tstate.getCenterX() / scale - tr.getX(),
                        tstate.getCenterY() / scale - tr.getY()
                      ),
                      source
                    );
                  }
                }

                model.setGeometry(edge, geo);
                model.setTerminal(edge, undefined, source);
              }
            }
          };

          for (let j = 0; j < edges.length; j++) {
            if (!dict.get(edges[j])) {
              dict.put(edges[j], true);
              disconnectTerminal(edges[j], true);
              disconnectTerminal(edges[j], false);
            }
          }

          model.remove(cells[i]);
        }

        fireEvent(EventObject(Event.CELLS_REMOVED, 'cells', cells));
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Function: splitEdge
   *
   * Splits the given edge by adding the newEdge between the previous source
   * and the given cell and reconnecting the source of the given edge to the
   * given cell. This method fires <mxEvent.SPLIT_EDGE> while the transaction
   * is in progress. Returns the new edge that was inserted.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to be splitted.
   * cells - <mxCells> that represents the cells to insert into the edge.
   * newEdge - <mxCell> that represents the edge to be inserted.
   * dx - Optional integer that specifies the vector to move the cells.
   * dy - Optional integer that specifies the vector to move the cells.
   * x - Integer that specifies the x-coordinate of the drop location.
   * y - Integer that specifies the y-coordinate of the drop location.
   * parent - Optional parent to insert the cell. If null the parent of
   * the edge is used.
   */
  const splitEdge = (edge, cells, newEdge, dx = 0, dy = 0, x, y, parent) => {
    const view = getView();
    const model = getModel();

    parent = isSet(parent) ? parent : model.getParent(edge);
    const source = model.getTerminal(edge, true);

    model.beginUpdate();

    try {
      if (isUnset(newEdge)) {
        newEdge = cloneCell(edge);

        // Removes waypoints before/after new cell
        const state = view.getState(edge);
        let geo = getCellGeometry(newEdge);

        if (isSet(geo) && isSet(geo.getPoints()) && isSet(state)) {
          const t = view.getTranslate();
          const s = view.getScale();
          const idx = findNearestSegment(
            state,
            (dx + t.getX()) * s,
            (dy + t.getY()) * s
          );
          geo.setPoints(geo.getPoints().slice(0, idx));

          geo = getCellGeometry(edge);

          if (isSet(geo) && isSet(geo.getPoints())) {
            geo = geo.clone();
            geo.setPoints(geo.getPoints().slice(idx));
            model.setGeometry(edge, geo);
          }
        }
      }

      cellsMoved(cells, dx, dy, false, false);
      cellsAdded(
        cells,
        parent,
        model.getChildCount(parent),
        undefined,
        undefined,
        true
      );
      cellsAdded(
        [newEdge],
        parent,
        model.getChildCount(parent),
        source,
        cells[0],
        false
      );
      cellConnected(edge, cells[0], true);
      fireEvent(
        EventObject(
          Event.SPLIT_EDGE,
          'edge',
          edge,
          'cells',
          cells,
          'newEdge',
          newEdge,
          'dx',
          dx,
          'dy',
          dy
        )
      );
    } finally {
      model.endUpdate();
    }

    return newEdge;
  };

  /**
   * Group: Cell visibility
   */

  /**
   * Function: toggleCells
   *
   * Sets the visible state of the specified cells and all connected edges
   * if includeEdges is true. The change is carried out using <cellsToggled>.
   * This method fires <mxEvent.TOGGLE_CELLS> while the transaction is in
   * progress. Returns the cells whose visible state was changed.
   *
   * Parameters:
   *
   * show - Boolean that specifies the visible state to be assigned.
   * cells - Array of <mxCells> whose visible state should be changed. If
   * null is specified then the selection cells are used.
   * includeEdges - Optional boolean indicating if the visible state of all
   * connected edges should be changed as well. Default is true.
   */
  const toggleCells = (show, cells, includeEdges) => {
    const model = getModel();

    if (isUnset(cells)) {
      cells = getSelectionCells();
    }

    // Adds all connected edges recursively
    if (includeEdges) {
      cells = addAllEdges(cells);
    }

    model.beginUpdate();

    try {
      cellsToggled(cells, show);
      fireEvent(
        EventObject(
          Event.TOGGLE_CELLS,
          'show',
          show,
          'cells',
          cells,
          'includeEdges',
          includeEdges
        )
      );
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  /**
   * Function: cellsToggled
   *
   * Sets the visible state of the specified cells.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose visible state should be changed.
   * show - Boolean that specifies the visible state to be assigned.
   */
  const cellsToggled = (cells, show) => {
    const model = getModel();

    if (isSet(cells) && cells.length > 0) {
      model.beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          model.setVisible(cells[i], show);
        }
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Group: Folding
   */

  /**
   * Function: foldCells
   *
   * Sets the collapsed state of the specified cells and all descendants
   * if recurse is true. The change is carried out using <cellsFolded>.
   * This method fires <mxEvent.FOLD_CELLS> while the transaction is in
   * progress. Returns the cells whose collapsed state was changed.
   *
   * Parameters:
   *
   * collapsed - Boolean indicating the collapsed state to be assigned.
   * recurse - Optional boolean indicating if the collapsed state of all
   * descendants should be set. Default is false.
   * cells - Array of <mxCells> whose collapsed state should be set. If
   * null is specified then the foldable selection cells are used.
   * checkFoldable - Optional boolean indicating of isCellFoldable should be
   * checked. Default is false.
   * evt - Optional native event that triggered the invocation.
   */
  const foldCells = (collapse, recurse = false, cells, checkFoldable, evt) => {
    const model = getModel();

    if (isUnset(cells)) {
      cells = getFoldableCells(getSelectionCells(), collapse);
    }

    stopEditing(false);

    model.beginUpdate();

    try {
      cellsFolded(cells, collapse, recurse, checkFoldable);
      fireEvent(
        EventObject(
          Event.FOLD_CELLS,
          'collapse',
          collapse,
          'recurse',
          recurse,
          'cells',
          cells
        )
      );
    } finally {
      model.endUpdate();
    }

    return cells;
  };

  /**
   * Function: cellsFolded
   *
   * Sets the collapsed state of the specified cells. This method fires
   * <mxEvent.CELLS_FOLDED> while the transaction is in progress. Returns the
   * cells whose collapsed state was changed.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose collapsed state should be set.
   * collapsed - Boolean indicating the collapsed state to be assigned.
   * recurse - Boolean indicating if the collapsed state of all descendants
   * should be set.
   * checkFoldable - Optional boolean indicating of isCellFoldable should be
   * checked. Default is false.
   */
  const cellsFolded = (cells, collapse, recurse, checkFoldable) => {
    const model = getModel();

    if (isSet(cells) && cells.length > 0) {
      model.beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          if (
            (!checkFoldable || isCellFoldable(cells[i], collapse)) &&
            collapse !== isCellCollapsed(cells[i])
          ) {
            model.setCollapsed(cells[i], collapse);
            swapBounds(cells[i], collapse);

            if (isExtendParent(cells[i])) {
              extendParent(cells[i]);
            }

            if (recurse) {
              const children = model.getChildren(cells[i]);
              cellsFolded(children, collapse, recurse);
            }

            constrainChild(cells[i]);
          }
        }

        fireEvent(
          EventObject(
            Event.CELLS_FOLDED,
            'cells',
            cells,
            'collapse',
            collapse,
            'recurse',
            recurse
          )
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Function: swapBounds
   *
   * Swaps the alternate and the actual bounds in the geometry of the given
   * cell invoking <updateAlternateBounds> before carrying out the swap.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the bounds should be swapped.
   * willCollapse - Boolean indicating if the cell is going to be collapsed.
   */
  const swapBounds = (cell, willCollapse) => {
    if (isSet(cell)) {
      let geo = getModel().getGeometry(cell);

      if (isSet(geo)) {
        geo = geo.clone();

        updateAlternateBounds(cell, geo, willCollapse);
        geo.swap();

        getModel().setGeometry(cell, geo);
      }
    }
  };

  /**
   * Function: updateAlternateBounds
   *
   * Updates or sets the alternate bounds in the given geometry for the given
   * cell depending on whether the cell is going to be collapsed. If no
   * alternate bounds are defined in the geometry and
   * <collapseToPreferredSize> is true, then the preferred size is used for
   * the alternate bounds. The top, left corner is always kept at the same
   * location.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the geometry is being udpated.
   * g - <mxGeometry> for which the alternate bounds should be updated.
   * willCollapse - Boolean indicating if the cell is going to be collapsed.
   */
  const updateAlternateBounds = (cell, geo, willCollapse) => {
    if (isSet(cell) && isSet(geo)) {
      const style = getCurrentCellStyle(cell);

      if (isUnset(geo.getAlternateBounds())) {
        let bounds = geo;

        if (isCollapseToPreferredSize()) {
          const tmp = getPreferredSizeForCell(cell);

          if (isSet(tmp)) {
            bounds = tmp;

            const startSize = getValue(style, STYLE_STARTSIZE);

            if (startSize > 0) {
              bounds.setHeight(Math.max(bounds.getHeight(), startSize));
            }
          }
        }

        geo.setAlternateBounds(
          Rectangle(0, 0, bounds.getWidth(), bounds.getHeight())
        );
      }

      if (isSet(geo.getAlternateBounds())) {
        const bounds = geo.getAlternateBounds();
        bounds.setX(geo.getX());
        bounds.setY(geo.getY());

        const alpha = toRadians(style[STYLE_ROTATION] || 0);

        if (alpha !== 0) {
          const dx = bounds.getCenterX() - geo.getCenterX();
          const dy = bounds.getCenterY() - geo.getCenterY();

          const cos = Math.cos(alpha);
          const sin = Math.sin(alpha);

          const dx2 = cos * dx - sin * dy;
          const dy2 = sin * dx + cos * dy;

          bounds.setX(bounds.getX() + dx2 - dx);
          bounds.setY(bounds.getY() + dy2 - dy);
        }
      }
    }
  };

  /**
   * Function: addAllEdges
   *
   * Returns an array with the given cells and all edges that are connected
   * to a cell or one of its descendants.
   */
  const addAllEdges = (cells) => {
    const allCells = cells.slice();

    return removeDuplicates(allCells.concat(getAllEdges(cells)));
  };

  /**
   * Function: getAllEdges
   *
   * Returns all edges connected to the given cells or its descendants.
   */
  const getAllEdges = (cells) => {
    const model = getModel();
    const edges = [];

    if (isSet(cells)) {
      for (let i = 0; i < cells.length; i++) {
        const edgeCount = model.getEdgeCount(cells[i]);

        for (let j = 0; j < edgeCount; j++) {
          edges.push(model.getEdgeAt(cells[i], j));
        }

        // Recurses
        const children = model.getChildren(cells[i]);
        edges = edges.concat(getAllEdges(children));
      }
    }

    return edges;
  };

  /**
   * Group: Cell sizing
   */

  /**
   * Function: updateCellSize
   *
   * Updates the size of the given cell in the model using <cellSizeUpdated>.
   * This method fires <mxEvent.UPDATE_CELL_SIZE> while the transaction is in
   * progress. Returns the cell whose size was updated.
   *
   * Parameters:
   *
   * cell - <mxCell> whose size should be updated.
   */
  const updateCellSize = (cell, ignoreChildren = false) => {
    getModel().beginUpdate();

    try {
      cellSizeUpdated(cell, ignoreChildren);
      fireEvent(
        EventObject(
          Event.UPDATE_CELL_SIZE,
          'cell',
          cell,
          'ignoreChildren',
          ignoreChildren
        )
      );
    } finally {
      getModel().endUpdate();
    }

    return cell;
  };

  /**
   * Function: cellSizeUpdated
   *
   * Updates the size of the given cell in the model using
   * <getPreferredSizeForCell> to get the new size.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the size should be changed.
   */
  const cellSizeUpdated = (cell, ignoreChildren) => {
    const view = getView();
    const model = getModel();

    if (isSet(cell)) {
      model.beginUpdate();

      try {
        const size = getPreferredSizeForCell(cell);
        let geo = model.getGeometry(cell);

        if (isSet(size) && isSet(geo)) {
          const collapsed = isCellCollapsed(cell);
          geo = geo.clone();

          if (isSwimlane(cell)) {
            const style = getCellStyle(cell);
            let cellStyle = model.getStyle(cell);

            if (isUnset(cellStyle)) {
              cellStyle = '';
            }

            if (getValue(style, STYLE_HORIZONTAL, true)) {
              cellStyle = setStyle(
                cellStyle,
                STYLE_STARTSIZE,
                size.getHeight() + 8
              );

              if (collapsed) {
                geo.setHeight(size.getHeight() + 8);
              }

              geo.setWidth(size.getWidth());
            } else {
              cellStyle = setStyle(
                cellStyle,
                STYLE_STARTSIZE,
                size.getWidth() + 8
              );

              if (collapsed) {
                geo.setWidth(size.getWidth() + 8);
              }

              geo.setHeight(size.getHeight());
            }

            model.setStyle(cell, cellStyle);
          } else {
            const state = view.createState(cell);
            const align = state.style[STYLE_ALIGN] || ALIGN_CENTER;

            if (align === ALIGN_RIGHT) {
              geo.setX(geo.getX() + geo.getWidth() - size.getWidth());
            } else if (align === ALIGN_CENTER) {
              geo.setX(
                geo.getX() + Math.round((geo.getWidth() - size.getWidth()) / 2)
              );
            }

            const valign = getVerticalAlign(state);

            if (valign === ALIGN_BOTTOM) {
              geo.setY(geo.getY() + geo.getHeight() - size.getHeight());
            } else if (valign === ALIGN_MIDDLE) {
              geo.setY(
                geo.getY() +
                  Math.round((geo.getHeight() - size.getHeight()) / 2)
              );
            }

            geo.setWidth(size.getWidth());
            geo.setHeight(size.getHeight());
          }

          if (!ignoreChildren && !collapsed) {
            const bounds = view.getBounds(model.getChildren(cell));

            if (isSet(bounds)) {
              const tr = view.getTranslate();
              const scale = view.getScale();

              const width =
                (bounds.getX() + bounds.getWidth()) / scale -
                geo.getX() -
                tr.getX();
              const height =
                (bounds.getY() + bounds.getHeight()) / scale -
                geo.getY() -
                tr.getY();

              geo.setWidth(Math.max(geo.getWidth(), width));
              geo.setHeight(Math.max(geo.getHeight(), height));
            }
          }

          cellsResized([cell], [geo], false);
        }
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Function: getPreferredSizeForCell
   *
   * Returns the preferred width and height of the given <mxCell> as an
   * <mxRectangle>. To implement a minimum width, add a new style eg.
   * minWidth in the vertex and override this method as follows.
   *
   * (code)
   * var graphGetPreferredSizeForCell = graph.getPreferredSizeForCell;
   * graph.getPreferredSizeForCell = function(cell)
   * {
   *   var result = graphGetPreferredSizeForCell.apply(this, arguments);
   *   var style = this.getCellStyle(cell);
   *
   *   if (style['minWidth'] > 0)
   *   {
   *     result.width = Math.max(style['minWidth'], result.width);
   *   }
   *
   *   return result;
   * };
   * (end)
   *
   * Parameters:
   *
   * cell - <mxCell> for which the preferred size should be returned.
   * textWidth - Optional maximum text width for word wrapping.
   */
  const getPreferredSizeForCell = (cell, textWidth) => {
    let result;

    if (isSet(cell)) {
      const state = getView().createState(cell);
      const style = state.getStyle();

      if (!getModel().isEdge(cell)) {
        const fontSize = style[STYLE_FONTSIZE] || DEFAULT_FONTSIZE;
        let dx = 0;
        let dy = 0;

        // Adds dimension of image if shape is a label
        if (isSet(getImage(state)) || isSet(style[STYLE_IMAGE])) {
          if (style[STYLE_SHAPE] === SHAPE_LABEL) {
            if (style[STYLE_VERTICAL_ALIGN] === ALIGN_MIDDLE) {
              dx += parseFloat(style[STYLE_IMAGE_WIDTH]) || Label.imageSize;
            }

            if (style[STYLE_ALIGN] != ALIGN_CENTER) {
              dy += parseFloat(style[STYLE_IMAGE_HEIGHT]) || Label.imageSize;
            }
          }
        }

        // Adds spacings
        dx += 2 * (style[STYLE_SPACING] || 0);
        dx += style[STYLE_SPACING_LEFT] || 0;
        dx += style[STYLE_SPACING_RIGHT] || 0;

        dy += 2 * (style[STYLE_SPACING] || 0);
        dy += style[STYLE_SPACING_TOP] || 0;
        dy += style[STYLE_SPACING_BOTTOM] || 0;

        // Add spacing for collapse/expand icon
        // LATER: Check alignment and use constants
        // for image spacing
        const image = getFoldingImage(state);

        if (isSet(image)) {
          dx += image.getWidth() + 8;
        }

        // Adds space for label
        let value = getCellRenderer().getLabelValue(state);

        if (isSet(value) && value.length > 0) {
          if (!isHtmlLabel(state.getCell())) {
            value = htmlEntities(value, false);
          }

          value = value.replace(/\n/g, '<br>');

          const size = getSizeForString(
            value,
            fontSize,
            style[STYLE_FONTFAMILY],
            textWidth,
            style[STYLE_FONTSTYLE]
          );
          let width = size.getWidth() + dx;
          let height = size.getHeight() + dy;

          if (!getValue(style, STYLE_HORIZONTAL, true)) {
            const tmp = height;

            height = width;
            width = tmp;
          }

          if (isGridEnabled()) {
            width = snap(width + getGridSize() / 2);
            height = snap(height + getGridSize() / 2);
          }

          result = Rectangle(0, 0, width, height);
        } else {
          const gs2 = 4 * getGridSize();
          result = Rectangle(0, 0, gs2, gs2);
        }
      }
    }

    return result;
  };

  /**
   * Function: resizeCell
   *
   * Sets the bounds of the given cell using <resizeCells>. Returns the
   * cell which was passed to the function.
   *
   * Parameters:
   *
   * cell - <mxCell> whose bounds should be changed.
   * bounds - <mxRectangle> that represents the new bounds.
   */
  const resizeCell = (cell, bounds, recurse) =>
    resizeCells([cell], [bounds], recurse)[0];

  /**
   * Function: resizeCells
   *
   * Sets the bounds of the given cells and fires a <mxEvent.RESIZE_CELLS>
   * event while the transaction is in progress. Returns the cells which
   * have been passed to the function.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounds should be changed.
   * bounds - Array of <mxRectangles> that represent the new bounds.
   */
  const resizeCells = (cells, bounds, recurse = isRecursiveResize()) => {
    getModel().beginUpdate();

    try {
      const prev = cellsResized(cells, bounds, recurse);
      fireEvent(
        EventObject(
          Event.RESIZE_CELLS,
          'cells',
          cells,
          'bounds',
          bounds,
          'previous',
          prev
        )
      );
    } finally {
      getModel().endUpdate();
    }

    return cells;
  };

  /**
   * Function: cellsResized
   *
   * Sets the bounds of the given cells and fires a <mxEvent.CELLS_RESIZED>
   * event. If <extendParents> is true, then the parent is extended if a
   * child size is changed so that it overlaps with the parent.
   *
   * The following example shows how to control group resizes to make sure
   * that all child cells stay within the group.
   *
   * (code)
   * graph.addListener(mxEvent.CELLS_RESIZED, function(sender, evt)
   * {
   *   var cells = evt.getProperty('cells');
   *
   *   if (cells != null)
   *   {
   *     for (var i = 0; i < cells.length; i++)
   *     {
   *       if (graph.getModel().getChildCount(cells[i]) > 0)
   *       {
   *         var geo = graph.getCellGeometry(cells[i]);
   *
   *         if (geo != null)
   *         {
   *           var children = graph.getChildCells(cells[i], true, true);
   *           var bounds = graph.getBoundingBoxFromGeometry(children, true);
   *
   *           geo = geo.clone();
   *           geo.width = Math.max(geo.width, bounds.width);
   *           geo.height = Math.max(geo.height, bounds.height);
   *
   *           graph.getModel().setGeometry(cells[i], geo);
   *         }
   *       }
   *     }
   *   }
   * });
   * (end)
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounds should be changed.
   * bounds - Array of <mxRectangles> that represent the new bounds.
   * recurse - Optional boolean that specifies if the children should be resized.
   */
  const cellsResized = (cells, bounds, recurse = false) => {
    const prev = [];

    if (isSet(cells) && isSet(bounds) && cells.length === bounds.length) {
      getModel().beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          prev.push(cellResized(cells[i], bounds[i], false, recurse));

          if (isExtendParent(cells[i])) {
            extendParent(cells[i]);
          }

          constrainChild(cells[i]);
        }

        if (isResetEdgesOnResize()) {
          resetEdges(cells);
        }

        fireEvent(
          EventObject(
            Event.CELLS_RESIZED,
            'cells',
            cells,
            'bounds',
            bounds,
            'previous',
            prev
          )
        );
      } finally {
        getModel().endUpdate();
      }
    }

    return prev;
  };

  /**
   * Function: cellResized
   *
   * Resizes the parents recursively so that they contain the complete area
   * of the resized child cell.
   *
   * Parameters:
   *
   * cell - <mxCell> whose bounds should be changed.
   * bounds - <mxRectangles> that represent the new bounds.
   * ignoreRelative - Boolean that indicates if relative cells should be ignored.
   * recurse - Optional boolean that specifies if the children should be resized.
   */
  const cellResized = (cell, bounds, ignoreRelative, recurse) => {
    const model = getModel();
    const prev = model.getGeometry(cell);

    if (isSet(prev) && !prev.equals(bounds)) {
      const geo = prev.clone();

      if (!ignoreRelative && geo.isRelative()) {
        const offset = geo.getOffset();

        if (isSet(offset)) {
          offset.setX(offset.getX() + bounds.getX() - geo.getX());
          offset.setY(offset.getY() + bounds.getY() - geo.getY());
        }
      } else {
        geo.setX(bounds.getX());
        geo.setY(bounds.getY());
      }

      geo.setWidth(bounds.getWidth());
      geo.setHeight(bounds.getHeight());

      if (
        !geo.isRelative() &&
        model.isVertex(cell) &&
        !isAllowNegativeCoordinates()
      ) {
        geo.setX(Math.max(0, geo.getX()));
        geo.setY(Math.max(0, geo.getY()));
      }

      model.beginUpdate();

      try {
        if (recurse) {
          resizeChildCells(cell, geo);
        }

        model.setGeometry(cell, geo);
        constrainChildCells(cell);
      } finally {
        model.endUpdate();
      }
    }

    return prev;
  };

  /**
   * Function: resizeChildCells
   *
   * Resizes the child cells of the given cell for the given new geometry with
   * respect to the current geometry of the cell.
   *
   * Parameters:
   *
   * cell - <mxCell> that has been resized.
   * newGeo - <mxGeometry> that represents the new bounds.
   */
  const resizeChildCells = (cell, newGeo) => {
    const model = getModel();
    const geo = model.getGeometry(cell);
    const dx = geo.getWidth() !== 0 ? newGeo.getWidth() / geo.getWidth() : 1;
    const dy = geo.getHeight() !== 0 ? newGeo.getHeight() / geo.getHeight() : 1;
    const childCount = model.getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      scaleCell(model.getChildAt(cell, i), dx, dy, true);
    }
  };

  /**
   * Function: constrainChildCells
   *
   * Constrains the children of the given cell using <constrainChild>.
   *
   * Parameters:
   *
   * cell - <mxCell> that has been resized.
   */
  const constrainChildCells = (cell) => {
    const model = getModel();
    const childCount = model.getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      constrainChild(model.getChildAt(cell, i));
    }
  };

  /**
   * Function: scaleCell
   *
   * Scales the points, position and size of the given cell according to the
   * given vertical and horizontal scaling factors.
   *
   * Parameters:
   *
   * cell - <mxCell> whose geometry should be scaled.
   * dx - Horizontal scaling factor.
   * dy - Vertical scaling factor.
   * recurse - Boolean indicating if the child cells should be scaled.
   */
  const scaleCell = (cell, dx, dy, recurse) => {
    const model = getModel();
    let geo = model.getGeometry(cell);

    if (isSet(geo)) {
      const style = getCurrentCellStyle(cell);
      geo = geo.clone();

      // Stores values for restoring based on style
      const x = geo.getX();
      const y = geo.getY();
      const w = geo.getWidth();
      const h = geo.getHeight();

      geo.scale(dx, dy, style[STYLE_ASPECT] === 'fixed');

      if (style[STYLE_RESIZE_WIDTH] === '1') {
        geo.setWidth(w * dx);
      } else if (style[STYLE_RESIZE_WIDTH] === '0') {
        geo.setWidth(w);
      }

      if (style[STYLE_RESIZE_HEIGHT] === '1') {
        geo.setHeight(h * dy);
      } else if (style[STYLE_RESIZE_HEIGHT] === '0') {
        geo.setHeight(h);
      }

      if (!isCellMovable(cell)) {
        geo.setX(x);
        geo.setY(y);
      }

      if (!isCellResizable(cell)) {
        geo.setWidth(w);
        geo.setHeight(h);
      }

      if (model.isVertex(cell)) {
        cellResized(cell, geo, true, recurse);
      } else {
        model.setGeometry(cell, geo);
      }
    }
  };

  /**
   * Function: extendParent
   *
   * Resizes the parents recursively so that they contain the complete area
   * of the resized child cell.
   *
   * Parameters:
   *
   * cell - <mxCell> that has been resized.
   */
  const extendParent = (cell) => {
    if (isSet(cell)) {
      const parent = getModel().getParent(cell);
      let p = getCellGeometry(parent);

      if (isSet(parent) && isSet(p) && !isCellCollapsed(parent)) {
        const geo = getCellGeometry(cell);

        if (
          isSet(geo) &&
          !geo.isRelative() &&
          (p.getWidth() < geo.getX() + geo.getWidth() ||
            p.getHeight() < geo.getY() + geo.getHeight())
        ) {
          p = p.clone();

          p.setWidth(Math.max(p.getWidth(), geo.getX() + geo.getWidth()));
          p.setHeight(Math.max(p.getHeight(), geo.getY() + geo.getHeight()));

          cellsResized([parent], [p], false);
        }
      }
    }
  };

  /**
   * Group: Cell moving
   */

  /**
   * Function: importCells
   *
   * Clones and inserts the given cells into the graph using the move
   * method and returns the inserted cells. This shortcut is used if
   * cells are inserted via datatransfer.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be imported.
   * dx - Integer that specifies the x-coordinate of the vector. Default is 0.
   * dy - Integer that specifies the y-coordinate of the vector. Default is 0.
   * target - <mxCell> that represents the new parent of the cells.
   * evt - Mouseevent that triggered the invocation.
   * mapping - Optional mapping for existing clones.
   */
  const importCells = (cells, dx, dy, target, evt, mapping) =>
    moveCells(cells, dx, dy, true, target, evt, mapping);

  /**
   * Function: moveCells
   *
   * Moves or clones the specified cells and moves the cells or clones by the
   * given amount, adding them to the optional target cell. The evt is the
   * mouse event as the mouse was released. The change is carried out using
   * <cellsMoved>. This method fires <mxEvent.MOVE_CELLS> while the
   * transaction is in progress. Returns the cells that were moved.
   *
   * Use the following code to move all cells in the graph.
   *
   * (code)
   * graph.moveCells(graph.getChildCells(null, true, true), 10, 10);
   * (end)
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be moved, cloned or added to the target.
   * dx - Integer that specifies the x-coordinate of the vector. Default is 0.
   * dy - Integer that specifies the y-coordinate of the vector. Default is 0.
   * clone - Boolean indicating if the cells should be cloned. Default is false.
   * target - <mxCell> that represents the new parent of the cells.
   * evt - Mouseevent that triggered the invocation.
   * mapping - Optional mapping for existing clones.
   */
  const moveCells = (
    cells,
    dx = 0,
    dy = 0,
    clone = false,
    target,
    evt,
    mapping
  ) => {
    const model = getModel();

    if (isSet(cells) && (dx !== 0 || dy !== 0 || clone || isSet(target))) {
      // Removes descendants with ancestors in cells to avoid multiple moving
      cells = model.getTopmostCells(cells);
      const origCells = cells;

      model.beginUpdate();

      try {
        // Faster cell lookups to remove relative edge labels with selected
        // terminals to avoid explicit and implicit move at same time
        const dict = Dictionary();

        for (let i = 0; i < cells.length; i++) {
          dict.put(cells[i], true);
        }

        const isSelected = (cell) => {
          while (isSet(cell)) {
            if (dict.get(cell)) {
              return true;
            }

            cell = model.getParent(cell);
          }

          return false;
        };

        // Removes relative edge labels with selected terminals
        const checked = [];

        for (let i = 0; i < cells.length; i++) {
          const geo = getCellGeometry(cells[i]);
          const parent = model.getParent(cells[i]);

          if (
            isUnset(geo) ||
            !geo.isRelative() ||
            !model.isEdge(parent) ||
            (!isSelected(model.getTerminal(parent, true)) &&
              !isSelected(model.getTerminal(parent, false)))
          ) {
            checked.push(cells[i]);
          }
        }

        cells = checked;

        if (clone) {
          cells = cloneCells(cells, isCloneInvalidEdges(), mapping);

          if (isUnset(target)) {
            target = getDefaultParent();
          }
        }

        // FIXME: Cells should always be inserted first before any other edit
        // to avoid forward references in sessions.
        // Need to disable allowNegativeCoordinates if target not null to
        // allow for temporary negative numbers until cellsAdded is called.
        const previous = isAllowNegativeCoordinates();

        if (isSet(target)) {
          setAllowNegativeCoordinates(true);
        }

        cellsMoved(
          cells,
          dx,
          dy,
          !clone && isDisconnectOnMove() && isAllowDanglingEdges(),
          isUnset(target),
          isExtendParentsOnMove() && isUnset(target)
        );

        setAllowNegativeCoordinates(previous);

        if (isSet(target)) {
          const index = model.getChildCount(target);
          cellsAdded(cells, target, index, undefined, undefined, true);

          // Restores parent edge on cloned edge labels
          if (clone) {
            for (let i = 0; i < cells.length; i++) {
              const geo = getCellGeometry(cells[i]);
              const parent = model.getParent(origCells[i]);

              if (
                isSet(geo) &&
                geo.isRelative() &&
                model.isEdge(parent) &&
                model.contains(parent)
              ) {
                model.add(parent, cells[i]);
              }
            }
          }
        }

        // Dispatches a move event
        fireEvent(
          EventObject(
            Event.MOVE_CELLS,
            'cells',
            cells,
            'dx',
            dx,
            'dy',
            dy,
            'clone',
            clone,
            'target',
            target,
            'event',
            evt
          )
        );
      } finally {
        model.endUpdate();
      }
    }

    return cells;
  };

  /**
   * Function: cellsMoved
   *
   * Moves the specified cells by the given vector, disconnecting the cells
   * using disconnectGraph is disconnect is true. This method fires
   * <mxEvent.CELLS_MOVED> while the transaction is in progress.
   */
  const cellsMoved = (cells, dx, dy, disconnect, constrain, extend = false) => {
    const model = getModel();

    if (isSet(cells) && (dx !== 0 || dy !== 0)) {
      model.beginUpdate();

      try {
        if (disconnect) {
          disconnectGraph(cells);
        }

        for (let i = 0; i < cells.length; i++) {
          translateCell(cells[i], dx, dy);

          if (extend && isExtendParent(cells[i])) {
            extendParent(cells[i]);
          } else if (constrain) {
            constrainChild(cells[i]);
          }
        }

        if (isResetEdgesOnMove()) {
          resetEdges(cells);
        }

        fireEvent(
          EventObject(
            Event.CELLS_MOVED,
            'cells',
            cells,
            'dx',
            dx,
            'dy',
            dy,
            'disconnect',
            disconnect
          )
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Function: translateCell
   *
   * Translates the geometry of the given cell and stores the new,
   * translated geometry in the model as an atomic change.
   */
  const translateCell = (cell, dx, dy) => {
    const model = getModel();
    let geo = model.getGeometry(cell);

    if (isSet(geo)) {
      dx = parseFloat(dx);
      dy = parseFloat(dy);
      geo = geo.clone();
      geo.translate(dx, dy);

      if (
        !geo.isRelative() &&
        model.isVertex(cell) &&
        !isAllowNegativeCoordinates()
      ) {
        geo.setX(Math.max(0, parseFloat(geo.getX())));
        geo.setY(Math.max(0, parseFloat(geo.getY())));
      }

      if (geo.isRelative() && !model.isEdge(cell)) {
        const parent = model.getParent(cell);
        let angle = 0;

        if (model.isVertex(parent)) {
          const style = getCurrentCellStyle(parent);
          angle = getValue(style, STYLE_ROTATION, 0);
        }

        if (angle !== 0) {
          const rad = toRadians(-angle);
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const pt = getRotatedPoint(Point(dx, dy), cos, sin, Point(0, 0));
          dx = pt.getX();
          dy = pt.getY();
        }

        if (isUnset(geo.getOffset())) {
          geo.setOffset(Point(dx, dy));
        } else {
          const offset = geo.getOffset();
          offset.setX(parseFloat(offset.getX()) + dx);
          offset.setY(parseFloat(offset.getY()) + dy);
        }
      }

      model.setGeometry(cell, geo);
    }
  };

  /**
   * Function: getCellContainmentArea
   *
   * Returns the <mxRectangle> inside which a cell is to be kept.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the area should be returned.
   */
  const getCellContainmentArea = (cell) => {
    const model = getModel();

    if (isSet(cell) && !model.isEdge(cell)) {
      const parent = model.getParent(cell);

      if (isSet(parent) && parent !== getDefaultParent()) {
        const g = model.getGeometry(parent);

        if (isSet(g)) {
          let x = 0;
          let y = 0;
          let w = g.getWidth();
          let h = g.getHeight();

          if (isSwimlane(parent)) {
            const size = getStartSize(parent);
            const style = getCurrentCellStyle(parent);
            const dir = getValue(style, STYLE_DIRECTION, DIRECTION_EAST);
            const flipH = getValue(style, STYLE_FLIPH, 0) === 1;
            const flipV = getValue(style, STYLE_FLIPV, 0) === 1;

            if (dir === DIRECTION_SOUTH || dir === DIRECTION_NORTH) {
              const tmp = size.getWidth();
              size.setWidth(size.getHeight());
              size.setHeight(tmp);
            }

            if (
              (dir === DIRECTION_EAST && !flipV) ||
              (dir === DIRECTION_NORTH && !flipH) ||
              (dir === DIRECTION_WEST && flipV) ||
              (dir === DIRECTION_SOUTH && flipH)
            ) {
              x = size.getWidth();
              y = size.getHeight();
            }

            w -= size.getWidth();
            h -= size.getHeight();
          }

          return Rectangle(x, y, w, h);
        }
      }
    }

    return;
  };

  /**
   * Function: constrainChild
   *
   * Keeps the given cell inside the bounds returned by
   * <getCellContainmentArea> for its parent, according to the rules defined by
   * <getOverlap> and <isConstrainChild>. This modifies the cell's geometry
   * in-place and does not clone it.
   *
   * Parameters:
   *
   * cells - <mxCell> which should be constrained.
   * sizeFirst - Specifies if the size should be changed first. Default is true.
   */
  const constrainChild = (cell, sizeFirst = true) => {
    const model = getModel();

    if (isSet(cell)) {
      const geo = getCellGeometry(cell);

      if (isSet(geo) && (isConstrainRelativeChildren() || !geo.isRelative())) {
        const parent = model.getParent(cell);
        const pgeo = getCellGeometry(parent);
        let max = getMaximumGraphBounds();

        // Finds parent offset
        if (isSet(max)) {
          const off = getBoundingBoxFromGeometry([parent], false);

          if (isSet(off)) {
            max = Rectangle.fromRectangle(max);

            max.setX(max.getX() - off.getX());
            max.setY(max.getY() - off.getY());
          }
        }

        if (isConstrainChild(cell)) {
          let tmp = getCellContainmentArea(cell);

          if (isSet(tmp)) {
            const overlap = getOverlap(cell);

            if (overlap > 0) {
              tmp = Rectangle.fromRectangle(tmp);

              tmp.setX(tmp.getX() - tmp.getWidth() * overlap);
              tmp.setY(tmp.getY() - tmp.getHeight() * overlap);
              tmp.setWidth(tmp.getWidth() + 2 * tmp.getWidth() * overlap);
              tmp.setHeight(tmp.getHeight() + 2 * tmp.getHeight() * overlap);
            }

            // Find the intersection between max and tmp
            if (isUnset(max)) {
              max = tmp;
            } else {
              max = Rectangle.fromRectangle(max);
              max.intersect(tmp);
            }
          }
        }

        if (isSet(max)) {
          const cells = [cell];

          if (!isCellCollapsed(cell)) {
            const desc = model.getDescendants(cell);

            for (let i = 0; i < desc.length; i++) {
              if (isCellVisible(desc[i])) {
                cells.push(desc[i]);
              }
            }
          }

          const bbox = getBoundingBoxFromGeometry(cells, false);

          if (isSet(bbox)) {
            geo = geo.clone();

            // Cumulative horizontal movement
            let dx = 0;

            if (geo.getWidth() > max.getWidth()) {
              dx = geo.getWidth() - max.getWidth();
              geo.setWidth(geo.getWidth() - dx);
            }

            if (bbox.getX() + bbox.getWidth() > max.getX() + max.getWidth()) {
              dx -=
                bbox.getX() +
                bbox.getWidth() -
                max.getX() -
                max.getWidth() -
                dx;
            }

            // Cumulative vertical movement
            let dy = 0;

            if (geo.getHeight() > max.getHeight()) {
              dy = geo.getHeight() - max.getHeight();
              geo.setHeight(geo.getHeight() - dy);
            }

            if (bbox.getY() + bbox.getHeight() > max.getY() + max.getHeight()) {
              dy -=
                bbox.getY() +
                bbox.getHeight() -
                max.getY() -
                max.getHeight() -
                dy;
            }

            if (bbox.getX() < max.getX()) {
              dx -= bbox.getX() - max.getX();
            }

            if (bbox.getY() < max.getY()) {
              dy -= bbox.getY() - max.getY();
            }

            if (dx !== 0 || dy !== 0) {
              if (geo.isRelative()) {
                const offset = geo.getOffset();

                // Relative geometries are moved via absolute offset
                if (isUnset(offset)) {
                  geo.setOffset(Point());
                }

                offset.setX(offset.getX() + dx);
                offset.setY(offset.getY() + dy);
              } else {
                geo.setX(geo.getX() + dx);
                geo.setY(geo.getY() + dy);
              }
            }

            model.setGeometry(cell, geo);
          }
        }
      }
    }
  };

  /**
   * Function: resetEdges
   *
   * Resets the control points of the edges that are connected to the given
   * cells if not both ends of the edge are in the given cells array.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> for which the connected edges should be
   * reset.
   */
  const resetEdges = (cells) => {
    const view = getView();
    const model = getModel();

    if (isSet(cells)) {
      // Prepares faster cells lookup
      const dict = Dictionary();

      for (let i = 0; i < cells.length; i++) {
        dict.put(cells[i], true);
      }

      model.beginUpdate();

      try {
        for (let i = 0; i < cells.length; i++) {
          const edges = model.getEdges(cells[i]);

          if (isSet(edges)) {
            for (let j = 0; j < edges.length; j++) {
              const state = view.getState(edges[j]);

              const source = isSet(state)
                ? state.getVisibleTerminal(true)
                : view.getVisibleTerminal(edges[j], true);
              const target = isSet(state)
                ? state.getVisibleTerminal(false)
                : view.getVisibleTerminal(edges[j], false);

              // Checks if one of the terminals is not in the given array
              if (!dict.get(source) || !dict.get(target)) {
                resetEdge(edges[j]);
              }
            }
          }

          resetEdges(model.getChildren(cells[i]));
        }
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Function: resetEdge
   *
   * Resets the control points of the given edge.
   *
   * Parameters:
   *
   * edge - <mxCell> whose points should be reset.
   */
  const resetEdge = (edge) => {
    const model = getModel();
    let geo = model.getGeometry(edge);

    // Resets the control points
    if (isSet(geo) && isSet(geo.getPoints()) && geo.getPoints().length > 0) {
      geo = geo.clone();
      geo.setPoints([]);
      model.setGeometry(edge, geo);
    }

    return edge;
  };

  /**
   * Group: Cell connecting and connection constraints
   */

  /**
   * Function: getOutlineConstraint
   *
   * Returns the constraint used to connect to the outline of the given state.
   */
  const getOutlineConstraint = (point, terminalState, mE) => {
    const shape = terminalState.getShape();
    const style = terminalState.getStyle();

    if (isSet(shape)) {
      const bounds = getView().getPerimeterBounds(terminalState);
      const direction = style[STYLE_DIRECTION];

      if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
        bounds.setX(
          bounds.getX() + (bounds.getWidth() / 2 - bounds.getHeight() / 2)
        );
        bounds.setY(
          bounds.getY() + (bounds.getHeight() / 2 - bounds.getWidth() / 2)
        );
        const tmp = bounds.getWidth();
        bounds.setWidth(bounds.getHeight());
        bounds.setHeight(tmp);
      }

      const alpha = toRadians(shape.getShapeRotation());

      if (alpha !== 0) {
        const cos = Math.cos(-alpha);
        const sin = Math.sin(-alpha);

        const ct = Point(bounds.getCenterX(), bounds.getCenterY());
        point = getRotatedPoint(point, cos, sin, ct);
      }

      let sx = 1;
      let sy = 1;
      let dx = 0;
      let dy = 0;

      // LATER: Add flipping support for image shapes
      if (getModel().isVertex(terminalState.getCell())) {
        let flipH = style[STYLE_FLIPH];
        let flipV = style[STYLE_FLIPV];

        if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
          const tmp = flipH;
          flipH = flipV;
          flipV = tmp;
        }

        if (flipH) {
          sx = -1;
          dx = -bounds.getWidth();
        }

        if (flipV) {
          sy = -1;
          dy = -bounds.getHeight();
        }
      }

      point = Point(
        (point.getX() - bounds.getX()) * sx - dx + bounds.getX(),
        (point.getY() - bounds.getY()) * sy - dy + bounds.getY()
      );

      const x =
        bounds.getWidth() === 0
          ? 0
          : Math.round(
              ((point.getX() - bounds.getX()) * 1000) / bounds.getWidth()
            ) / 1000;
      const y =
        bounds.getHeight() === 0
          ? 0
          : Math.round(
              ((point.getY() - bounds.getY()) * 1000) / bounds.getHeight()
            ) / 1000;

      return ConnectionConstraint(Point(x, y), false);
    }

    return;
  };

  /**
   * Function: getAllConnectionConstraints
   *
   * Returns an array of all <mxConnectionConstraints> for the given terminal. If
   * the shape of the given terminal is a <mxStencilShape> then the constraints
   * of the corresponding <mxStencil> are returned.
   *
   * Parameters:
   *
   * terminal - <mxCellState> that represents the terminal.
   * source - Boolean that specifies if the terminal is the source or target.
   */
  const getAllConnectionConstraints = (terminal, source) => {
    if (
      isSet(terminal) &&
      isSet(terminal.getShape()) &&
      isSet(terminal.getShape().getStencil())
    ) {
      return terminal.getShape().getStencil().getConstraints();
    }

    return;
  };

  /**
   * Function: getConnectionConstraint
   *
   * Returns an <mxConnectionConstraint> that describes the given connection
   * point. This result can then be passed to <getConnectionPoint>.
   *
   * Parameters:
   *
   * edge - <mxCellState> that represents the edge.
   * terminal - <mxCellState> that represents the terminal.
   * source - Boolean indicating if the terminal is the source or target.
   */
  const getConnectionConstraint = (edge, terminal, source) => {
    const style = edge.getStyle();
    let point;
    const x = style[source ? STYLE_EXIT_X : STYLE_ENTRY_X];

    if (isSet(x)) {
      const y = style[source ? STYLE_EXIT_Y : STYLE_ENTRY_Y];

      if (isSet(y)) {
        point = Point(parseFloat(x), parseFloat(y));
      }
    }

    let perimeter = false;
    let dx = 0,
      dy = 0;

    if (isSet(point)) {
      perimeter = getValue(
        style,
        source ? STYLE_EXIT_PERIMETER : STYLE_ENTRY_PERIMETER,
        true
      );

      //Add entry/exit offset
      dx = parseFloat(style[source ? STYLE_EXIT_DX : STYLE_ENTRY_DX]);
      dy = parseFloat(style[source ? STYLE_EXIT_DY : STYLE_ENTRY_DY]);

      dx = isFinite(dx) ? dx : 0;
      dy = isFinite(dy) ? dy : 0;
    }

    return ConnectionConstraint(point, perimeter, undefined, dx, dy);
  };

  /**
   * Function: setConnectionConstraint
   *
   * Sets the <mxConnectionConstraint> that describes the given connection point.
   * If no constraint is given then nothing is changed. To remove an existing
   * constraint from the given edge, use an empty constraint instead.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge.
   * terminal - <mxCell> that represents the terminal.
   * source - Boolean indicating if the terminal is the source or target.
   * constraint - Optional <mxConnectionConstraint> to be used for this
   * connection.
   */
  const setConnectionConstraint = (edge, terminal, source, constraint) => {
    if (isSet(constraint)) {
      getModel().beginUpdate();

      try {
        const point = constraint.getPoint();

        if (isUnset(constraint) || isUnset(point)) {
          setCellStyles(source ? STYLE_EXIT_X : STYLE_ENTRY_X, undefined, [
            edge
          ]);
          setCellStyles(source ? STYLE_EXIT_Y : STYLE_ENTRY_Y, undefined, [
            edge
          ]);
          setCellStyles(source ? STYLE_EXIT_DX : STYLE_ENTRY_DX, undefined, [
            edge
          ]);
          setCellStyles(source ? STYLE_EXIT_DY : STYLE_ENTRY_DY, undefined, [
            edge
          ]);
          setCellStyles(
            source ? STYLE_EXIT_PERIMETER : STYLE_ENTRY_PERIMETER,
            undefined,
            [edge]
          );
        } else if (isSet(point)) {
          setCellStyles(source ? STYLE_EXIT_X : STYLE_ENTRY_X, point.getX(), [
            edge
          ]);
          setCellStyles(source ? STYLE_EXIT_Y : STYLE_ENTRY_Y, point.getY(), [
            edge
          ]);
          setCellStyles(
            source ? STYLE_EXIT_DX : STYLE_ENTRY_DX,
            constraint.getDx(),
            [edge]
          );
          setCellStyles(
            source ? STYLE_EXIT_DY : STYLE_ENTRY_DY,
            constraint.getDy(),
            [edge]
          );

          // Only writes 0 since 1 is default
          if (!constraint.isPerimeter()) {
            setCellStyles(
              source ? STYLE_EXIT_PERIMETER : STYLE_ENTRY_PERIMETER,
              '0',
              [edge]
            );
          } else {
            setCellStyles(
              source ? STYLE_EXIT_PERIMETER : STYLE_ENTRY_PERIMETER,
              undefined,
              [edge]
            );
          }
        }
      } finally {
        getModel().endUpdate();
      }
    }
  };

  /**
   * Function: getConnectionPoint
   *
   * Returns the nearest point in the list of absolute points or the center
   * of the opposite terminal.
   *
   * Parameters:
   *
   * vertex - <mxCellState> that represents the vertex.
   * constraint - <mxConnectionConstraint> that represents the connection point
   * constraint as returned by <getConnectionConstraint>.
   */
  const getConnectionPoint = (vertex, constraint, round = true) => {
    let point;
    const cp = constraint.getPoint();

    if (isSet(vertex) && isSet(cp)) {
      const bounds = getView().getPerimeterBounds(vertex);
      const cx = Point(bounds.getCenterX(), bounds.getCenterY());
      const direction = vertex.getStyle()[STYLE_DIRECTION];
      let r1 = 0;

      // Bounds need to be rotated by 90 degrees for further computation
      if (
        isSet(direction) &&
        getValue(vertex.getStyle(), STYLE_ANCHOR_POINT_DIRECTION, 1) === 1
      ) {
        if (direction === DIRECTION_NORTH) {
          r1 += 270;
        } else if (direction === DIRECTION_WEST) {
          r1 += 180;
        } else if (direction === DIRECTION_SOUTH) {
          r1 += 90;
        }

        // Bounds need to be rotated by 90 degrees for further computation
        if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
          bounds.rotate90();
        }
      }

      const scale = getView().getScale();
      point = Point(
        bounds.getX() +
          cp.getX() * bounds.getWidth() +
          constraint.getDx() * scale,
        bounds.getY() +
          cp.getY() * bounds.getHeight() +
          constraint.getDy() * scale
      );

      // Rotation for direction before projection on perimeter
      let r2 = vertex.getStyle()[STYLE_ROTATION] || 0;

      if (constraint.isPerimeter()) {
        if (r1 !== 0) {
          // Only 90 degrees steps possible here so no trig needed
          let cos = 0;
          let sin = 0;

          if (r1 === 90) {
            sin = 1;
          } else if (r1 === 180) {
            cos = -1;
          } else if (r1 === 270) {
            sin = -1;
          }

          point = getRotatedPoint(point, cos, sin, cx);
        }

        point = getView().getPerimeterPoint(vertex, point, false);
      } else {
        r2 += r1;

        if (getModel().isVertex(vertex.getCell())) {
          let flipH = vertex.style[STYLE_FLIPH] === 1;
          let flipV = vertex.style[STYLE_FLIPV] === 1;

          if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
            const temp = flipH;
            flipH = flipV;
            flipV = temp;
          }

          if (flipH) {
            point.setX(2 * bounds.getCenterX() - point.getX());
          }

          if (flipV) {
            point.setY(2 * bounds.getCenterY() - point.getY());
          }
        }
      }

      // Generic rotation after projection on perimeter
      if (r2 !== 0 && isSet(point)) {
        const rad = toRadians(r2);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        point = getRotatedPoint(point, cos, sin, cx);
      }
    }

    if (round && isSet(point)) {
      point.setX(Math.round(point.getX()));
      point.setY(Math.round(point.getY()));
    }

    return point;
  };

  /**
   * Function: connectCell
   *
   * Connects the specified end of the given edge to the given terminal
   * using <cellConnected> and fires <mxEvent.CONNECT_CELL> while the
   * transaction is in progress. Returns the updated edge.
   *
   * Parameters:
   *
   * edge - <mxCell> whose terminal should be updated.
   * terminal - <mxCell> that represents the new terminal to be used.
   * source - Boolean indicating if the new terminal is the source or target.
   * constraint - Optional <mxConnectionConstraint> to be used for this
   * connection.
   */
  const connectCell = (edge, terminal, source, constraint) => {
    const model = getModel();

    model.beginUpdate();

    try {
      const previous = model.getTerminal(edge, source);
      cellConnected(edge, terminal, source, constraint);
      fireEvent(
        EventObject(
          Event.CONNECT_CELL,
          'edge',
          edge,
          'terminal',
          terminal,
          'source',
          source,
          'previous',
          previous
        )
      );
    } finally {
      model.endUpdate();
    }

    return edge;
  };

  /**
   * Function: cellConnected
   *
   * Sets the new terminal for the given edge and resets the edge points if
   * <resetEdgesOnConnect> is true. This method fires
   * <mxEvent.CELL_CONNECTED> while the transaction is in progress.
   *
   * Parameters:
   *
   * edge - <mxCell> whose terminal should be updated.
   * terminal - <mxCell> that represents the new terminal to be used.
   * source - Boolean indicating if the new terminal is the source or target.
   * constraint - <mxConnectionConstraint> to be used for this connection.
   */
  const cellConnected = (edge, terminal, source, constraint) => {
    const model = getModel();

    if (isSet(edge)) {
      model.beginUpdate();

      try {
        const previous = model.getTerminal(edge, source);

        // Updates the constraint
        setConnectionConstraint(edge, terminal, source, constraint);

        // Checks if the new terminal is a port, uses the ID of the port in the
        // style and the parent of the port as the actual terminal of the edge.
        if (isPortsEnabled()) {
          let id;

          if (isPort(terminal)) {
            id = terminal.getId();
            terminal = getTerminalForPort(terminal, source);
          }

          // Sets or resets all previous information for connecting to a child port
          const key = source ? STYLE_SOURCE_PORT : STYLE_TARGET_PORT;
          setCellStyles(key, id, [edge]);
        }

        model.setTerminal(edge, terminal, source);

        if (isResetEdgesOnConnect()) {
          resetEdge(edge);
        }

        fireEvent(
          EventObject(
            Event.CELL_CONNECTED,
            'edge',
            edge,
            'terminal',
            terminal,
            'source',
            source,
            'previous',
            previous
          )
        );
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Function: disconnectGraph
   *
   * Disconnects the given edges from the terminals which are not in the
   * given array.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be disconnected.
   */
  const disconnectGraph = (cells) => {
    const view = getView();
    const model = getModel();

    if (isSet(cells)) {
      model.beginUpdate();

      try {
        const scale = view.getScale();
        const tr = view.getTranslate();

        // Fast lookup for finding cells in array
        const dict = Dictionary();

        for (let i = 0; i < cells.length; i++) {
          dict.put(cells[i], true);
        }

        for (let i = 0; i < cells.length; i++) {
          if (model.isEdge(cells[i])) {
            let geo = model.getGeometry(cells[i]);

            if (isSet(geo)) {
              const state = view.getState(cells[i]);
              const pstate = view.getState(model.getParent(cells[i]));

              if (isSet(state) && isSet(pstate)) {
                geo = geo.clone();

                const dx = -pstate.getOrigin().getX();
                const dy = -pstate.getOrigin().getY();
                const pts = state.getAbsolutePoints();

                let src = model.getTerminal(cells[i], true);

                if (isSet(src) && isCellDisconnectable(cells[i], src, true)) {
                  while (isSet(src) && !dict.get(src)) {
                    src = model.getParent(src);
                  }

                  if (isUnset(src)) {
                    geo.setTerminalPoint(
                      Point(
                        pts[0].getX() / scale - tr.getX() + dx,
                        pts[0].getY() / scale - tr.getY() + dy
                      ),
                      true
                    );
                    model.setTerminal(cells[i], undefined, true);
                  }
                }

                let trg = model.getTerminal(cells[i], false);

                if (isSet(trg) && isCellDisconnectable(cells[i], trg, false)) {
                  while (isSet(trg) && !dict.get(trg)) {
                    trg = model.getParent(trg);
                  }

                  if (isUnset(trg)) {
                    const n = pts.length - 1;
                    geo.setTerminalPoint(
                      Point(
                        pts[n].getX() / scale - tr.getX() + dx,
                        pts[n].getY() / scale - tr.getY() + dy
                      ),
                      false
                    );
                    model.setTerminal(cells[i], undefined, false);
                  }
                }

                model.setGeometry(cells[i], geo);
              }
            }
          }
        }
      } finally {
        model.endUpdate();
      }
    }
  };

  /**
   * Group: Drilldown
   */

  /**
   * Function: getCurrentRoot
   *
   * Returns the current root of the displayed cell hierarchy. This is a
   * shortcut to <mxGraphView.currentRoot> in <view>.
   */
  const getCurrentRoot = () => getView().getCurrentRoot();

  /**
   * Function: getTranslateForRoot
   *
   * Returns the translation to be used if the given cell is the root cell as
   * an <mxPoint>. This implementation returns null.
   *
   * Example:
   *
   * To keep the children at their absolute position while stepping into groups,
   * this function can be overridden as follows.
   *
   * (code)
   * var offset = new mxPoint(0, 0);
   *
   * while (cell != null)
   * {
   *   var geo = this.model.getGeometry(cell);
   *
   *   if (geo != null)
   *   {
   *     offset.x -= geo.x;
   *     offset.y -= geo.y;
   *   }
   *
   *   cell = this.model.getParent(cell);
   * }
   *
   * return offset;
   * (end)
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the root.
   */
  const getTranslateForRoot = (cell) => undefined;

  /**
   * Function: isPort
   *
   * Returns true if the given cell is a "port", that is, when connecting to
   * it, the cell returned by getTerminalForPort should be used as the
   * terminal and the port should be referenced by the ID in either the
   * mxConstants.STYLE_SOURCE_PORT or the or the
   * mxConstants.STYLE_TARGET_PORT. Note that a port should not be movable.
   * This implementation always returns false.
   *
   * A typical implementation is the following:
   *
   * (code)
   * graph.isPort = function(cell)
   * {
   *   var geo = this.getCellGeometry(cell);
   *
   *   return (geo != null) ? geo.relative : false;
   * };
   * (end)
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the port.
   */
  const isPort = (cell) => false;

  /**
   * Function: getTerminalForPort
   *
   * Returns the terminal to be used for a given port. This implementation
   * always returns the parent cell.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the port.
   * source - If the cell is the source or target port.
   */
  const getTerminalForPort = (cell, source) => getModel().getParent(cell);

  /**
   * Function: getChildOffsetForCell
   *
   * Returns the offset to be used for the cells inside the given cell. The
   * root and layer cells may be identified using <mxGraphModel.isRoot> and
   * <mxGraphModel.isLayer>. For all other current roots, the
   * <mxGraphView.currentRoot> field points to the respective cell, so that
   * the following holds: cell == this.view.currentRoot. This implementation
   * returns null.
   *
   * Parameters:
   *
   * cell - <mxCell> whose offset should be returned.
   */
  const getChildOffsetForCell = (cell) => undefined;

  /**
   * Function: enterGroup
   *
   * Uses the given cell as the root of the displayed cell hierarchy. If no
   * cell is specified then the selection cell is used. The cell is only used
   * if <isValidRoot> returns true.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> to be used as the new root. Default is the
   * selection cell.
   */
  const enterGroup = (cell = getSelectionCell()) => {
    if (isSet(cell) && isValidRoot(cell)) {
      getView().setCurrentRoot(cell);
      clearSelection();
    }
  };

  /**
   * Function: exitGroup
   *
   * Changes the current root to the next valid root in the displayed cell
   * hierarchy.
   */
  const exitGroup = () => {
    const view = getView();
    const model = getModel();
    const root = model.getRoot();
    let current = getCurrentRoot();

    if (isSet(current)) {
      let next = model.getParent(current);

      // Finds the next valid root in the hierarchy
      while (
        next !== root &&
        !isValidRoot(next) &&
        model.getParent(next) !== root
      ) {
        next = model.getParent(next);
      }

      // Clears the current root if the new root is
      // the model's root or one of the layers.
      if (next === root || model.getParent(next) === root) {
        view.setCurrentRoot();
      } else {
        view.setCurrentRoot(next);
      }

      const state = view.getState(current);

      // Selects the previous root in the graph
      if (isSet(state)) {
        setSelectionCell(current);
      }
    }
  };

  /**
   * Function: home
   *
   * Uses the root of the model as the root of the displayed cell hierarchy
   * and selects the previous root.
   */
  const home = () => {
    const current = getCurrentRoot();

    if (isSet(current)) {
      getView().setCurrentRoot();
      const state = getView().getState(current);

      if (isSet(state)) {
        setSelectionCell(current);
      }
    }
  };

  /**
   * Function: isValidRoot
   *
   * Returns true if the given cell is a valid root for the cell display
   * hierarchy. This implementation returns true for all non-null values.
   *
   * Parameters:
   *
   * cell - <mxCell> which should be checked as a possible root.
   */
  const isValidRoot = (cell) => isSet(cell);

  /**
   * Function: getGraphBounds
   *
   * Returns the bounds of the visible graph. Shortcut to
   * <mxGraphView.getGraphBounds>. See also: <getBoundingBoxFromGeometry>.
   */
  const getGraphBounds = () => getView().getGraphBounds();

  /**
   * Function: getCellBounds
   *
   * Returns the scaled, translated bounds for the given cell. See
   * <mxGraphView.getBounds> for arrays.
   *
   * Parameters:
   *
   * cell - <mxCell> whose bounds should be returned.
   * includeEdge - Optional boolean that specifies if the bounds of
   * the connected edges should be included. Default is false.
   * includeDescendants - Optional boolean that specifies if the bounds
   * of all descendants should be included. Default is false.
   */
  const getCellBounds = (cell, includeEdges, includeDescendants) => {
    const model = getModel();
    let cells = [cell];

    // Includes all connected edges
    if (includeEdges) {
      cells = cells.concat(model.getEdges(cell));
    }

    let result = getView().getBounds(cells);

    // Recursively includes the bounds of the children
    if (includeDescendants) {
      const childCount = model.getChildCount(cell);

      for (let i = 0; i < childCount; i++) {
        const tmp = getCellBounds(
          model.getChildAt(cell, i),
          includeEdges,
          true
        );

        if (isSet(result)) {
          result.add(tmp);
        } else {
          result = tmp;
        }
      }
    }

    return result;
  };

  /**
   * Function: getBoundingBoxFromGeometry
   *
   * Returns the bounding box for the geometries of the vertices in the
   * given array of cells. This can be used to find the graph bounds during
   * a layout operation (ie. before the last endUpdate) as follows:
   *
   * (code)
   * var cells = graph.getChildCells(graph.getDefaultParent(), true, true);
   * var bounds = graph.getBoundingBoxFromGeometry(cells, true);
   * (end)
   *
   * This can then be used to move cells to the origin:
   *
   * (code)
   * if (bounds.x < 0 || bounds.y < 0)
   * {
   *   graph.moveCells(cells, -Math.min(bounds.x, 0), -Math.min(bounds.y, 0))
   * }
   * (end)
   *
   * Or to translate the graph view:
   *
   * (code)
   * if (bounds.x < 0 || bounds.y < 0)
   * {
   *   graph.view.setTranslate(-Math.min(bounds.x, 0), -Math.min(bounds.y, 0));
   * }
   * (end)
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounds should be returned.
   * includeEdges - Specifies if edge bounds should be included by computing
   * the bounding box for all points in geometry. Default is false.
   */
  const getBoundingBoxFromGeometry = (cells, includeEdges = false) => {
    const model = getModel();
    let result;

    if (isSet(cells)) {
      for (let i = 0; i < cells.length; i++) {
        if (includeEdges || model.isVertex(cells[i])) {
          // Computes the bounding box for the points in the geometry
          const geo = getCellGeometry(cells[i]);

          if (isSet(geo)) {
            let bbox;
            let tmp;

            if (model.isEdge(cells[i])) {
              const addPoint = (pt) => {
                if (isSet(pt)) {
                  if (isUnset(tmp)) {
                    tmp = Rectangle(pt.getX(), pt.getY(), 0, 0);
                  } else {
                    tmp.add(Rectangle(pt.getX(), pt.getY(), 0, 0));
                  }
                }
              };

              if (isUnset(model.getTerminal(cells[i], true))) {
                addPoint(geo.getTerminalPoint(true));
              }

              if (isUnset(model.getTerminal(cells[i], false))) {
                addPoint(geo.getTerminalPoint(false));
              }

              const pts = geo.getPoints;

              if (isSet(pts) && pts.length > 0) {
                tmp = Rectangle(pts[0].getX(), pts[0].getY(), 0, 0);

                for (var j = 1; j < pts.length; j++) {
                  addPoint(pts[j]);
                }
              }

              bbox = tmp;
            } else {
              const parent = model.getParent(cells[i]);

              if (geo.isRelative()) {
                if (
                  model.isVertex(parent) &&
                  parent !== getView().getCurrentRoot()
                ) {
                  tmp = getBoundingBoxFromGeometry([parent], false);

                  if (isSet(tmp)) {
                    bbox = Rectangle(
                      geo.getX() * tmp.getWidth(),
                      geo.getY() * tmp.getHeight(),
                      geo.getWidth(),
                      geo.getHeight()
                    );

                    if (cells.indexOf(parent) >= 0) {
                      bbox.setX(bbox.getX() + tmp.getX());
                      bbox.setY(bbox.getY() + tmp.getY());
                    }
                  }
                }
              } else {
                bbox = Rectangle.fromRectangle(geo);

                if (model.isVertex(parent) && cells.indexOf(parent) >= 0) {
                  tmp = getBoundingBoxFromGeometry([parent], false);

                  if (isSet(tmp)) {
                    bbox.setX(bbox.getX() + tmp.getX());
                    bbox.setY(bbox.getY() + tmp.getY());
                  }
                }
              }

              const offset = geo.getOffset();

              if (isSet(bbox) && isSet(offset)) {
                bbox.setX(bbox.getX() + offset.getX());
                bbox.setY(bbox.getY() + offset.getY());
              }

              const style = getCurrentCellStyle(cells[i]);

              if (isSet(bbox)) {
                const angle = getValue(style, STYLE_ROTATION, 0);

                if (angle !== 0) {
                  bbox = getBoundingBox(bbox, angle);
                }
              }
            }

            if (isSet(bbox)) {
              if (isUnset(result)) {
                result = Rectangle.fromRectangle(bbox);
              } else {
                result.add(bbox);
              }
            }
          }
        }
      }
    }

    return result;
  };

  /**
   * Function: refresh
   *
   * Clears all cell states or the states for the hierarchy starting at the
   * given cell and validates the graph. This fires a refresh event as the
   * last step.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> for which the cell states should be cleared.
   */
  const refresh = (cell) => {
    getView().clear(cell, isUnset(cell));
    getView().validate();
    sizeDidChange();
    fireEvent(EventObject(Event.REFRESH));
  };

  /**
   * Function: snap
   *
   * Snaps the given numeric value to the grid if <gridEnabled> is true.
   *
   * Parameters:
   *
   * value - Numeric value to be snapped to the grid.
   */
  const snap = (value) => {
    if (isGridEnabled()) {
      value = Math.round(value / getGridSize()) * getGridSize();
    }

    return value;
  };

  /**
   * Function: snapDelta
   *
   * Snaps the given delta with the given scaled bounds.
   */
  const snapDelta = (
    delta,
    bounds,
    ignoreGrid,
    ignoreHorizontal,
    ignoreVertical
  ) => {
    const t = getView().getTranslate();
    const s = getView().getScale();

    if (!ignoreGrid && isGridEnabled()) {
      const tol = getGridSize() * s * 0.5;

      if (!ignoreHorizontal) {
        const tx =
          bounds.getX() - (snap(bounds.getX() / s - t.getX()) + t.getX()) * s;

        if (Math.abs(delta.getX() - tx) < tol) {
          delta.setX(0);
        } else {
          delta.setX(snap(delta.getX() / s) * s - tx);
        }
      }

      if (!ignoreVertical) {
        const ty =
          bounds.getY() - (snap(bounds.getY() / s - t.getY()) + t.getY()) * s;

        if (Math.abs(delta.getY() - ty) < tol) {
          delta.setY(0);
        } else {
          delta.setY(snap(delta.getY() / s) * s - ty);
        }
      }
    } else {
      const tol = 0.5 * s;

      if (!ignoreHorizontal) {
        const tx =
          bounds.getX() -
          (Math.round(bounds.getX() / s - t.getX()) + t.getX()) * s;

        if (Math.abs(delta.getX() - tx) < tol) {
          delta.setX(0);
        } else {
          delta.setX(Math.round(delta.getX() / s) * s - tx);
        }
      }

      if (!ignoreVertical) {
        const ty =
          bounds.getY() -
          (Math.round(bounds.getY() / s - t.getY()) + t.getY()) * s;

        if (Math.abs(delta.getY() - ty) < tol) {
          delta.setY(0);
        } else {
          delta.setY(Math.round(delta.getY() / s) * s - ty);
        }
      }
    }

    return delta;
  };

  /**
   * Function: panGraph
   *
   * Shifts the graph display by the given amount. This is used to preview
   * panning operations, use <mxGraphView.setTranslate> to set a persistent
   * translation of the view. Fires <mxEvent.PAN>.
   *
   * Parameters:
   *
   * dx - Amount to shift the graph along the x-axis.
   * dy - Amount to shift the graph along the y-axis.
   */
  const panGraph = (dx, dy) => {
    const container = getContainer();

    if (isUseScrollbarsForPanning() && hasScrollbars(container)) {
      container.scrollLeft = -dx;
      container.scrollTop = -dy;
    } else {
      const canvas = getView().getCanvas();

      // Puts everything inside the container in a DIV so that it
      // can be moved without changing the state of the container
      if (dx === 0 && dy === 0) {
        canvas.removeAttribute('transform');

        const shiftPreview1 = getShiftPreview1();
        const shiftPreview2 = getShiftPreview2();

        if (isSet(shiftPreview1)) {
          let child = shiftPreview1.firstChild;

          while (isSet(child)) {
            const next = child.nextSibling;
            container.appendChild(child);
            child = next;
          }

          if (isSet(shiftPreview1.parentNode)) {
            shiftPreview1.parentNode.removeChild(shiftPreview1);
          }

          setShiftPreview1();

          container.appendChild(canvas.parentNode);

          child = shiftPreview2.firstChild;

          while (isSet(child)) {
            const next = child.nextSibling;
            container.appendChild(child);
            child = next;
          }

          if (isSet(shiftPreview2.parentNode)) {
            shiftPreview2.parentNode.removeChild(shiftPreview2);
          }

          setShiftPreview2();
        }
      } else {
        canvas.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');

        if (isUnset(getShiftPreview1())) {
          // Needs two divs for stuff before and after the SVG element
          const shiftPreview1 = setShiftPreview1(document.createElement('div'));
          shiftPreview1.style.position = 'absolute';
          shiftPreview1.style.overflow = 'visible';

          const shiftPreview2 = setShiftPreview2(document.createElement('div'));
          shiftPreview2.style.position = 'absolute';
          shiftPreview2.style.overflow = 'visible';

          let current = shiftPreview1;
          let child = container.firstChild;

          while (isSet(child)) {
            const next = child.nextSibling;

            // SVG element is moved via transform attribute
            if (child !== canvas.parentNode) {
              current.appendChild(child);
            } else {
              current = shiftPreview2;
            }

            child = next;
          }

          // Inserts elements only if not empty
          if (isSet(shiftPreview1.firstChild)) {
            container.insertBefore(shiftPreview1, canvas.parentNode);
          }

          if (isSet(shiftPreview2.firstChild)) {
            container.appendChild(shiftPreview2);
          }
        }

        getShiftPreview1().style.left = dx + 'px';
        getShiftPreview1().style.top = dy + 'px';
        getShiftPreview2().style.left = dx + 'px';
        getShiftPreview2().style.top = dy + 'px';
      }

      setPanDx(dx);
      setPanDy(dy);

      fireEvent(EventObject(Event.PAN));
    }
  };

  /**
   * Function: zoomIn
   *
   * Zooms into the graph by <zoomFactor>.
   */
  const zoomIn = () => zoom(getZoomFactor());

  /**
   * Function: zoomOut
   *
   * Zooms out of the graph by <zoomFactor>.
   */
  const zoomOut = () => zoom(1 / getZoomFactor());

  /**
   * Function: zoomActual
   *
   * Resets the zoom and panning in the view.
   */
  const zoomActual = () => {
    const view = getView();

    if (view.getScale() === 1) {
      view.setTranslate(0, 0);
    } else {
      view.getTranslate().setX(0);
      view.getTranslate().setY(0);

      view.setScale(1);
    }
  };

  /**
   * Function: zoomTo
   *
   * Zooms the graph to the given scale with an optional boolean center
   * argument, which is passd to <zoom>.
   */
  const zoomTo = (scale, center) => zoom(scale / getView().getScale(), center);

  /**
   * Function: center
   *
   * Centers the graph in the container.
   *
   * Parameters:
   *
   * horizontal - Optional boolean that specifies if the graph should be centered
   * horizontally. Default is true.
   * vertical - Optional boolean that specifies if the graph should be centered
   * vertically. Default is true.
   * cx - Optional float that specifies the horizontal center. Default is 0.5.
   * cy - Optional float that specifies the vertical center. Default is 0.5.
   */
  const center = (horizontal = true, vertical = true, cx = 0.5, cy = 0.5) => {
    const view = getView();
    const container = getContainer();
    const hasScrollbars = hasScrollbars(container);
    const padding = 2 * getBorder();
    const cw = container.clientWidth - padding;
    const ch = container.clientHeight - padding;
    const bounds = getGraphBounds();

    const t = view.getTranslate();
    const s = view.getScale();

    let dx = horizontal ? cw - bounds.getWidth() : 0;
    let dy = vertical ? ch - bounds.getHeight() : 0;

    if (!hasScrollbars) {
      view.setTranslate(
        horizontal
          ? Math.floor(t.getX() - bounds.getX() / s + (dx * cx) / s)
          : t.getX(),
        vertical
          ? Math.floor(t.getY() - bounds.getY() / s + (dy * cy) / s)
          : t.getY()
      );
    } else {
      bounds.setX(bounds.getX() - t.getX());
      bounds.setY(bounds.getY() - t.getY());

      const sw = container.scrollWidth;
      const sh = container.scrollHeight;

      if (sw > cw) {
        dx = 0;
      }

      if (sh > ch) {
        dy = 0;
      }

      view.setTranslate(
        Math.floor(dx / 2 - bounds.getX()),
        Math.floor(dy / 2 - bounds.getY())
      );
      container.scrollLeft = (sw - cw) / 2;
      container.scrollTop = (sh - ch) / 2;
    }
  };

  /**
   * Function: zoom
   *
   * Zooms the graph using the given factor. Center is an optional boolean
   * argument that keeps the graph scrolled to the center. If the center argument
   * is omitted, then <centerZoom> will be used as its value.
   */
  const zoom = (factor, center = getCenterZoom()) => {
    const view = getView();
    const container = getContainer();
    const scale = Math.round(view.getScale() * factor * 100) / 100;
    const state = view.getState(getSelectionCell());
    factor = scale / view.getScale();

    if (isKeepSelectionVisibleOnZoom() && isSet(state)) {
      const rect = Rectangle(
        state.getX() * factor,
        state.getY() * factor,
        state.getWidth() * factor,
        state.getHeight() * factor
      );

      // Refreshes the display only once if a scroll is carried out
      view.setScale(scale);

      if (!scrollRectToVisible(rect)) {
        view.revalidate();

        // Forces an event to be fired but does not revalidate again
        view.setScale(scale);
      }
    } else {
      const hasScrollbars = hasScrollbars(container);

      if (center && !hasScrollbars) {
        let dx = container.offsetWidth;
        let dy = container.offsetHeight;

        if (factor > 1) {
          const f = (factor - 1) / (scale * 2);
          dx *= -f;
          dy *= -f;
        } else {
          const f = (1 / factor - 1) / (view.getScale() * 2);
          dx *= f;
          dy *= f;
        }

        view.scaleAndTranslate(
          scale,
          view.getTranslate().getX() + dx,
          view.getTranslate().getY() + dy
        );
      } else {
        const translate = view.getTranslate();

        // Allows for changes of translate and scrollbars during setscale
        const tx = translate.getX();
        const ty = translate.getY();
        const sl = container.scrollLeft;
        const st = container.scrollTop;

        view.setScale(scale);

        if (hasScrollbars) {
          let dx = 0;
          let dy = 0;

          if (center) {
            dx = (container.offsetWidth * (factor - 1)) / 2;
            dy = (container.offsetHeight * (factor - 1)) / 2;
          }

          container.scrollLeft =
            (translate.getX() - tx) * view.scale + Math.round(sl * factor + dx);
          container.scrollTop =
            (translate.getY() - ty) * view.scale + Math.round(st * factor + dy);
        }
      }
    }
  };

  /**
   * Function: zoomToRect
   *
   * Zooms the graph to the specified rectangle. If the rectangle does not have same aspect
   * ratio as the display container, it is increased in the smaller relative dimension only
   * until the aspect match. The original rectangle is centralised within this expanded one.
   *
   * Note that the input rectangular must be un-scaled and un-translated.
   *
   * Parameters:
   *
   * rect - The un-scaled and un-translated rectangluar region that should be just visible
   * after the operation
   */
  const zoomToRect = (rect) => {
    const view = getView();
    const container = getContainer();

    const scaleX = container.clientWidth / rect.getWidth();
    const scaleY = container.clientHeight / rect.getHeight();
    const aspectFactor = scaleX / scaleY;

    // Remove any overlap of the rect outside the client area
    rect.setX(Math.max(0, rect.getX()));
    rect.setY(Math.max(0, rect.getY()));
    const rectRight = Math.min(
      container.scrollWidth,
      rect.getX() + rect.getWidth()
    );
    const rectBottom = Math.min(
      container.scrollHeight,
      rect.getY() + rect.getHeight()
    );
    rect.setWidth(rectRight - rect.getX());
    rect.setHeight(rectBottom - rect.getY());

    // The selection area has to be increased to the same aspect
    // ratio as the container, centred around the centre point of the
    // original rect passed in.
    if (aspectFactor < 1.0) {
      // Height needs increasing
      const newHeight = rect.getHeight() / aspectFactor;
      const deltaHeightBuffer = (newHeight - rect.getHeight()) / 2.0;
      rect.setHeight(newHeight);

      // Assign up to half the buffer to the upper part of the rect, not crossing 0
      // put the rest on the bottom
      const upperBuffer = Math.min(rect.getY(), deltaHeightBuffer);
      rect.setY(rect.getY() - upperBuffer);

      // Check if the bottom has extended too far
      rectBottom = Math.min(
        container.scrollHeight,
        rect.getY() + rect.getHeight()
      );
      rect.setHeight(rectBottom - rect.getY());
    } else {
      // Width needs increasing
      const newWidth = rect.getWidth() * aspectFactor;
      const deltaWidthBuffer = (newWidth - rect.getWidth()) / 2.0;
      rect.setWidth(newWidth);

      // Assign up to half the buffer to the upper part of the rect, not crossing 0
      // put the rest on the bottom
      const leftBuffer = Math.min(rect.getX(), deltaWidthBuffer);
      rect.setX(rect.getX() - leftBuffer);

      // Check if the right hand side has extended too far
      rectRight = Math.min(
        container.scrollWidth,
        rect.getX() + rect.getWidth()
      );
      rect.setWidth(rectRight - rect.getX());
    }

    const scale = container.clientWidth / rect.getWidth();
    const newScale = view.getScale() * scale;

    if (!hasScrollbars(container)) {
      view.scaleAndTranslate(
        newScale,
        view.getTranslate().getX() - rect.getX() / view.getScale(),
        view.getTranslate().getY() - rect.getY() / view.getScale()
      );
    } else {
      view.setScale(newScale);
      container.scrollLeft = Math.round(rect.getX() * scale);
      container.scrollTop = Math.round(rect.getY() * scale);
    }
  };

  /**
   * Function: scrollCellToVisible
   *
   * Pans the graph so that it shows the given cell. Optionally the cell may
   * be centered in the container.
   *
   * To center a given graph if the <container> has no scrollbars, use the following code.
   *
   * [code]
   * var bounds = graph.getGraphBounds();
   * graph.view.setTranslate(-bounds.x - (bounds.width - container.clientWidth) / 2,
   * 						   -bounds.y - (bounds.height - container.clientHeight) / 2);
   * [/code]
   *
   * Parameters:
   *
   * cell - <mxCell> to be made visible.
   * center - Optional boolean flag. Default is false.
   */
  const scrollCellToVisible = (cell, center) => {
    const view = getView();
    const translate = view.getTranslate();
    const container = getContainer();

    const x = -translate.getX();
    const y = -translate.getY();

    const state = view.getState(cell);

    if (isSet(state)) {
      const bounds = Rectangle(
        x + state.getX(),
        y + state.getY(),
        state.getWidth(),
        state.getHeight()
      );

      if (center && isSet(container)) {
        const w = container.clientWidth;
        const h = container.clientHeight;

        bounds.setX(bounds.getCenterX() - w / 2);
        bounds.setWidth(w);
        bounds.setY(bounds.getCenterY() - h / 2);
        bounds.setHeight(h);
      }

      const tr = Point(translate.getX(), translate.getY());

      if (scrollRectToVisible(bounds)) {
        // Triggers an update via the view's event source
        const tr2 = Point(translate.getX(), translate.getY());
        translate.setX(tr.getX());
        translate.setY(tr.getY());
        view.setTranslate(tr2.getX(), tr2.getY());
      }
    }
  };

  /**
   * Function: scrollRectToVisible
   *
   * Pans the graph so that it shows the given rectangle.
   *
   * Parameters:
   *
   * rect - <mxRectangle> to be made visible.
   */
  const scrollRectToVisible = (rect) => {
    const view = getView();
    const translate = view.getTranslate();
    const container = getContainer();

    let isChanged = false;

    if (isSet(rect)) {
      const w = container.offsetWidth;
      const h = container.offsetHeight;

      const widthLimit = Math.min(w, rect.getWidth());
      const heightLimit = Math.min(h, rect.getHeight());

      if (hasScrollbars(container)) {
        rect.setX(rect.getX() + translate.getX());
        rect.setY(rect.getY() + translate.getY());
        let dx = container.scrollLeft - rect.getX();
        const ddx = Math.max(dx - container.scrollLeft, 0);

        if (dx > 0) {
          container.scrollLeft -= dx + 2;
        } else {
          dx =
            rect.getX() +
            widthLimit -
            container.scrollLeft -
            container.clientWidth;

          if (dx > 0) {
            container.scrollLeft += dx + 2;
          }
        }

        let dy = container.scrollTop - rect.getY();
        const ddy = Math.max(0, dy - c.scrollTop);

        if (dy > 0) {
          container.scrollTop -= dy + 2;
        } else {
          dy =
            rect.getY() +
            heightLimit -
            container.scrollTop -
            container.clientHeight;

          if (dy > 0) {
            container.scrollTop += dy + 2;
          }
        }

        if (!useScrollbarsForPanning && (ddx != 0 || ddy != 0)) {
          view.setTranslate(ddx, ddy);
        }
      } else {
        const x = -translate.getX();
        const y = -translate.getY();

        const s = view.getScale();

        if (rect.getX() + widthLimit > x + w) {
          translate.setX(
            translate.getX() - (rect.getX() + widthLimit - w - x) / s
          );
          isChanged = true;
        }

        if (rect.getY() + heightLimit > y + h) {
          translate.setY(
            translate.getY() - (rect.getY() + heightLimit - h - y) / s
          );
          isChanged = true;
        }

        if (rect.getX() < x) {
          translate.setX(translate.getX() + (x - rect.getX()) / s);
          isChanged = true;
        }

        if (rect.getY() < y) {
          translate.setY(translate.getY() + (y - rect.getY()) / s);
          isChanged = true;
        }

        if (isChanged) {
          view.refresh();

          // Repaints selection marker (ticket 18)
          if (isSet(getSelectionCellsHandler())) {
            getSelectionCellsHandler().refresh();
          }
        }
      }
    }

    return isChanged;
  };

  /**
   * Function: getCellGeometry
   *
   * Returns the <mxGeometry> for the given cell. This implementation uses
   * <mxGraphModel.getGeometry>. Subclasses can override this to implement
   * specific geometries for cells in only one graph, that is, it can return
   * geometries that depend on the current state of the view.
   *
   * Parameters:
   *
   * cell - <mxCell> whose geometry should be returned.
   */
  const getCellGeometry = (cell) => getModel().getGeometry(cell);

  /**
   * Function: isCellVisible
   *
   * Returns true if the given cell is visible in this graph. This
   * implementation uses <mxGraphModel.isVisible>. Subclassers can override
   * this to implement specific visibility for cells in only one graph, that
   * is, without affecting the visible state of the cell.
   *
   * When using dynamic filter expressions for cell visibility, then the
   * graph should be revalidated after the filter expression has changed.
   *
   * Parameters:
   *
   * cell - <mxCell> whose visible state should be returned.
   */
  const isCellVisible = (cell) => getModel().isVisible(cell);

  /**
   * Function: isCellCollapsed
   *
   * Returns true if the given cell is collapsed in this graph. This
   * implementation uses <mxGraphModel.isCollapsed>. Subclassers can override
   * this to implement specific collapsed states for cells in only one graph,
   * that is, without affecting the collapsed state of the cell.
   *
   * When using dynamic filter expressions for the collapsed state, then the
   * graph should be revalidated after the filter expression has changed.
   *
   * Parameters:
   *
   * cell - <mxCell> whose collapsed state should be returned.
   */
  const isCellCollapsed = (cell) => getModel().isCollapsed(cell);

  /**
   * Function: isCellConnectable
   *
   * Returns true if the given cell is connectable in this graph. This
   * implementation uses <mxGraphModel.isConnectable>. Subclassers can override
   * this to implement specific connectable states for cells in only one graph,
   * that is, without affecting the connectable state of the cell in the model.
   *
   * Parameters:
   *
   * cell - <mxCell> whose connectable state should be returned.
   */
  const isCellConnectable = (cell) => getModel().isConnectable(cell);

  /**
   * Function: isOrthogonal
   *
   * Returns true if perimeter points should be computed such that the
   * resulting edge has only horizontal or vertical segments.
   *
   * Parameters:
   *
   * edge - <mxCellState> that represents the edge.
   */
  const isOrthogonal = (edge) => {
    const orthogonal = edge.getStyle()[STYLE_ORTHOGONAL];

    if (isSet(orthogonal)) {
      return orthogonal;
    }

    const tmp = getView().getEdgeStyle(edge);

    return (
      tmp === EdgeStyle.SegmentConnector ||
      tmp === EdgeStyle.ElbowConnector ||
      tmp === EdgeStyle.SideToSide ||
      tmp === EdgeStyle.TopToBottom ||
      tmp === EdgeStyle.EntityRelation ||
      tmp === EdgeStyle.OrthConnector
    );
  };

  /**
   * Function: isLoop
   *
   * Returns true if the given cell state is a loop.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents a potential loop.
   */
  const isLoop = (state) => {
    const src = state.getVisibleTerminalState(true);
    const trg = state.getVisibleTerminalState(false);

    return isSet(src) && src === trg;
  };

  /**
   * Function: isCloneEvent
   *
   * Returns true if the given event is a clone event. This implementation
   * returns true if control is pressed.
   */
  const isCloneEvent = (evt) => Event.isControlDown(evt);

  /**
   * Function: isTransparentClickEvent
   *
   * Hook for implementing click-through behaviour on selected cells. If this
   * returns true the cell behind the selected cell will be selected. This
   * implementation returns false;
   */
  const isTransparentClickEvent = (evt) => false;

  /**
   * Function: isToggleEvent
   *
   * Returns true if the given event is a toggle event. This implementation
   * returns true if the meta key (Cmd) is pressed on Macs or if control is
   * pressed on any other platform.
   */
  const isToggleEvent = (evt) =>
    IS_MAC ? Event.isMetaDown(evt) : Event.isControlDown(evt);

  /**
   * Function: isGridEnabledEvent
   *
   * Returns true if the given mouse event should be aligned to the grid.
   */
  const isGridEnabledEvent = (evt) => isSet(evt) && !Event.isAltDown(evt);

  /**
   * Function: isConstrainedEvent
   *
   * Returns true if the given mouse event should be aligned to the grid.
   */
  const isConstrainedEvent = (evt) => Event.isShiftDown(evt);

  /**
   * Function: isIgnoreTerminalEvent
   *
   * Returns true if the given mouse event should not allow any connections to be
   * made. This implementation returns false.
   */
  const isIgnoreTerminalEvent = (evt) => false;

  /**
   * Group: Validation
   */

  /**
   * Function: validationAlert
   *
   * Displays the given validation error in a dialog. This implementation uses
   * mxUtils.alert.
   */
  const validationAlert = (message) => alert(message);

  /**
   * Function: isEdgeValid
   *
   * Checks if the return value of <getEdgeValidationError> for the given
   * arguments is null.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to validate.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   */
  const isEdgeValid = (edge, source, target) =>
    isUnset(getEdgeValidationError(edge, source, target));

  /**
   * Function: getEdgeValidationError
   *
   * Returns the validation error message to be displayed when inserting or
   * changing an edges' connectivity. A return value of null means the edge
   * is valid, a return value of '' means it's not valid, but do not display
   * an error message. Any other (non-empty) string returned from this method
   * is displayed as an error message when trying to connect an edge to a
   * source and target. This implementation uses the <multiplicities>, and
   * checks <multigraph>, <allowDanglingEdges> and <allowLoops> to generate
   * validation errors.
   *
   * For extending this method with specific checks for source/target cells,
   * the method can be extended as follows. Returning an empty string means
   * the edge is invalid with no error message, a non-null string specifies
   * the error message, and null means the edge is valid.
   *
   * (code)
   * graph.getEdgeValidationError = function(edge, source, target)
   * {
   *   if (source != null && target != null &&
   *     this.model.getValue(source) != null &&
   *     this.model.getValue(target) != null)
   *   {
   *     if (target is not valid for source)
   *     {
   *       return 'Invalid Target';
   *     }
   *   }
   *
   *   // "Supercall"
   *   return mxGraph.prototype.getEdgeValidationError.apply(this, arguments);
   * }
   * (end)
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to validate.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   */
  const getEdgeValidationError = (edge, source, target) => {
    const model = getModel();

    if (
      isSet(edge) &&
      !isAllowDanglingEdges() &&
      (isUnset(source) || isUnset(target))
    ) {
      return '';
    }

    if (
      isSet(edge) &&
      isUnset(model.getTerminal(edge, true)) &&
      isUnset(model.getTerminal(edge, false))
    ) {
      return;
    }

    // Checks if we're dealing with a loop
    if (!isAllowLoops() && source === target && isSet(source)) {
      return '';
    }

    // Checks if the connection is generally allowed
    if (!isValidConnection(source, target)) {
      return '';
    }

    if (isSet(source) && isSet(target)) {
      let error = '';

      // Checks if the cells are already connected
      // and adds an error message if required
      if (!isMultigraph()) {
        const tmp = model.getEdgesBetween(source, target, true);

        // Checks if the source and target are not connected by another edge
        if (tmp.length > 1 || (tmp.length === 1 && tmp[0] !== edge)) {
          error += 'alreadyConnectedResource' + '\n';
        }
      }

      // Gets the number of outgoing edges from the source
      // and the number of incoming edges from the target
      // without counting the edge being currently changed.
      const sourceOut = model.getDirectedEdgeCount(source, true, edge);
      const targetIn = model.getDirectedEdgeCount(target, false, edge);

      // Checks the change against each multiplicity rule
      if (isSet(getMultiplicities())) {
        for (let i = 0; i < getMultiplicities().length; i++) {
          const err = getMultiplicities()[i].check(
            this,
            edge,
            source,
            target,
            sourceOut,
            targetIn
          );

          if (isSet(err)) {
            error += err;
          }
        }
      }

      // Validates the source and target terminals independently
      const err = validateEdge(edge, source, target);

      if (isSet(err)) {
        error += err;
      }

      return error.length > 0 ? error : undefined;
    }

    return isAllowDanglingEdges() ? undefined : '';
  };

  /**
   * Function: validateEdge
   *
   * Hook method for subclassers to return an error message for the given
   * edge and terminals. This implementation returns null.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to validate.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   */
  const validateEdge = (edge, source, target) => undefined;

  /**
   * Function: validateGraph
   *
   * Validates the graph by validating each descendant of the given cell or
   * the root of the model. Context is an object that contains the validation
   * state for the complete validation run. The validation errors are
   * attached to their cells using <setCellWarning>. Returns null in the case of
   * successful validation or an array of strings (warnings) in the case of
   * failed validations.
   *
   * Paramters:
   *
   * cell - Optional <mxCell> to start the validation recursion. Default is
   * the graph root.
   * context - Object that represents the global validation state.
   */
  const validateGraph = (cell = getModel().getRoot(), context = {}) => {
    const model = getModel();
    let isValid = true;
    const childCount = model.getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      const tmp = model.getChildAt(cell, i);
      let ctx = context;

      if (isValidRoot(tmp)) {
        ctx = {};
      }

      const warn = validateGraph(tmp, ctx);

      if (isSet(warn)) {
        setCellWarning(tmp, warn.replace(/\n/g, '<br>'));
      } else {
        setCellWarning(tmp, undefined);
      }

      isValid = isValid && isUnset(warn);
    }

    let warning = '';

    // Adds error for invalid children if collapsed (children invisible)
    if (isCellCollapsed(cell) && !isValid) {
      warning += 'containsValidationErrorsResource' + '\n';
    }

    // Checks edges and cells using the defined multiplicities
    if (model.isEdge(cell)) {
      warning +=
        getEdgeValidationError(
          cell,
          model.getTerminal(cell, true),
          model.getTerminal(cell, false)
        ) || '';
    } else {
      warning += getCellValidationError(cell) || '';
    }

    // Checks custom validation rules
    const err = validateCell(cell, context);

    if (isSet(err)) {
      warning += err;
    }

    // Updates the display with the warning icons
    // before any potential alerts are displayed.
    // LATER: Move this into addCellOverlay. Redraw
    // should check if overlay was added or removed.
    if (isUnset(model.getParent(cell))) {
      getView().validate();
    }

    return warning.length > 0 || !isValid ? warning : undefined;
  };

  /**
   * Function: getCellValidationError
   *
   * Checks all <multiplicities> that cannot be enforced while the graph is
   * being modified, namely, all multiplicities that require a minimum of
   * 1 edge.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the multiplicities should be checked.
   */
  const getCellValidationError = (cell) => {
    const model = getModel();
    const outCount = model.getDirectedEdgeCount(cell, true);
    const inCount = model.getDirectedEdgeCount(cell, false);
    const value = model.getValue(cell);
    const multiplicities = getMultiplicities();
    let error = '';

    if (isSet(multiplicities)) {
      for (let i = 0; i < multiplicities.length; i++) {
        const rule = multiplicities[i];

        if (
          rule.isSource() &&
          isNode(value, rule.getType(), rule.getAttr(), rule.getValue()) &&
          (outCount > rule.getMax() || outCount < rule.getMin())
        ) {
          error += rule.getCountError() + '\n';
        } else if (
          !rule.isSource() &&
          isNode(value, rule.getType(), rule.getAttr(), rule.getValue()) &&
          (inCount > rule.getMax() || inCount < rule.getMin())
        ) {
          error += rule.getCountError() + '\n';
        }
      }
    }

    return error.length > 0 ? error : undefined;
  };

  /**
   * Function: validateCell
   *
   * Hook method for subclassers to return an error message for the given
   * cell and validation context. This implementation returns null. Any HTML
   * breaks will be converted to linefeeds in the calling method.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the cell to validate.
   * context - Object that represents the global validation state.
   */
  const validateCell = (cell, context) => undefined;

  /**
   * Function: getFoldingImage
   *
   * Returns the <mxImage> used to display the collapsed state of
   * the specified cell state. This returns null for all edges.
   */
  const getFoldingImage = (state) => {
    if (
      isSet(state) &&
      isFoldingEnabled() &&
      !getModel().isEdge(state.getCell())
    ) {
      const tmp = isCellCollapsed(state.getCell());

      if (isCellFoldable(state.getCell(), !tmp)) {
        return tmp ? getCollapsedImage() : getExpandedImage();
      }
    }

    return;
  };

  /**
   * Function: convertValueToString
   *
   * Returns the textual representation for the given cell. This
   * implementation returns the nodename or string-representation of the user
   * object.
   *
   * Example:
   *
   * The following returns the label attribute from the cells user
   * object if it is an XML node.
   *
   * (code)
   * graph.convertValueToString = function(cell)
   * {
   * 	return cell.getAttribute('label');
   * }
   * (end)
   *
   * See also: <cellLabelChanged>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose textual representation should be returned.
   */
  const convertValueToString = (cell) => {
    const value = getModel().getValue(cell);

    if (isSet(value)) {
      if (isNode(value)) {
        return value.nodeName;
      } else if (typeof value.toString === 'function') {
        return value.toString();
      }
    }

    return '';
  };

  /**
   * Function: getLabel
   *
   * Returns a string or DOM node that represents the label for the given
   * cell. This implementation uses <convertValueToString> if <labelsVisible>
   * is true. Otherwise it returns an empty string.
   *
   * To truncate a label to match the size of the cell, the following code
   * can be used.
   *
   * (code)
   * graph.getLabel = function(cell)
   * {
   *   var label = mxGraph.prototype.getLabel.apply(this, arguments);
   *
   *   if (label != null && this.model.isVertex(cell))
   *   {
   *     var geo = this.getCellGeometry(cell);
   *
   *     if (geo != null)
   *     {
   *       var max = parseInt(geo.width / 8);
   *
   *       if (label.length > max)
   *       {
   *         label = label.substring(0, max)+'...';
   *       }
   *     }
   *   }
   *   return mxUtils.htmlEntities(label);
   * }
   * (end)
   *
   * A resize listener is needed in the graph to force a repaint of the label
   * after a resize.
   *
   * (code)
   * graph.addListener(mxEvent.RESIZE_CELLS, function(sender, evt)
   * {
   *   var cells = evt.getProperty('cells');
   *
   *   for (var i = 0; i < cells.length; i++)
   *   {
   *     this.view.removeState(cells[i]);
   *   }
   * });
   * (end)
   *
   * Parameters:
   *
   * cell - <mxCell> whose label should be returned.
   */
  const getLabel = (cell) => {
    let result = '';

    if (isLabelsVisible() && isSet(cell)) {
      const style = getCurrentCellStyle(cell);

      if (!getValue(style, STYLE_NOLABEL, false)) {
        result = convertValueToString(cell);
      }
    }

    return result;
  };

  /**
   * Function: isHtmlLabel
   *
   * Returns true if the label must be rendered as HTML markup. The default
   * implementation returns <htmlLabels>.
   *
   * Parameters:
   *
   * cell - <mxCell> whose label should be displayed as HTML markup.
   */
  const isHtmlLabel = (cell) => isHtmlLabels();

  /**
   * Function: isWrapping
   *
   * This enables wrapping for HTML labels.
   *
   * Returns true if no white-space CSS style directive should be used for
   * displaying the given cells label. This implementation returns true if
   * <mxConstants.STYLE_WHITE_SPACE> in the style of the given cell is 'wrap'.
   *
   * This is used as a workaround for IE ignoring the white-space directive
   * of child elements if the directive appears in a parent element. It
   * should be overridden to return true if a white-space directive is used
   * in the HTML markup that represents the given cells label. In order for
   * HTML markup to work in labels, <isHtmlLabel> must also return true
   * for the given cell.
   *
   * Example:
   *
   * (code)
   * graph.getLabel = function(cell)
   * {
   *   var tmp = mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"
   *
   *   if (this.model.isEdge(cell))
   *   {
   *     tmp = '<div style="width: 150px; white-space:normal;">'+tmp+'</div>';
   *   }
   *
   *   return tmp;
   * }
   *
   * graph.isWrapping = function(state)
   * {
   * 	 return this.model.isEdge(state.cell);
   * }
   * (end)
   *
   * Makes sure no edge label is wider than 150 pixels, otherwise the content
   * is wrapped. Note: No width must be specified for wrapped vertex labels as
   * the vertex defines the width in its geometry.
   *
   * Parameters:
   *
   * state - <mxCell> whose label should be wrapped.
   */
  const isWrapping = (cell) =>
    getCurrentCellStyle(cell)[STYLE_WHITE_SPACE] === 'wrap';

  /**
   * Function: isLabelClipped
   *
   * Returns true if the overflow portion of labels should be hidden. If this
   * returns true then vertex labels will be clipped to the size of the vertices.
   * This implementation returns true if <mxConstants.STYLE_OVERFLOW> in the
   * style of the given cell is 'hidden'.
   *
   * Parameters:
   *
   * state - <mxCell> whose label should be clipped.
   */
  const isLabelClipped = (cell) =>
    getCurrentCellStyle(cell)[STYLE_OVERFLOW] === 'hidden';

  /**
   * Function: getTooltip
   *
   * Returns the string or DOM node that represents the tooltip for the given
   * state, node and coordinate pair. This implementation checks if the given
   * node is a folding icon or overlay and returns the respective tooltip. If
   * this does not result in a tooltip, the handler for the cell is retrieved
   * from <selectionCellsHandler> and the optional getTooltipForNode method is
   * called. If no special tooltip exists here then <getTooltipForCell> is used
   * with the cell in the given state as the argument to return a tooltip for the
   * given state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose tooltip should be returned.
   * node - DOM node that is currently under the mouse.
   * x - X-coordinate of the mouse.
   * y - Y-coordinate of the mouse.
   */
  const getTooltip = (state, node, x, y) => {
    let tip;

    if (isSet(state)) {
      // Checks if the mouse is over the folding icon
      if (
        isSet(state.getControl()) &&
        (node === state.getControl().getNode() ||
          node.parentNode === state.getControl().getNode())
      ) {
        tip = 'collapseExpandResource';
        tip = htmlEntities(tip).replace(/\\n/g, '<br>');
      }

      if (isUnset(tip) && isSet(state.getOverlays())) {
        state.getOverlays().visit((id, shape) => {
          // LATER: Exit loop if tip is not null
          if (
            isUnset(tip) &&
            (node === shape.getNode() || node.parentNode === shape.getNode())
          ) {
            tip = shape.getOverlay().toString();
          }
        });
      }

      if (isUnset(tip)) {
        const handler = getSelectionCellsHandler().getHandler(state.getCell());

        if (isSet(handler) && typeof handler.getTooltipForNode === 'function') {
          tip = handler.getTooltipForNode(node);
        }
      }

      if (isUnset(tip)) {
        tip = getTooltipForCell(state.getCell());
      }
    }

    return tip;
  };

  /**
   * Function: getTooltipForCell
   *
   * Returns the string or DOM node to be used as the tooltip for the given
   * cell. This implementation uses the cells getTooltip function if it
   * exists, or else it returns <convertValueToString> for the cell.
   *
   * Example:
   *
   * (code)
   * graph.getTooltipForCell = function(cell)
   * {
   *   return 'Hello, World!';
   * }
   * (end)
   *
   * Replaces all tooltips with the string Hello, World!
   *
   * Parameters:
   *
   * cell - <mxCell> whose tooltip should be returned.
   */
  const getTooltipForCell = (cell) => {
    let tip;

    if (isSet(cell) && isSet(cell.getTooltip)) {
      tip = cell.getTooltip();
    } else {
      tip = convertValueToString(cell);
    }

    return tip;
  };

  /**
   * Function: getLinkForCell
   *
   * Returns the string to be used as the link for the given cell. This
   * implementation returns null.
   *
   * Parameters:
   *
   * cell - <mxCell> whose tooltip should be returned.
   */
  const getLinkForCell = (cell) => undefined;

  /**
   * Function: getCursorForMouseEvent
   *
   * Returns the cursor value to be used for the CSS of the shape for the
   * given event. This implementation calls <getCursorForCell>.
   *
   * Parameters:
   *
   * me - <mxMouseEvent> whose cursor should be returned.
   */
  const getCursorForMouseEvent = (mE) => getCursorForCell(mE.getCell());

  /**
   * Function: getCursorForCell
   *
   * Returns the cursor value to be used for the CSS of the shape for the
   * given cell. This implementation returns null.
   *
   * Parameters:
   *
   * cell - <mxCell> whose cursor should be returned.
   */
  const getCursorForCell = (cell) => undefined;

  /**
   * Function: getStartSize
   *
   * Returns the start size of the given swimlane, that is, the width or
   * height of the part that contains the title, depending on the
   * horizontal style. The return value is an <mxRectangle> with either
   * width or height set as appropriate.
   *
   * Parameters:
   *
   * swimlane - <mxCell> whose start size should be returned.
   * ignoreState - Optional boolean that specifies if cell state should be ignored.
   */
  const getStartSize = (swimlane, ignoreState) => {
    const result = Rectangle();
    const style = getCurrentCellStyle(swimlane, ignoreState);
    const size = parseInt(getValue(style, STYLE_STARTSIZE, DEFAULT_STARTSIZE));

    if (getValue(style, STYLE_HORIZONTAL, true)) {
      result.setHeight(size);
    } else {
      result.setWidth(size);
    }

    return result;
  };

  /**
   * Function: getSwimlaneDirection
   *
   * Returns the direction for the given swimlane style.
   */
  const getSwimlaneDirection = (style) => {
    const dir = getValue(style, STYLE_DIRECTION, DIRECTION_EAST);
    const flipH = getValue(style, STYLE_FLIPH, 0) === 1;
    const flipV = getValue(style, STYLE_FLIPV, 0) === 1;
    const h = getValue(style, STYLE_HORIZONTAL, true);
    let n = h ? 0 : 3;

    if (dir === DIRECTION_NORTH) {
      n--;
    } else if (dir === DIRECTION_WEST) {
      n += 2;
    } else if (dir === DIRECTION_SOUTH) {
      n += 1;
    }

    const mod = mod(n, 2);

    if (flipH && mod === 1) {
      n += 2;
    }

    if (flipV && mod === 0) {
      n += 2;
    }

    return [DIRECTION_NORTH, DIRECTION_EAST, DIRECTION_SOUTH, DIRECTION_WEST][
      mod(n, 4)
    ];
  };

  /**
   * Function: getActualStartSize
   *
   * Returns the actual start size of the given swimlane taking into account
   * direction and horizontal and vertial flip styles. The start size is
   * returned as an <mxRectangle> where top, left, bottom, right start sizes
   * are returned as x, y, height and width, respectively.
   *
   * Parameters:
   *
   * swimlane - <mxCell> whose start size should be returned.
   * ignoreState - Optional boolean that specifies if cell state should be ignored.
   */
  const getActualStartSize = (swimlane, ignoreState) => {
    const result = Rectangle();

    if (isSwimlane(swimlane, ignoreState)) {
      const style = getCurrentCellStyle(swimlane, ignoreState);
      const size = parseInt(
        getValue(style, STYLE_STARTSIZE, DEFAULT_STARTSIZE)
      );
      const dir = getSwimlaneDirection(style);

      if (dir === DIRECTION_NORTH) {
        result.setY(size);
      } else if (dir === DIRECTION_WEST) {
        result.setX(size);
      } else if (dir === DIRECTION_SOUTH) {
        result.setHeight(size);
      } else {
        result.setWidth(size);
      }
    }

    return result;
  };

  /**
   * Function: getImage
   *
   * Returns the image URL for the given cell state. This implementation
   * returns the value stored under <mxConstants.STYLE_IMAGE> in the cell
   * style.
   *
   * Parameters:
   *
   * state - <mxCellState> whose image URL should be returned.
   */
  const getImage = (state) => state?.style?.[STYLE_IMAGE];

  /**
   * Function: isTransparentState
   *
   * Returns true if the given state has no stroke- or fillcolor and no image.
   *
   * Parameters:
   *
   * state - <mxCellState> to check.
   */
  const isTransparentState = (state) => {
    let result = false;

    if (isSet(state)) {
      const stroke = getValue(state.getStyle(), STYLE_STROKECOLOR, NONE);
      const fill = getValue(state.getStyle(), STYLE_FILLCOLOR, NONE);

      result = stroke === NONE && fill === NONE && isUnset(getImage(state));
    }

    return result;
  };

  /**
   * Function: getVerticalAlign
   *
   * Returns the vertical alignment for the given cell state. This
   * implementation returns the value stored under
   * <mxConstants.STYLE_VERTICAL_ALIGN> in the cell style.
   *
   * Parameters:
   *
   * state - <mxCellState> whose vertical alignment should be
   * returned.
   */
  const getVerticalAlign = (state) =>
    state?.style?.[STYLE_VERTICAL_ALIGN] || ALIGN_MIDDLE;

  /**
   * Function: getIndicatorColor
   *
   * Returns the indicator color for the given cell state. This
   * implementation returns the value stored under
   * <mxConstants.STYLE_INDICATOR_COLOR> in the cell style.
   *
   * Parameters:
   *
   * state - <mxCellState> whose indicator color should be
   * returned.
   */
  const getIndicatorColor = (state) => state?.style?.[STYLE_INDICATOR_COLOR];

  /**
   * Function: getIndicatorGradientColor
   *
   * Returns the indicator gradient color for the given cell state. This
   * implementation returns the value stored under
   * <mxConstants.STYLE_INDICATOR_GRADIENTCOLOR> in the cell style.
   *
   * Parameters:
   *
   * state - <mxCellState> whose indicator gradient color should be
   * returned.
   */
  const getIndicatorGradientColor = (state) =>
    state?.style?.[STYLE_INDICATOR_GRADIENTCOLOR];

  /**
   * Function: getIndicatorShape
   *
   * Returns the indicator shape for the given cell state. This
   * implementation returns the value stored under
   * <mxConstants.STYLE_INDICATOR_SHAPE> in the cell style.
   *
   * Parameters:
   *
   * state - <mxCellState> whose indicator shape should be returned.
   */
  const getIndicatorShape = (state) => state?.style?.[STYLE_INDICATOR_SHAPE];

  /**
   * Function: getIndicatorImage
   *
   * Returns the indicator image for the given cell state. This
   * implementation returns the value stored under
   * <mxConstants.STYLE_INDICATOR_IMAGE> in the cell style.
   *
   * Parameters:
   *
   * state - <mxCellState> whose indicator image should be returned.
   */
  const getIndicatorImage = (state) => state?.style?.[STYLE_INDICATOR_IMAGE];

  /**
   * Function: isSwimlane
   *
   * Returns true if the given cell is a swimlane in the graph. A swimlane is
   * a container cell with some specific behaviour. This implementation
   * checks if the shape associated with the given cell is a <mxSwimlane>.
   *
   * Parameters:
   *
   * cell - <mxCell> to be checked.
   * ignoreState - Optional boolean that specifies if the cell state should be ignored.
   */
  const isSwimlane = (cell, ignoreState) => {
    if (
      isSet(cell) &&
      getModel().getParent(cell) !== getModel().getRoot() &&
      !getModel().isEdge(cell)
    ) {
      return (
        getCurrentCellStyle(cell, ignoreState)[STYLE_SHAPE] === SHAPE_SWIMLANE
      );
    }

    return false;
  };

  /**
   * Group: Graph behaviour
   */

  /**
   * Function: isCellLocked
   *
   * Returns true if the given cell may not be moved, sized, bended,
   * disconnected, edited or selected. This implementation returns true for
   * all vertices with a relative geometry if <locked> is false.
   *
   * Parameters:
   *
   * cell - <mxCell> whose locked state should be returned.
   */
  const isCellLocked = (cell) => {
    const geometry = getModel().getGeometry(cell);

    return (
      isCellsLocked() ||
      (isSet(geometry) && getModel().isVertex(cell) && geometry.isRelative())
    );
  };

  /**
   * Function: getCloneableCells
   *
   * Returns the cells which may be exported in the given array of cells.
   */
  const getCloneableCells = (cells) =>
    getModel().filterCells(cells, (cell) => isCellsCloneable(cell));

  /**
   * Function: isCellCloneable
   *
   * Returns true if the given cell is cloneable. This implementation returns
   * <isCellsCloneable> for all cells unless a cell style specifies
   * <mxConstants.STYLE_CLONEABLE> to be 0.
   *
   * Parameters:
   *
   * cell - Optional <mxCell> whose cloneable state should be returned.
   */
  const isCellCloneable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return isCellsCloneable() && style[STYLE_CLONEABLE] !== 0;
  };

  /**
   * Function: getExportableCells
   *
   * Returns the cells which may be exported in the given array of cells.
   */
  const getExportableCells = (cells) =>
    getModel().filterCells(cells, (cell) => canExportCell(cell));

  /**
   * Function: canExportCell
   *
   * Returns true if the given cell may be exported to the clipboard. This
   * implementation returns <exportEnabled> for all cells.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the cell to be exported.
   */
  const canExportCell = (cell) => isExportEnabled();

  /**
   * Function: getImportableCells
   *
   * Returns the cells which may be imported in the given array of cells.
   */
  const getImportableCells = (cells) =>
    getModel().filterCells(cells, (cell) => canImportCell(cell));

  /**
   * Function: canImportCell
   *
   * Returns true if the given cell may be imported from the clipboard.
   * This implementation returns <importEnabled> for all cells.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the cell to be imported.
   */
  const canImportCell = (cell) => isImportEnabled();

  /**
   * Function: isCellSelectable
   *
   * Returns true if the given cell is selectable. This implementation
   * returns <cellsSelectable>.
   *
   * To add a new style for making cells (un)selectable, use the following code.
   *
   * (code)
   * mxGraph.prototype.isCellSelectable = function(cell)
   * {
   *   var style = this.getCurrentCellStyle(cell);
   *
   *   return this.isCellsSelectable() && !this.isCellLocked(cell) && style['selectable'] != 0;
   * };
   * (end)
   *
   * You can then use the new style as shown in this example.
   *
   * (code)
   * graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30, 'selectable=0');
   * (end)
   *
   * Parameters:
   *
   * cell - <mxCell> whose selectable state should be returned.
   */
  const isCellSelectable = (cell) => isCellsSelectable();

  /**
   * Function: getDeletableCells
   *
   * Returns the cells which may be exported in the given array of cells.
   */
  const getDeletableCells = (cells) =>
    getModel().filterCells(cells, (cell) => isCellDeletable(cell));

  /**
   * Function: isCellDeletable
   *
   * Returns true if the given cell is moveable. This returns
   * <cellsDeletable> for all given cells if a cells style does not specify
   * <mxConstants.STYLE_DELETABLE> to be 0.
   *
   * Parameters:
   *
   * cell - <mxCell> whose deletable state should be returned.
   */
  const isCellDeletable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return isCellsDeletable() && style[STYLE_DELETABLE] !== 0;
  };

  /**
   * Function: isLabelMovable
   *
   * Returns true if the given edges's label is moveable. This returns
   * <movable> for all given cells if <isLocked> does not return true
   * for the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> whose label should be moved.
   */
  const isLabelMovable = (cell) =>
    !isCellLocked(cell) &&
    ((getModel().isEdge(cell) && isEdgeLabelsMovable()) ||
      (getModel().isVertex(cell) && isVertexLabelsMovable()));

  /**
   * Function: isCellRotatable
   *
   * Returns true if the given cell is rotatable. This returns true for the given
   * cell if its style does not specify <mxConstants.STYLE_ROTATABLE> to be 0.
   *
   * Parameters:
   *
   * cell - <mxCell> whose rotatable state should be returned.
   */
  const isCellRotatable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return style[STYLE_ROTATABLE] !== 0;
  };

  /**
   * Function: getMovableCells
   *
   * Returns the cells which are movable in the given array of cells.
   */
  const getMovableCells = (cells) =>
    getModel().filterCells(cells, (cell) => isCellMovable(cell));

  /**
   * Function: isCellMovable
   *
   * Returns true if the given cell is moveable. This returns <cellsMovable>
   * for all given cells if <isCellLocked> does not return true for the given
   * cell and its style does not specify <mxConstants.STYLE_MOVABLE> to be 0.
   *
   * Parameters:
   *
   * cell - <mxCell> whose movable state should be returned.
   */
  const isCellMovable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return (
      isCellsMovable() && !isCellLocked(cell) && style[STYLE_MOVABLE] !== 0
    );
  };

  /**
   * Function: isCellResizable
   *
   * Returns true if the given cell is resizable. This returns
   * <cellsResizable> for all given cells if <isCellLocked> does not return
   * true for the given cell and its style does not specify
   * <mxConstants.STYLE_RESIZABLE> to be 0.
   *
   * Parameters:
   *
   * cell - <mxCell> whose resizable state should be returned.
   */
  const isCellResizable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return (
      isCellsResizable() &&
      !isCellLocked(cell) &&
      getValue(style, STYLE_RESIZABLE, '1') !== '0'
    );
  };

  /**
   * Function: isTerminalPointMovable
   *
   * Returns true if the given terminal point is movable. This is independent
   * from <isCellConnectable> and <isCellDisconnectable> and controls if terminal
   * points can be moved in the graph if the edge is not connected. Note that it
   * is required for this to return true to connect unconnected edges. This
   * implementation returns true.
   *
   * Parameters:
   *
   * cell - <mxCell> whose terminal point should be moved.
   * source - Boolean indicating if the source or target terminal should be moved.
   */
  const isTerminalPointMovable = (cell, source) => true;

  /**
   * Function: isCellBendable
   *
   * Returns true if the given cell is bendable. This returns <cellsBendable>
   * for all given cells if <isLocked> does not return true for the given
   * cell and its style does not specify <mxConstants.STYLE_BENDABLE> to be 0.
   *
   * Parameters:
   *
   * cell - <mxCell> whose bendable state should be returned.
   */
  const isCellBendable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return (
      isCellsBendable() && !isCellLocked(cell) && style[STYLE_BENDABLE] !== 0
    );
  };

  /**
   * Function: isCellEditable
   *
   * Returns true if the given cell is editable. This returns <cellsEditable> for
   * all given cells if <isCellLocked> does not return true for the given cell
   * and its style does not specify <mxConstants.STYLE_EDITABLE> to be 0.
   *
   * Parameters:
   *
   * cell - <mxCell> whose editable state should be returned.
   */
  const isCellEditable = (cell) => {
    const style = getCurrentCellStyle(cell);

    return (
      isCellsEditable() && !isCellLocked(cell) && style[STYLE_EDITABLE] !== 0
    );
  };

  /**
   * Function: isCellDisconnectable
   *
   * Returns true if the given cell is disconnectable from the source or
   * target terminal. This returns <isCellsDisconnectable> for all given
   * cells if <isCellLocked> does not return true for the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> whose disconnectable state should be returned.
   * terminal - <mxCell> that represents the source or target terminal.
   * source - Boolean indicating if the source or target terminal is to be
   * disconnected.
   */
  const isCellDisconnectable = (cell, terminal, source) =>
    isCellsDisconnectable() && !isCellLocked(cell);

  /**
   * Function: isValidSource
   *
   * Returns true if the given cell is a valid source for new connections.
   * This implementation returns true for all non-null values and is
   * called by is called by <isValidConnection>.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents a possible source or null.
   */
  const isValidSource = (cell) =>
    (isUnset(cell) && isAllowDanglingEdges()) ||
    (isSet(cell) &&
      (!getModel().isEdge(cell) || isConnectableEdges()) &&
      isCellConnectable(cell));

  /**
   * Function: isValidTarget
   *
   * Returns <isValidSource> for the given cell. This is called by
   * <isValidConnection>.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents a possible target or null.
   */
  const isValidTarget = (cell) => isValidSource(cell);

  /**
   * Function: isValidConnection
   *
   * Returns true if the given target cell is a valid target for source.
   * This is a boolean implementation for not allowing connections between
   * certain pairs of vertices and is called by <getEdgeValidationError>.
   * This implementation returns true if <isValidSource> returns true for
   * the source and <isValidTarget> returns true for the target.
   *
   * Parameters:
   *
   * source - <mxCell> that represents the source cell.
   * target - <mxCell> that represents the target cell.
   */
  const isValidConnection = (source, target) =>
    isValidSource(source) && isValidTarget(target);

  /**
   * Function: setConnectable
   *
   * Specifies if the graph should allow new connections. This implementation
   * updates <mxConnectionHandler.enabled> in <connectionHandler>.
   *
   * Parameters:
   *
   * connectable - Boolean indicating if new connections should be allowed.
   */
  const setConnectable = (connectable) =>
    getConnectionHandler().setEnabled(connectable);

  /**
   * Function: isConnectable
   *
   * Returns true if the <connectionHandler> is enabled.
   */
  const isConnectable = () => getConnectionHandler().isEnabled();

  /**
   * Function: setTooltips
   *
   * Specifies if tooltips should be enabled. This implementation updates
   * <mxTooltipHandler.enabled> in <tooltipHandler>.
   *
   * Parameters:
   *
   * enabled - Boolean indicating if tooltips should be enabled.
   */
  const setTooltips = (enabled) => getTooltipHandler().setEnabled(enabled);

  /**
   * Function: setPanning
   *
   * Specifies if panning should be enabled. This implementation updates
   * <mxPanningHandler.panningEnabled> in <panningHandler>.
   *
   * Parameters:
   *
   * enabled - Boolean indicating if panning should be enabled.
   */
  const setPanning = (enabled) =>
    getPanningHandler().setPanningEnabled(enabled);

  /**
   * Function: isEditing
   *
   * Returns true if the given cell is currently being edited.
   * If no cell is specified then this returns true if any
   * cell is currently being edited.
   *
   * Parameters:
   *
   * cell - <mxCell> that should be checked.
   */
  const isEditing = (cell) => {
    if (isSet(getCellEditor())) {
      const editingCell = getCellEditor().getEditingCell();

      return isUnset(cell) ? isSet(editingCell) : cell === editingCell;
    }

    return false;
  };

  /**
   * Function: isAutoSizeCell
   *
   * Returns true if the size of the given cell should automatically be
   * updated after a change of the label. This implementation returns
   * <autoSizeCells> or checks if the cell style does specify
   * <mxConstants.STYLE_AUTOSIZE> to be 1.
   *
   * Parameters:
   *
   * cell - <mxCell> that should be resized.
   */
  const isAutoSizeCell = (cell) => {
    const style = getCurrentCellStyle(cell);

    return isAutoSizeCells() || style[STYLE_AUTOSIZE] === 1;
  };

  /**
   * Function: isExtendParent
   *
   * Returns true if the parent of the given cell should be extended if the
   * child has been resized so that it overlaps the parent. This
   * implementation returns <isExtendParents> if the cell is not an edge.
   *
   * Parameters:
   *
   * cell - <mxCell> that has been resized.
   */
  const isExtendParent = (cell) =>
    !getModel().isEdge(cell) && isExtendParents();

  /**
   * Function: isConstrainChild
   *
   * Returns true if the given cell should be kept inside the bounds of its
   * parent according to the rules defined by <getOverlap> and
   * <isAllowOverlapParent>. This implementation returns false for all children
   * of edges and <isConstrainChildren> otherwise.
   *
   * Parameters:
   *
   * cell - <mxCell> that should be constrained.
   */
  const isConstrainChild = (cell) =>
    isConstrainChildren() && !getModel().isEdge(getModel().getParent(cell));

  /**
   * Function: getOverlap
   *
   * Returns a decimal number representing the amount of the width and height
   * of the given cell that is allowed to overlap its parent. A value of 0
   * means all children must stay inside the parent, 1 means the child is
   * allowed to be placed outside of the parent such that it touches one of
   * the parents sides. If <isAllowOverlapParent> returns false for the given
   * cell, then this method returns 0.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the overlap ratio should be returned.
   */
  const getOverlap = (cell) =>
    isAllowOverlapParent(cell) ? getDefaultOverlap() : 0;

  /**
   * Function: isAllowOverlapParent
   *
   * Returns true if the given cell is allowed to be placed outside of the
   * parents area.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the child to be checked.
   */
  const isAllowOverlapParent = (cell) => false;

  /**
   * Function: getFoldableCells
   *
   * Returns the cells which are movable in the given array of cells.
   */
  const getFoldableCells = (cells, collapse) =>
    getModel().filterCells(cells, (cell) => isCellFoldable(cell, collapse));

  /**
   * Function: isCellFoldable
   *
   * Returns true if the given cell is foldable. This implementation
   * returns true if the cell has at least one child and its style
   * does not specify <mxConstants.STYLE_FOLDABLE> to be 0.
   *
   * Parameters:
   *
   * cell - <mxCell> whose foldable state should be returned.
   */
  const isCellFoldable = (cell, collapse) => {
    const style = getCurrentCellStyle(cell);

    return getModel().getChildCount(cell) > 0 && style[STYLE_FOLDABLE] !== 0;
  };

  /**
   * Function: isValidDropTarget
   *
   * Returns true if the given cell is a valid drop target for the specified
   * cells. If <splitEnabled> is true then this returns <isSplitTarget> for
   * the given arguments else it returns true if the cell is not collapsed
   * and its child count is greater than 0.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the possible drop target.
   * cells - <mxCells> that should be dropped into the target.
   * evt - Mouseevent that triggered the invocation.
   */
  const isValidDropTarget = (cell, cells, evt) =>
    isSet(cell) &&
    ((isSplitEnabled() && isSplitTarget(cell, cells, evt)) ||
      (!getModel().isEdge(cell) &&
        (isSwimlane(cell) ||
          (getModel().getChildCount(cell) > 0 && !isCellCollapsed(cell)))));

  /**
   * Function: isSplitTarget
   *
   * Returns true if the given edge may be splitted into two edges with the
   * given cell as a new terminal between the two.
   *
   * Parameters:
   *
   * target - <mxCell> that represents the edge to be splitted.
   * cells - <mxCells> that should split the edge.
   * evt - Mouseevent that triggered the invocation.
   */
  const isSplitTarget = (target, cells, evt) => {
    const model = getModel();

    if (
      model.isEdge(target) &&
      isSet(cells) &&
      cells.length == 1 &&
      isCellConnectable(cells[0]) &&
      isUnset(
        getEdgeValidationError(
          target,
          model.getTerminal(target, true),
          cells[0]
        )
      )
    ) {
      const src = model.getTerminal(target, true);
      const trg = model.getTerminal(target, false);

      return (
        !model.isAncestor(cells[0], src) && !model.isAncestor(cells[0], trg)
      );
    }

    return false;
  };

  /**
   * Function: getDropTarget
   *
   * Returns the given cell if it is a drop target for the given cells or the
   * nearest ancestor that may be used as a drop target for the given cells.
   * If the given array contains a swimlane and <swimlaneNesting> is false
   * then this always returns null. If no cell is given, then the bottommost
   * swimlane at the location of the given event is returned.
   *
   * This function should only be used if <isDropEnabled> returns true.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> which are to be dropped onto the target.
   * evt - Mouseevent for the drag and drop.
   * cell - <mxCell> that is under the mousepointer.
   * clone - Optional boolean to indicate of cells will be cloned.
   */
  const getDropTarget = (cells, evt, cell, clone) => {
    const model = getModel();

    if (!isSwimlaneNesting()) {
      for (let i = 0; i < cells.length; i++) {
        if (isSwimlane(cells[i])) {
          return;
        }
      }
    }

    const pt = convertPoint(
      getContainer(),
      Event.getClientX(evt),
      Event.getClientY(evt)
    );
    pt.setX(pt.getX() - getPanDx());
    pt.setY(pt.getY() - getPanDy());
    const swimlane = getSwimlaneAt(pt.getX(), pt.getY());

    if (isUnset(cell)) {
      cell = swimlane;
    } else if (isSet(swimlane)) {
      // Checks if the cell is an ancestor of the swimlane
      // under the mouse and uses the swimlane in that case
      let tmp = model.getParent(swimlane);

      while (isSet(tmp) && isSwimlane(tmp) && tmp !== cell) {
        tmp = model.getParent(tmp);
      }

      if (tmp === cell) {
        cell = swimlane;
      }
    }

    while (
      isSet(cell) &&
      !isValidDropTarget(cell, cells, evt) &&
      !model.isLayer(cell)
    ) {
      cell = model.getParent(cell);
    }

    // Checks if parent is dropped into child if not cloning
    if (isUnset(clone) || !clone) {
      let parent = cell;

      while (isSet(parent) && cells.indexOf(parent) < 0) {
        parent = model.getParent(parent);
      }
    }

    return !model.isLayer(cell) && isUnset(parent) ? cell : undefined;
  };

  /**
   * Group: Cell retrieval
   */

  /**
   * Function: getDefaultParent
   *
   * Returns <defaultParent> or <mxGraphView.currentRoot> or the first child
   * child of <mxGraphModel.root> if both are null. The value returned by
   * this function should be used as the parent for new cells (aka default
   * layer).
   */
  const getDefaultParent = () => {
    let parent = getCurrentRoot();

    if (isUnset(parent)) {
      parent = _getDefaultParent();

      if (isUnset(parent)) {
        const root = getModel().getRoot();
        parent = getModel().getChildAt(root, 0);
      }
    }

    return parent;
  };

  /**
   * Function: getSwimlane
   *
   * Returns the nearest ancestor of the given cell which is a swimlane, or
   * the given cell, if it is itself a swimlane.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the ancestor swimlane should be returned.
   */
  const getSwimlane = (cell) => {
    while (isSet(cell) && !isSwimlane(cell)) {
      cell = getModel().getParent(cell);
    }

    return cell;
  };

  /**
   * Function: getSwimlaneAt
   *
   * Returns the bottom-most swimlane that intersects the given point (x, y)
   * in the cell hierarchy that starts at the given parent.
   *
   * Parameters:
   *
   * x - X-coordinate of the location to be checked.
   * y - Y-coordinate of the location to be checked.
   * parent - <mxCell> that should be used as the root of the recursion.
   * Default is <defaultParent>.
   */
  const getSwimlaneAt = (x, y, parent) => {
    if (isUnset(parent)) {
      parent = getCurrentRoot();

      if (isUnset(parent)) {
        parent = getModel().getRoot();
      }
    }

    if (isSet(parent)) {
      const childCount = getModel().getChildCount(parent);

      for (let i = 0; i < childCount; i++) {
        const child = getModel().getChildAt(parent, i);

        if (isSet(child)) {
          const result = getSwimlaneAt(x, y, child);

          if (isSet(result)) {
            return result;
          } else if (isCellVisible(child) && isSwimlane(child)) {
            const state = getView().getState(child);

            if (intersects(state, x, y)) {
              return child;
            }
          }
        }
      }
    }

    return;
  };

  /**
   * Function: getCellAt
   *
   * Returns the bottom-most cell that intersects the given point (x, y) in
   * the cell hierarchy starting at the given parent. This will also return
   * swimlanes if the given location intersects the content area of the
   * swimlane. If this is not desired, then the <hitsSwimlaneContent> may be
   * used if the returned cell is a swimlane to determine if the location
   * is inside the content area or on the actual title of the swimlane.
   *
   * Parameters:
   *
   * x - X-coordinate of the location to be checked.
   * y - Y-coordinate of the location to be checked.
   * parent - <mxCell> that should be used as the root of the recursion.
   * Default is current root of the view or the root of the model.
   * vertices - Optional boolean indicating if vertices should be returned.
   * Default is true.
   * edges - Optional boolean indicating if edges should be returned. Default
   * is true.
   * ignoreFn - Optional function that returns true if cell should be ignored.
   * The function is passed the cell state and the x and y parameter.
   */
  const getCellAt = (x, y, parent, vertices = true, edges = true, ignoreFn) => {
    if (isUnset(parent)) {
      parent = getCurrentRoot();

      if (isUnset(parent)) {
        parent = getModel().getRoot();
      }
    }

    if (isSet(parent)) {
      const childCount = getModel().getChildCount(parent);

      for (let i = childCount - 1; i >= 0; i--) {
        const cell = getModel().getChildAt(parent, i);
        const result = getCellAt(x, y, cell, vertices, edges, ignoreFn);

        if (isSet(result)) {
          return result;
        } else if (
          isCellVisible(cell) &&
          ((edges && getModel().isEdge(cell)) ||
            (vertices && getModel().isVertex(cell)))
        ) {
          const state = getView().getState(cell);

          if (
            isSet(state) &&
            (isUnset(ignoreFn) || !ignoreFn(state, x, y)) &&
            intersects(state, x, y)
          ) {
            return cell;
          }
        }
      }
    }

    return;
  };

  /**
   * Function: intersects
   *
   * Returns the bottom-most cell that intersects the given point (x, y) in
   * the cell hierarchy that starts at the given parent.
   *
   * Parameters:
   *
   * state - <mxCellState> that represents the cell state.
   * x - X-coordinate of the location to be checked.
   * y - Y-coordinate of the location to be checked.
   */
  const intersects = (state, x, y) => {
    if (isSet(state)) {
      const pts = state.getAbsolutePoints();

      if (isSet(pts)) {
        const t2 = getTolerance() * getTolerance();
        let pt = pts[0];

        for (let i = 1; i < pts.length; i++) {
          const next = pts[i];
          const dist = ptSegDistSq(
            pt.getX(),
            pt.getY(),
            next.getX(),
            next.getY(),
            x,
            y
          );

          if (dist <= t2) {
            return true;
          }

          pt = next;
        }
      } else {
        const alpha = toRadians(
          getValue(state.getStyle(), STYLE_ROTATION) || 0
        );

        if (alpha !== 0) {
          const cos = Math.cos(-alpha);
          const sin = Math.sin(-alpha);
          const cx = Point(state.getCenterX(), state.getCenterY());
          const pt = getRotatedPoint(Point(x, y), cos, sin, cx);
          x = pt.x;
          y = pt.y;
        }

        if (contains(state, x, y)) {
          return true;
        }
      }
    }

    return false;
  };

  /**
   * Function: hitsSwimlaneContent
   *
   * Returns true if the given coordinate pair is inside the content
   * are of the given swimlane.
   *
   * Parameters:
   *
   * swimlane - <mxCell> that specifies the swimlane.
   * x - X-coordinate of the mouse event.
   * y - Y-coordinate of the mouse event.
   */
  const hitsSwimlaneContent = (swimlane, x, y) => {
    const state = getView().getState(swimlane);
    const size = getStartSize(swimlane);

    if (isSet(state)) {
      const scale = getView().getScale();
      x -= state.getX();
      y -= state.getY();

      if (size.getWidth() > 0 && x > 0 && x > size.getWidth() * scale) {
        return true;
      } else if (
        size.getHeight() > 0 &&
        y > 0 &&
        y > size.getHeight() * scale
      ) {
        return true;
      }
    }

    return false;
  };

  /**
   * Function: getChildVertices
   *
   * Returns the visible child vertices of the given parent.
   *
   * Parameters:
   *
   * parent - <mxCell> whose children should be returned.
   */
  const getChildVertices = (parent) => getChildCells(parent, true, false);

  /**
   * Function: getChildEdges
   *
   * Returns the visible child edges of the given parent.
   *
   * Parameters:
   *
   * parent - <mxCell> whose child vertices should be returned.
   */
  const getChildEdges = (parent) => getChildCells(parent, false, true);

  /**
   * Function: getChildCells
   *
   * Returns the visible child vertices or edges in the given parent. If
   * vertices and edges is false, then all children are returned.
   *
   * Parameters:
   *
   * parent - <mxCell> whose children should be returned.
   * vertices - Optional boolean that specifies if child vertices should
   * be returned. Default is false.
   * edges - Optional boolean that specifies if child edges should
   * be returned. Default is false.
   */
  const getChildCells = (
    parent = getDefaultParent(),
    vertices = false,
    edges = false
  ) => {
    const cells = getModel().getChildCells(parent, vertices, edges);
    const result = [];

    // Filters out the non-visible child cells
    for (let i = 0; i < cells.length; i++) {
      if (isCellVisible(cells[i])) {
        result.push(cells[i]);
      }
    }

    return result;
  };

  /**
   * Function: getConnections
   *
   * Returns all visible edges connected to the given cell without loops.
   *
   * Parameters:
   *
   * cell - <mxCell> whose connections should be returned.
   * parent - Optional parent of the opposite end for a connection to be
   * returned.
   */
  const getConnections = (cell, parent) =>
    getEdges(cell, parent, true, true, false);

  /**
   * Function: getIncomingEdges
   *
   * Returns the visible incoming edges for the given cell. If the optional
   * parent argument is specified, then only child edges of the given parent
   * are returned.
   *
   * Parameters:
   *
   * cell - <mxCell> whose incoming edges should be returned.
   * parent - Optional parent of the opposite end for an edge to be
   * returned.
   */
  const getIncomingEdges = (cell, parent) =>
    getEdges(cell, parent, true, false, false);

  /**
   * Function: getOutgoingEdges
   *
   * Returns the visible outgoing edges for the given cell. If the optional
   * parent argument is specified, then only child edges of the given parent
   * are returned.
   *
   * Parameters:
   *
   * cell - <mxCell> whose outgoing edges should be returned.
   * parent - Optional parent of the opposite end for an edge to be
   * returned.
   */
  const getOutgoingEdges = (cell, parent) =>
    getEdges(cell, parent, false, true, false);

  /**
   * Function: getEdges
   *
   * Returns the incoming and/or outgoing edges for the given cell.
   * If the optional parent argument is specified, then only edges are returned
   * where the opposite is in the given parent cell. If at least one of incoming
   * or outgoing is true, then loops are ignored, if both are false, then all
   * edges connected to the given cell are returned including loops.
   *
   * Parameters:
   *
   * cell - <mxCell> whose edges should be returned.
   * parent - Optional parent of the opposite end for an edge to be
   * returned.
   * incoming - Optional boolean that specifies if incoming edges should
   * be included in the result. Default is true.
   * outgoing - Optional boolean that specifies if outgoing edges should
   * be included in the result. Default is true.
   * includeLoops - Optional boolean that specifies if loops should be
   * included in the result. Default is true.
   * recurse - Optional boolean the specifies if the parent specified only
   * need be an ancestral parent, true, or the direct parent, false.
   * Default is false
   */
  const getEdges = (
    cell,
    parent,
    incoming = true,
    outgoing = true,
    includeLoops = true,
    recurse = false
  ) => {
    const view = getView();
    const model = getModel();
    let edges = [];
    const isCollapsed = isCellCollapsed(cell);
    const childCount = model.getChildCount(cell);

    for (let i = 0; i < childCount; i++) {
      const child = model.getChildAt(cell, i);

      if (isCollapsed || !isCellVisible(child)) {
        edges = edges.concat(model.getEdges(child, incoming, outgoing));
      }
    }

    edges = edges.concat(model.getEdges(cell, incoming, outgoing));
    const result = [];

    for (let i = 0; i < edges.length; i++) {
      const state = view.getState(edges[i]);

      const source = isSet(state)
        ? state.getVisibleTerminal(true)
        : view.getVisibleTerminal(edges[i], true);
      const target = isSet(state)
        ? state.getVisibleTerminal(false)
        : view.getVisibleTerminal(edges[i], false);

      if (
        (includeLoops && source === target) ||
        (source !== target &&
          ((incoming &&
            target === cell &&
            (isUnset(parent) || isValidAncestor(source, parent, recurse))) ||
            (outgoing &&
              source === cell &&
              (isUnset(parent) || isValidAncestor(target, parent, recurse)))))
      ) {
        result.push(edges[i]);
      }
    }

    return result;
  };

  /**
   * Function: isValidAncestor
   *
   * Returns whether or not the specified parent is a valid
   * ancestor of the specified cell, either direct or indirectly
   * based on whether ancestor recursion is enabled.
   *
   * Parameters:
   *
   * cell - <mxCell> the possible child cell
   * parent - <mxCell> the possible parent cell
   * recurse - boolean whether or not to recurse the child ancestors
   */
  const isValidAncestor = (cell, parent, recurse) =>
    recurse
      ? getModel().isAncestor(parent, cell)
      : getModel().getParent(cell) === parent;

  /**
   * Function: getOpposites
   *
   * Returns all distinct visible opposite cells for the specified terminal
   * on the given edges.
   *
   * Parameters:
   *
   * edges - Array of <mxCells> that contains the edges whose opposite
   * terminals should be returned.
   * terminal - Terminal that specifies the end whose opposite should be
   * returned.
   * sources - Optional boolean that specifies if source terminals should be
   * included in the result. Default is true.
   * targets - Optional boolean that specifies if targer terminals should be
   * included in the result. Default is true.
   */
  const getOpposites = (edges, terminal, sources = true, targets = true) => {
    const view = getView();
    const terminals = [];

    // Fast lookup to avoid duplicates in terminals array
    const dict = Dictionary();

    if (isSet(edges)) {
      for (let i = 0; i < edges.length; i++) {
        const state = view.getState(edges[i]);

        const source = isSet(state)
          ? state.getVisibleTerminal(true)
          : view.getVisibleTerminal(edges[i], true);
        const target = isSet(state)
          ? state.getVisibleTerminal(false)
          : view.getVisibleTerminal(edges[i], false);

        // Checks if the terminal is the source of the edge and if the
        // target should be stored in the result
        if (
          source === terminal &&
          isSet(target) &&
          target !== terminal &&
          targets
        ) {
          if (!dict.get(target)) {
            dict.put(target, true);
            terminals.push(target);
          }
        }

        // Checks if the terminal is the taget of the edge and if the
        // source should be stored in the result
        else if (
          target === terminal &&
          isSet(source) &&
          source !== terminal &&
          sources
        ) {
          if (!dict.get(source)) {
            dict.put(source, true);
            terminals.push(source);
          }
        }
      }
    }

    return terminals;
  };

  /**
   * Function: getEdgesBetween
   *
   * Returns the edges between the given source and target. This takes into
   * account collapsed and invisible cells and returns the connected edges
   * as displayed on the screen.
   *
   * Parameters:
   *
   * source -
   * target -
   * directed -
   */
  const getEdgesBetween = (source, target, directed = false) => {
    const view = getView();
    const edges = getEdges(source);
    const result = [];

    // Checks if the edge is connected to the correct
    // cell and returns the first match
    for (let i = 0; i < edges.length; i++) {
      const state = view.getState(edges[i]);

      const src = isSet(state)
        ? state.getVisibleTerminal(true)
        : view.getVisibleTerminal(edges[i], true);
      const trg = isSet(state)
        ? state.getVisibleTerminal(false)
        : view.getVisibleTerminal(edges[i], false);

      if (
        (src == source && trg == target) ||
        (!directed && src == target && trg == source)
      ) {
        result.push(edges[i]);
      }
    }

    return result;
  };

  /**
   * Function: getPointForEvent
   *
   * Returns an <mxPoint> representing the given event in the unscaled,
   * non-translated coordinate space of <container> and applies the grid.
   *
   * Parameters:
   *
   * evt - Mousevent that contains the mouse pointer location.
   * addOffset - Optional boolean that specifies if the position should be
   * offset by half of the <gridSize>. Default is true.
   */
  const getPointForEvent = (evt, addOffset) => {
    const p = convertPoint(
      getContainer(),
      Event.getClientX(evt),
      Event.getClientY(evt)
    );

    const s = getView().getScale();
    const tr = getView().getTranslate();
    const off = addOffset !== false ? getGridSize() / 2 : 0;

    p.setX(snap(p.getX() / s - tr.getX() - off));
    p.setY(snap(p.getY() / s - tr.getY() - off));

    return p;
  };

  /**
   * Function: getCells
   *
   * Returns the child vertices and edges of the given parent that are contained
   * in the given rectangle. The result is added to the optional result array,
   * which is returned. If no result array is specified then a new array is
   * created and returned.
   *
   * Parameters:
   *
   * x - X-coordinate of the rectangle.
   * y - Y-coordinate of the rectangle.
   * width - Width of the rectangle.
   * height - Height of the rectangle.
   * parent - <mxCell> that should be used as the root of the recursion.
   * Default is current root of the view or the root of the model.
   * result - Optional array to store the result in.
   * intersection - Optional <mxRectangle> to check vertices for intersection.
   * ignoreFn - Optional function to check if a cell state is ignored.
   * includeDescendants - Optional boolean flag to add descendants to the result.
   * Default is false.
   */
  const getCells = (
    x,
    y,
    width,
    height,
    parent,
    result = [],
    intersection,
    ignoreFn,
    includeDescendants
  ) => {
    if (width > 0 || height > 0 || isSet(intersection)) {
      const model = getModel();
      const right = x + width;
      const bottom = y + height;

      if (isUnset(parent)) {
        parent = getCurrentRoot();

        if (isUnset(parent)) {
          parent = model.getRoot();
        }
      }

      if (isSet(parent)) {
        const childCount = model.getChildCount(parent);

        for (let i = 0; i < childCount; i++) {
          const cell = model.getChildAt(parent, i);
          const state = getView().getState(cell);

          if (
            isSet(state) &&
            isCellVisible(cell) &&
            (isUnset(ignoreFn) || !ignoreFn(state))
          ) {
            const deg = getValue(state.getStyle(), STYLE_ROTATION) || 0;
            let box = state;

            if (deg !== 0) {
              box = getBoundingBox(box, deg);
            }

            const hit =
              (isSet(intersection) &&
                model.isVertex(cell) &&
                intersects(intersection, box)) ||
              (isUnset(intersection) &&
                (model.isEdge(cell) || model.isVertex(cell)) &&
                box.getX() >= x &&
                box.getY() + box.getHeight() <= bottom &&
                box.getY() >= y &&
                box.getX() + box.getWidth() <= right);

            if (hit) {
              result.push(cell);
            }

            if (!hit || includeDescendants) {
              getCells(
                x,
                y,
                width,
                height,
                cell,
                result,
                intersection,
                ignoreFn,
                includeDescendants
              );
            }
          }
        }
      }
    }

    return result;
  };

  /**
   * Function: getCellsBeyond
   *
   * Returns the children of the given parent that are contained in the
   * halfpane from the given point (x0, y0) rightwards or downwards
   * depending on rightHalfpane and bottomHalfpane.
   *
   * Parameters:
   *
   * x0 - X-coordinate of the origin.
   * y0 - Y-coordinate of the origin.
   * parent - Optional <mxCell> whose children should be checked. Default is
   * <defaultParent>.
   * rightHalfpane - Boolean indicating if the cells in the right halfpane
   * from the origin should be returned.
   * bottomHalfpane - Boolean indicating if the cells in the bottom halfpane
   * from the origin should be returned.
   */
  const getCellsBeyond = (x0, y0, parent, rightHalfpane, bottomHalfpane) => {
    const result = [];

    if (rightHalfpane || bottomHalfpane) {
      if (isUnset(parent)) {
        parent = getDefaultParent();
      }

      if (isSet(parent)) {
        const childCount = getModel().getChildCount(parent);

        for (let i = 0; i < childCount; i++) {
          const child = getModel().getChildAt(parent, i);
          const state = getView().getState(child);

          if (isCellVisible(child) && isSet(state)) {
            if (
              (!rightHalfpane || state.getX() >= x0) &&
              (!bottomHalfpane || state.getY() >= y0)
            ) {
              result.push(child);
            }
          }
        }
      }
    }

    return result;
  };

  /**
   * Function: findTreeRoots
   *
   * Returns all children in the given parent which do not have incoming
   * edges. If the result is empty then the with the greatest difference
   * between incoming and outgoing edges is returned.
   *
   * Parameters:
   *
   * parent - <mxCell> whose children should be checked.
   * isolate - Optional boolean that specifies if edges should be ignored if
   * the opposite end is not a child of the given parent cell. Default is
   * false.
   * invert - Optional boolean that specifies if outgoing or incoming edges
   * should be counted for a tree root. If false then outgoing edges will be
   * counted. Default is false.
   */
  const findTreeRoots = (parent, isolate = false, invert = false) => {
    const roots = [];

    if (isSet(parent)) {
      const model = getModel();
      const childCount = model.getChildCount(parent);
      let best;
      let maxDiff = 0;

      for (let i = 0; i < childCount; i++) {
        const cell = model.getChildAt(parent, i);

        if (model.isVertex(cell) && isCellVisible(cell)) {
          const conns = getConnections(cell, isolate ? parent : undefined);
          let fanOut = 0;
          let fanIn = 0;

          for (let j = 0; j < conns.length; j++) {
            const src = getView().getVisibleTerminal(conns[j], true);

            if (src === cell) {
              fanOut++;
            } else {
              fanIn++;
            }
          }

          if (
            (invert && fanOut === 0 && fanIn > 0) ||
            (!invert && fanIn === 0 && fanOut > 0)
          ) {
            roots.push(cell);
          }

          const diff = invert ? fanIn - fanOut : fanOut - fanIn;

          if (diff > maxDiff) {
            maxDiff = diff;
            best = cell;
          }
        }
      }

      if (roots.length == 0 && isSet(best)) {
        roots.push(best);
      }
    }

    return roots;
  };

  /**
   * Function: traverse
   *
   * Traverses the (directed) graph invoking the given function for each
   * visited vertex and edge. The function is invoked with the current vertex
   * and the incoming edge as a parameter. This implementation makes sure
   * each vertex is only visited once. The function may return false if the
   * traversal should stop at the given vertex.
   *
   * Example:
   *
   * (code)
   * mxLog.show();
   * var cell = graph.getSelectionCell();
   * graph.traverse(cell, false, function(vertex, edge)
   * {
   *   mxLog.debug(graph.getLabel(vertex));
   * });
   * (end)
   *
   * Parameters:
   *
   * vertex - <mxCell> that represents the vertex where the traversal starts.
   * directed - Optional boolean indicating if edges should only be traversed
   * from source to target. Default is true.
   * func - Visitor function that takes the current vertex and the incoming
   * edge as arguments. The traversal stops if the function returns false.
   * edge - Optional <mxCell> that represents the incoming edge. This is
   * null for the first step of the traversal.
   * visited - Optional <mxDictionary> from cells to true for the visited cells.
   * inverse - Optional boolean to traverse in inverse direction. Default is false.
   * This is ignored if directed is false.
   */
  const traverse = (
    vertex,
    directed = true,
    func,
    edge,
    visited = Dictionary(),
    inverse = false
  ) => {
    const model = getModel();

    if (isSet(func) && isSet(vertex)) {
      if (!visited.get(vertex)) {
        visited.put(vertex, true);
        const result = func(vertex, edge);

        if (isUnset(result) || result) {
          const edgeCount = model.getEdgeCount(vertex);

          if (edgeCount > 0) {
            for (let i = 0; i < edgeCount; i++) {
              const e = model.getEdgeAt(vertex, i);
              const isSource = model.getTerminal(e, true) === vertex;

              if (!directed || !inverse === isSource) {
                const next = model.getTerminal(e, !isSource);
                traverse(next, directed, func, e, visited, inverse);
              }
            }
          }
        }
      }
    }
  };

  /**
   * Group: Selection
   */

  /**
   * Function: isCellSelected
   *
   * Returns true if the given cell is selected.
   *
   * Parameters:
   *
   * cell - <mxCell> for which the selection state should be returned.
   */
  const isCellSelected = (cell) => getSelectionModel().isSelected(cell);

  /**
   * Function: isSelectionEmpty
   *
   * Returns true if the selection is empty.
   */
  const isSelectionEmpty = () => getSelectionModel().isEmpty();

  /**
   * Function: clearSelection
   *
   * Clears the selection using <mxGraphSelectionModel.clear>.
   */
  const clearSelection = () => getSelectionModel().clear();

  /**
   * Function: getSelectionCount
   *
   * Returns the number of selected cells.
   */
  const getSelectionCount = () => getSelectionModel().getCells().length;

  /**
   * Function: getSelectionCell
   *
   * Returns the first cell from the array of selected <mxCells>.
   */
  const getSelectionCell = () => getSelectionModel().getCells()[0];

  /**
   * Function: getSelectionCells
   *
   * Returns the array of selected <mxCells>.
   */
  const getSelectionCells = () => getSelectionModel().getCells().slice();

  /**
   * Function: setSelectionCell
   *
   * Sets the selection cell.
   *
   * Parameters:
   *
   * cell - <mxCell> to be selected.
   */
  const setSelectionCell = (cell) => getSelectionModel().setCell(cell);

  /**
   * Function: setSelectionCells
   *
   * Sets the selection cell.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be selected.
   */
  const setSelectionCells = (cells) => getSelectionModel().setCells(cells);

  /**
   * Function: addSelectionCell
   *
   * Adds the given cell to the selection.
   *
   * Parameters:
   *
   * cell - <mxCell> to be add to the selection.
   */
  const addSelectionCell = (cell) => getSelectionModel().addCell(cell);

  /**
   * Function: addSelectionCells
   *
   * Adds the given cells to the selection.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be added to the selection.
   */
  const addSelectionCells = (cells) => getSelectionModel().addCells(cells);

  /**
   * Function: removeSelectionCell
   *
   * Removes the given cell from the selection.
   *
   * Parameters:
   *
   * cell - <mxCell> to be removed from the selection.
   */
  const removeSelectionCell = (cells) => (cell) =>
    getSelectionModel().removeCell(cell);

  /**
   * Function: removeSelectionCells
   *
   * Removes the given cells from the selection.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be removed from the selection.
   */
  const removeSelectionCells = (cells) =>
    getSelectionModel().removeCells(cells);

  /**
   * Function: selectRegion
   *
   * Selects and returns the cells inside the given rectangle for the
   * specified event.
   *
   * Parameters:
   *
   * rect - <mxRectangle> that represents the region to be selected.
   * evt - Mouseevent that triggered the selection.
   */
  const selectRegion = (rect, evt) => {
    const cells = getCells(
      rect.getX(),
      rect.getY(),
      rect.getWidth(),
      rect.getHeight()
    );
    selectCellsForEvent(cells, evt);

    return cells;
  };

  /**
   * Function: selectNextCell
   *
   * Selects the next cell.
   */
  const selectNextCell = () => selectCell(true);

  /**
   * Function: selectPreviousCell
   *
   * Selects the previous cell.
   */
  const selectPreviousCell = () => selectCell();

  /**
   * Function: selectParentCell
   *
   * Selects the parent cell.
   */
  const selectParentCell = () => selectCell(false, true);

  /**
   * Function: selectChildCell
   *
   * Selects the first child cell.
   */
  const selectChildCell = () => selectCell(false, false, true);

  /**
   * Function: selectCell
   *
   * Selects the next, parent, first child or previous cell, if all arguments
   * are false.
   *
   * Parameters:
   *
   * isNext - Boolean indicating if the next cell should be selected.
   * isParent - Boolean indicating if the parent cell should be selected.
   * isChild - Boolean indicating if the first child cell should be selected.
   */
  const selectCell = (isNext, isParent, isChild) => {
    const model = getModel();
    const sel = getSelectionModel();
    const cell = sel.getCells().length > 0 ? sel.getCells()[0] : undefined;

    if (sel.getCells().length > 1) {
      sel.clear();
    }

    const parent = isSet(cell) ? model.getParent(cell) : getDefaultParent();

    const childCount = model.getChildCount(parent);

    if (isUnset(cell) && childCount > 0) {
      const child = model.getChildAt(parent, 0);
      setSelectionCell(child);
    } else if (
      (isUnset(cell) || isParent) &&
      isSet(getView().getState(parent)) &&
      isSet(model.getGeometry(parent))
    ) {
      if (getCurrentRoot() != parent) {
        setSelectionCell(parent);
      }
    } else if (isSet(cell) && isChild) {
      const tmp = model.getChildCount(cell);

      if (tmp > 0) {
        const child = model.getChildAt(cell, 0);
        setSelectionCell(child);
      }
    } else if (childCount > 0) {
      let i = parent.getIndex(cell);

      if (isNext) {
        i++;
        const child = model.getChildAt(parent, i % childCount);
        setSelectionCell(child);
      } else {
        i--;
        const index = i < 0 ? childCount - 1 : i;
        const child = model.getChildAt(parent, index);
        setSelectionCell(child);
      }
    }
  };

  /**
   * Function: selectAll
   *
   * Selects all children of the given parent cell or the children of the
   * default parent if no parent is specified. To select leaf vertices and/or
   * edges use <selectCells>.
   *
   * Parameters:
   *
   * parent - Optional <mxCell> whose children should be selected.
   * Default is <defaultParent>.
   * descendants - Optional boolean specifying whether all descendants should be
   * selected. Default is false.
   */
  const selectAll = (parent = getDefaultParent(), descendants) => {
    const cells = descendants
      ? getModel().filterDescendants(
          (cell) => ell !== parent && isSet(getView().getState(cell)),
          parent
        )
      : getModel().getChildren(parent);

    if (isSet(cells)) {
      setSelectionCells(cells);
    }
  };

  /**
   * Function: selectVertices
   *
   * Select all vertices inside the given parent or the default parent.
   */
  const selectVertices = (parent, selectGroups) =>
    selectCells(true, false, parent, selectGroups);

  /**
   * Function: selectEdges
   *
   * Select all edges inside the given parent or the default parent.
   */
  const selectEdges = (parent) => selectCells(false, true, parent);

  /**
   * Function: selectCells
   *
   * Selects all vertices and/or edges depending on the given boolean
   * arguments recursively, starting at the given parent or the default
   * parent if no parent is specified. Use <selectAll> to select all cells.
   * For vertices, only cells with no children are selected.
   *
   * Parameters:
   *
   * vertices - Boolean indicating if vertices should be selected.
   * edges - Boolean indicating if edges should be selected.
   * parent - Optional <mxCell> that acts as the root of the recursion.
   * Default is <defaultParent>.
   * selectGroups - Optional boolean that specifies if groups should be
   * selected. Default is false.
   */
  const selectCells = (
    vertices,
    edges,
    parent = getDefaultParent(),
    selectGroups
  ) => {
    const model = getModel();
    const filter = (cell) =>
      isSet(getView().getState(cell)) &&
      (((selectGroups || model.getChildCount(cell) === 0) &&
        model.isVertex(cell) &&
        vertices &&
        !model.isEdge(model.getParent(cell))) ||
        (model.isEdge(cell) && edges));

    const cells = model.filterDescendants(filter, parent);

    if (isSet(cells)) {
      setSelectionCells(cells);
    }
  };

  /**
   * Function: selectCellForEvent
   *
   * Selects the given cell by either adding it to the selection or
   * replacing the selection depending on whether the given mouse event is a
   * toggle event.
   *
   * Parameters:
   *
   * cell - <mxCell> to be selected.
   * evt - Optional mouseevent that triggered the selection.
   */
  const selectCellForEvent = (cell, evt) => {
    const isSelected = isCellSelected(cell);

    if (isToggleEvent(evt)) {
      if (isSelected) {
        removeSelectionCell(cell);
      } else {
        addSelectionCell(cell);
      }
    } else if (!isSelected || getSelectionCount() !== 1) {
      setSelectionCell(cell);
    }
  };

  /**
   * Function: selectCellsForEvent
   *
   * Selects the given cells by either adding them to the selection or
   * replacing the selection depending on whether the given mouse event is a
   * toggle event.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be selected.
   * evt - Optional mouseevent that triggered the selection.
   */
  const selectCellsForEvent = (cells, evt) => {
    if (isToggleEvent(evt)) {
      addSelectionCells(cells);
    } else {
      setSelectionCells(cells);
    }
  };

  /**
   * Group: Selection state
   */

  /**
   * Function: createHandler
   *
   * Creates a new handler for the given cell state. This implementation
   * returns a new <mxEdgeHandler> of the corresponding cell is an edge,
   * otherwise it returns an <mxVertexHandler>.
   *
   * Parameters:
   *
   * state - <mxCellState> whose handler should be created.
   */
  const createHandler = (state) => {
    let result;

    if (isSet(state)) {
      if (getModel().isEdge(state.getCell())) {
        const source = state.getVisibleTerminalState(true);
        const target = state.getVisibleTerminalState(false);
        const geo = getCellGeometry(state.getCell());

        const edgeStyle = getView().getEdgeStyle(
          state,
          isSet(geo) ? geo.getPoints() : undefined,
          source,
          target
        );
        result = createEdgeHandler(state, edgeStyle);
      } else {
        result = createVertexHandler(state);
      }
    }

    return result;
  };

  /**
   * Function: createVertexHandler
   *
   * Hooks to create a new <mxVertexHandler> for the given <mxCellState>.
   *
   * Parameters:
   *
   * state - <mxCellState> to create the handler for.
   */
  const createVertexHandler = (state) => VertexHandler(state);

  /**
   * Function: createEdgeHandler
   *
   * Hooks to create a new <mxEdgeHandler> for the given <mxCellState>.
   *
   * Parameters:
   *
   * state - <mxCellState> to create the handler for.
   */
  const createEdgeHandler = (state, edgeStyle) => {
    let result;

    if (
      edgeStyle === EdgeStyle.Loop ||
      edgeStyle === EdgeStyle.ElbowConnector ||
      edgeStyle === EdgeStyle.SideToSide ||
      edgeStyle === EdgeStyle.TopToBottom
    ) {
      result = createElbowEdgeHandler(state);
    } else if (
      edgeStyle === EdgeStyle.SegmentConnector ||
      edgeStyle === EdgeStyle.OrthConnector
    ) {
      result = createEdgeSegmentHandler(state);
    } else {
      result = EdgeHandler(state);
    }

    // lazy initialization
    result.init();

    return result;
  };

  /**
   * Function: createEdgeSegmentHandler
   *
   * Hooks to create a new <mxEdgeSegmentHandler> for the given <mxCellState>.
   *
   * Parameters:
   *
   * state - <mxCellState> to create the handler for.
   */
  const createEdgeSegmentHandler = (state) => EdgeSegmentHandler(state);

  /**
   * Function: createElbowEdgeHandler
   *
   * Hooks to create a new <mxElbowEdgeHandler> for the given <mxCellState>.
   *
   * Parameters:
   *
   * state - <mxCellState> to create the handler for.
   */
  const createElbowEdgeHandler = (state) => ElbowEdgeHandler(state);

  /**
   * Group: Graph events
   */

  /**
   * Function: addMouseListener
   *
   * Adds a listener to the graph event dispatch loop. The listener
   * must implement the mouseDown, mouseMove and mouseUp methods
   * as shown in the <mxMouseEvent> class.
   *
   * Parameters:
   *
   * listener - Listener to be added to the graph event listeners.
   */
  const addMouseListener = (listener) => {
    if (isUnset(getMouseListeners())) {
      setMouseListeners([]);
    }

    getMouseListeners().push(listener);
  };

  /**
   * Function: removeMouseListener
   *
   * Removes the specified graph listener.
   *
   * Parameters:
   *
   * listener - Listener to be removed from the graph event listeners.
   */
  const removeMouseListener = (listener) => {
    if (isSet(getMouseListeners())) {
      for (let i = 0; i < getMouseListeners().length; i++) {
        if (getMouseListeners()[i] === listener) {
          getMouseListeners().splice(i, 1);
          break;
        }
      }
    }
  };

  /**
   * Function: updateMouseEvent
   *
   * Sets the graphX and graphY properties if the given <mxMouseEvent> if
   * required and returned the event.
   *
   * Parameters:
   *
   * me - <mxMouseEvent> to be updated.
   * evtName - Name of the mouse event.
   */
  const updateMouseEvent = (mE, evtName) => {
    if (isUnset(mE.getGraphX()) || isUnset(mE.getGraphY())) {
      const pt = convertPoint(getContainer(), mE.getX(), mE.getY());

      mE.setGraphX(pt.getX() - getPanDx());
      mE.setGraphY(pt.getY() - getPanDy());

      // Searches for rectangles using method if native hit detection is disabled on shape
      if (
        isUnset(mE.getCell()) &&
        isMouseDown() &&
        evtName === Event.MOUSE_MOVE
      ) {
        mE.setState(
          getView().getState(
            getCellAt(
              pt.getX(),
              pt.getY(),
              undefined,
              undefined,
              undefined,
              (state) => {
                const shape = state.getShape();

                return (
                  isUnset(shape) ||
                  shape.paintBackground !== paintBackground ||
                  getValue(state.getStyle(), STYLE_POINTER_EVENTS, '1') ===
                    '1' ||
                  (isSet(shape.getFill()) && shape.getFill() !== NONE)
                );
              }
            )
          )
        );
      }
    }

    return mE;
  };

  /**
   * Function: getStateForTouchEvent
   *
   * Returns the state for the given touch event.
   */
  const getStateForTouchEvent = (evt) => {
    const x = Event.getClientX(evt);
    const y = Event.getClientY(evt);

    // Dispatches the drop event to the graph which
    // consumes and executes the source function
    const pt = convertPoint(getContainer(), x, y);

    return getView().getState(getCellAt(pt.getX(), pt.getY()));
  };

  /**
   * Function: isEventIgnored
   *
   * Returns true if the event should be ignored in <fireMouseEvent>.
   */
  const isEventIgnored = (evtName, mE, sender) => {
    const mouseEvent = Event.isMouseEvent(mE.getEvent());
    let result = false;

    // Drops events that are fired more than once
    if (mE.getEvent() === getLastEvent()) {
      result = true;
    } else {
      setLastEvent(mE.getEvent());
    }

    // Installs event listeners to capture the complete gesture from the event source
    // for non-MS touch events as a workaround for all events for the same geture being
    // fired from the event source even if that was removed from the DOM.
    if (isSet(getEventSource()) && evtName !== Event.MOUSE_MOVE) {
      Event.removeGestureListeners(
        getEventSource(),
        undefined,
        getMouseMoveRedirect(),
        getMouseUpRedirect()
      );
      setMouseMoveRedirect();
      setMouseUpRedirect();
      setEventSource();
    } else if (
      !IS_GC &&
      isSet(getEventSource()) &&
      mE.getSource() !== getEventSource()
    ) {
      result = true;
    } else if (
      IS_TOUCH &&
      evtName === Event.MOUSE_DOWN &&
      !mouseEvent &&
      !Event.isPenEvent(mE.getEvent())
    ) {
      setEventSource(mE.getSource());

      setMouseMoveRedirect((evt) =>
        fireMouseEvent(
          Event.MOUSE_MOVE,
          MouseEvent(evt, getStateForTouchEvent(evt))
        )
      );

      setMouseUpRedirect((evt) =>
        fireMouseEvent(
          Event.MOUSE_UP,
          MouseEvent(evt, getStateForTouchEvent(evt))
        )
      );

      Event.addGestureListeners(
        getEventSource(),
        undefined,
        getMouseMoveRedirect(),
        getMouseUpRedirect()
      );
    }

    // Factored out the workarounds for FF to make it easier to override/remove
    // Note this method has side-effects!
    if (isSyntheticEventIgnored(evtName, mE, sender)) {
      result = true;
    }

    // Never fires mouseUp/-Down for double clicks
    if (
      !Event.isPopupTrigger(getLastEvent()) &&
      evtName !== Event.MOUSE_MOVE &&
      getLastEvent().detail === 2
    ) {
      return true;
    }

    // Filters out of sequence events or mixed event types during a gesture
    if (evtName === Event.MOUSE_UP && isMouseDown()) {
      setMouseDown(false);
    } else if (evtName === Event.MOUSE_DOWN && !isMouseDown()) {
      setMouseDown(true);
      setMouseTrigger(mouseEvent);
    }
    // Drops mouse events that are fired during touch gestures as a workaround for Webkit
    // and mouse events that are not in sync with the current internal button state
    else if (
      !result &&
      (((!IS_FF || evtName !== Event.MOUSE_MOVE) &&
        isMouseDown() &&
        isMouseTrigger() !== mouseEvent) ||
        (evtName === Event.MOUSE_DOWN && isMouseDown()) ||
        (evtName === Event.MOUSE_UP && !isMouseDown()))
    ) {
      result = true;
    }

    return result;
  };

  /**
   * Function: isSyntheticEventIgnored
   *
   * Hook for ignoring synthetic mouse events after touchend in Firefox.
   */
  const isSyntheticEventIgnored = (evtName, mE, sender) => {
    let result = false;
    const mouseEvent = Event.isMouseEvent(mE.getEvent());

    // LATER: This does not cover all possible cases that can go wrong in FF
    if (isIgnoreMouseEvents() && mouseEvent && evtName !== Event.MOUSE_MOVE) {
      setIgnoreMouseEvents(evtName !== Event.MOUSE_UP);
      result = true;
    } else if (IS_FF && !mouseEvent && evtName === Event.MOUSE_UP) {
      setIgnoreMouseEvents(true);
    }

    return result;
  };

  /**
   * Function: isEventSourceIgnored
   *
   * Returns true if the event should be ignored in <fireMouseEvent>. This
   * implementation returns true for select, option and input (if not of type
   * checkbox, radio, button, submit or file) event sources if the event is not
   * a mouse event or a left mouse button press event.
   *
   * Parameters:
   *
   * evtName - The name of the event.
   * me - <mxMouseEvent> that should be ignored.
   */
  const isEventSourceIgnored = (evtName, mE) => {
    const source = mE.getSource();
    const name = isSet(source.nodeName) ? source.nodeName.toLowerCase() : '';
    const candidate =
      !Event.isMouseEvent(mE.getEvent()) ||
      Event.isLeftMouseButton(mE.getEvent());

    return (
      evtName === Event.MOUSE_DOWN &&
      candidate &&
      (name === 'select' ||
        name === 'option' ||
        (name === 'input' &&
          source.type !== 'checkbox' &&
          source.type !== 'radio' &&
          source.type !== 'button' &&
          source.type !== 'submit' &&
          source.type !== 'file'))
    );
  };

  /**
   * Function: getEventState
   *
   * Returns the <mxCellState> to be used when firing the mouse event for the
   * given state. This implementation returns the given state.
   *
   * Parameters:
   *
   * <mxCellState> - State whose event source should be returned.
   */
  const getEventState = (state) => state;

  /**
   * Function: fireMouseEvent
   *
   * Dispatches the given event in the graph event dispatch loop. Possible
   * event names are <mxEvent.MOUSE_DOWN>, <mxEvent.MOUSE_MOVE> and
   * <mxEvent.MOUSE_UP>. All listeners are invoked for all events regardless
   * of the consumed state of the event.
   *
   * Parameters:
   *
   * evtName - String that specifies the type of event to be dispatched.
   * me - <mxMouseEvent> to be fired.
   * sender - Optional sender argument. Default is this.
   */
  const fireMouseEvent = (evtName, mE, sender) => {
    if (isEventSourceIgnored(evtName, mE)) {
      if (isSet(getTooltipHandler())) {
        getTooltipHandler().hide();
      }

      return;
    }

    if (isUnset(sender)) {
      sender = me;
    }

    // Updates the graph coordinates in the event
    mE = updateMouseEvent(mE, evtName);

    // Detects and processes double taps for touch-based devices which do not have native double click events
    // or where detection of double click is not always possible (quirks, IE10+). Note that this can only handle
    // double clicks on cells because the sequence of events in IE prevents detection on the background, it fires
    // two mouse ups, one of which without a cell but no mousedown for the second click which means we cannot
    // detect which mouseup(s) are part of the first click, ie we do not know when the first click ends.
    if (
      (!isNativeDblClickEnabled() && !Event.isPopupTrigger(mE.getEvent())) ||
      (isDoubleTapEnabled() &&
        IS_TOUCH &&
        (Event.isTouchEvent(mE.getEvent()) || Event.isPenEvent(mE.getEvent())))
    ) {
      const currentTime = new Date().getTime();

      if (evtName === Event.MOUSE_DOWN) {
        if (
          isSet(getLastTouchEvent()) &&
          getLastTouchEvent() !== mE.getEvent() &&
          currentTime - getLastTouchTime() < getDoubleTapTimeout() &&
          Math.abs(getLastTouchX() - mE.getX()) < getDoubleTapTolerance() &&
          Math.abs(getLastTouchY() - mE.getY()) < getDoubleTapTolerance() &&
          getDoubleClickCounter() < 2
        ) {
          setDoubleClickCounter(getDoubleClickCounter() + 1);

          if (evtName === Event.MOUSE_UP) {
            if (
              mE.getCell() === getLastTouchCell() &&
              isSet(getLastTouchCell())
            ) {
              setLastTouchTime(0);
              const cell = getLastTouchCell();
              setLastTouchCell();

              dblClick(mE.getEvent(), cell);
              doubleClickFired = true;
            }
          } else {
            setFireDoubleClick(true);
            setLastTouchTime(0);
          }

          Event.consume(mE.getEvent());
          return;
        } else if (
          isUnset(getLastTouchEvent()) ||
          getLastTouchEvent() !== mE.getEvent()
        ) {
          setLastTouchCell(mE.getCell());
          setLastTouchX(mE.getX());
          setLastTouchY(mE.getY());
          setLastTouchTime(currentTime);
          setLastTouchEvent(mE.getEvent());
          setDoubleClickCounter(0);
        }
      } else if (
        (isMouseDown() || evtName === Event.MOUSE_UP) &&
        isFireDoubleClick()
      ) {
        setFireDoubleClick(false);
        const cell = getLastTouchCell();
        setLastTouchCell();
        setIsMouseDown(false);

        // Workaround for Chrome/Safari not firing native double click events for double touch on background
        const valid =
          isSet(cell) ||
          ((Event.isTouchEvent(mE.getEvent()) ||
            Event.isPenEvent(mE.getEvent())) &&
            (IS_GC || IS_SF));

        if (
          valid &&
          Math.abs(getLastTouchX() - mE.getX()) < getDoubleTapTolerance() &&
          Math.abs(getLastTouchY() - mE.getY()) < getDoubleTapTolerance()
        ) {
          dblClick(mE.getEvent(), cell);
        } else {
          Event.consume(mE.getEvent());
        }

        return;
      }
    }

    if (!isEventIgnored(evtName, mE, sender)) {
      // Updates the event state via getEventState
      mE.setState(getEventState(mE.getState()));
      fireEvent(
        EventObject(Event.FIRE_MOUSE_EVENT, 'eventName', evtName, 'event', mE)
      );

      const container = getContainer();

      if (
        IS_OP ||
        IS_SF ||
        IS_GC ||
        IS_IE11 ||
        IS_IE ||
        mE.getEvent().target !== container
      ) {
        if (
          evtName === Event.MOUSE_MOVE &&
          isMouseDown() &&
          isAutoScroll() &&
          !Event.isMultiTouchEvent(mE.getEvent())
        ) {
          scrollPointToVisible(mE.getGraphX(), mE.getGraphY(), isAutoExtend());
        } else if (
          evtName === Event.MOUSE_UP &&
          isIgnoreScrollbars() &&
          isTranslateToScrollPosition() &&
          (container.scrollLeft !== 0 || container.scrollTop !== 0)
        ) {
          const s = getView().getScale();
          const tr = getView().getTranslate();
          getView().setTranslate(
            tr.getX() - container.scrollLeft / s,
            tr.getY() - container.scrollTop / s
          );
          container.scrollLeft = 0;
          container.scrollTop = 0;
        }

        if (isSet(getMouseListeners())) {
          const args = [sender, mE];

          // Does not change returnValue in Opera
          if (!mE.getEvent().preventDefault) {
            mE.getEvent().returnValue = true;
          }

          for (let i = 0; i < getMouseListeners().length; i++) {
            const l = getMouseListeners()[i];

            if (evtName === Event.MOUSE_DOWN) {
              l.mouseDown(...args);
            } else if (evtName === Event.MOUSE_MOVE) {
              l.mouseMove(...args);
            } else if (evtName === Event.MOUSE_UP) {
              l.mouseUp(...args);
            }
          }
        }

        // Invokes the click handler
        if (evtName === Event.MOUSE_UP) {
          click(mE);
        }
      }

      // Detects tapAndHold events using a timer
      if (
        (Event.isTouchEvent(mE.getEvent()) ||
          Event.isPenEvent(mE.getEvent())) &&
        evtName === Event.MOUSE_DOWN &&
        isTapAndHoldEnabled() &&
        !isTapAndHoldInProgress()
      ) {
        setTapAndHoldInProgress(true);
        setInitialTouchX(mE.getGraphX());
        setInitialTouchY(mE.getGraphY());

        const handler = () => {
          if (isTapAndHoldValid()) {
            tapAndHold(mE);
          }

          setTapAndHoldInProgress(false);
          setTapAndHoldValid(false);
        };

        if (isTapAndHoldThread()) {
          window.clearTimeout(getTapAndHoldThread());
        }

        setTapAndHoldThread(window.setTimeout(handler, getTapAndHoldDelay()));

        setTapAndHoldValid(true);
      } else if (evtName === Event.MOUSE_UP) {
        setTapAndHoldInProgress(false);
        setTapAndHoldValid(false);
      } else if (isTapAndHoldValid()) {
        setTapAndHoldValid(
          Math.abs(getInitialTouchX() - mE.getGraphX()) < getTolerance() &&
            Math.abs(getInitialTouchY() - mE.getGraphY()) < getTolerance()
        );
      }

      // Stops editing for all events other than from cellEditor
      if (
        evtName === Event.MOUSE_DOWN &&
        isEditing() &&
        !getCellEditor().isEventSource(mE.getEvent())
      ) {
        stopEditing(!isInvokesStopCellEditing());
      }

      consumeMouseEvent(evtName, mE, sender);
    }
  };

  /**
   * Function: consumeMouseEvent
   *
   * Consumes the given <mxMouseEvent> if it's a touchStart event.
   */
  const consumeMouseEvent = (evtName, mE, sender) => {
    // Workaround for duplicate click in Windows 8 with Chrome/FF/Opera with touch
    if (evtName === Event.MOUSE_DOWN && Event.isTouchEvent(mE.getEvent())) {
      mE.consume(false);
    }
  };

  /**
   * Function: fireGestureEvent
   *
   * Dispatches a <mxEvent.GESTURE> event. The following example will resize the
   * cell under the mouse based on the scale property of the native touch event.
   *
   * (code)
   * graph.addListener(mxEvent.GESTURE, function(sender, eo)
   * {
   *   var evt = eo.getProperty('event');
   *   var state = graph.view.getState(eo.getProperty('cell'));
   *
   *   if (graph.isEnabled() && graph.isCellResizable(state.cell) && Math.abs(1 - evt.scale) > 0.2)
   *   {
   *     var scale = graph.view.scale;
   *     var tr = graph.view.translate;
   *
   *     var w = state.width * evt.scale;
   *     var h = state.height * evt.scale;
   *     var x = state.x - (w - state.width) / 2;
   *     var y = state.y - (h - state.height) / 2;
   *
   *     var bounds = new mxRectangle(graph.snap(x / scale) - tr.x,
   *     		graph.snap(y / scale) - tr.y, graph.snap(w / scale), graph.snap(h / scale));
   *     graph.resizeCell(state.cell, bounds);
   *     eo.consume();
   *   }
   * });
   * (end)
   *
   * Parameters:
   *
   * evt - Gestureend event that represents the gesture.
   * cell - Optional <mxCell> associated with the gesture.
   */
  const fireGestureEvent = (evt, cell) => {
    // Resets double tap event handling when gestures take place
    setLastTouchTime(0);
    fireEvent(EventObject(Event.GESTURE, 'event', evt, 'cell', cell));
  };

  /**
   * Function: destroy
   *
   * Destroys the graph and all its resources.
   */
  const destroy = () => {
    if (!isDestroyed()) {
      setDestroyed(true);

      if (isSet(getToltipHandler())) {
        getToltipHandler().destroy();
      }

      if (isSet(getSelectionCellsHandler())) {
        getSelectionCellsHandler().destroy();
      }

      if (isSet(getPanningHandler())) {
        getPanningHandler().destroy();
      }

      if (isSet(getPopupMenuHandler())) {
        getPopupMenuHandler().destroy();
      }

      if (isSet(getConnectionHandler())) {
        getConnectionHandler().destroy();
      }

      if (isSet(getGraphHandler())) {
        getGraphHandler().destroy();
      }

      if (isSet(getCellEditor())) {
        getCellEditor().destroy();
      }

      if (isSet(getView())) {
        getView().destroy();
      }

      if (isSet(getModel()) && isSet(getGraphModelChangeListener())) {
        getModel().removeListener(getGraphModelChangeListener());
        setGraphModelChangeListener();
      }

      setContainer();
    }
  };

  const { fireEvent, addListener, removeListener } = EventSource();
  const { paintBackground } = RectangleShape();

  const me = {
    addListener,
    removeListener,
    createTooltipHandler,
    createSelectionCellsHandler,
    createConnectionHandler,
    createPanningHandler,
    createPopupMenuHandler,
    createSelectionModel,
    createStylesheet,
    createGraphView,
    createCellRenderer,
    createCellEditor,
    getContainer,

    /**
     * Function: getModel
     *
     * Returns the <mxGraphModel> that contains the cells.
     */
    getModel,

    /**
     * Function: getView
     *
     * Returns the <mxGraphView> that contains the <mxCellStates>.
     */
    getView,

    /**
     * Function: getStylesheet
     *
     * Returns the <mxStylesheet> that defines the style.
     */
    getStylesheet,

    /**
     * Function: setStylesheet
     *
     * Sets the <mxStylesheet> that defines the style.
     */
    setStylesheet,

    /**
     * Function: getSelectionModel
     *
     * Returns the <mxGraphSelectionModel> that contains the selection.
     */
    getSelectionModel,

    /**
     * Function: setSelectionModel
     *
     * Sets the <mxSelectionModel> that contains the selection.
     */
    setSelectionModel,
    getSelectionCellsForChanges,
    graphModelChanged,
    updateSelection,
    processChange,
    removeStateForCell,
    addCellOverlay,
    getCellOverlays,
    removeCellOverlay,
    removeCellOverlays,
    clearCellOverlays,
    setCellWarning,
    startEditing,
    startEditingAtCell,
    getEditingValue,
    stopEditing,
    labelChanged,
    cellLabelChanged,
    escape,
    click,
    isSiblingSelected,
    dblClick,
    tapAndHold,
    scrollPointToVisible,
    createPanningManager,
    getBorderSizes,
    getPreferredPageSize,
    fit,
    sizeDidChange,
    doResizeContainer,
    updatePageBreaks,
    getCurrentCellStyle,
    getCellStyle,
    postProcessCellStyle,
    setCellStyle,
    toggleCellStyle,
    toggleCellStyles,
    setCellStyles,
    toggleCellStyleFlags,
    setCellStyleFlags,
    alignCells,
    flipEdge,
    addImageBundle,
    removeImageBundle,
    getImageFromBundles,
    orderCells,
    cellsOrdered,
    groupCells,
    getCellsForGroup,
    getBoundsForGroup,
    createGroupCell,
    ungroupCells,
    getCellsForUngroup,
    removeCellsAfterUngroup,
    removeCellsFromParent,
    updateGroupBounds,
    getBoundingBox,
    cloneCell,
    cloneCells,
    insertVertex,
    createVertex,
    insertEdge,
    createEdge,
    addEdge,
    addCell,
    addCells,
    cellsAdded,
    autoSizeCell,
    removeCells,
    cellsRemoved,
    splitEdge,
    toggleCells,
    cellsToggled,
    foldCells,
    cellsFolded,
    swapBounds,
    updateAlternateBounds,
    addAllEdges,
    getAllEdges,
    updateCellSize,
    cellSizeUpdated,
    getPreferredSizeForCell,
    resizeCell,
    resizeCells,
    cellsResized,
    cellResized,
    resizeChildCells,
    constrainChildCells,
    scaleCell,
    extendParent,
    importCells,
    moveCells,
    cellsMoved,
    translateCell,
    getCellContainmentArea,

    /**
     * Function: getMaximumGraphBounds
     *
     * Returns the bounds inside which the diagram should be kept as an
     * <mxRectangle>.
     */
    getMaximumGraphBounds,
    constrainChild,
    resetEdges,
    resetEdge,
    getOutlineConstraint,
    getAllConnectionConstraints,
    getConnectionConstraint,
    setConnectionConstraint,
    getConnectionPoint,
    connectCell,
    cellConnected,
    disconnectGraph,
    getCurrentRoot,
    getTranslateForRoot,
    isPort,
    getTerminalForPort,
    getChildOffsetForCell,
    enterGroup,
    exitGroup,
    home,
    isValidRoot,
    getGraphBounds,
    getCellBounds,
    getBoundingBoxFromGeometry,
    refresh,
    snap,
    snapDelta,
    panGraph,
    zoomIn,
    zoomOut,
    zoomActual,
    zoomTo,
    center,
    zoom,
    zoomToRect,
    scrollCellToVisible,
    scrollRectToVisible,
    getCellGeometry,
    isCellVisible,
    isCellCollapsed,
    isCellConnectable,
    isOrthogonal,
    isLoop,
    isCloneEvent,
    isTransparentClickEvent,
    isToggleEvent,
    isGridEnabledEvent,
    isConstrainedEvent,
    isIgnoreTerminalEvent,
    validationAlert,
    isEdgeValid,
    getEdgeValidationError,
    validateEdge,
    validateGraph,
    getCellValidationError,
    validateCell,

    /**
     * Function: getBackgroundImage
     *
     * Returns the <backgroundImage> as an <mxImage>.
     */
    getBackgroundImage,

    /**
     * Function: setBackgroundImage
     *
     * Sets the new <backgroundImage>.
     *
     * Parameters:
     *
     * image - New <mxImage> to be used for the background.
     */
    setBackgroundImage,
    getFoldingImage,
    convertValueToString,
    getLabel,
    isHtmlLabel,

    /**
     * Function: isHtmlLabels
     *
     * Returns <htmlLabels>.
     */
    isHtmlLabels,

    /**
     * Function: setHtmlLabels
     *
     * Sets <htmlLabels>.
     */
    setHtmlLabels,
    isWrapping,
    isLabelClipped,
    getTooltip,
    getTooltipForCell,
    getLinkForCell,
    getCursorForMouseEvent,
    getCursorForCell,
    getStartSize,
    getSwimlaneDirection,
    getActualStartSize,
    getImage,
    isTransparentState,
    getVerticalAlign,
    getIndicatorColor,
    getIndicatorGradientColor,
    getIndicatorShape,
    getIndicatorImage,

    /**
     * Function: getBorder
     *
     * Returns the value of <border>.
     */
    getBorder,

    /**
     * Function: setBorder
     *
     * Sets the value of <border>.
     *
     * Parameters:
     *
     * value - Positive integer that represents the border to be used.
     */
    setBorder,
    isSwimlane,

    /**
     * Function: isResizeContainer
     *
     * Returns <resizeContainer>.
     */
    isResizeContainer,

    /**
     * Function: setResizeContainer
     *
     * Sets <resizeContainer>.
     *
     * Parameters:
     *
     * value - Boolean indicating if the container should be resized.
     */
    setResizeContainer,

    /**
     * Function: setEnabled
     *
     * Specifies if the graph should allow any interactions. This
     * implementation updates <enabled>.
     *
     * Parameters:
     *
     * value - Boolean indicating if the graph should be enabled.
     */
    isEnabled,
    setEnabled,

    /**
     * Function: isEscapeEnabled
     *
     * Returns <escapeEnabled>.
     */
    isEscapeEnabled,
    setEscapeEnabled,

    /**
     * Function: isInvokesStopCellEditing
     *
     * Returns <invokesStopCellEditing>.
     */
    isInvokesStopCellEditing,

    /**
     * Function: setInvokesStopCellEditing
     *
     * Sets <invokesStopCellEditing>.
     */
    setInvokesStopCellEditing,

    /**
     * Function: isEnterStopsCellEditing
     *
     * Returns <enterStopsCellEditing>.
     */
    isEnterStopsCellEditing,

    /**
     * Function: setEnterStopsCellEditing
     *
     * Sets <enterStopsCellEditing>.
     */
    setEnterStopsCellEditing,
    isCellLocked,

    /**
     * Function: isCellsLocked
     *
     * Returns true if the given cell may not be moved, sized, bended,
     * disconnected, edited or selected. This implementation returns true for
     * all vertices with a relative geometry if <locked> is false.
     *
     * Parameters:
     *
     * cell - <mxCell> whose locked state should be returned.
     */
    isCellsLocked,

    /**
     * Function: setCellsLocked
     *
     * Sets if any cell may be moved, sized, bended, disconnected, edited or
     * selected.
     *
     * Parameters:
     *
     * value - Boolean that defines the new value for <cellsLocked>.
     */
    setCellsLocked,
    getCloneableCells,
    isCellCloneable,

    /**
     * Function: isCellsCloneable
     *
     * Returns <cellsCloneable>, that is, if the graph allows cloning of cells
     * by using control-drag.
     */
    isCellsCloneable,

    /**
     * Function: setCellsCloneable
     *
     * Specifies if the graph should allow cloning of cells by holding down the
     * control key while cells are being moved. This implementation updates
     * <cellsCloneable>.
     *
     * Parameters:
     *
     * value - Boolean indicating if the graph should be cloneable.
     */
    setCellsCloneable,
    getExportableCells,
    canExportCell,
    getImportableCells,
    canImportCell,
    isCellSelectable,

    /**
     * Function: isCellsSelectable
     *
     * Returns <cellsSelectable>.
     */
    isCellsSelectable,

    /**
     * Function: setCellsSelectable
     *
     * Sets <cellsSelectable>.
     */
    setCellsSelectable,
    getDeletableCells,
    isCellDeletable,

    /**
     * Function: isCellsDeletable
     *
     * Returns <cellsDeletable>.
     */
    isCellsDeletable,

    /**
     * Function: setCellsDeletable
     *
     * Sets <cellsDeletable>.
     *
     * Parameters:
     *
     * value - Boolean indicating if the graph should allow deletion of cells.
     */
    setCellsDeletable,
    isLabelMovable,
    isCellRotatable,
    getMovableCells,
    isCellMovable,

    /**
     * Function: isCellsMovable
     *
     * Returns <cellsMovable>.
     */
    isCellsMovable,

    /**
     * Function: setCellsMovable
     *
     * Specifies if the graph should allow moving of cells. This implementation
     * updates <cellsMsovable>.
     *
     * Parameters:
     *
     * value - Boolean indicating if the graph should allow moving of cells.
     */
    setCellsMovable,

    /**
     * Function: isGridEnabled
     *
     * Returns <gridEnabled> as a boolean.
     */
    isGridEnabled,

    /**
     * Function: setGridEnabled
     *
     * Specifies if the grid should be enabled.
     *
     * Parameters:
     *
     * value - Boolean indicating if the grid should be enabled.
     */
    setGridEnabled,

    /**
     * Function: isPortsEnabled
     *
     * Returns <portsEnabled> as a boolean.
     */
    isPortsEnabled,

    /**
     * Function: setPortsEnabled
     *
     * Specifies if the ports should be enabled.
     *
     * Parameters:
     *
     * value - Boolean indicating if the ports should be enabled.
     */
    setPortsEnabled,

    /**
     * Function: getGridSize
     *
     * Returns <gridSize>.
     */
    getGridSize,

    /**
     * Function: setGridSize
     *
     * Sets <gridSize>.
     */
    setGridSize,

    /**
     * Function: getTolerance
     *
     * Returns <tolerance>.
     */
    getTolerance,

    /**
     * Function: setTolerance
     *
     * Sets <tolerance>.
     */
    setTolerance,

    /**
     * Function: isVertexLabelsMovable
     *
     * Returns <vertexLabelsMovable>.
     */
    isVertexLabelsMovable,

    /**
     * Function: setVertexLabelsMovable
     *
     * Sets <vertexLabelsMovable>.
     */
    setVertexLabelsMovable,

    /**
     * Function: isEdgeLabelsMovable
     *
     * Returns <edgeLabelsMovable>.
     */
    isEdgeLabelsMovable,

    /**
     * Function: isEdgeLabelsMovable
     *
     * Sets <edgeLabelsMovable>.
     */
    setEdgeLabelsMovable,

    /**
     * Function: isSwimlaneNesting
     *
     * Returns <swimlaneNesting> as a boolean.
     */
    isSwimlaneNesting,

    /**
     * Function: setSwimlaneNesting
     *
     * Specifies if swimlanes can be nested by drag and drop. This is only
     * taken into account if dropEnabled is true.
     *
     * Parameters:
     *
     * value - Boolean indicating if swimlanes can be nested.
     */
    setSwimlaneNesting,

    /**
     * Function: isSwimlaneSelectionEnabled
     *
     * Returns <swimlaneSelectionEnabled> as a boolean.
     */
    isSwimlaneSelectionEnabled,

    /**
     * Function: setSwimlaneSelectionEnabled
     *
     * Specifies if swimlanes should be selected if the mouse is released
     * over their content area.
     *
     * Parameters:
     *
     * value - Boolean indicating if swimlanes content areas
     * should be selected when the mouse is released over them.
     */
    setSwimlaneSelectionEnabled,

    /**
     * Function: isMultigraph
     *
     * Returns <multigraph> as a boolean.
     */
    isMultigraph,

    /**
     * Function: setMultigraph
     *
     * Specifies if the graph should allow multiple connections between the
     * same pair of vertices.
     *
     * Parameters:
     *
     * value - Boolean indicating if the graph allows multiple connections
     * between the same pair of vertices.
     */
    setMultigraph,

    /**
     * Function: isAllowLoops
     *
     * Returns <allowLoops> as a boolean.
     */
    isAllowLoops,

    /**
     * Function: setAllowDanglingEdges
     *
     * Specifies if dangling edges are allowed, that is, if edges are allowed
     * that do not have a source and/or target terminal defined.
     *
     * Parameters:
     *
     * value - Boolean indicating if dangling edges are allowed.
     */
    setAllowDanglingEdges,

    /**
     * Function: isAllowDanglingEdges
     *
     * Returns <allowDanglingEdges> as a boolean.
     */
    isAllowDanglingEdges,

    /**
     * Function: setConnectableEdges
     *
     * Specifies if edges should be connectable.
     *
     * Parameters:
     *
     * value - Boolean indicating if edges should be connectable.
     */
    setConnectableEdges,

    /**
     * Function: isConnectableEdges
     *
     * Returns <connectableEdges> as a boolean.
     */
    isConnectableEdges,

    /**
     * Function: setCloneInvalidEdges
     *
     * Specifies if edges should be inserted when cloned but not valid wrt.
     * <getEdgeValidationError>. If false such edges will be silently ignored.
     *
     * Parameters:
     *
     * value - Boolean indicating if cloned invalid edges should be
     * inserted into the graph or ignored.
     */
    setCloneInvalidEdges,

    /**
     * Function: isCloneInvalidEdges
     *
     * Returns <cloneInvalidEdges> as a boolean.
     */
    isCloneInvalidEdges,

    /**
     * Function: setAllowLoops
     *
     * Specifies if loops are allowed.
     *
     * Parameters:
     *
     * value - Boolean indicating if loops are allowed.
     */
    setAllowLoops,

    /**
     * Function: isDisconnectOnMove
     *
     * Returns <disconnectOnMove> as a boolean.
     */
    isDisconnectOnMove,

    /**
     * Function: setDisconnectOnMove
     *
     * Specifies if edges should be disconnected when moved. (Note: Cloned
     * edges are always disconnected.)
     *
     * Parameters:
     *
     * value - Boolean indicating if edges should be disconnected
     * when moved.
     */
    setDisconnectOnMove,

    /**
     * Function: isDropEnabled
     *
     * Returns <dropEnabled> as a boolean.
     */
    isDropEnabled,

    /**
     * Function: setDropEnabled
     *
     * Specifies if the graph should allow dropping of cells onto or into other
     * cells.
     *
     * Parameters:
     *
     * dropEnabled - Boolean indicating if the graph should allow dropping
     * of cells into other cells.
     */
    setDropEnabled,

    /**
     * Function: isSplitEnabled
     *
     * Returns <splitEnabled> as a boolean.
     */
    isSplitEnabled,

    /**
     * Function: setSplitEnabled
     *
     * Specifies if the graph should allow dropping of cells onto or into other
     * cells.
     *
     * Parameters:
     *
     * dropEnabled - Boolean indicating if the graph should allow dropping
     * of cells into other cells.
     */
    setSplitEnabled,
    isCellResizable,

    /**
     * Function: isCellsResizable
     *
     * Returns <cellsResizable>.
     */
    isCellsResizable,

    /**
     * Function: setCellsResizable
     *
     * Specifies if the graph should allow resizing of cells. This
     * implementation updates <cellsResizable>.
     *
     * Parameters:
     *
     * value - Boolean indicating if the graph should allow resizing of
     * cells.
     */
    setCellsResizable,

    /**
     * Function: isTerminalPointMovable
     *
     * Returns true if the given terminal point is movable. This is independent
     * from <isCellConnectable> and <isCellDisconnectable> and controls if terminal
     * points can be moved in the graph if the edge is not connected. Note that it
     * is required for this to return true to connect unconnected edges. This
     * implementation returns true.
     *
     * Parameters:
     *
     * cell - <mxCell> whose terminal point should be moved.
     * source - Boolean indicating if the source or target terminal should be moved.
     */
    isTerminalPointMovable,
    isCellBendable,

    /**
     * Function: isCellsBendable
     *
     * Returns <cellsBenadable>.
     */
    isCellsBendable,

    /**
     * Function: setCellsBendable
     *
     * Specifies if the graph should allow bending of edges. This
     * implementation updates <bendable>.
     *
     * Parameters:
     *
     * value - Boolean indicating if the graph should allow bending of
     * edges.
     */
    setCellsBendable,
    isCellEditable,

    /**
     * Function: isCellsEditable
     *
     * Returns <cellsEditable>.
     */
    isCellsEditable,

    /**
     * Function: setCellsEditable
     *
     * Specifies if the graph should allow in-place editing for cell labels.
     * This implementation updates <cellsEditable>.
     *
     * Parameters:
     *
     * value - Boolean indicating if the graph should allow in-place
     * editing.
     */
    setCellsEditable,
    isCellDisconnectable,

    /**
     * Function: isCellsDisconnectable
     *
     * Returns <cellsDisconnectable>.
     */
    isCellsDisconnectable,

    /**
     * Function: setCellsDisconnectable
     *
     * Sets <cellsDisconnectable>.
     */
    setCellsDisconnectable,
    isValidSource,
    isValidTarget,
    isValidConnection,
    setConnectable,
    isConnectable,
    setTooltips,
    setPanning,
    isEditing,
    isAutoSizeCell,

    /**
     * Function: isAutoSizeCells
     *
     * Returns <autoSizeCells>.
     */
    isAutoSizeCells,

    /**
     * Function: setAutoSizeCells
     *
     * Specifies if cell sizes should be automatically updated after a label
     * change. This implementation sets <autoSizeCells> to the given parameter.
     * To update the size of cells when the cells are added, set
     * <autoSizeCellsOnAdd> to true.
     *
     * Parameters:
     *
     * value - Boolean indicating if cells should be resized
     * automatically.
     */
    setAutoSizeCells,
    isExtendParent,

    /**
     * Function: isExtendParents
     *
     * Returns <extendParents>.
     */
    isExtendParents,

    /**
     * Function: setExtendParents
     *
     * Sets <extendParents>.
     *
     * Parameters:
     *
     * value - New boolean value for <extendParents>.
     */
    setExtendParents,

    /**
     * Function: isExtendParentsOnAdd
     *
     * Returns <extendParentsOnAdd>.
     */
    isExtendParentsOnAdd,

    /**
     * Function: setExtendParentsOnAdd
     *
     * Sets <extendParentsOnAdd>.
     *
     * Parameters:
     *
     * value - New boolean value for <extendParentsOnAdd>.
     */
    setExtendParentsOnAdd,

    /**
     * Function: isExtendParentsOnMove
     *
     * Returns <extendParentsOnMove>.
     */
    isExtendParentsOnMove,

    /**
     * Function: setExtendParentsOnMove
     *
     * Sets <extendParentsOnMove>.
     *
     * Parameters:
     *
     * value - New boolean value for <extendParentsOnAdd>.
     */
    setExtendParentsOnMove,

    /**
     * Function: isRecursiveResize
     *
     * Returns <recursiveResize>.
     *
     * Parameters:
     *
     * state - <mxCellState> that is being resized.
     */
    isRecursiveResize,

    /**
     * Function: setRecursiveResize
     *
     * Sets <recursiveResize>.
     *
     * Parameters:
     *
     * value - New boolean value for <recursiveResize>.
     */
    setRecursiveResize,
    isConstrainChild,

    /**
     * Function: isConstrainChildren
     *
     * Returns <constrainChildren>.
     */
    isConstrainChildren,

    /**
     * Function: setConstrainChildren
     *
     * Sets <constrainChildren>.
     */
    setConstrainChildren,

    /**
     * Function: isConstrainRelativeChildren
     *
     * Returns <constrainRelativeChildren>.
     */
    isConstrainRelativeChildren,

    /**
     * Function: setConstrainRelativeChildren
     *
     * Sets <constrainRelativeChildren>.
     */
    setConstrainRelativeChildren,

    /**
     * Function: isConstrainChildren
     *
     * Returns <allowNegativeCoordinates>.
     */
    isAllowNegativeCoordinates,

    /**
     * Function: setConstrainChildren
     *
     * Sets <allowNegativeCoordinates>.
     */
    setAllowNegativeCoordinates,
    getOverlap,
    isAllowOverlapParent,
    getFoldableCells,
    isCellFoldable,
    isValidDropTarget,
    isSplitTarget,
    getDropTarget,
    getDefaultParent,

    /**
     * Function: setDefaultParent
     *
     * Sets the <defaultParent> to the given cell. Set this to null to return
     * the first child of the root in getDefaultParent.
     */
    setDefaultParent,
    getSwimlane,
    getSwimlaneAt,
    getCellAt,
    intersects,
    hitsSwimlaneContent,
    getChildVertices,
    getChildEdges,
    getChildCells,
    getConnections,
    getIncomingEdges,
    getOutgoingEdges,
    getEdges,
    isValidAncestor,
    getOpposites,
    getEdgesBetween,
    getPointForEvent,
    getCells,
    getCellsBeyond,
    findTreeRoots,
    traverse,
    isCellSelected,
    isSelectionEmpty,
    clearSelection,
    getSelectionCount,
    getSelectionCell,
    getSelectionCells,
    setSelectionCell,
    setSelectionCells,
    addSelectionCell,
    addSelectionCells,
    removeSelectionCell,
    removeSelectionCells,
    selectRegion,
    selectNextCell,
    selectPreviousCell,
    selectParentCell,
    selectChildCell,
    selectCell,
    selectAll,
    selectVertices,
    selectEdges,
    selectCells,
    selectCellForEvent,
    selectCellsForEvent,
    createHandler,
    createVertexHandler,
    createEdgeHandler,
    createEdgeSegmentHandler,
    createElbowEdgeHandler,
    addMouseListener,
    removeMouseListener,
    updateMouseEvent,
    getStateForTouchEvent,
    isEventIgnored,
    isSyntheticEventIgnored,
    isEventSourceIgnored,
    getEventState,
    fireMouseEvent,
    consumeMouseEvent,
    fireGestureEvent,
    getCellRenderer,
    isPageVisible,
    setPageVisible,
    isMouseDown,
    getTooltipHandler,
    getPopupMenuHandler,
    getSelectionCellsHandler,
    setSelectionCellsHandler,
    getConnectionHandler,
    setConnectionHandler,
    getGraphHandler,
    getCellEditor,
    isNativeDblClickEnabled,
    setNativeDblClickEnabled,
    isFoldingEnabled,
    setFoldingEnabled,
    isKeepEdgesInForeground,
    setKeepEdgesInForeground,
    isKeepEdgesInBackground,
    setKeepEdgesInBackground,
    getPanDx,
    setPanDx,
    getPanDy,
    setPanDy,
    isResetEdgesOnConnect,
    setResetEdgesOnConnect,
    isResetEdgesOnMove,
    setResetEdgesOnMove,
    isResetEdgesOnResize,
    setResetEdgesOnResize,
    getDefaultLoopStyle,
    setDefaultLoopStyle,
    destroy
  };

  // Initializes the main members that do not require a container
  setModel(isSet(model) ? model : GraphModel());
  setMultiplicities([]);
  setImageBundles([]);
  setCellRenderer(createCellRenderer());
  setSelectionModel(createSelectionModel());
  setStylesheet(isSet(stylesheet) ? stylesheet : createStylesheet());
  setView(createGraphView());

  getModel().addListener(Event.CHANGE, getGraphModelChangeListener());

  // Installs basic event handlers with disabled default settings.
  createHandlers();

  // Initializes the display if a container was specified
  if (isSet(container)) {
    init(container);
  }

  getView().revalidate();

  return me;
};

export default makeComponent(Graph);
