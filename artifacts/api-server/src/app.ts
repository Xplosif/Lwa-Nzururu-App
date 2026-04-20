import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const SESSION_SECRET = process.env.SESSION_SECRET || "lwa-nzururu-secret-2024";
const sessions = new Map<string, { userId: number; expiresAt: number }>();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SESSION_SECRET));

app.use((req, res, next) => {
  const sessionId = req.cookies?.sessionId;
  (req as any).sessionStore = sessions;
  (req as any).session = { userId: null as number | null, _id: null as string | null };

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session && session.expiresAt > Date.now()) {
      (req as any).session.userId = session.userId;
      (req as any).session._id = sessionId;
    } else if (session) {
      sessions.delete(sessionId);
    }
  }

  const originalEnd = res.end.bind(res);
  (res as any).end = function (...args: Parameters<typeof res.end>) {
    const sess = (req as any).session;
    if (sess?.userId && !sess._id) {
      const newId = crypto.randomBytes(32).toString("hex");
      sessions.set(newId, {
        userId: sess.userId,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      if (!res.headersSent) {
        res.cookie("sessionId", newId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: "lax",
        });
      }
    } else if (sess?._loggedOut) {
      if (!res.headersSent) {
        res.clearCookie("sessionId");
      }
    }
    return originalEnd(...args);
  };

  next();
});

app.use("/api", router);

export default app;
