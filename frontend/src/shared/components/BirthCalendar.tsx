import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { birthDate } from './DateOfBirthField';

const months = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleDateString('el-GR', { month: 'long' }),
);

function localDate(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function BirthCalendar({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  const id = useId();
  const trigger = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(value.split('-').reverse().join('/'));
  useEffect(() => {
    trigger.current?.setCustomValidity(
      value ? '' : 'Συμπλήρωσε έγκυρη ημερομηνία γέννησης πριν από σήμερα.',
    );
  }, [value]);
  const days = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() =>
    value
      ? localDate(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, 1)
      : localDate(2000, 0, 1),
  );
  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();
  const count = localDate(year, month + 1, 0).getDate();
  const offset = (view.getDay() + 6) % 7;
  function move(next: Date) {
    setView(next);
  }
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  function show() {
    if (!open && value)
      move(localDate(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, 1));
    setOpen(true);
  }
  return (
    <div className="birth-calendar">
      <div className="birth-calendar-field">
        <input
          ref={trigger}
          type="text"
          className="birth-calendar-trigger"
          aria-label="Ημερομηνία γέννησης"
          aria-describedby={`${id}-hint`}
          aria-expanded={open}
          aria-controls={id}
          placeholder="ΗΗ/ΜΜ/ΕΕΕΕ"
          autoComplete="bday"
          inputMode="numeric"
          required
          value={display}
          onClick={show}
          onChange={(event) => {
            const text = event.target.value;
            setDisplay(text);
            const parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
            onSelect(parts ? birthDate(parts[1], parts[2], parts[3]) : '');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'ArrowDown') {
              event.preventDefault();
              show();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
        />
        <CalendarDays size={18} aria-hidden="true" />
      </div>
      <p id={`${id}-hint`} className="birth-calendar-help">
        ΗΗ/ΜΜ/ΕΕΕΕ · Πάτησε για επιλογή από ημερολόγιο.
      </p>
      {open && (
        <section
          id={id}
          className="birth-calendar-panel"
          aria-label="Ημερολόγιο γέννησης"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
        >
          <div className="birth-calendar-heading">
            <button
              type="button"
              aria-label="Προηγούμενος μήνας"
              disabled={year === 1 && month === 0}
              onClick={() => move(localDate(year, month - 1, 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <label>
              Μήνας ημερολογίου
              <select
                value={month}
                onChange={(event) => move(localDate(year, Number(event.target.value), 1))}
              >
                {months.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Έτος ημερολογίου
              <select
                value={year}
                onChange={(event) => move(localDate(Number(event.target.value), month, 1))}
              >
                {Array.from({ length: today.getFullYear() }, (_, index) => {
                  const optionYear = today.getFullYear() - index;
                  return (
                    <option key={optionYear} value={optionYear}>
                      {optionYear}
                    </option>
                  );
                })}
              </select>
            </label>
            <button
              type="button"
              aria-label="Επόμενος μήνας"
              disabled={year === today.getFullYear() && month >= today.getMonth()}
              onClick={() => move(localDate(year, month + 1, 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <p className="birth-calendar-help">Διάλεξε μήνα, έτος και ημέρα.</p>
          <div className="birth-calendar-week" aria-hidden="true">
            {['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <div className="birth-calendar-days" ref={days} aria-label={`${months[month]} ${year}`}>
            {Array.from({ length: offset }, (_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {Array.from({ length: count }, (_, index) => {
              const day = index + 1;
              const iso = birthDate(String(day), String(month + 1), String(year).padStart(4, '0'));
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!iso}
                  aria-pressed={!!iso && value === iso}
                  aria-label={localDate(year, month, day).toLocaleDateString('el-GR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  onClick={() => {
                    setDisplay(iso.split('-').reverse().join('/'));
                    onSelect(iso);
                    close();
                  }}
                  onKeyDown={(event) => {
                    const delta = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                      Home: 1 - day,
                      End: count - day,
                    }[event.key];
                    if (delta === undefined) return;
                    event.preventDefault();
                    const target = Math.max(1, Math.min(count, day + delta));
                    days.current
                      ?.querySelectorAll<HTMLButtonElement>('button')
                      [target - 1]?.focus();
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
