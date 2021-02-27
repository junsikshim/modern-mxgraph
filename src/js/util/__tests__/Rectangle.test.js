import * as Constants from '../../util/Constants';
import Rectangle from '../Rectangle';

test('create a rectangle with values', () => {
  const r = Rectangle(100, 200, 300, 400);

  expect(r.getX()).toStrictEqual(100);
  expect(r.getY()).toStrictEqual(200);
  expect(r.getWidth()).toStrictEqual(300);
  expect(r.getHeight()).toStrictEqual(400);
});

test('get center coordinates', () => {
  const r = Rectangle(100, 200, 300, 400);

  expect(r.getCenterX()).toStrictEqual(250);
  expect(r.getCenterY()).toStrictEqual(400);
});

test('add other rect', () => {
  const r = Rectangle(100, 200, 300, 400);
  const r2 = Rectangle(50, 60, 70, 80);

  r.add(r2);

  expect(r.getX()).toStrictEqual(50);
  expect(r.getY()).toStrictEqual(60);
  expect(r.getWidth()).toStrictEqual(350);
  expect(r.getHeight()).toStrictEqual(540);
});

test('find intersection with other rect', () => {
  const r = Rectangle(100, 200, 300, 400);
  const r2 = Rectangle(50, 60, 70, 80);

  r.intersect(r2);

  expect(r.getX()).toStrictEqual(100);
  expect(r.getY()).toStrictEqual(200);
  expect(r.getWidth()).toStrictEqual(20);
  expect(r.getHeight()).toStrictEqual(-60);
});

test('grow rectangle by some amount', () => {
  const r = Rectangle(100, 200, 300, 400);

  r.grow(20);

  expect(r.getX()).toStrictEqual(80);
  expect(r.getY()).toStrictEqual(180);
  expect(r.getWidth()).toStrictEqual(340);
  expect(r.getHeight()).toStrictEqual(440);
});

test('get point of the rect', () => {
  const r = Rectangle(100, 200, 300, 400);

  expect(r.getPoint().getX()).toStrictEqual(100);
  expect(r.getPoint().getY()).toStrictEqual(200);
});

test('rotate 90 degrees', () => {
  const r = Rectangle(100, 200, 300, 400);

  r.rotate90();

  expect(r.getX()).toStrictEqual(50);
  expect(r.getY()).toStrictEqual(250);
  expect(r.getWidth()).toStrictEqual(400);
  expect(r.getHeight()).toStrictEqual(300);
});

test('should be equal', () => {
  const r = Rectangle(100, 200, 300, 400);
  const r2 = Rectangle.fromRectangle(r);

  expect(r.equals(r2)).toStrictEqual(true);
});

test('should not be equal', () => {
  const r = Rectangle(100, 200, 300, 400);
  const r2 = Rectangle.fromRectangle(r);
  r2.grow(1);

  expect(r.equals(r2)).toStrictEqual(false);
});
