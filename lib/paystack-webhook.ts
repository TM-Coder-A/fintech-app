import {
  createHmac,
  timingSafeEqual,
} from "crypto";

function getSecretKey() {
  const secret =
    process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not configured."
    );
  }

  return secret;
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null
) {
  if (
    !signature ||
    !/^[a-f0-9]{128}$/i.test(signature)
  ) {
    return false;
  }

  const expected =
    createHmac(
      "sha512",
      getSecretKey()
    )
      .update(rawBody)
      .digest("hex");

  const expectedBuffer =
    Buffer.from(expected, "hex");

  const receivedBuffer =
    Buffer.from(signature, "hex");

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

export function expectedPaystackDomain() {
  const secret =
    getSecretKey();

  if (
    secret.startsWith("sk_test_")
  ) {
    return "test";
  }

  if (
    secret.startsWith("sk_live_")
  ) {
    return "live";
  }

  throw new Error(
    "Invalid Paystack secret-key environment."
  );
}
