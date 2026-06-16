import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function logAudit(
  action: string,
  actorId: string | null,
  actorName: string | null,
  targetId?: string,
  targetType?: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from("audit_log").insert({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      actor_id: actorId ?? null,
      actor_name: actorName ?? null,
      action,
      target_id: targetId ?? null,
      target_type: targetType ?? null,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // silent fail — audit should never break the main flow
  }
}
