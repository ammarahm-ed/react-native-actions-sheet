/**
 * Verifies jest/mock.js through the public subpath, the way a consumer uses it.
 * Lives in .local/ (gitignored) so it never ships; run with:
 *   npx jest --config .local/jest.config.js
 */
jest.mock('react-native-actions-sheet', () =>
  require('react-native-actions-sheet/jest/mock'),
);

const React = require('react');
const renderer = require('react-test-renderer');
const RN = require('react-native');

const mod = require('react-native-actions-sheet');
const ActionSheet = mod.default;
const {
  SheetManager,
  ScrollView,
  FlatList,
  SheetGestureBlocker,
  CloseRequestType,
  useSheetPosition,
  useSheetRef,
  useSheetPayload,
  useSheetScrollable,
  useSheetGestureRegion,
} = mod;

const textOf = tree => {
  const out = [];
  const walk = node => {
    if (node == null) return;
    if (typeof node === 'string') return out.push(node);
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.children) node.children.forEach(walk);
  };
  walk(tree);
  return out.join('');
};

function HookProbe() {
  const position = useSheetPosition();
  const ref = useSheetRef();
  const payload = useSheetPayload();
  const scrollable = useSheetScrollable();
  const region = useSheetGestureRegion();
  return React.createElement(
    RN.Text,
    null,
    `y=${position.y.value} payload=${String(payload)} enabled=${String(
      scrollable.enabled,
    )} region=${String(region.enabled)} refApi=${typeof ref.current.show}`,
  );
}

it('mirrors the public surface', () => {
  expect(ActionSheet).toBeTruthy();
  expect(ScrollView).toBe(RN.ScrollView);
  expect(FlatList).toBe(RN.FlatList);
  expect(CloseRequestType).toEqual({
    SWIPE: 0,
    BACK_PRESS: 1,
    TOUCH_BACKDROP: 2,
    0: 'SWIPE',
    1: 'BACK_PRESS',
    2: 'TOUCH_BACKDROP',
  });
});

it('resolves SheetManager promises', async () => {
  await expect(SheetManager.show('some-sheet')).resolves.toBeUndefined();
  await expect(SheetManager.hide('some-sheet')).resolves.toBeUndefined();
  expect(SheetManager.show).toHaveBeenCalledWith('some-sheet');
});

it('renders children only once shown, and spies on the ref API', async () => {
  const ref = React.createRef();
  let tree;
  await renderer.act(async () => {
    tree = renderer.create(
      React.createElement(
        ActionSheet,
        {ref, testID: 'sheet'},
        React.createElement(RN.Text, null, 'sheet body'),
      ),
    );
  });
  expect(textOf(tree.toJSON())).toBe('');

  await renderer.act(async () => {
    ref.current.show(1);
  });
  expect(textOf(tree.toJSON())).toBe('sheet body');
  expect(ref.current.show).toHaveBeenCalledWith(1);
  expect(ref.current.isOpen()).toBe(true);
  expect(ref.current.snapToIndex).toBeDefined();
});

it('calls onClose with the value passed to hide', async () => {
  const onClose = jest.fn();
  const ref = React.createRef();
  await renderer.act(async () => {
    renderer.create(
      React.createElement(
        ActionSheet,
        {ref, onClose},
        React.createElement(RN.Text, null, 'body'),
      ),
    );
  });
  await renderer.act(async () => {
    ref.current.show();
  });
  await renderer.act(async () => {
    ref.current.hide(true);
  });
  expect(onClose).toHaveBeenCalledWith(true);
});

it('renders hook consumers inside the sheet without throwing', async () => {
  const ref = React.createRef();
  let tree;
  await renderer.act(async () => {
    tree = renderer.create(
      React.createElement(
        ActionSheet,
        {ref},
        React.createElement(
          SheetGestureBlocker,
          null,
          React.createElement(HookProbe, null),
        ),
      ),
    );
  });
  await renderer.act(async () => {
    ref.current.show();
  });
  expect(textOf(tree.toJSON())).toContain('y=0');
  expect(textOf(tree.toJSON())).toContain('refApi=function');
});
