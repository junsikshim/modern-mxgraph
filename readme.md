# modern-mxgraph

This is a modernized version of mxGraph.

The official mxGraph is at https://github.com/jgraph/mxgraph. However, it is discontinued as of now.

## Objectives

- Reformat into ES6 modules to enable tree-shaking
- Favor composition over inheritance
- Replace class components with functional components
- Remove support for IE10 and under
- Remove fetch-related operations
- Remove language-related resources
- Divide the components into plugins (later)

## Conversion progress

### /

| File      | LoC | Progress  | Unit tests |
| --------- | --- | --------- | ---------- |
| /mxClient | 798 | Converted |            |

### /handler

| File                             | LoC   | Progress  | Unit tests |
| -------------------------------- | ----- | --------- | ---------- |
| /handler/mxCellHighlight         | 315   | Converted |            |
| /handler/mxCellMarker            | 431   | Converted |            |
| /handler/mxCellTracker           | 146   |           |            |
| /handler/mxConnectionHandler     | 2250  | Converted |            |
| /handler/mxConstraintHandler     | 518   | Converted |            |
| /handler/mxEdgeHandler           | 2545  | Converted |            |
| /handler/mxEdgeSegmentHandler    | 414   |           |            |
| /handler/mxElbowEdgeHandler      | 231   |           |            |
| /handler/mxGraphHandler          | 1866  | Converted |            |
| /handler/mxHandle                | 353   |           |            |
| /handler/mxKeyHandler            | 429   |           |            |
| /handler/mxPanningHandler        | 495   | Converted |            |
| /handler/mxPopupMenuHandler      | 219   | Converted |            |
| /handler/mxRubberband            | 430   |           |            |
| /handler/mxSelectionCellsHandler | 345   | Converted |            |
| /handler/mxTooltipHandler        | 354   | Converted |            |
| /handler/mxVertexHandler         | 2252  | Converted |            |
| Total                            | 13593 |           |            |

### /io

| File                         | LoC  | Progress | Unit tests |
| ---------------------------- | ---- | -------- | ---------- |
| /io/mxCellCodec              | 190  |          |            |
| /io/mxChildChangeCodec       | 169  |          |            |
| /io/mxCodec                  | 622  |          |            |
| /io/mxCodecRegistry          | 138  |          |            |
| /io/mxDefaultKeyHandlerCodec | 89   |          |            |
| /io/mxDefaultPopupMenuCodec  | 55   |          |            |
| /io/mxDefaultToolbarCodec    | 313  |          |            |
| /io/mxEditorCodec            | 246  |          |            |
| /io/mxGenericChangeCodec     | 65   |          |            |
| /io/mxGraphCodec             | 29   |          |            |
| /io/mxGraphViewCodec         | 198  |          |            |
| /io/mxModelCodec             | 81   |          |            |
| /io/mxObjectCodec            | 1098 |          |            |
| /io/mxRootChangeCodec        | 84   |          |            |
| /io/mxStylesheetCodec        | 218  |          |            |
| /io/mxTerminalChangeCodec    | 43   |          |            |
| Total                        | 3638 |          |            |

### /layout

| File                         | LoC  | Progress | Unit tests |
| ---------------------------- | ---- | -------- | ---------- |
| /layout/mxCircleLayout       | 204  |          |            |
| /layout/mxCompactTreeLayout  | 1116 |          |            |
| /layout/mxCompositeLayout    | 102  |          |            |
| /layout/mxEdgeLabelLayout    | 166  |          |            |
| /layout/mxFastOrganicLayout  | 592  |          |            |
| /layout/mxGraphLayout        | 592  |          |            |
| /layout/mxParallelEdgeLayout | 271  |          |            |
| /layout/mxPartitionLayout    | 241  |          |            |
| /layout/mxRadialTreeLayout   | 319  |          |            |
| /layout/mxStackLayout        | 604  |          |            |
| Total                        | 4207 |          |            |

#### /hierarchical

| File                                      | LoC  | Progress | Unit tests |
| ----------------------------------------- | ---- | -------- | ---------- |
| /layout/hierarchical/mxHierarchicalLayout | 852  |          |            |
| /layout/hierarchical/mxSwimlaneLayout     | 934  |          |            |
| Total                                     | 1786 |          |            |

    ##### 		/model

| File                                                    | LoC  | Progress | Unit tests |
| ------------------------------------------------------- | ---- | -------- | ---------- |
| /layout/hierarchical/model/mxGraphAbstractHierarchyCell | 201  |          |            |
| /layout/hierarchical/model/mxGraphHierarchyEdge         | 188  |          |            |
| /layout/hierarchical/model/mxGraphHierarchyModel        | 682  |          |            |
| /layout/hierarchical/model/mxGraphHierarchyNode         | 221  |          |            |
| /layout/hierarchical/model/mxSwimlaneModel              | 802  |          |            |
| Total                                                   | 2094 |          |            |

##### /stage

| File                                                       | LoC  | Progress | Unit tests |
| ---------------------------------------------------------- | ---- | -------- | ---------- |
| /layout/hierarchical/stage/mxCoordinateAssignment          | 1744 |          |            |
| /layout/hierarchical/stage/mxHierarchicalLayoutStage       | 26   |          |            |
| /layout/hierarchical/stage/mxMedianHybridCrossingReduction | 676  |          |            |
| /layout/hierarchical/stage/mxMinimumCycleRemover           | 109  |          |            |
| /layout/hierarchical/stage/mxSwimlaneOrdering              | 96   |          |            |
| Total                                                      | 2651 |          |            |

### /model

| File                | LoC  | Progress  | Unit tests |
| ------------------- | ---- | --------- | ---------- |
| /model/mxCell       | 826  | Converted |            |
| /model/mxCellPath   | 164  | Converted |            |
| /model/mxGeometry   | 416  | Converted |            |
| /model/mxGraphModel | 2706 | Converted |            |
| Total               | 4112 |           |            |

### /shape

| File                     | LoC  | Progress  | Unit tests |
| ------------------------ | ---- | --------- | ---------- |
| /shape/mxActor           | 87   |           |            |
| /shape/mxArrow           | 116  |           |            |
| /shape/mxArrowConnector  | 495  |           |            |
| /shape/mxCloud           | 56   |           |            |
| /shape/mxConnector       | 150  | Converted |            |
| /shape/mxCylinder        | 119  | Converted |            |
| /shape/mxDoubleEllipse   | 115  |           |            |
| /shape/mxEllipse         | 49   | Converted |            |
| /shape/mxHexagon         | 35   |           |            |
| /shape/mxImageShape      | 244  | Converted |            |
| /shape/mxLabel           | 277  |           |            |
| /shape/mxLine            | 70   |           |            |
| /shape/mxMarker          | 209  | Converted |            |
| /shape/mxPolyline        | 133  | Converted |            |
| /shape/mxRectangleShape  | 128  | Converted |            |
| /shape/mxRhombus         | 65   | Converted |            |
| /shape/mxShape           | 1673 | Converted |            |
| /shape/mxStencil         | 868  | Converted |            |
| /shape/mxStencilRegistry | 54   | Converted |            |
| /shape/mxSwimlane        | 506  |           |            |
| /shape/mxText            | 1438 | Converted |            |
| /shape/mxTriangle        | 44   |           |            |
| Total                    | 6931 |           |            |

### /util

| File                     | LoC   | Progress  | Unit tests |
| ------------------------ | ----- | --------- | ---------- |
| /util/mxAbstractCanvas2D | 643   | Converted |            |
| /util/mxAnimation        | 93    |           |            |
| /util/mxAutoSaveManager  | 214   |           |            |
| /util/mxClipboard        | 222   |           |            |
| /util/mxConstants        | 2339  | Converted |            |
| /util/mxDictionary       | 131   | Converted |            |
| /util/mxDivResizer       | 152   |           |            |
| /util/mxDragSource       | 726   |           |            |
| /util/mxEffects          | 212   |           |            |
| /util/mxEvent            | 1487  | Converted |            |
| /util/mxEventObject      | 112   | Converted |            |
| /util/mxEventSource      | 190   | Converted |            |
| /util/mxForm             | 203   |           |            |
| /util/mxGuide            | 449   |           |            |
| /util/mxImage            | 40    | Converted |            |
| /util/mxImageBundle      | 104   |           |            |
| /util/mxImageExport      | 184   |           |            |
| /util/mxLog              | 415   | Skipped   |            |
| /util/mxMorphing         | 250   |           |            |
| /util/mxMouseEvent       | 246   | Converted |            |
| /util/mxObjectIdentity   | 73    | Converted |            |
| /util/mxPanningManager   | 266   |           |            |
| /util/mxPoint            | 55    | Converted |            |
| /util/mxPopupMenu        | 621   | Converted |            |
| /util/mxRectangle        | 182   | Converted |            |
| /util/mxResources        | 451   | Skipped   |            |
| /util/mxSvgCanvas2D      | 1950  | Converted |            |
| /util/mxToolbar          | 528   |           |            |
| /util/mxUndoableEdit     | 214   | Converted |            |
| /util/mxUndoManager      | 230   |           |            |
| /util/mxUrlConverter     | 154   | Converted |            |
| /util/mxUtils            | 4521  | Converted |            |
| /util/mxVmlCanvas2D      | 1103  | Skipped   |            |
| /util/mxWindow           | 1133  |           |            |
| /util/mxXmlCanvas2D      | 1218  | Skipped   |            |
| mxXmlRequest             | 456   | Skipped   |            |
| Total                    | 21567 |           |            |

### /view

| File                         | LoC   | Progress  | Unit tests |
| ---------------------------- | ----- | --------- | ---------- |
| /view/mxCellEditor           | 1221  | Converted |            |
| /view/mxCellOverlay          | 234   |           |            |
| /view/mxCellRenderer         | 1640  | Converted |            |
| /view/mxCellState            | 448   | Converted |            |
| /view/mxCellStatePreview     | 204   |           |            |
| /view/mxConnectionConstraint | 68    | Converted |            |
| /view/mxEdgeStyle            | 1653  | Converted |            |
| /view/mxGraph                | 13230 | Converted |            |
| /view/mxGraphSelectionModel  | 437   | Converted |            |
| /view/mxGraphView            | 3023  | Converted |            |
| /view/mxLayoutManager        | 501   |           |            |
| /view/mxMultiplicity         | 258   | Converted |            |
| /view/mxOutline              | 763   |           |            |
| /view/mxPerimeter            | 922   | Converted |            |
| /view/mxPrintPreview         | 1235  |           |            |
| /view/mxStyleRegistry        | 72    | Converted |            |
| /view/mxStylesheet           | 267   | Converted |            |
| /view/mxSwimlaneManager      | 451   |           |            |
| /view/mxTemporaryCellStates  | 134   | Converted |            |
| Total                        | 26761 |           |            |
