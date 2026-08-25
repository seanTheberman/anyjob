import "server-only";

type AdminClient = {
  from(table: string): any;
};

function text(value: unknown) {
  return String(value || "").trim();
}

function moneyRange(min: unknown, max: unknown) {
  const minimum = Number(min || 0);
  const maximum = Number(max || 0);
  if (!minimum && !maximum) return "Open budget";
  if (minimum && maximum && minimum !== maximum) return `EUR ${minimum}-${maximum}`;
  return `EUR ${maximum || minimum}`;
}

export function privateRequestMessage(inquiry: Record<string, unknown>) {
  const storedDescription = text(inquiry.job_description);
  const [title, ...descriptionParts] = storedDescription.split(/\n\s*\n/);
  const description = descriptionParts.join("\n\n").trim();
  return [
    "PRIVATE JOB REQUIREMENTS",
    title || text(inquiry.subcategory_slug) || "Service request",
    description,
    `Service: ${text(inquiry.category_slug) || "Custom"} / ${text(inquiry.subcategory_slug) || "Custom job"}`,
    `Schedule: ${text(inquiry.preferred_date) || "Flexible"}${text(inquiry.preferred_time_start) ? ` at ${text(inquiry.preferred_time_start)}` : ""}`,
    `Area: ${text(inquiry.coarse_location_label) || text(inquiry.city) || "Shared after confirmation"}`,
    `Budget: ${moneyRange(inquiry.budget_range_min, inquiry.budget_range_max)}`,
    "Please review these requirements and accept with your quote or reject the request.",
  ].filter(Boolean).join("\n\n");
}

export async function createPrivateRequestConversation(
  admin: AdminClient,
  inquiry: Record<string, unknown>,
  providerId: string,
) {
  const inquiryId = text(inquiry.id);
  const buyerId = text(inquiry.user_id);
  if (!inquiryId || !buyerId || !providerId) {
    throw new Error("Private request conversation is missing participants.");
  }

  const timestamp = new Date().toISOString();
  const { data: existing, error: existingError } = await admin
    .from("eloo_conversations")
    .select("id")
    .eq("inquiry_id", inquiryId)
    .eq("is_active", true)
    .maybeSingle();
  if (existingError) throw existingError;

  const { data: conversation, error: conversationError } = existing
    ? { data: existing, error: null }
    : await admin
        .from("eloo_conversations")
        .insert({
          client_id: buyerId,
          provider_id: providerId,
          inquiry_id: inquiryId,
          bid_id: null,
          is_active: true,
          last_message_at: timestamp,
        })
        .select("id")
        .single();
  if (conversationError || !conversation) {
    throw conversationError || new Error("Could not create requirements conversation.");
  }

  const content = privateRequestMessage(inquiry);
  const { data: priorMessage, error: priorError } = await admin
    .from("eloo_messages")
    .select("id")
    .eq("conversation_id", conversation.id)
    .eq("sender_id", buyerId)
    .eq("content", content)
    .maybeSingle();
  if (priorError) throw priorError;

  if (!priorMessage) {
    const { error: messageError } = await admin.from("eloo_messages").insert({
      conversation_id: conversation.id,
      sender_id: buyerId,
      content,
      attachments: [],
    });
    if (messageError) throw messageError;
  }

  return conversation;
}
