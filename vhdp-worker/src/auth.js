import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import * as schema from "./schema.js";

export function getAuth(db, env, request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const clientOrigin = request.headers.get("origin");

  const trustedOrigins = [
    "https://dauanvanhoc.site",
    "http://localhost:5173",
    "http://localhost:4173"
  ];
  if (clientOrigin) {
    const isLocalhost = clientOrigin.includes("localhost") || clientOrigin.includes("127.0.0.1");
    const isIp = /https?:\/\/\d+\.\d+\.\d+\.\d+/.test(clientOrigin);
    if ((isLocalhost || isIp) && !trustedOrigins.includes(clientOrigin)) {
      trustedOrigins.push(clientOrigin);
    }
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema
    }),
    trustedOrigins,
    plugins: [bearer()],
    emailAndPassword: {
      enabled: true
    },
    useSecureCookies: true,
    cookie: {
      sameSite: "none"
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user"
        },
        username: {
          type: "string",
          required: true
        },
        banned: {
          type: "boolean",
          defaultValue: false
        }
      }
    },
    secret: env.BETTER_AUTH_SECRET || "vhdp-super-secret-key-1234567890",
    baseURL: origin,
    hooks: {
      before: async (context) => {
        if (context.path === "/sign-up/email") {
          try {
            const body = await context.request.clone().json();
            const username = body.username;
            if (!username) {
              return {
                error: {
                  status: 400,
                  message: "Tên đăng nhập không được để trống"
                }
              };
            }
            const trimmed = username.trim();
            const existing = await db.select().from(schema.user).where(
              eq(schema.user.username, trimmed)
            ).limit(1);

            if (existing && existing.length > 0) {
              return {
                error: {
                  status: 400,
                  message: "Tên đăng nhập đã tồn tại"
                }
              };
            }
          } catch (e) {
            console.error("Hook sign-up error:", e);
          }
        }
      }
    }
  });
}
