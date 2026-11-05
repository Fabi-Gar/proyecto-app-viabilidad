"use client";

/**
 * Campos de entrada reutilizables.
 *
 * NumInput mantiene un buffer de texto local para permitir escribir decimales
 * y borrar el campo sin que el valor numérico del estado lo pise en cada tecla.
 */
import { useEffect, useRef, useState } from "react";
import { N } from "@/lib/calculo";

export function NumInput({
  value,
  onNum,
  className,
  invalid,
  ...rest
}: {
  value: number;
  onNum: (v: number) => void;
  invalid?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  // 0 se muestra vacío (con placeholder) para que el estado "en blanco" se vea limpio.
  const [buf, setBuf] = useState<string>(value === 0 ? "" : String(value));
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      const parsed = parseFloat(buf);
      if (!(parsed === value || (buf === "" && value === 0))) {
        setBuf(value === 0 ? "" : String(value));
      }
    }
  }, [value, buf]);

  return (
    <input
      type="number"
      inputMode="decimal"
      step="any"
      value={buf}
      className={invalid ? (className ? className + " invalid" : "invalid") : className}
      onChange={(e) => {
        setBuf(e.target.value);
        onNum(e.target.value === "" ? 0 : N(e.target.value));
      }}
      {...rest}
    />
  );
}

export function TextInput({
  value,
  onText,
  invalid,
  className,
  ...rest
}: {
  value: string;
  onText: (v: string) => void;
  invalid?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <input
      type="text"
      value={value}
      className={invalid ? (className ? className + " invalid" : "invalid") : className}
      onChange={(e) => onText(e.target.value)}
      {...rest}
    />
  );
}

export function Select<T extends string | number>({
  value,
  onPick,
  options,
  numeric,
  ...rest
}: {
  value: T;
  onPick: (v: T) => void;
  options: [T, string][];
  numeric?: boolean;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">) {
  return (
    <select
      value={String(value)}
      onChange={(e) =>
        onPick((numeric ? (N(e.target.value) as T) : (e.target.value as T)))
      }
      {...rest}
    >
      {options.map((o) => (
        <option key={String(o[0])} value={String(o[0])}>
          {o[1]}
        </option>
      ))}
    </select>
  );
}
