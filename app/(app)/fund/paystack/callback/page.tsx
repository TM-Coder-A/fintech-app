import Link from "next/link";

type Props = {
  searchParams: Promise<{
    reference?: string | string[];
  }>;
};

export default async function PaystackCallbackPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const reference =
    typeof params.reference ===
    "string"
      ? params.reference
      : "";

  return (
    <main>
      <div className="mx-auto max-w-xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-7">
          <h1 className="text-3xl font-bold text-slate-950">
            Payment returned
          </h1>

          {reference ? (
            <>
              <p className="mt-3 text-slate-600">
                Paystack returned your
                payment reference.
              </p>

              <p className="mt-5 break-all rounded-xl bg-slate-50 p-4 text-sm">
                {reference}
              </p>

              <Link
                href={`/fund/paystack/status?reference=${encodeURIComponent(
                  reference
                )}`}
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white"
              >
                Verify Payment
              </Link>
            </>
          ) : (
            <p className="mt-3 text-rose-700">
              Payment reference was not
              returned.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
