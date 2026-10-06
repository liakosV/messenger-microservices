import type { Profile } from '../../profile/model/types';
import type { Conversation } from './types';
import { shortId } from '../../../shared/utils/format';
export function titleFor(conversation: Conversation, me: Profile) {
  const others = conversation.participantUuids.filter((id) => id !== me.uuid);
  return others.length > 1
    ? `Ομάδα · ${conversation.participantUuids.length} μέλη`
    : `Χρήστης ${shortId(others[0] || conversation.uuid)}`;
}
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function participantIds(text: string, me: string): string[] {
  const ids = [
    ...new Set(
      text
        .trim()
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map((id) => id.toLowerCase()),
    ),
  ].filter((id) => id !== me.toLowerCase());
  if (!ids.length || ids.length > 99 || ids.some((id) => !UUID_PATTERN.test(id)))
    throw new Error('Βάλε 1–99 έγκυρα UUID άλλων χρηστών, χωρισμένα με κόμμα ή νέα γραμμή.');
  return ids;
}
