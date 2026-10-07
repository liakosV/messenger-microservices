import { useEffect, useRef, useState } from 'react';

export function birthDate(day: string, month: string, year: string, today = new Date()): string {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return '';
  const d = Number(day),
    m = Number(month),
    y = Number(year);
  const date = new Date(0);
  date.setFullYear(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (
    y < 1 ||
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d ||
    date >= now
  )
    return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function DateOfBirthField({ defaultValue = '' }: { defaultValue?: string }) {
  const initial = defaultValue.split('-');
  const [day, setDay] = useState(initial[2] || '');
  const [month, setMonth] = useState(initial[1] || '');
  const [year, setYear] = useState(initial[0] || '');
  const yearInput = useRef<HTMLInputElement>(null);
  const value = birthDate(day, month, year);
  useEffect(() => {
    yearInput.current?.setCustomValidity(
      value ? '' : 'Συμπλήρωσε έγκυρη ημερομηνία γέννησης πριν από σήμερα.',
    );
  }, [value]);
  return (
    <fieldset className="birth-date">
      <legend>Ημερομηνία γέννησης</legend>
      <div className="birth-date-parts">
        <label>
          Ημέρα
          <input
            inputMode="numeric"
            autoComplete="bday-day"
            placeholder="ΗΗ"
            maxLength={2}
            pattern="[0-9]{1,2}"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
          />
        </label>
        <label>
          Μήνας
          <input
            inputMode="numeric"
            autoComplete="bday-month"
            placeholder="ΜΜ"
            maxLength={2}
            pattern="[0-9]{1,2}"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
          />
        </label>
        <label>
          Έτος
          <input
            ref={yearInput}
            inputMode="numeric"
            autoComplete="bday-year"
            placeholder="ΕΕΕΕ"
            maxLength={4}
            pattern="[0-9]{4}"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </label>
      </div>
      <input type="hidden" name="dateOfBirth" value={value} />
    </fieldset>
  );
}
