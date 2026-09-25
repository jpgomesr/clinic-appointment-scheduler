export const TOKEN_COOKIE = "token";

export const TOKEN_COOKIE_OPTIONS = {
   httpOnly: true,
   sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
   secure: process.env.NODE_ENV === "production",
   path: "/",
};

export const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000;
