const NIGERIA_UTC_OFFSET_MS =
  60 * 60 * 1000;

const DAY_MS =
  24 * 60 * 60 * 1000;

export function getNigeriaDayBounds(
  now = new Date()
) {
  /*
   * Nigeria uses UTC+1.
   *
   * Shift the current instant into Nigerian
   * local time, find midnight there, then
   * convert that midnight back to UTC.
   */
  const nigeriaNow =
    new Date(
      now.getTime() +
        NIGERIA_UTC_OFFSET_MS
    );

  const localMidnightAsUtc =
    Date.UTC(
      nigeriaNow.getUTCFullYear(),
      nigeriaNow.getUTCMonth(),
      nigeriaNow.getUTCDate()
    );

  const start =
    new Date(
      localMidnightAsUtc -
        NIGERIA_UTC_OFFSET_MS
    );

  const end =
    new Date(
      start.getTime() + DAY_MS
    );

  return {
    start,
    end,
  };
}
