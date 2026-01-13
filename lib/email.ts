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
 * Bug report email parameters.
 */
interface BugReportEmailParams {
  to: string;
  repoName: string;
  branchName: string;
  symptoms: string[];
  stressLevel: string;
  dashboardUrl?: string;
}

/**
 * Sends a bug report email styled as a work request from QA.
 * Only includes symptoms (what the user sees), NOT the technical changes.
 * 
 * @param params - Bug report email parameters
 * @returns Success status and message ID or error
 */
export async function sendBugReportEmail(
  params: BugReportEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, repoName, branchName, symptoms, stressLevel, dashboardUrl } = params;

  // Skip email sending if no API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping bug report email");
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const priorityLabel = stressLevel === "high" ? "🔴 HIGH" : stressLevel === "medium" ? "🟡 MEDIUM" : "🟢 LOW";
    const ticketId = `BUG-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "QA Team <qa@buggr.dev>",
      to: [to],
      subject: `[${priorityLabel}] Bug Report: Issues found in ${repoName}`,
      html: generateBugReportEmailHtml({
        ticketId,
        repoName,
        branchName,
        symptoms,
        priorityLabel,
        dashboardUrl,
      }),
      text: generateBugReportEmailText({
        ticketId,
        repoName,
        branchName,
        symptoms,
        priorityLabel,
        dashboardUrl,
      }),
    });

    if (error) {
      console.error("[Email] Failed to send bug report:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Bug report sent to ${to}, messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Email] Error sending bug report:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error" 
    };
  }
}

/**
 * Generates HTML content for the bug report email.
 */
function generateBugReportEmailHtml(params: {
  ticketId: string;
  repoName: string;
  branchName: string;
  symptoms: string[];
  priorityLabel: string;
  dashboardUrl?: string;
}): string {
  const { ticketId, repoName, branchName, symptoms, priorityLabel, dashboardUrl } = params;
  
  const symptomsHtml = symptoms
    .map((s) => `<li style="margin-bottom: 12px; color: #c9d1d9; line-height: 1.5;">${escapeHtml(s)}</li>`)
    .join("");

  const ctaButton = dashboardUrl 
    ? `<a href="${dashboardUrl}" style="display: inline-block; background-color: #238636; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">View in Dashboard</a>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bug Report: ${escapeHtml(repoName)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #30363d;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #21262d; color: #8b949e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${ticketId}</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 14px; font-weight: 600;">${priorityLabel} Priority</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 24px 32px 16px;">
              <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 20px; font-weight: 600;">Bug Report</h1>
              <p style="margin: 0; color: #8b949e; font-size: 14px;">
                Issues have been reported in <strong style="color: #58a6ff;">${escapeHtml(repoName)}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Branch Info -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #21262d; border-radius: 6px; padding: 12px 16px;">
                <span style="color: #8b949e; font-size: 12px;">Branch:</span>
                <code style="color: #f0883e; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; margin-left: 8px;">${escapeHtml(branchName)}</code>
              </div>
            </td>
          </tr>

          <!-- Symptoms Section -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                📋 Reported Issues
              </h2>
              <div style="background-color: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 16px 20px;">
                <ol style="margin: 0; padding-left: 20px;">
                  ${symptomsHtml}
                </ol>
              </div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0; color: #8b949e; font-size: 14px; line-height: 1.6;">
                Please investigate and resolve these issues at your earliest convenience. 
                The team is counting on you to track down and fix these bugs.
              </p>
            </td>
          </tr>

          ${ctaButton ? `
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px;">
              ${ctaButton}
            </td>
          </tr>
          ` : ""}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #30363d; background-color: #0d1117; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6e7681; font-size: 12px;">
                This is an automated bug report. Good luck! 🐛
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
 * Generates plain text content for the bug report email.
 */
function generateBugReportEmailText(params: {
  ticketId: string;
  repoName: string;
  branchName: string;
  symptoms: string[];
  priorityLabel: string;
  dashboardUrl?: string;
}): string {
  const { ticketId, repoName, branchName, symptoms, priorityLabel, dashboardUrl } = params;
  
  const symptomsList = symptoms.map((s, i) => `${i + 1}. ${s}`).join("\n");

  return `
${ticketId} - ${priorityLabel} Priority

BUG REPORT
==========

Repository: ${repoName}
Branch: ${branchName}

REPORTED ISSUES:
${symptomsList}

Please investigate and resolve these issues at your earliest convenience.
The team is counting on you to track down and fix these bugs.

${dashboardUrl ? `View in Dashboard: ${dashboardUrl}` : ""}

---
This is an automated bug report. Good luck! 🐛
  `.trim();
}

/**
 * Welcome email parameters.
 */
interface WelcomeEmailParams {
  to: string;
  userName: string;
  startingCoins: number;
}

/**
 * Sends a welcome email to new users.
 * 
 * @param params - Welcome email parameters
 * @returns Success status and message ID or error
 */
export async function sendWelcomeEmail(
  params: WelcomeEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, userName, startingCoins } = params;

  // Skip email sending if no API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping welcome email");
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const dashboardUrl = `${APP_URL}/dashboard`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Welcome to Buggr, ${userName}! 🐛`,
      html: generateWelcomeEmailHtml({ userName, startingCoins, dashboardUrl }),
      text: generateWelcomeEmailText({ userName, startingCoins, dashboardUrl }),
    });

    if (error) {
      console.error("[Email] Failed to send welcome email:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Welcome email sent to ${to}, messageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Email] Error sending welcome email:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error" 
    };
  }
}

/**
 * Generates HTML content for the welcome email.
 */
function generateWelcomeEmailHtml(params: {
  userName: string;
  startingCoins: number;
  dashboardUrl: string;
}): string {
  const { userName, startingCoins, dashboardUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Buggr!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🐛</div>
              <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 24px; font-weight: 600;">Welcome to Buggr!</h1>
              <p style="margin: 0; color: #8b949e; font-size: 16px;">Hey ${escapeHtml(userName)}, you're in!</p>
            </td>
          </tr>
          
          <!-- Coins Badge -->
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #238636 0%, #2ea043 100%); border-radius: 12px; padding: 16px 24px;">
                <p style="margin: 0 0 4px; color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Starting Balance</p>
                <p style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">🪙 ${startingCoins} Coins</p>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 16px; font-weight: 600;">How Buggr Works</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #30363d;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="font-size: 18px;">1️⃣</span>
                        </td>
                        <td style="color: #c9d1d9; font-size: 14px; line-height: 1.5;">
                          <strong style="color: #ffffff;">Pick a repo</strong> – Choose any repository you want to practice on
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #30363d;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="font-size: 18px;">2️⃣</span>
                        </td>
                        <td style="color: #c9d1d9; font-size: 14px; line-height: 1.5;">
                          <strong style="color: #ffffff;">Bugger it up</strong> – We'll inject realistic bugs into a branch
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #30363d;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="font-size: 18px;">3️⃣</span>
                        </td>
                        <td style="color: #c9d1d9; font-size: 14px; line-height: 1.5;">
                          <strong style="color: #ffffff;">Hunt the bugs</strong> – Find and fix them like a real debugging session
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="font-size: 18px;">4️⃣</span>
                        </td>
                        <td style="color: #c9d1d9; font-size: 14px; line-height: 1.5;">
                          <strong style="color: #ffffff;">Get scored</strong> – See how fast and accurate you were
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Coin Info -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px; font-weight: 600;">💡 Pro Tip</p>
                <p style="margin: 0; color: #8b949e; font-size: 13px; line-height: 1.5;">
                  Invite friends to earn more coins! You'll get <strong style="color: #58a6ff;">30 coins</strong> for your first invite, 
                  plus <strong style="color: #58a6ff;">30 more</strong> for each friend who signs up.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #238636; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                Start Debugging 🚀
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #30363d; text-align: center;">
              <p style="margin: 0; color: #6e7681; font-size: 12px;">
                Happy bug hunting! 🐛
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
 * Generates plain text content for the welcome email.
 */
function generateWelcomeEmailText(params: {
  userName: string;
  startingCoins: number;
  dashboardUrl: string;
}): string {
  const { userName, startingCoins, dashboardUrl } = params;

  return `
Welcome to Buggr, ${userName}! 🐛
================================

You're in! Here's your starting balance: 🪙 ${startingCoins} Coins

HOW BUGGR WORKS
---------------
1. Pick a repo – Choose any repository you want to practice on
2. Bugger it up – We'll inject realistic bugs into a branch
3. Hunt the bugs – Find and fix them like a real debugging session
4. Get scored – See how fast and accurate you were

💡 PRO TIP
----------
Invite friends to earn more coins! You'll get 30 coins for your first invite, 
plus 30 more for each friend who signs up.

Start debugging: ${dashboardUrl}

Happy bug hunting! 🐛
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
