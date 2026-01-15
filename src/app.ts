import "dotenv/config";
import express from "express";
import routes from "./routes/reply-tweet.route";
import authRoute from "./routes/auth.route";
import session from "express-session";
import cors from "cors";
import { redisClient } from "./utils/redis-client";
import { RedisStore } from "connect-redis";

const app = express();

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

app.use("/api", routes);
app.use("/auth", authRoute);

export default app;
