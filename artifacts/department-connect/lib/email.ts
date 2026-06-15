const SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID ?? "";
const PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY ?? "";
const APPROVE_TEMPLATE = process.env.EXPO_PUBLIC_EMAILJS_APPROVE_TEMPLATE ?? "";
const REJECT_TEMPLATE = process.env.EXPO_PUBLIC_EMAILJS_REJECT_TEMPLATE ?? "";
const INVITE_TEMPLATE = process.env.EXPO_PUBLIC_EMAILJS_INVITE_TEMPLATE ?? "";

export const isEmailConfigured = !!(SERVICE_ID && PUBLIC_KEY);

async function sendEmailJS(
  templateId: string,
  params: Record<string, string>
): Promise<void> {
  if (!isEmailConfigured || !templateId) return;
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: templateId,
        user_id: PUBLIC_KEY,
        template_params: params,
      }),
    });
  } catch {}
}

export async function sendApprovalEmail(name: string, email: string): Promise<void> {
  await sendEmailJS(APPROVE_TEMPLATE, {
    to_name: name,
    to_email: email,
    message:
      "Your Department Connect account has been approved! You can now log in using your email and password.",
  });
}

export async function sendRejectionEmail(name: string, email: string): Promise<void> {
  await sendEmailJS(REJECT_TEMPLATE, {
    to_name: name,
    to_email: email,
    message:
      "Your Department Connect registration request was not approved. Please contact your department admin for more information.",
  });
}

export async function sendInviteEmail(
  name: string,
  email: string,
  role: string
): Promise<void> {
  await sendEmailJS(INVITE_TEMPLATE, {
    to_name: name,
    to_email: email,
    role: role.charAt(0).toUpperCase() + role.slice(1),
    message: `You have been added to Department Connect as a ${role}. Sign up using this email address (${email}) and your account will be automatically approved.`,
  });
}
