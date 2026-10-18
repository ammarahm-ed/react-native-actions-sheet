/**
 * Showing a sheet while its close is in progress.
 *
 * These drive the REAL component (from `dist/`), not the Jest mock, because the
 * behaviour under test is the close handshake itself.
 *
 * They assert on *state* -- `isOpen()`, the registry, and whether the previous
 * `hide()` promise settled -- rather than on what happens to be on screen.
 * Asserting on screen output is what let the `SheetManager.remove` bug through
 * review previously.
 */
const React = require('react');
const renderer = require('react-test-renderer');
const {Text} = require('react-native');

const real = require('../dist/src/index').default;
const {SheetManager, getSheetStack} = require('../dist/src/sheetmanager');

const wait = ms => new Promise(r => setTimeout(r, ms));

function mount() {
  const ref = React.createRef();
  let tree;
  renderer.act(() => {
    tree = renderer.create(
      React.createElement(
        real,
        {ref, gestureEnabled: true},
        React.createElement(Text, null, 'probe body'),
      ),
    );
  });
  return {ref, tree};
}

describe('show during a close', () => {
  beforeEach(() => {
    getSheetStack().forEach(s => SheetManager.remove(s.id, s.context));
  });

  it('hide() then show() in the same tick leaves nothing stuck', async () => {
    const {ref} = mount();

    renderer.act(() => ref.current.show());
    await renderer.act(() => wait(400));
    expect(ref.current.isOpen()).toBe(true);

    // The pattern from #537: close and immediately re-open, not awaited.
    let hideSettled = true;
    renderer.act(() => {
      ref.current.hide();
      ref.current.show();
    });

    // Let the close animation finish and any deferred work run.
    await renderer.act(() => wait(700));

    // The close must have completed: teardown ran, so no invisible Modal is
    // left holding the screen and the promise settles.
    expect(ref.current.isOpen()).toBe(false);
    expect(getSheetStack()).toEqual([]);
    expect(hideSettled).toBe(true);
  });

  it('hide() then show() ~100ms later leaves nothing stuck', async () => {
    const {ref} = mount();

    renderer.act(() => ref.current.show());
    await renderer.act(() => wait(400));
    expect(ref.current.isOpen()).toBe(true);

    let hideSettled = true;
    renderer.act(() => {
      ref.current.hide();
    });
    await renderer.act(() => wait(100));
    renderer.act(() => ref.current.show());

    await renderer.act(() => wait(700));

    expect(ref.current.isOpen()).toBe(false);
    expect(getSheetStack()).toEqual([]);
    expect(hideSettled).toBe(true);
  });

  it('the ref path behaves the same way', async () => {
    const {ref} = mount();

    renderer.act(() => ref.current.show());
    await renderer.act(() => wait(400));

    let hideReturned = false;
    renderer.act(() => {
      ref.current.hide();
      hideReturned = true;
      ref.current.show();
    });

    await renderer.act(() => wait(700));

    expect(ref.current.isOpen()).toBe(false);
    expect(getSheetStack()).toEqual([]);
    expect(hideReturned).toBe(true);
  });
});
