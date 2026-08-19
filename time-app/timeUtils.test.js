import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeLapDeltas,
  formatClockParts,
  formatElapsedMs,
  formatRemainingMs,
  parseDurationInputs,
} from './timeUtils.js';

test('formats 24-hour clock parts with seconds', () => {
  const parts = formatClockParts(new Date(2024, 5, 12, 15, 4, 9));

  assert.deepEqual(parts, {
    hours: '15',
    minutes: '04',
    seconds: '09',
    meridiem: null,
  });
});

test('formats midnight as 12 AM in 12-hour mode', () => {
  const parts = formatClockParts(new Date(2024, 5, 12, 0, 7, 2), {
    hour12: true,
  });

  assert.deepEqual(parts, {
    hours: '12',
    minutes: '07',
    seconds: '02',
    meridiem: 'AM',
  });
});

test('formats noon as 12 PM and can omit seconds', () => {
  const parts = formatClockParts(new Date(2024, 5, 12, 12, 30, 0).getTime(), {
    hour12: true,
    showSeconds: false,
  });

  assert.deepEqual(parts, {
    hours: '12',
    minutes: '30',
    seconds: null,
    meridiem: 'PM',
  });
});

test('rejects invalid dates', () => {
  assert.throws(() => formatClockParts('not a date'), RangeError);
});

test('formats sub-second elapsed durations without hours', () => {
  assert.equal(formatElapsedMs(1234), '00:01.234');
});

test('formats multi-hour elapsed durations with hours', () => {
  assert.equal(formatElapsedMs(3 * 60 * 60 * 1000 + 4 * 60 * 1000 + 5 * 1000 + 6), '03:04:05.006');
});

test('clamps negative and non-finite elapsed durations to zero', () => {
  assert.equal(formatElapsedMs(-1), '00:00.000');
  assert.equal(formatElapsedMs(Number.NaN), '00:00.000');
});

test('formats countdown duration and clamps negative remaining time', () => {
  assert.equal(formatRemainingMs(2 * 60 * 60 * 1000 + 3 * 60 * 1000 + 4 * 1000), '02:03:04');
  assert.equal(formatRemainingMs(-500), '00:00:00');
});

test('parses duration fields into milliseconds', () => {
  assert.equal(parseDurationInputs('1', '02', '03'), 3_723_000);
});

test('treats empty duration fields as zero', () => {
  assert.equal(parseDurationInputs('', null, undefined), 0);
});

test('rejects invalid duration fields', () => {
  for (const values of [['one', '0', '0'], ['0', '-1', '0'], ['0', '1.5', '0'], ['0', '0', Infinity]]) {
    assert.throws(() => parseDurationInputs(...values), RangeError);
  }
});

test('computes lap deltas for empty, single, and multiple laps', () => {
  assert.deepEqual(computeLapDeltas([]), []);
  assert.deepEqual(computeLapDeltas([850]), [850]);
  assert.deepEqual(computeLapDeltas([850, 1_900, 3_025]), [850, 1_050, 1_125]);
});

test('rejects malformed lap timestamps', () => {
  assert.throws(() => computeLapDeltas('not an array'), TypeError);
  assert.throws(() => computeLapDeltas([100, Number.NaN]), RangeError);
});
