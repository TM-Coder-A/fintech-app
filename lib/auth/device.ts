export function describeDevice(
  userAgent: string | null
): string {
  if (!userAgent) {
    return "Unknown device";
  }

  let browser = "Browser";
  let operatingSystem =
    "Unknown device";

  if (
    userAgent.includes("Edg/")
  ) {
    browser = "Edge";
  } else if (
    userAgent.includes("Chrome/")
  ) {
    browser = "Chrome";
  } else if (
    userAgent.includes("Firefox/")
  ) {
    browser = "Firefox";
  } else if (
    userAgent.includes("Safari/")
  ) {
    browser = "Safari";
  }

  if (
    userAgent.includes("Android")
  ) {
    operatingSystem = "Android";
  } else if (
    /iPhone|iPad/.test(userAgent)
  ) {
    operatingSystem = "iPhone/iPad";
  } else if (
    userAgent.includes("Windows")
  ) {
    operatingSystem = "Windows";
  } else if (
    userAgent.includes("Macintosh")
  ) {
    operatingSystem = "macOS";
  } else if (
    userAgent.includes("Linux")
  ) {
    operatingSystem = "Linux";
  }

  return `${browser} on ${operatingSystem}`;
}
