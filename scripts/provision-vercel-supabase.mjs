#!/usr/bin/env node
/**
 * Create (or reuse) a Supabase secret API key and add it to Vercel.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/provision-vercel-supabase.mjs
 *
 * Get a token: https://supabase.com/dashboard/account/tokens
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_REF = "fapvarebtgckjbiwheko";
const VERCEL_PROJECT_ID = "prj_Pv3jgiWESs5HenvgihajFVgD9Cxq";
const VERCEL_TEAM_ID = "team_pMAjSs8Y8TefWIxmj3wdxelG";

function readVercelToken() {
  const path = join(homedir(), "AppData", "Roaming", "xdg.data", "com.vercel.cli", "auth.json");
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw).token;
}

async function createSupabaseSecretKey(accessToken) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys?reveal=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "secret",
        name: "kai-kj-vercel",
        description: "Server-side key for Moodna on Vercel",
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Supabase API failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  const key = data.api_key ?? data.key;
  if (!key) {
    throw new Error(`Unexpected Supabase response: ${JSON.stringify(data)}`);
  }

  return key;
}

async function addVercelEnv(vercelToken, key, value) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: "encrypted",
        target: ["production", "preview"],
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Vercel API failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    console.error(
      "Set SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)",
    );
    process.exit(1);
  }

  const secretKey = await createSupabaseSecretKey(accessToken);
  const vercelToken = readVercelToken();

  await addVercelEnv(vercelToken, "SUPABASE_SECRET_KEY", secretKey);

  console.log("Added SUPABASE_SECRET_KEY to Vercel (production + preview).");
  console.log("Redeploy: npx vercel --prod --yes");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
