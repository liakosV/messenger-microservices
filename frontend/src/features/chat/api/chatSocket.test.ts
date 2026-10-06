import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectChat } from './chatSocket';

class MockSocket {
  static instances: MockSocket[] = [];
  onopen?: () => void;
  onclose?: (event: { code: number }) => void;
  onmessage?: (event: { data: string }) => void;
  onerror?: () => void;
  send = vi.fn();
  close = vi.fn();
  constructor(public url: string) {
    MockSocket.instances.push(this);
  }
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  MockSocket.instances = [];
});
describe('authenticated WebSocket lifecycle', () => {
  it('authenticates with a frame, reconciles events, reconnects and stops on cleanup', () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', MockSocket);
    const state = vi.fn(),
      event = vi.fn(),
      rejected = vi.fn();
    const cleanup = connectChat('secret-token', event, state, rejected);
    const socket = MockSocket.instances[0];
    expect(socket.url).not.toContain('secret-token');
    socket.onopen!();
    expect(socket.send).toHaveBeenCalledWith('Bearer secret-token');
    socket.onmessage!({ data: '{"type":"AUTHENTICATED"}' });
    expect(state).toHaveBeenLastCalledWith('online');
    socket.onmessage!({ data: '{"type":"MESSAGE_CREATED","conversationUuid":"one"}' });
    expect(event).toHaveBeenCalledOnce();
    socket.onclose!({ code: 1006 });
    vi.advanceTimersByTime(1000);
    expect(MockSocket.instances).toHaveLength(2);
    cleanup();
    vi.advanceTimersByTime(30000);
    expect(MockSocket.instances).toHaveLength(2);
  });
  it('does not endlessly retry a rejected account', () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', MockSocket);
    const rejected = vi.fn();
    const cleanup = connectChat('token', vi.fn(), vi.fn(), rejected);
    MockSocket.instances[0].onclose!({ code: 1008 });
    vi.advanceTimersByTime(30000);
    expect(rejected).toHaveBeenCalledOnce();
    expect(MockSocket.instances).toHaveLength(1);
    cleanup();
  });
});
