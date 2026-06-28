export interface OwnerSmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export const SMTP_PRESETS = {
  gmail: {
    label: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
  },
  outlook: {
    label: "Outlook / Microsoft 365",
    host: "smtp.office365.com",
    port: 587,
  },
  yahoo: {
    label: "Yahoo Mail",
    host: "smtp.mail.yahoo.com",
    port: 587,
  },
} as const;

export function isOwnerSmtpConfigured(
  integration: {
    smtpHost?: string | null;
    smtpUser?: string | null;
    smtpPassword?: string | null;
    smtpFrom?: string | null;
  } | null,
): boolean {
  return Boolean(
    integration?.smtpHost &&
      integration?.smtpUser &&
      integration?.smtpPassword &&
      integration?.smtpFrom,
  );
}

export function ownerSmtpFromIntegration(integration: {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
}): OwnerSmtpConfig | null {
  if (
    !integration.smtpHost ||
    !integration.smtpUser ||
    !integration.smtpPassword ||
    !integration.smtpFrom
  ) {
    return null;
  }

  return {
    host: integration.smtpHost,
    port: integration.smtpPort ?? 587,
    user: integration.smtpUser,
    password: integration.smtpPassword,
    from: integration.smtpFrom,
  };
}
