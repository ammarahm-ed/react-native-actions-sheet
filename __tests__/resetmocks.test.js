/**
 * The mock must keep working when a project sets `resetMocks: true`.
 * That option strips implementations after every test, so anything installed
 * once at module load would silently start returning undefined.
 */
jest.mock('react-native-actions-sheet', () =>
  require('react-native-actions-sheet/jest/mock'),
);

const {SheetManager} = require('react-native-actions-sheet/jest/mock');

it('SheetManager.show still resolves after mocks are reset', async () => {
  jest.resetAllMocks();
  await expect(SheetManager.show('x')).resolves.toBeUndefined();
  await expect(SheetManager.hide('x')).resolves.toBeUndefined();
  await expect(SheetManager.update('x')).resolves.toBeUndefined();
});

it('other helpers still return their documented values after reset', () => {
  jest.resetAllMocks();
  expect(SheetManager.get('x')).toBeUndefined();
  expect(SheetManager.getActiveSheets('x')).toEqual([]);
  expect(SheetManager.context()).toBe('global');
});

it('ref show() still renders children after reset', async () => {
  const React = require('react');
  const renderer = require('react-test-renderer');
  const ActionSheet = require('react-native-actions-sheet').default;
  const RN = require('react-native');
  jest.resetAllMocks();
  const ref = React.createRef();
  let tree;
  await renderer.act(async () => {
    tree = renderer.create(
      React.createElement(ActionSheet, {ref}, React.createElement(RN.Text, null, 'body')),
    );
  });
  await renderer.act(async () => {
    ref.current.show();
  });
  const text = JSON.stringify(tree.toJSON());
  expect(text).toContain('body');
});
