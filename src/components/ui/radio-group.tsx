"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type RadioGroupContextValue = {
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

type RadioGroupProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

function RadioGroup({
  className,
  name,
  value: controlledValue,
  defaultValue,
  onValueChange,
  ...props
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? "",
  );
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return (
    <RadioGroupContext.Provider
      value={{ name, value, onValueChange: handleValueChange }}
    >
      <div
        data-slot="radio-group"
        className={cn("grid w-full gap-2", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  );
}

type RadioGroupItemProps = Omit<React.ComponentProps<"input">, "type"> & {
  value: string;
};

function RadioGroupItem({
  className,
  value,
  id,
  disabled,
  ...props
}: RadioGroupItemProps) {
  const ctx = React.useContext(RadioGroupContext);
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const checked = ctx.value === value;

  return (
    <input
      id={inputId}
      data-slot="radio-group-item"
      type="radio"
      name={ctx.name}
      value={value}
      checked={checked}
      disabled={disabled}
      onChange={() => ctx.onValueChange?.(value)}
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-background outline-none transition",
        "checked:border-primary checked:bg-primary",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { RadioGroup, RadioGroupItem };
