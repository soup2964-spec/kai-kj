export function isSlackOAuthConfigured(): boolean {
  return Boolean(
    process.env.SLACK_CLIENT_ID?.trim() &&
      process.env.SLACK_CLIENT_SECRET?.trim(),
  );
}

export function appBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}

export function slackRedirectUri(request: Request): string {
  return `${appBaseUrl(request)}/api/integrations/slack/callback`;
}

export function encodeSlackOAuthState(ownerId: string): string {
  return Buffer.from(JSON.stringify({ ownerId }), "utf8").toString("base64url");
}

export function decodeSlackOAuthState(state: string): string | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as { ownerId?: string };
    return parsed.ownerId?.trim() || null;
  } catch {
    return null;
  }
}

export function buildSlackAuthorizeUrl(request: Request, ownerId: string): string {
  const clientId = process.env.SLACK_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("SLACK_CLIENT_ID is not configured.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "incoming-webhook",
    redirect_uri: slackRedirectUri(request),
    state: encodeSlackOAuthState(ownerId),
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export interface SlackOAuthResult {
  webhookUrl: string;
  teamName: string | null;
  channelName: string | null;
}

export async function exchangeSlackOAuthCode(
  request: Request,
  code: string,
): Promise<SlackOAuthResult> {
  const clientId = process.env.SLACK_CLIENT_ID?.trim();
  const clientSecret = process.env.SLACK_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Slack OAuth is not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: slackRedirectUri(request),
  });

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    incoming_webhook?: {
      url?: string;
      channel?: string;
    };
    team?: { name?: string };
  };

  if (!data.ok || !data.incoming_webhook?.url) {
    throw new Error(data.error ?? "Slack did not return an incoming webhook.");
  }

  return {
    webhookUrl: data.incoming_webhook.url,
    teamName: data.team?.name ?? null,
    channelName: data.incoming_webhook.channel ?? null,
  };
}
