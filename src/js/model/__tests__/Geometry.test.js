import * as Constants from '../../util/Constants';
import Geometry from '../Geometry';

test('check if two geometries equal', () => {
  const g = Geometry(100, 200, 300, 400);
  const g2 = Geometry(100, 200, 300, 400);

  expect(g.equals(g2)).toStrictEqual(true);
});
