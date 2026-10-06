import type { ChatEvent } from '../model/types';

export type ConnectionState = 'connecting' | 'online' | 'offline';
export function connectChat(
  token: string,
  onEvent: (event: ChatEvent) => void,
  onState: (state: ConnectionState) => void,
  onRejected: () => void,
) {
  let stopped = false,
    retries = 0;
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let handshake: ReturnType<typeof setTimeout> | undefined;
  const connect = () => {
    if (stopped) return;
    onState('connecting');
    socket = new WebSocket(
      `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/chat`,
    );
    socket.onopen = () => {
      socket!.send(`Bearer ${token}`);
      handshake = setTimeout(() => socket?.close(), 9000);
    };
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ChatEvent;
        if (data.type === 'AUTHENTICATED') {
          clearTimeout(handshake);
          retries = 0;
          onState('online');
        } else if (['MESSAGE_CREATED', 'MESSAGE_UPDATED', 'MESSAGE_DELETED'].includes(data.type))
          onEvent(data);
      } catch {
        /* Ignore malformed frames without rendering untrusted data. */
      }
    };
    socket.onclose = (event) => {
      clearTimeout(handshake);
      if (stopped) return;
      onState('offline');
      if (event.code === 1008) {
        onRejected();
        return;
      }
      retry = setTimeout(connect, Math.min(1000 * 2 ** retries++, 15000));
    };
    socket.onerror = () => socket?.close();
  };
  connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    clearTimeout(handshake);
    socket?.close();
  };
}
