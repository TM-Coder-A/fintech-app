import {
  forwardRef,
  InputHTMLAttributes,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      error,
      helperText,
      id,
      className = "",
      ...props
    },
    ref
  ) {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={id}
          className={[
            "w-full rounded-xl border bg-white px-4 py-3 text-slate-950",
            "outline-none transition placeholder:text-slate-400",
            "focus:ring-4",
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
              : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10",
            className,
          ].join(" ")}
          {...props}
        />

        {error ? (
          <p className="mt-2 text-sm text-rose-600">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-2 text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

export default Input;
