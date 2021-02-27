import { isSet } from '../Helpers';

test('isSet with a single null', () => {
  const r = isSet(null);

  expect(r).toStrictEqual(false);
});

test('isSet with a single undefined', () => {
  const r = isSet(undefined);

  expect(r).toStrictEqual(false);
});

test('isSet with a single value', () => {
  const r = isSet('hello');

  expect(r).toStrictEqual(true);
});

test('isSet with an empty string', () => {
  const r = isSet('');

  expect(r).toStrictEqual(true);
});
