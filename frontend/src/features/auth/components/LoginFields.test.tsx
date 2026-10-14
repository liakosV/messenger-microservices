import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthScreen } from './AuthScreen';
import { authApi } from '../api/authApi';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function setup() {
  const login = vi
    .spyOn(authApi, 'login')
    .mockResolvedValue({ accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 900 });
  const signedIn = vi.fn();
  render(<AuthScreen signedIn={signedIn} />);
  return { login, signedIn, user: userEvent.setup() };
}

it.each(['alex', 'alex@example.com', '6912345678'])(
  'preserves the username/email identifier %s',
  async (identifier) => {
    const { user, login, signedIn } = setup();
    await user.type(screen.getByLabelText('Όνομα χρήστη, email ή τηλέφωνο'), identifier);
    await user.type(screen.getByLabelText('Κωδικός'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Πάμε στις συνομιλίες' }));
    expect(login).toHaveBeenCalledWith({ identifier, password: 'secret' });
    expect(signedIn).toHaveBeenCalledWith('test-token', 900);
  },
);

it.each([
  ['691 234 5678', '+306912345678'],
  ['+30 (691) 234-5678', '+306912345678'],
  ['0044 20 7946 0018', '+442079460018'],
])(
  'logs in with phone input %s using the full international identifier',
  async (typed, expected) => {
    const { user, login } = setup();
    await user.click(screen.getByRole('button', { name: 'Με τηλέφωνο' }));
    await user.click(screen.getByLabelText('Αριθμός τηλεφώνου'));
    await user.paste(typed);
    await user.type(screen.getByLabelText('Κωδικός'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Πάμε στις συνομιλίες' }));
    expect(login).toHaveBeenCalledWith({ identifier: expected, password: 'secret' });
  },
);

it('uses the selected country for a national number and blocks an empty phone', async () => {
  const { user, login } = setup();
  await user.click(screen.getByRole('button', { name: 'Με τηλέφωνο' }));
  await user.type(screen.getByLabelText('Κωδικός'), 'secret');
  await user.click(screen.getByRole('button', { name: 'Πάμε στις συνομιλίες' }));
  expect(login).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: /Χώρα κλήσης/ }));
  await user.type(screen.getByLabelText('Αναζήτηση χώρας ή κωδικού'), 'United Kingdom');
  await user.click(screen.getByRole('option', { name: /\(GB\)/ }));
  await user.type(screen.getByLabelText('Αριθμός τηλεφώνου'), '020 7946 0018');
  await user.click(screen.getByRole('button', { name: 'Πάμε στις συνομιλίες' }));
  expect(login).toHaveBeenCalledWith({ identifier: '+442079460018', password: 'secret' });
});

it('still accepts a spaced international phone in the general identifier field', async () => {
  const { user, login } = setup();
  await user.type(screen.getByLabelText('Όνομα χρήστη, email ή τηλέφωνο'), '+30 691 234 5678');
  await user.type(screen.getByLabelText('Κωδικός'), 'secret');
  await user.click(screen.getByRole('button', { name: 'Πάμε στις συνομιλίες' }));
  expect(login).toHaveBeenCalledWith({ identifier: '+306912345678', password: 'secret' });
});
