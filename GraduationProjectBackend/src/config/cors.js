import { env } from "./env.js";

export const corsOptions = {
  origin: (origin, callback) => {
    // allow curl / server-to-server with no origin
    if (!origin) return callback(null, true);

    if (env.corsOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },

  // This backend uses Authorization Bearer tokens (not cookies),
  // so credentials are not required.
  credentials: false,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
};
