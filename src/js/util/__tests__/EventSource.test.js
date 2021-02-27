import * as Constants from '../../util/Constants';
import EventObject from '../EventObject';
import EventSource from '../EventSource';

test('create a eventsource', () => {
  const es = EventSource();

  expect(es.getEventSource()).toStrictEqual(null);
});

test('add a listener and fire it', () => {
  let isCalled = false;
  const es = EventSource();

  es.addListener('hello', () => {
    isCalled = true;
  });

  expect(isCalled).toStrictEqual(false);

  es.fireEvent(EventObject('hello'));

  expect(isCalled).toStrictEqual(true);
});

test('add a listener then remove it', () => {
  let isCalled = false;
  const es = EventSource();
  const callback = () => {
    isCalled = true;
  };

  es.addListener('hello', callback);
  es.removeListener(callback);
  es.fireEvent(EventObject('hello'));

  expect(isCalled).toStrictEqual(false);
});
