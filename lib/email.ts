import { Resend } from "resend";

// Initialize Resend client
// Requires RESEND_API_KEY environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

/** From email address for sending invitations */
const FROM_EMAIL = process.env.EMAIL_FROM || "Buggr <noreply@buggr.dev>";

/** Base URL for the application */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Sends an invitation email to the specified address.
 * 
 * @param to - Email address to send the invitation to
 * @param inviterName - Name of the person who sent the invitation
 * @param inviteCode - Unique invitation code
 * @returns Success status and message ID or error
 */
export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  inviteCode: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Skip email sending if no API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email send");
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const signupUrl = `${APP_URL}?invite=${inviteCode}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `${inviterName} invited you to Buggr! 🐛`,
      html: generateInviteEmailHtml(inviterName, signupUrl),
      text: generateInviteEmailText(inviterName, signupUrl),
    });

    if (error) {
      console.error("[Email] Failed to send invitation:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Invitation sent to ${to}, messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Email] Error sending invitation:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error" 
    };
  }
}

/**
 * Generates HTML content for the invitation email.
 */
function generateInviteEmailHtml(inviterName: string, signupUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Buggr!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 16px;">🐛</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">You're Invited to Buggr!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0 0 16px; color: #8b949e; font-size: 16px; line-height: 1.5;">
                <strong style="color: #ffffff;">${escapeHtml(inviterName)}</strong> thinks you'd be great at debugging! They've invited you to join Buggr - a game where you hunt bugs in real code.
              </p>
              <p style="margin: 0 0 24px; color: #8b949e; font-size: 16px; line-height: 1.5;">
                Test your debugging skills, compete with friends, and level up your code review abilities.
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${signupUrl}" style="display: inline-block; background-color: #238636; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                Accept Invitation
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #30363d; text-align: center;">
              <p style="margin: 0; color: #6e7681; font-size: 12px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text content for the invitation email.
 */
function generateInviteEmailText(inviterName: string, signupUrl: string): string {
  return `
You're Invited to Buggr! 🐛

${inviterName} thinks you'd be great at debugging! They've invited you to join Buggr - a game where you hunt bugs in real code.

Test your debugging skills, compete with friends, and level up your code review abilities.

Accept your invitation here: ${signupUrl}

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
