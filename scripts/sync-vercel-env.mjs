#!/usr/bin/env node
/**
 * Sync Moodna env vars to Vercel (production + preview) via the REST API.
 * Fast + reliable: one process, upsert each var, no npx/CLI spin-up.
 *
 * Usage: node scripts/sync-vercel-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "prj_Pv3jgiWESs5HenvgihajFVgD9Cxq";
const TEAM_ID = "team_pMAjSs8Y8TefWIxmj3wdxelG";
const PRODUCTION_URL = "https://kai-kj.vercel.app";
const SUPABASE_URL = "https://fapvarebtgckjbiwheko.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ky5yiiuKzwuqPc46I6H4dA_Tj7RaT3Y";

function readVercelToken() {
  const path = join(
    homedir(),
    "AppData",
    "Roaming",
    "xdg.data",
    "com.vercel.cli",
    "auth.json",
  );
  return JSON.parse(readFileSync(path, "utf8")).token;
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function isPublicKey(key) {
  return key.startsWith("NEXT_PUBLIC_");
}

async function upsertEnv(token, key, value) {
  const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true&teamId=${TEAM_ID}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value,
      type: isPublicKey(key) ? "plain" : "encrypted",
      target: ["production", "preview"],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${key}: ${res.status} ${JSON.stringify(data)}`);
  }
}

async function main() {
  const token = readVercelToken();
  const local = parseEnvFile(".env.local");

  // Required, known values
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY,
    KAI_KJ_API_URL: PRODUCTION_URL,
    NEXT_PUBLIC_APP_URL: PRODUCTION_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/dashboard",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/dashboard",
    NEXT_PUBLIC_CLERK_SIGN_OUT_URL: "/",
    ACCOUNTING_PROVIDER: "quickbooks",
  };

  // Secrets only pushed if present locally (and not a placeholder)
  const secretKeys = [
    "KIE_API_KEY",
    "SUPABASE_SECRET_KEY",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "GOOGLE_SERVICE_ACCOUNT_JSON",
    "GOOGLE_SHEETS_SHARE_EMAIL",
    "SLACK_CLIENT_ID",
    "SLACK_CLIENT_SECRET",
  ];

  const added = [];
  const skipped = [];

  for (const [key, value] of Object.entries(required)) {
    await upsertEnv(token, key, value);
    added.push(key);
    console.log(`✓ ${key}`);
  }

  for (const key of secretKeys) {
    const value = local[key]?.trim();
    if (!value || value.startsWith("your-")) {
      skipped.push(key);
      continue;
    }
    await upsertEnv(token, key, value);
    added.push(key);
    console.log(`✓ ${key} (secret)`);
  }

  console.log(`\nDone. Added/updated ${added.length}.`);
  if (skipped.length) {
    console.log(`Skipped (no local value — add real secret to .env.local first):`);
    for (const k of skipped) console.log(`  - ${k}`);
  }
}

main().catch((error) => {
  console.error("FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
