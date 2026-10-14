import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

const greek = new Intl.DisplayNames(['el'], { type: 'region' });
const english = new Intl.DisplayNames(['en'], { type: 'region' });
const countries = getCountries()
  .map((code) => ({
    code,
    name: greek.of(code) || code,
    english: english.of(code) || code,
    dial: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'el'));
const searchable = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('el');

export function registrationPhone(value: string, country: CountryCode): string {
  const compact = value.trim().replace(/[\s()-]/g, '');
  if (!compact) return '';
  if (/^(\+|00)/.test(compact)) return compact.replace(/^00/, '+');
  if (!/^\d+$/.test(compact)) return '';
  return (
    parsePhoneNumberFromString(compact, country)?.number ||
    `+${getCountryCallingCode(country)}${compact}`
  );
}

export function CountryPhoneField({
  name = 'phoneNumber',
  defaultValue = '',
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [initial] = useState(() => parsePhoneNumberFromString(defaultValue));
  const [country, setCountry] = useState<CountryCode>(initial?.country || 'GR');
  const [number, setNumber] = useState(initial?.country ? initial.nationalNumber : defaultValue);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<CountryCode>('GR');
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const selected = countries.find((item) => item.code === country)!;
  const untouched = !dirty && !!defaultValue;
  const normalized = untouched ? defaultValue : registrationPhone(number, country);
  const results = countries.filter((item) =>
    searchable(`${item.name} ${item.english} ${item.code} +${item.dial}`).includes(
      searchable(query.trim()),
    ),
  );
  useEffect(() => {
    input.current?.setCustomValidity(
      untouched || /^\+[1-9]\d{6,14}$/.test(normalized)
        ? ''
        : 'Συμπλήρωσε έγκυρο τηλέφωνο με 7–15 ψηφία.',
    );
  }, [normalized, untouched]);
  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);
  function update(text: string) {
    setDirty(true);
    const compact = text
      .trim()
      .replace(/[\s()-]/g, '')
      .replace(/^00/, '+');
    if (compact.startsWith('+')) {
      const parsed = parsePhoneNumberFromString(compact);
      if (parsed?.country) {
        setCountry(parsed.country);
        setNumber(parsed.nationalNumber);
        return;
      }
    }
    setNumber(text);
  }
  return (
    <fieldset className="registration-phone">
      <legend>Τηλέφωνο</legend>
      <div className="phone-entry-row">
        <button
          type="button"
          ref={button}
          className="phone-country-trigger"
          aria-label={`Χώρα κλήσης: ${selected.name} (${selected.code}) +${selected.dial}`}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            setQuery('');
            setActive(country);
            setOpen(!open);
          }}
        >
          <img className="country-flag" src={`/flags/${country}.svg`} alt="" />
          <strong>+{selected.dial}</strong>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <label className="phone-number-label">
          <span className="phone-visually-hidden">Αριθμός τηλεφώνου</span>
          <input
            ref={input}
            type="tel"
            autoComplete="tel-national"
            placeholder="π.χ. 6912345678"
            value={number}
            maxLength={255}
            required
            onChange={(event) => update(event.target.value)}
          />
        </label>
      </div>
      {open && (
        <section
          id={id}
          className="phone-country-panel"
          aria-label="Επιλογή χώρας"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              button.current?.focus();
            }
          }}
        >
          <label>
            Αναζήτηση χώρας ή κωδικού
            <input
              ref={search}
              type="search"
              placeholder="π.χ. Ελλάδα, Canada, +44"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  options.current?.querySelector<HTMLButtonElement>('button')?.focus();
                }
              }}
            />
          </label>
          <div
            ref={options}
            className="phone-country-options"
            role="listbox"
            aria-label="Χώρα και κωδικός κλήσης"
            onKeyDown={(event) => {
              const buttons = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>('button'),
              );
              const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
              const target =
                event.key === 'ArrowDown'
                  ? Math.min(index + 1, buttons.length - 1)
                  : event.key === 'ArrowUp'
                    ? Math.max(index - 1, 0)
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? buttons.length - 1
                        : null;
              if (target !== null) {
                event.preventDefault();
                buttons[target]?.focus();
              }
            }}
          >
            {results.map((item, index) => (
              <button
                type="button"
                role="option"
                aria-selected={country === item.code}
                tabIndex={
                  active === item.code ||
                  (!results.some((result) => result.code === active) && index === 0)
                    ? 0
                    : -1
                }
                key={item.code}
                onFocus={() => setActive(item.code)}
                onClick={() => {
                  if (item.code !== country) setDirty(true);
                  setCountry(item.code);
                  setOpen(false);
                  input.current?.focus();
                }}
              >
                <img
                  className="country-flag"
                  src={`/flags/${item.code}.svg`}
                  alt=""
                  loading="lazy"
                />
                <span>
                  {item.name} ({item.code})
                </span>
                <strong>+{item.dial}</strong>
              </button>
            ))}
          </div>
          {results.length === 0 && <p role="status">Δεν βρέθηκε χώρα.</p>}
        </section>
      )}
      <input type="hidden" name={name} value={normalized} />
    </fieldset>
  );
}
