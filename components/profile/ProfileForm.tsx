"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { profileSchema } from "@/lib/validation/profile";

interface ProfileFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function ProfileForm({
  initialData,
}: ProfileFormProps) {
  const router = useRouter();

  const [firstName, setFirstName] =
    useState(initialData.firstName);

  const [lastName, setLastName] =
    useState(initialData.lastName);

  const [phone, setPhone] =
    useState(initialData.phone);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    const result =
      profileSchema.safeParse({
        firstName,
        lastName,
        phone,
      });

    if (!result.success) {
      setError(
        result.error.issues[0]?.message ??
          "Invalid profile details."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/profile",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            result.data
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ??
            "Profile update failed."
        );

        return;
      }

      setMessage(data.message);

      router.refresh();
    } catch {
      setError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold">
          Personal information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Update your account information.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-medium"
              >
                First name
              </label>

              <input
                id="firstName"
                value={firstName}
                onChange={(event) =>
                  setFirstName(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-medium"
              >
                Last name
              </label>

              <input
                id="lastName"
                value={lastName}
                onChange={(event) =>
                  setLastName(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              value={initialData.email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
            />

            <p className="mt-2 text-xs text-slate-500">
              Email changes require a
              separate verification process.
            </p>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium"
            >
              Phone number
            </label>

            <input
              id="phone"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {loading
              ? "Saving..."
              : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex gap-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your account security.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <LockKeyhole size={20} />

            <div>
              <p className="font-medium">
                Password
              </p>

              <p className="text-sm text-slate-500">
                Password management comes
                in a later security stage.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-400"
          >
            Change Password
          </button>
        </div>
      </div>
    </section>
  );
}
