import { useEffect, useRef, useState } from 'react';

export function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s()-]/g, '');
  if (!compact || compact === '+30') return '';
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('00')) return `+${compact.slice(2)}`;
  return `+30${compact}`;
}

export function PhoneField({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? '+30');
  const normalized = normalizePhone(value);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.setCustomValidity(
      /^\+[1-9]\d{6,14}$/.test(normalized) || (value === defaultValue && !!value)
        ? ''
        : 'Συμπλήρωσε έγκυρο τηλέφωνο με 7–15 ψηφία.',
    );
  }, [normalized, value, defaultValue]);
  return (
    <label>
      Τηλέφωνο
      <input
        ref={input}
        type="tel"
        autoComplete="tel"
        value={value}
        placeholder="+30 6912345678"
        maxLength={255}
        required
        onChange={(e) => setValue(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text').trim();
          if (value === '+30' && /^(\+|00)/.test(pasted)) {
            e.preventDefault();
            setValue(pasted);
          }
        }}
        onBlur={() => {
          if (value !== defaultValue) setValue(normalized || '+30');
        }}
      />
      <input type="hidden" name="phoneNumber" value={value === defaultValue ? value : normalized} />
    </label>
  );
}
