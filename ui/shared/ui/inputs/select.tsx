import { forwardRef, SelectHTMLAttributes } from "react";

import { FormWidgetProps } from "../../../types/form.ts";

export interface TextInputProps
  extends
    Omit<SelectHTMLAttributes<HTMLSelectElement>, keyof FormWidgetProps>,
    FormWidgetProps<string> {}

export const Select = forwardRef<HTMLSelectElement, TextInputProps>(
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
      <select
        ref={ref}
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
