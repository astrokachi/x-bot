import "dotenv/config";
import express, { Express } from "express";
import tweetReplyRoute from "./features/tweet-reply/tweet-reply.route.js";
import authRoute from "./features/auth/auth.route.js";
import session from "express-session";
import cors from "cors";
import { redisClient } from "./shared/utils/redis-client.js";
import { RedisStore } from "connect-redis";
import { globalErrorHandler } from "./shared/middleware/error-handler.js";

const app: Express = express();

app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_URL!],
    credentials: true,
  })
);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use("/api", tweetReplyRoute);
app.use("/auth", authRoute);

app.use(globalErrorHandler);

export default app;
