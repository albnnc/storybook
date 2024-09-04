import { forwardRef, type SelectHTMLAttributes } from "react";
import type { FormWidgetProps } from "../../types/form.ts";

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
      // ?
      // placeholder,
      ...rest
    },
    ref,
  ) => {
    return (
      <select
        ref={ref}
        value={value}
        // ?
        // placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => onFocus?.()}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={() => onBlur?.()}
        disabled={disabled}
        {...rest}
      />
    );
  },
);
