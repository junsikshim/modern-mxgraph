import * as Constants from '../../util/Constants';
import Cell from '../Cell';
import GraphModel from '../GraphModel';

test('create a graph model', () => {
  const m = GraphModel();
  const root = m.getRoot();

  expect(m.isRoot(root)).toStrictEqual(true);
});

test('add a child to the root', () => {
  const m = GraphModel();
  const parent = m.getRoot();

  expect(m.getChildCount(parent)).toStrictEqual(1);

  const c = Cell();
  c.setVertex(true);
  m.add(parent, c, 0);

  expect(m.getChildCount(parent)).toStrictEqual(2);
});

const createBasicTree = () => {
  const model = GraphModel();
  const parent = model.getRoot();

  const v1 = Cell();
  v1.setVertex(true);
  model.add(parent, v1, 0);

  const v2 = Cell();
  v2.setVertex(true);
  model.add(parent, v2, 1);

  const v2_1 = Cell();
  v2_1.setVertex(true);
  model.add(v2, v2_1, 0);

  return model;
};

test('check if createBasicTree() is working', () => {
  const m = createBasicTree();
  const root = m.getRoot();
  // console.log(`${m.getChildCells(root)}`);
  // expect(m.getChildCells(root).length).toStrictEqual(2);
});
