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
