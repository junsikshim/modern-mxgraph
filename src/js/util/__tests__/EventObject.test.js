import * as Constants from '../../util/Constants';
import EventObject from '../EventObject';

test('create an event object with name "hello"', () => {
  const e = EventObject('hello');
  expect(e.getName()).toStrictEqual('hello');
});

test('check if the created event object has correct properties', () => {
  const e = EventObject('hello', 'arg1', 123, 'arg2', 'world');

  expect(e.getProperty('arg1')).toStrictEqual(123);
  expect(e.getProperty('arg2')).toStrictEqual('world');
});

test('consume an event object', () => {
  const e = EventObject('hello');
  expect(e.isConsumed()).toStrictEqual(false);

  e.consume();
  expect(e.isConsumed()).toStrictEqual(true);
});
