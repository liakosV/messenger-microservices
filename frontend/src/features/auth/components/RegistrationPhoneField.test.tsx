import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationPhoneField, registrationPhone } from './RegistrationPhoneField';

afterEach(cleanup);

it('normalizes national trunk prefixes and preserves explicit international numbers', () => {
  expect(registrationPhone('020 7946 0018', 'GB')).toBe('+442079460018');
  expect(registrationPhone('691 234 5678', 'GR')).toBe('+306912345678');
  expect(registrationPhone('0012423651234', 'GR')).toBe('+12423651234');
  expect(registrationPhone('+44 7911 123456', 'GR')).toBe('+447911123456');
});

it('defaults to Greece, blocks an empty number and submits one full phone number', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <RegistrationPhoneField />
    </form>,
  );
  const form = container.querySelector('form')!;
  expect(screen.getByRole('button', { name: /Ελλάδα.*\+30/ })).toBeTruthy();
  expect(form.checkValidity()).toBe(false);
  await user.type(screen.getByLabelText('Αριθμός τηλεφώνου'), '6912345678');
  expect(form.checkValidity()).toBe(true);
  expect(new FormData(form).getAll('phoneNumber')).toEqual(['+306912345678']);
});

it('searches countries and keeps shared-code countries independently selectable', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <RegistrationPhoneField />
    </form>,
  );
  const trigger = screen.getByRole('button');
  await user.click(trigger);
  const search = screen.getByLabelText('Αναζήτηση χώρας ή κωδικού');
  expect(document.activeElement).toBe(search);
  await user.type(search, '+1');
  expect(screen.getByRole('listbox', { name: 'Χώρα και κωδικός κλήσης' })).toBeTruthy();
  expect(screen.getByRole('option', { name: /\(US\)/ })).toBeTruthy();
  expect(screen.getByRole('option', { name: /\(CA\)/ })).toBeTruthy();
  await user.click(screen.getByRole('option', { name: /\(CA\)/ }));
  expect(document.activeElement).toBe(screen.getByLabelText('Αριθμός τηλεφώνου'));
  await user.type(screen.getByLabelText('Αριθμός τηλεφώνου'), '4165550123');
  expect(screen.getByRole('button', { name: /Καναδάς/ })).toBeTruthy();
  expect(new FormData(container.querySelector('form')!).get('phoneNumber')).toBe('+14165550123');
  await user.click(trigger);
  await user.type(screen.getByLabelText('Αναζήτηση χώρας ή κωδικού'), 'ανυπαρκτηχωρα');
  expect(screen.getByRole('status').textContent).toBe('Δεν βρέθηκε χώρα.');
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(trigger);
});

it('accepts a pasted international number without duplicating its country code', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <RegistrationPhoneField />
    </form>,
  );
  await user.click(screen.getByLabelText('Αριθμός τηλεφώνου'));
  await user.paste('+1 242 365 1234');
  expect(screen.getByRole('button', { name: /\(BS\)/ })).toBeTruthy();
  expect(new FormData(container.querySelector('form')!).get('phoneNumber')).toBe('+12423651234');
});

it('keeps the closed prefix compact and allows country selection with the keyboard', async () => {
  const user = userEvent.setup();
  render(<RegistrationPhoneField />);
  const trigger = screen.getByRole('button');
  expect(trigger.textContent).toBe('+30');
  expect(trigger.querySelector('img')?.getAttribute('src')).toBe('/flags/GR.svg');
  await user.click(trigger);
  await user.type(screen.getByLabelText('Αναζήτηση χώρας ή κωδικού'), 'Canada');
  await user.keyboard('{ArrowDown}{Enter}');
  expect(screen.getByRole('button', { name: /Καναδάς/ }).textContent).toBe('+1');
  expect(document.activeElement).toBe(screen.getByLabelText('Αριθμός τηλεφώνου'));
});
