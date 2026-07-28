type AttemptRecord = {
  count: number;
  resetAt: number;
};

const attempts = new Map<
  string,
  AttemptRecord
>();

const WINDOW_MS =
  15 * 60 * 1000;

const MAX_ATTEMPTS = 5;

export function checkLoginRateLimit(
  key: string
) {
  const now = Date.now();

  const current =
    attempts.get(key);

  if (
    !current ||
    current.resetAt <= now
  ) {
    attempts.set(key, {
      count: 0,
      resetAt: now + WINDOW_MS,
    });

    return {
      allowed: true,
      remaining: MAX_ATTEMPTS,
    };
  }

  if (
    current.count >= MAX_ATTEMPTS
  ) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds:
        Math.ceil(
          (current.resetAt - now) /
            1000
        ),
    };
  }

  return {
    allowed: true,
    remaining:
      MAX_ATTEMPTS -
      current.count,
  };
}

export function recordFailedLogin(
  key: string
) {
  const now = Date.now();

  const current =
    attempts.get(key);

  if (
    !current ||
    current.resetAt <= now
  ) {
    attempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return;
  }

  current.count += 1;

  attempts.set(
    key,
    current
  );
}

export function clearLoginAttempts(
  key: string
) {
  attempts.delete(key);
}
