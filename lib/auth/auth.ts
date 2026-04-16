import * as argon2 from "argon2";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: process.env.BASE_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: false,
    password: {
      hash: async (password: string) => {
        return await argon2.hash(password, {
          type: argon2.argon2id,
          timeCost: 4,
          hashLength: 64,
          memoryCost: 65536,
          parallelism: 1,
        });
      },

      verify: async ({
        hash,
        password,
      }: {
        hash: string;
        password: string;
      }) => {
        return await argon2.verify(hash, password);
      },
    },
  },

  // user: {
  //   additionalFields: {
  //     role: {
  //       type: ["user", "admin"],
  //       defaultValue: "user",
  //       required: false,
  //       input: false,
  //     },
  //   },
  // },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 5,
    storage: "database",
    modelName: "rateLimit",
  },

  advanced: {
    ipAddress: {
      ipv6Subnet: 64,
    },

    useSecureCookies: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 10,
      strategy: "jwe",
      version: "2",
    },
  },

  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),

    username({
      minUsernameLength: 3,
      maxUsernameLength: 20,
      usernameValidator: (name) => {
        const reservedNames = ["admin", "administrator", "root", "system"];

        // Return false if the requested username is in our reserved list (case-insensitive)
        if (reservedNames.includes(name.toLowerCase())) {
          return false;
        }

        // Optional: Ensure the username only contains letters, numbers, and underscores
        return /^[a-zA-Z0-9_]+$/.test(name);
      },
    }),

    nextCookies(),
  ],
});
