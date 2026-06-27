import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient(accessToken?: () => Promise<string | null>) {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    accessToken
      ? {
          global: {
            fetch: async (url, options = {}) => {
              const token = await accessToken();
              const headers = new Headers(options.headers);
              if (token) {
                headers.set("Authorization", `Bearer ${token}`);
              }
              return fetch(url, { ...options, headers });
            },
          },
        }
      : undefined,
  );
}
