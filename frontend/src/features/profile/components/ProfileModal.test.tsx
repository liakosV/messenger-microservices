import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileModal } from './ProfileModal';
import { profileApi } from '../api/profileApi';

const profile = {
  uuid: 'profile-id',
  username: 'alex',
  email: 'alex@example.com',
  dateOfBirth: '2000-02-29',
  phoneNumber: '+306912345678',
};
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function setup(phoneNumber = profile.phoneNumber) {
  const current = { ...profile, phoneNumber };
  const update = vi.spyOn(profileApi, 'update').mockResolvedValue(current);
  const close = vi.fn();
  const { container } = render(
    <ProfileModal
      profile={current}
      token="token"
      close={close}
      updated={vi.fn()}
      logout={vi.fn()}
      onError={vi.fn()}
    />,
  );
  return { user: userEvent.setup(), update, close, form: container.querySelector('form')! };
}

it.each([
  ['+306912345678', 'GR'],
  ['+442079460018', 'GB'],
  ['+14165550123', 'CA'],
  ['+12423651234', 'BS'],
  ['+30 691 234 5678', 'GR'],
])(
  'prepopulates %s and preserves the exact saved values on unchanged save',
  async (phone, country) => {
    const { user, form, update, close } = setup(phone);
    expect((screen.getByLabelText('Ημερομηνία γέννησης') as HTMLInputElement).value).toBe(
      '29/02/2000',
    );
    expect(screen.queryByLabelText('Ημέρα')).toBeNull();
    expect(screen.getByRole('button', { name: new RegExp(`\\(${country}\\)`) })).toBeTruthy();
    const number = screen.getByLabelText('Αριθμός τηλεφώνου');
    await user.click(number);
    await user.tab();
    expect(new FormData(form).get('phoneNumber')).toBe(phone);
    expect(new FormData(form).get('dateOfBirth')).toBe(profile.dateOfBirth);
    await user.click(screen.getByRole('button', { name: 'Αποθήκευση αλλαγών' }));
    expect(update).toHaveBeenCalledWith('token', {});
    expect(close).toHaveBeenCalled();
  },
);

it('patches only changed calendar and international phone values', async () => {
  const { user, update } = setup();
  await user.click(screen.getByLabelText('Ημερομηνία γέννησης'));
  await user.selectOptions(screen.getByLabelText('Έτος ημερολογίου'), '1999');
  await user.selectOptions(screen.getByLabelText('Μήνας ημερολογίου'), '0');
  await user.click(screen.getByRole('button', { name: '15 Ιανουαρίου 1999' }));
  await user.click(screen.getByRole('button', { name: /Χώρα κλήσης/ }));
  await user.type(screen.getByLabelText('Αναζήτηση χώρας ή κωδικού'), 'Canada');
  await user.click(screen.getByRole('option', { name: /\(CA\)/ }));
  await user.clear(screen.getByLabelText('Αριθμός τηλεφώνου'));
  await user.type(screen.getByLabelText('Αριθμός τηλεφώνου'), '4165550123');
  await user.click(screen.getByRole('button', { name: 'Αποθήκευση αλλαγών' }));
  expect(update).toHaveBeenCalledWith('token', {
    dateOfBirth: '1999-01-15',
    phoneNumber: '+14165550123',
  });
});

it('blocks an invalid edited phone and date without sending a patch', async () => {
  const { user, update, form } = setup();
  await user.clear(screen.getByLabelText('Αριθμός τηλεφώνου'));
  await user.type(screen.getByLabelText('Αριθμός τηλεφώνου'), '12');
  await user.clear(screen.getByLabelText('Ημερομηνία γέννησης'));
  await user.type(screen.getByLabelText('Ημερομηνία γέννησης'), '31/02/2000');
  expect(form.checkValidity()).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Αποθήκευση αλλαγών' }));
  expect(update).not.toHaveBeenCalled();
});
