const PAYSTACK_BASE_URL =
  "https://api.paystack.co";

function getPaystackSecretKey() {
  const key =
    process.env.PAYSTACK_SECRET_KEY;

  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not configured."
    );
  }

  return key;
}

type InitializeInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<
    string,
    string
  >;
};

type InitializeResponse = {
  status: boolean;
  message: string;

  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export async function initializePaystackTransaction(
  input: InitializeInput
) {
  const response =
    await fetch(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${getPaystackSecretKey()}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          email:
            input.email,

          amount:
            input.amountKobo,

          reference:
            input.reference,

          callback_url:
            input.callbackUrl,

          metadata:
            input.metadata,
        }),
      }
    );

  const result =
    await response.json() as InitializeResponse;

  if (
    !response.ok ||
    !result.status
  ) {
    throw new Error(
      result.message ||
        "Paystack initialization failed."
    );
  }

  return result.data;
}

type VerifyResponse = {
  status: boolean;
  message: string;

  data: {
    id: number | string;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string | null;
    paid_at: string | null;
  };
};

export async function verifyPaystackTransaction(
  reference: string
) {
  const response =
    await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${getPaystackSecretKey()}`,
        },

        cache: "no-store",
      }
    );

  const result =
    await response.json() as VerifyResponse;

  if (
    !response.ok ||
    !result.status
  ) {
    throw new Error(
      result.message ||
        "Unable to verify Paystack transaction."
    );
  }

  return result.data;
}
