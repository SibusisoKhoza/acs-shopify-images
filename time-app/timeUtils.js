const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;

function normalizeDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError('A valid Date or epoch millisecond value is required');
  }

  return date;
}

function normalizeDuration(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

/**
 * Return local clock parts. `hour12` controls the hour format, and a null
 * seconds value means seconds should not be shown.
 */
export function formatClockParts(value, { hour12 = false, showSeconds = true } = {}) {
  const date = normalizeDate(value);
  const hour24 = date.getHours();
  const meridiem = hour24 < 12 ? 'AM' : 'PM';
  const hour = hour12 ? (hour24 % 12 || 12) : hour24;

  return {
    hours: pad(hour),
    minutes: pad(date.getMinutes()),
    seconds: showSeconds ? pad(date.getSeconds()) : null,
    meridiem: hour12 ? meridiem : null,
  };
}

export function formatElapsedMs(elapsedMs) {
  const duration = normalizeDuration(elapsedMs);
  const hours = Math.floor(duration / MILLISECONDS_PER_HOUR);
  const minutes = Math.floor((duration % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
  const seconds = Math.floor((duration % MILLISECONDS_PER_MINUTE) / MILLISECONDS_PER_SECOND);
  const milliseconds = duration % MILLISECONDS_PER_SECOND;
  const clock = `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;

  return hours > 0 ? `${pad(hours)}:${clock}` : clock;
}

export function formatRemainingMs(remainingMs) {
  const duration = normalizeDuration(remainingMs);
  const hours = Math.floor(duration / MILLISECONDS_PER_HOUR);
  const minutes = Math.floor((duration % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
  const seconds = Math.floor((duration % MILLISECONDS_PER_MINUTE) / MILLISECONDS_PER_SECOND);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Empty fields count as zero. All other fields must be non-negative integers.
 * Invalid fields throw a RangeError so callers can show a useful message.
 */
export function parseDurationInputs(hours, minutes, seconds) {
  const values = [hours, minutes, seconds].map((value) => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      throw new RangeError('Hours, minutes, and seconds must be non-negative integers');
    }

    return parsed;
  });

  return (
    values[0] * MILLISECONDS_PER_HOUR
    + values[1] * MILLISECONDS_PER_MINUTE
    + values[2] * MILLISECONDS_PER_SECOND
  );
}

export function computeLapDeltas(lapTimestamps) {
  if (!Array.isArray(lapTimestamps)) {
    throw new TypeError('Lap timestamps must be an array');
  }

  let previousTimestamp = 0;

  return lapTimestamps.map((timestamp) => {
    if (!Number.isFinite(timestamp)) {
      throw new RangeError('Lap timestamps must be finite numbers');
    }

    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
    return delta;
  });
}
