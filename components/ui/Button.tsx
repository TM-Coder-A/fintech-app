import {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700",
  };

  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition",
        "focus:outline-none focus:ring-4 focus:ring-emerald-500/20",
        "disabled:cursor-not-allowed",
        variants[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
