"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { profileSchema } from "@/lib/validation/profile";
import { changePasswordSchema } from "@/lib/validation/change-password";

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

  /*
   * Profile state
   */
  const [firstName, setFirstName] =
    useState(initialData.firstName);

  const [lastName, setLastName] =
    useState(initialData.lastName);

  const [phone, setPhone] =
    useState(initialData.phone);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileError, setProfileError] =
    useState("");

  const [profileLoading, setProfileLoading] =
    useState(false);

  /*
   * Password state
   */
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordLoading,
    setPasswordLoading,
  ] = useState(false);

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    const result =
      profileSchema.safeParse({
        firstName,
        lastName,
        phone,
      });

    if (!result.success) {
      setProfileError(
        result.error.issues[0]
          ?.message ??
          "Invalid profile details."
      );

      return;
    }

    try {
      setProfileLoading(true);

      const response =
        await fetch(
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
        setProfileError(
          data.message ??
            "Profile update failed."
        );

        return;
      }

      setProfileMessage(
        data.message
      );

      router.refresh();
    } catch {
      setProfileError(
        "Could not reach the server."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordError("");

    const result =
      changePasswordSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

    if (!result.success) {
      setPasswordError(
        result.error.issues[0]
          ?.message ??
          "Invalid password details."
      );

      return;
    }

    try {
      setPasswordLoading(true);

      const response =
        await fetch(
          "/api/change-password",
          {
            method: "POST",

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
        setPasswordError(
          data.message ??
            "Password change failed."
        );

        return;
      }

      /*
       * API removes the session cookie,
       * so send the user back to login.
       */
      router.replace("/login");
      router.refresh();
    } catch {
      setPasswordError(
        "Could not reach the server."
      );
    } finally {
      setPasswordLoading(false);
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
          onSubmit={handleProfileSubmit}
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
                autoComplete="given-name"
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
                autoComplete="family-name"
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
                setPhone(
                  event.target.value
                )
              }
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          {profileError && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              {profileError}
            </div>
          )}

          {profileMessage && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              {profileMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {profileLoading
              ? "Saving..."
              : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex gap-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck
              size={22}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Change your account
              password securely.
            </p>
          </div>
        </div>

        <form
          onSubmit={handlePasswordSubmit}
          className="mt-7 space-y-5"
        >
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-2 block text-sm font-medium"
            >
              Current password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="currentPassword"
                type={
                  showCurrentPassword
                    ? "text"
                    : "password"
                }
                value={
                  currentPassword
                }
                onChange={(event) => {
                  setCurrentPassword(
                    event.target.value
                  );
                  setPasswordError("");
                }}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-12 outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowCurrentPassword(
                    (current) =>
                      !current
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label={
                  showCurrentPassword
                    ? "Hide current password"
                    : "Show current password"
                }
              >
                {showCurrentPassword ? (
                  <EyeOff
                    size={19}
                  />
                ) : (
                  <Eye
                    size={19}
                  />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-medium"
            >
              New password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="newPassword"
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(
                    event.target.value
                  );
                  setPasswordError("");
                }}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-12 outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(
                    (current) =>
                      !current
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label={
                  showNewPassword
                    ? "Hide new password"
                    : "Show new password"
                }
              >
                {showNewPassword ? (
                  <EyeOff
                    size={19}
                  />
                ) : (
                  <Eye
                    size={19}
                  />
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              At least 8 characters
              with uppercase, lowercase
              and a number.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              Confirm new password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(
                  event.target.value
                );
                setPasswordError("");
              }}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          {passwordError && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              {passwordError}
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            You will be signed out
            after changing your
            password and must log in
            again.
          </div>

          <button
            type="submit"
            disabled={
              passwordLoading ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {passwordLoading
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </section>
  );
}
