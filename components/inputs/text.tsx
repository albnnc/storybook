import { forwardRef, type InputHTMLAttributes } from "react";
import type { FormWidgetProps } from "../../types/form.ts";

export interface TextInputProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof FormWidgetProps>,
    FormWidgetProps<string> {}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      disabled,
      onChange,
      onFocus,
      onBlur,
      autoComplete,
      value = "",
      placeholder,
      ...rest
    },
    ref,
  ) => {
    return (
      <input
        ref={ref}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => onFocus?.()}
        // deno-lint-ignore no-explicit-any
        onChange={(e: any) => onChange?.(e.target.value)}
        onBlur={() => onBlur?.()}
        disabled={disabled}
        {...rest}
      />
    );
  },
);
