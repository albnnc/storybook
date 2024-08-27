import {
  type ChangeEvent,
  forwardRef,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { FormWidgetProps } from "../../types/form.ts";
import { get } from "../../utils/get.ts";

export interface CheckboxProps extends
  Omit<
    HTMLAttributes<HTMLLabelElement>,
    keyof FormWidgetProps | "onKeyDown"
  >,
  FormWidgetProps<boolean> {
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(
  ({
    value = false,
    onChange,
    readOnly,
    disabled,
    onFocus,
    onBlur,
    indeterminate,
  }) => {
    const ref = useRef<HTMLInputElement>(null);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        onChange?.(!!get(e, "target.checked"));
      },
      [onChange],
    );
    useEffect(() => {
      if (ref.current && indeterminate) {
        ref.current.indeterminate = indeterminate;
      }
    }, [indeterminate, value]);

    return (
      <input
        ref={ref}
        type="checkbox"
        checked={value}
        disabled={disabled}
        // deno-lint-ignore no-explicit-any
        onChange={(event: any) => {
          if (!readOnly) {
            handleChange(event);
          }
        }}
        css={{ margin: 0 }}
        onBlur={() => onBlur?.()}
        onFocus={() => onFocus?.()}
      />
    );
  },
);
