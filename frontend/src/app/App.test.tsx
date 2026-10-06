import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
const me = '11111111-1111-4111-8111-111111111111',
  other = '22222222-2222-4222-8222-222222222222';
const profile = {
  uuid: me,
  username: 'alex',
  email: 'alex@example.com',
  dateOfBirth: '2000-01-01',
  phoneNumber: '+301234567890',
};
const conversation = {
  uuid: '33333333-3333-4333-8333-333333333333',
  creatorUuid: me,
  participantUuids: [me, other],
  createdAt: '2026-10-06T10:00:00',
  updatedAt: '2026-10-06T10:00:00',
};
const page = (content: unknown[]) => ({
  content,
  page: 0,
  size: 50,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
});
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
class Socket {
  static instances: Socket[] = [];
  onmessage?: (event: { data: string }) => void;
  onopen?: () => void;
  onclose?: (event: { code: number }) => void;
  constructor() {
    Socket.instances.push(this);
  }
  close() {}
  send() {}
}
beforeEach(() => {
  sessionStorage.clear();
  Socket.instances = [];
  vi.stubGlobal('WebSocket', Socket);
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('logs in, creates a conversation, sends and edits a message using the real API contract', async () => {
  const user = userEvent.setup();
  const calls: { path: string; options: RequestInit }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, options: RequestInit) => {
      calls.push({ path, options });
      if (path.endsWith('/login')) return reply({ accessToken: 'token', expiresIn: 900 });
      if (path.endsWith('/me')) return reply(profile);
      if (path.endsWith('/conversations') && options.method === 'POST') return reply(conversation);
      if (path.includes('/messages?page')) return reply(page([]));
      if (path.includes('/messages') && ['POST', 'PATCH'].includes(options.method!))
        return reply(
          {
            uuid: 'message-one',
            conversationUuid: conversation.uuid,
            senderUuid: me,
            content: JSON.parse(options.body as string).content,
            createdAt: '2026-10-06T10:01:00',
            updatedAt: '2026-10-06T10:01:00',
          },
          options.method === 'POST' ? 201 : 200,
        );
      return reply(page([]));
    }),
  );
  render(<App />);
  await user.type(screen.getByLabelText('Όνομα χρήστη, email ή τηλέφωνο'), 'alex');
  await user.type(screen.getByLabelText('Κωδικός'), 'password');
  await user.click(screen.getByRole('button', { name: 'Πάμε στις συνομιλίες' }));
  await screen.findByText('Συνομιλίες');
  await user.click(screen.getAllByRole('button', { name: 'Νέα συνομιλία' })[0]);
  await user.type(screen.getByLabelText('UUID συμμετεχόντων'), other);
  await user.click(screen.getByRole('button', { name: 'Ξεκίνα τη συνομιλία' }));
  await waitFor(() => expect(screen.getByLabelText('Μήνυμα').hasAttribute('disabled')).toBe(false));
  await user.type(screen.getByLabelText('Μήνυμα'), 'Γεια σου!');
  await user.click(screen.getByRole('button', { name: 'Αποστολή μηνύματος' }));
  await within(screen.getByLabelText('Ιστορικό μηνυμάτων')).findByText('Γεια σου!');
  await user.click(screen.getByRole('button', { name: 'Επεξεργασία μηνύματος' }));
  await user.clear(screen.getByLabelText('Μήνυμα'));
  await user.type(screen.getByLabelText('Μήνυμα'), 'Γεια ξανά!');
  await user.click(screen.getByRole('button', { name: 'Αποθήκευση μηνύματος' }));
  await within(screen.getByLabelText('Ιστορικό μηνυμάτων')).findByText('Γεια ξανά!');
  expect(calls.find((call) => call.options.method === 'PATCH')?.path).toContain(
    '/messages/message-one',
  );
  expect(
    JSON.parse(
      calls.find((call) => call.path.endsWith('/conversations') && call.options.method === 'POST')!
        .options.body as string,
    ),
  ).toEqual({ participantUuids: [other] });
});
it('loads the latest message page, applies WebSocket changes, and requires confirmation before deletion', async () => {
  sessionStorage.setItem(
    'messenger.session',
    JSON.stringify({ token: 'token', expiresAt: Date.now() + 60000 }),
  );
  const message = {
    uuid: 'message-one',
    conversationUuid: conversation.uuid,
    senderUuid: me,
    content: 'Τελευταίο μήνυμα',
    createdAt: '2026-10-06T10:00:00',
    updatedAt: '2026-10-06T10:00:00',
  };
  const calls: { path: string; method?: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, options: RequestInit) => {
      calls.push({ path, method: options.method });
      if (path.endsWith('/me')) return reply(profile);
      if (options.method === 'DELETE') return new Response(null, { status: 204 });
      if (path.includes('/messages?page=0')) return reply({ ...page([]), totalPages: 3 });
      if (path.includes('/messages?page=2'))
        return reply({ ...page([message]), page: 2, totalPages: 3 });
      return reply(page([conversation]));
    }),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('button', { name: /Χρήστης 22222222/ }));
  await within(screen.getByLabelText('Ιστορικό μηνυμάτων')).findByText('Τελευταίο μήνυμα');
  expect(calls.some((call) => call.path.includes('/messages?page=2'))).toBe(true);
  const socket = Socket.instances.at(-1)!;
  act(() =>
    socket.onmessage!({
      data: JSON.stringify({
        type: 'MESSAGE_UPDATED',
        conversationUuid: conversation.uuid,
        messageUuid: message.uuid,
        message: { ...message, content: 'Άλλαξε ζωντανά' },
      }),
    }),
  );
  await within(screen.getByLabelText('Ιστορικό μηνυμάτων')).findByText('Άλλαξε ζωντανά');
  await user.click(screen.getByRole('button', { name: 'Διαγραφή μηνύματος' }));
  expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'Επιβεβαίωση' }));
  await waitFor(() => expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(1));
  expect(
    within(screen.getByLabelText('Ιστορικό μηνυμάτων')).queryByText('Άλλαξε ζωντανά'),
  ).toBeNull();
});
it('keeps the new-conversation dialog open when identity rejects a participant', async () => {
  sessionStorage.setItem(
    'messenger.session',
    JSON.stringify({ token: 'token', expiresAt: Date.now() + 60000 }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, options: RequestInit) =>
      path.endsWith('/me')
        ? reply(profile)
        : options.method === 'POST'
          ? reply({ detail: 'One or more participants do not exist or are inactive' }, 400)
          : reply(page([])),
    ),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click((await screen.findAllByRole('button', { name: 'Νέα συνομιλία' }))[0]);
  await user.type(screen.getByLabelText('UUID συμμετεχόντων'), other);
  await user.click(screen.getByRole('button', { name: 'Ξεκίνα τη συνομιλία' }));
  await screen.findByText('Ένα ή περισσότερα UUID δεν ανήκουν σε ενεργούς χρήστες.');
  expect(screen.getByRole('dialog')).toBeDefined();
});
it('sends only changed profile fields in PATCH and leaves a blank password out', async () => {
  sessionStorage.setItem(
    'messenger.session',
    JSON.stringify({ token: 'token', expiresAt: Date.now() + 60000 }),
  );
  const fetcher = vi.fn(async (path: string, options: RequestInit) =>
    path.endsWith('/me')
      ? reply(options.method === 'PATCH' ? { ...profile, email: 'new@example.com' } : profile)
      : reply(page([])),
  );
  vi.stubGlobal('fetch', fetcher);
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Το προφίλ σου' }));
  await user.clear(screen.getByLabelText('Email'));
  await user.type(screen.getByLabelText('Email'), 'new@example.com');
  await user.click(screen.getByRole('button', { name: 'Αποθήκευση αλλαγών' }));
  await waitFor(() =>
    expect(fetcher.mock.calls.some((call) => call[1].method === 'PATCH')).toBe(true),
  );
  expect(
    JSON.parse(fetcher.mock.calls.find((call) => call[1].method === 'PATCH')![1].body as string),
  ).toEqual({ email: 'new@example.com' });
});
it('expires a rejected session rather than displaying protected content', async () => {
  sessionStorage.setItem(
    'messenger.session',
    JSON.stringify({ token: 'expired', expiresAt: Date.now() + 60000 }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(null, { status: 401 })),
  );
  render(<App />);
  await screen.findByRole('button', { name: 'Πάμε στις συνομιλίες' });
  expect(sessionStorage.getItem('messenger.session')).toBeNull();
});
