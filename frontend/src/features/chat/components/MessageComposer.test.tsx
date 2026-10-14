import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageComposer } from './MessageComposer';

afterEach(cleanup);
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const props = () => ({
  editing: null,
  loading: false,
  onCancelEditing: vi.fn(),
  onSend: vi.fn().mockResolvedValue(undefined),
  onError: vi.fn(),
});

it('focuses on opening and switching, survives loading, and ignores background refreshes', async () => {
  const user = userEvent.setup();
  const options = props();
  const view = (id: string, loading: boolean) => (
    <>
      <button>Άλλο στοιχείο</button>
      <MessageComposer key={id} {...options} loading={loading} />
    </>
  );
  const { rerender } = render(view('first', true));
  const field = screen.getByLabelText('Μήνυμα') as HTMLTextAreaElement;
  expect(document.activeElement).toBe(field);
  expect(field.readOnly).toBe(true);
  rerender(view('first', false));
  expect(document.activeElement).toBe(field);
  expect(field.readOnly).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Άλλο στοιχείο' }));
  rerender(view('first', true));
  rerender(view('first', false));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Άλλο στοιχείο' }));
  rerender(view('second', false));
  expect(document.activeElement).toBe(screen.getByLabelText('Μήνυμα'));
});

it.each(['Enter', 'button'])('restores composer focus after sending via %s', async (method) => {
  const user = userEvent.setup();
  const pending = deferred();
  const options = props();
  options.onSend.mockReturnValue(pending.promise);
  render(<MessageComposer {...options} />);
  const field = screen.getByLabelText('Μήνυμα') as HTMLTextAreaElement;
  await user.type(field, 'Γεια');
  if (method === 'Enter') await user.keyboard('{Enter}');
  else await user.click(screen.getByRole('button', { name: 'Αποστολή μηνύματος' }));
  expect(options.onSend).toHaveBeenCalledTimes(1);
  expect(field.readOnly).toBe(true);
  await act(async () => pending.resolve());
  expect(field.value).toBe('');
  expect(field.readOnly).toBe(false);
  expect(document.activeElement).toBe(field);
  await user.keyboard('Επόμενο');
  expect(field.value).toBe('Επόμενο');
});

it('preserves the draft and restores focus when sending fails', async () => {
  const user = userEvent.setup();
  const pending = deferred();
  const options = props();
  options.onSend.mockReturnValue(pending.promise);
  render(<MessageComposer {...options} />);
  const field = screen.getByLabelText('Μήνυμα') as HTMLTextAreaElement;
  await user.type(field, 'Να μείνει');
  await user.click(screen.getByRole('button', { name: 'Αποστολή μηνύματος' }));
  const failure = new Error('offline');
  await act(async () => pending.reject(failure));
  expect(options.onError).toHaveBeenCalledWith(failure);
  expect(field.value).toBe('Να μείνει');
  expect(document.activeElement).toBe(field);
});

it('does not take focus back if the user moved to another control during send', async () => {
  const user = userEvent.setup();
  const pending = deferred();
  const options = props();
  options.onSend.mockReturnValue(pending.promise);
  render(
    <>
      <MessageComposer {...options} />
      <input aria-label="Αναζήτηση" />
    </>,
  );
  await user.type(screen.getByLabelText('Μήνυμα'), 'Γεια');
  await user.keyboard('{Enter}');
  const other = screen.getByLabelText('Αναζήτηση');
  await user.click(other);
  await act(async () => pending.resolve());
  expect(document.activeElement).toBe(other);
});

it('does not focus under an open modal, including when a pending send completes', async () => {
  const user = userEvent.setup();
  const pending = deferred();
  const options = props();
  options.onSend.mockReturnValue(pending.promise);
  const view = (open: boolean) => (
    <>
      <MessageComposer {...options} />
      {open && (
        <dialog open>
          <input aria-label="Πεδίο διαλόγου" />
        </dialog>
      )}
    </>
  );
  const { rerender } = render(view(false));
  await user.type(screen.getByLabelText('Μήνυμα'), 'Γεια');
  await user.keyboard('{Enter}');
  rerender(view(true));
  const modalInput = screen.getByLabelText('Πεδίο διαλόγου');
  await user.click(modalInput);
  await act(async () => pending.resolve());
  expect(document.activeElement).toBe(modalInput);
});

it('restores focus even when sending resolves immediately', async () => {
  const user = userEvent.setup();
  render(<MessageComposer {...props()} />);
  await user.type(screen.getByLabelText('Μήνυμα'), 'Γεια');
  await user.click(screen.getByRole('button', { name: 'Αποστολή μηνύματος' }));
  expect(document.activeElement).toBe(screen.getByLabelText('Μήνυμα'));
});

it('does not focus a newly mounted composer behind an already open modal', () => {
  render(
    <>
      <dialog open>
        <input aria-label="Πεδίο διαλόγου" autoFocus />
      </dialog>
      <MessageComposer {...props()} />
    </>,
  );
  expect(document.activeElement).toBe(screen.getByLabelText('Πεδίο διαλόγου'));
});
