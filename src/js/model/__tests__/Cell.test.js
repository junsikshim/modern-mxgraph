import * as Constants from '../../util/Constants';
import Cell from '../Cell';
import Geometry from '../Geometry';

const g = Geometry(10, 20, 30, 40);

test('initialize with default values', () => {
  const c = Cell('cell value', g, '');

  expect(c.getValue()).toStrictEqual('cell value');
  expect(c.getGeometry()).toStrictEqual(g);
  expect(c.getStyle()).toStrictEqual('');
});

test('setGeometry should change the value', () => {
  const c = Cell('cell value', g, '');
  c.setGeometry(Geometry(20, 30, 40, 50));

  expect(c.getGeometry().equals(Geometry(20, 30, 40, 50))).toStrictEqual(true);
});

test('setValue should change the value', () => {
  const c = Cell('cell value', g, '');
  c.setValue({ some: 1234 });

  expect(c.getValue()).toStrictEqual({ some: 1234 });
});

test('edgecount should be 0 on initial', () => {
  const c = Cell('cell value', g, '');
  expect(c.getEdgeCount()).toStrictEqual(0);
});

test('cloning a cell will create another', () => {
  const c = Cell('cell value', g, '');
  const c2 = c.clone();

  expect(c.getValue()).toStrictEqual(c2.getValue());
  expect(c.getGeometry().equals(c2.getGeometry())).toStrictEqual(true);
});
