import { adminClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BASE_AUTH_URL,

  fetchOptions: {
    onError: async (context) => {
      const { response } = context;

      if (response.status === 429) {
        const retryAfter = response.headers.get("X-Retry-After");
        console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);

        throw new Error(
          `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
        );
      }
    },
  },

  plugins: [usernameClient(), adminClient()],
});
