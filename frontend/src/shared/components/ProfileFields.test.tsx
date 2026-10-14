import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { birthDate, DateOfBirthField } from './DateOfBirthField';
import { normalizePhone, PhoneField } from './PhoneField';

afterEach(cleanup);

it('validates leap days, impossible dates, today and future without UTC date shifts', () => {
  const today = new Date(2026, 9, 7);
  expect(birthDate('29', '2', '2000', today)).toBe('2000-02-29');
  for (const [d, m, y] of [
    ['29', '2', '2001'],
    ['31', '4', '2000'],
    ['7', '10', '2026'],
    ['8', '10', '2026'],
    ['1', '0', '2000'],
    ['1', '1', '0000'],
  ]) {
    expect(birthDate(d, m, y, today)).toBe('');
  }
});

it('allows direct year typing and serializes only the ISO date, blocking invalid dates', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <DateOfBirthField defaultValue="2000-02-29" />
    </form>,
  );
  const form = container.querySelector('form')!;
  expect(new FormData(form).get('dateOfBirth')).toBe('2000-02-29');
  await user.clear(screen.getByLabelText('Έτος'));
  await user.type(screen.getByLabelText('Έτος'), '2001');
  expect(form.checkValidity()).toBe(false);
  await user.clear(screen.getByLabelText('Ημέρα'));
  await user.type(screen.getByLabelText('Ημέρα'), '28');
  expect(form.checkValidity()).toBe(true);
  expect(new FormData(form).get('dateOfBirth')).toBe('2001-02-28');
});

it('adds Greece once and preserves explicit international dialing codes', () => {
  expect(normalizePhone('691 234 5678')).toBe('+306912345678');
  expect(normalizePhone('+30 6912345678')).toBe('+306912345678');
  expect(normalizePhone('00306912345678')).toBe('+306912345678');
  expect(normalizePhone('+44 7911 123456')).toBe('+447911123456');
  expect(normalizePhone('+30')).toBe('');
});

it('supports replacing/pasting a phone and blocks an empty prefix', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <PhoneField />
    </form>,
  );
  const form = container.querySelector('form')!;
  expect(form.checkValidity()).toBe(false);
  await user.click(screen.getByLabelText('Τηλέφωνο'));
  await user.paste('+30 6912345678');
  expect(form.checkValidity()).toBe(true);
  expect(new FormData(form).get('phoneNumber')).toBe('+306912345678');
});

it('does not change an existing international phone on focus or blur', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <PhoneField defaultValue="+44 7911 123456" />
    </form>,
  );
  await user.click(screen.getByLabelText('Τηλέφωνο'));
  await user.tab();
  expect(new FormData(container.querySelector('form')!).get('phoneNumber')).toBe('+44 7911 123456');
});

it('selects a leap day using the calendar keyboard and restores focus', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <DateOfBirthField calendar />
    </form>,
  );
  const trigger = screen.getByRole('textbox', { name: 'Ημερομηνία γέννησης' });
  await user.click(trigger);
  await user.selectOptions(screen.getByLabelText('Μήνας ημερολογίου'), '1');
  const year = screen.getByLabelText('Έτος ημερολογίου');
  await user.selectOptions(year, '2000');
  const day = screen.getByRole('button', { name: '28 Φεβρουαρίου 2000' });
  day.focus();
  await user.keyboard('{ArrowRight}{Enter}');
  expect(new FormData(container.querySelector('form')!).get('dateOfBirth')).toBe('2000-02-29');
  expect(container.querySelector('form')!.checkValidity()).toBe(true);
  expect(document.activeElement).toBe(trigger);
  expect(screen.queryByRole('region', { name: 'Ημερολόγιο γέννησης' })).toBeNull();
  await user.click(trigger);
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(trigger);
});

it('disables today and future days in the calendar', async () => {
  const user = userEvent.setup();
  render(<DateOfBirthField calendar />);
  await user.click(screen.getByRole('textbox', { name: 'Ημερομηνία γέννησης' }));
  const today = new Date();
  await user.selectOptions(screen.getByLabelText('Μήνας ημερολογίου'), String(today.getMonth()));
  await user.selectOptions(screen.getByLabelText('Έτος ημερολογίου'), String(today.getFullYear()));
  const label = today.toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  expect((screen.getByRole('button', { name: label }) as HTMLButtonElement).disabled).toBe(true);
});

it('shows one registration date field and blocks empty or impossible typed dates', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <DateOfBirthField calendar defaultValue="2000-02-29" />
    </form>,
  );
  const field = screen.getByRole('textbox', { name: 'Ημερομηνία γέννησης' }) as HTMLInputElement;
  const form = container.querySelector('form')!;
  expect(field.value).toBe('29/02/2000');
  expect(screen.queryByLabelText('Ημέρα')).toBeNull();
  expect(screen.queryByLabelText('Μήνας')).toBeNull();
  expect(screen.queryByLabelText('Έτος')).toBeNull();
  await user.clear(field);
  expect(form.checkValidity()).toBe(false);
  await user.type(field, '29/02/2001');
  expect(form.checkValidity()).toBe(false);
  expect(new FormData(form).get('dateOfBirth')).toBe('');
  await user.clear(field);
  await user.type(field, '28/02/2001');
  expect(form.checkValidity()).toBe(true);
  expect(new FormData(form).get('dateOfBirth')).toBe('2001-02-28');
  await user.keyboard('{Escape}{ArrowDown}');
  expect(screen.getByRole('region', { name: 'Ημερολόγιο γέννησης' })).toBeTruthy();
});

it('selects distant birth years without a minimum age or a recent-year cutoff', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <DateOfBirthField calendar />
    </form>,
  );
  await user.click(screen.getByRole('textbox', { name: 'Ημερομηνία γέννησης' }));
  const year = screen.getByRole('combobox', { name: 'Έτος ημερολογίου' }) as HTMLSelectElement;
  expect(year.options[0].value).toBe(String(new Date().getFullYear()));
  expect(year.options[year.options.length - 1].value).toBe('1');
  await user.selectOptions(year, '1900');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Μήνας ημερολογίου' }), '1');
  expect(screen.queryByRole('button', { name: '29 Φεβρουαρίου 1900' })).toBeNull();
  await user.click(screen.getByRole('button', { name: '28 Φεβρουαρίου 1900' }));
  expect(new FormData(container.querySelector('form')!).get('dateOfBirth')).toBe('1900-02-28');
  expect(container.querySelector('form')!.checkValidity()).toBe(true);
});
