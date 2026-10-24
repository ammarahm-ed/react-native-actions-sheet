const EventManager = require('../dist/src/eventmanager').default;

test('an unrelated publish preserves a once subscription', () => {
  const events = new EventManager();
  const handler = jest.fn();
  events.subscribe('close', handler, true);
  events.publish('open');
  events.publish('close', 'synthetic');
  events.publish('close', 'again');
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledWith('synthetic');
});

test('a once handler cannot fire again during a nested publish', () => {
  const events = new EventManager();
  const handler = jest.fn(() => events.publish('close'));
  events.subscribe('close', handler, true);
  events.publish('close');
  expect(handler).toHaveBeenCalledTimes(1);
});

test('persistent subscriptions keep receiving their matching event', () => {
  const events = new EventManager();
  const handler = jest.fn();
  events.subscribe('close', handler);
  events.publish('open');
  events.publish('close');
  events.publish('close');
  expect(handler).toHaveBeenCalledTimes(2);
});
