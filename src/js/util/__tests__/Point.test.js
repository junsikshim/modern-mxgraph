import * as Constants from '../../util/Constants';
import Point from '../Point';

test('create a new point', () => {
  const p = Point(100, 200);

  expect(p.getX()).toStrictEqual(100);
  expect(p.getY()).toStrictEqual(200);
});

test('set a point to a different coordinates', () => {
  const p = Point(100, 200);
  p.setX(150);
  p.setY(80);

  expect(p.getX()).toStrictEqual(150);
  expect(p.getY()).toStrictEqual(80);
});

test('a cloned point should equal to the original', () => {
  const p = Point(100, 200);
  const c = p.clone();

  expect(p.equals(c)).toStrictEqual(true);
});
