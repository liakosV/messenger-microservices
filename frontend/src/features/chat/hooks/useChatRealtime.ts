import { useCallback, useEffect, useRef, useState } from 'react';
import { connectChat, type ConnectionState } from '../api/chatSocket';
import type { ChatEvent } from '../model/types';

interface Options {
  token: string;
  onEvent: (event: ChatEvent) => void;
  onConnected: () => void;
  onRejected: () => void;
}
export function useChatRealtime({ token, onEvent, onConnected, onRejected }: Options) {
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [retry, setRetry] = useState(0);
  const callbacks = useRef({ onEvent, onConnected, onRejected });
  callbacks.current = { onEvent, onConnected, onRejected };
  useEffect(() => {
    // Changing selection or message state must not tear down the account's socket.
    return connectChat(
      token,
      (event) => callbacks.current.onEvent(event),
      (state) => {
        setConnection(state);
        if (state === 'online') callbacks.current.onConnected();
      },
      () => callbacks.current.onRejected(),
    );
  }, [token, retry]);
  return { connection, reconnect: useCallback(() => setRetry((value) => value + 1), []) };
}
