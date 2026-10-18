/**
 * Regression tests for showing a sheet while its close is still in progress.
 *
 * These assert on *state* (`getSheetStack`, `isOpen`, the hide promise), not on
 * what happens to be on screen -- asserting on screen output is what let the
 * SheetManager.remove bug through review.
 *
 * Two windows, deliberately distinguished:
 *   - the close ANIMATION (~300ms): a show is dropped, and the close must still
 *     finish cleanly. Guarding `flushCloseHandshake` on a parked notification
 *     is what makes this true.
 *   - the DISMISSAL window (after the animation, before onDismiss): nothing is
 *     runnable here in jsdom, so it is covered by the on-device probes.
 */
jest.mock('react-native-actions-sheet', () =>
  require('react-native-actions-sheet/jest/mock'),
);

const path = require('path');
const real = require(path.resolve(__dirname, '../dist/src/sheetmanager.js'));

describe('SheetManager registry', () => {
  beforeEach(() => {
    real.getSheetStack().forEach(s => real.SheetManager.remove(s.id, s.context));
  });

  it('remove() deletes only the target, not every later entry', () => {
    real.SheetManager.add('a', 'global');
    real.SheetManager.add('b', 'global');
    real.SheetManager.add('c', 'global');
    expect(real.getSheetStack().map(s => s.id)).toEqual(['a', 'b', 'c']);

    real.SheetManager.remove('a', 'global');

    expect(real.getSheetStack().map(s => s.id)).toEqual(['b', 'c']);
  });

  it('remove() matches an entry added with the default global context', () => {
    real.SheetManager.add('x', '');
    expect(real.getSheetStack().map(s => s.id)).toEqual(['x']);
    real.SheetManager.remove('x', '');
    expect(real.getSheetStack()).toEqual([]);
  });

  it('add() does not duplicate an already-registered sheet', () => {
    real.SheetManager.add('dup', 'global');
    real.SheetManager.add('dup', 'global');
    expect(real.getSheetStack().filter(s => s.id === 'dup')).toHaveLength(1);
  });
});
