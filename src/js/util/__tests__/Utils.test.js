import * as Constants from '../../util/Constants';
import { getFunctionName } from '../Utils';
import Cell from '../../model/Cell';

test('getting function name from an object', () => {
  const c = Cell();
  expect(getFunctionName(c)).toStrictEqual('Cell');
});
