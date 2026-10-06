import type { Message } from './types';
export function mergeMessages(existing: Message[], incoming: Message[]) {
  const merged = new Map(existing.map((message) => [message.uuid, message]));
  incoming.forEach((message) => merged.set(message.uuid, message));
  return [...merged.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
