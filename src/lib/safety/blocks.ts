import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function database() {
  return createAdminSupabaseClient() as never as { from(table: string): any };
}

export async function usersHaveBlockedEachOther(userId: string, otherUserId: string) {
  if (!userId || !otherUserId || userId === otherUserId) return false;
  const { data, error } = await database()
    .from("user_blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${userId},blocked_user_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_user_id.eq.${userId})`,
    )
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

export async function blockedParticipantIds(userId: string, participantIds: string[]) {
  const candidates = new Set(participantIds.filter((id) => id && id !== userId));
  if (!candidates.size) return new Set<string>();

  const { data, error } = await database()
    .from("user_blocks")
    .select("blocker_id,blocked_user_id")
    .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);
  if (error) throw error;

  const blocked = new Set<string>();
  for (const row of data || []) {
    const otherId = row.blocker_id === userId ? row.blocked_user_id : row.blocker_id;
    if (candidates.has(otherId)) blocked.add(otherId);
  }
  return blocked;
}
