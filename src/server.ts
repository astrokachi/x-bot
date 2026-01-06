import "dotenv/config";
import express from "express";
import routes from "./routes/reply-tweet.route";
import authRoute from "./routes/auth.route";
import session from "express-session";
import cors from "cors";
import { redisClient } from "./utils/redis-client";
import { RedisStore } from "connect-redis";
import { tweetReplyQueue, worker } from "./queue/tweet-reply.queue";

const PORT = process.env.PORT || 8080;
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

if (!process.env.GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is not set.");
}

if (!process.env.X_CLIENT_ID) {
  console.error("X_CLIENT_ID not set.");
}

worker.on("completed", (job) => {
  console.log(`Done job: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed. ${err}`);
});

app.use("/api", routes);
app.use("/auth", authRoute);

const server = app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

const shutdown = async (sig: string) => {
  try {
    server.close(() => {
      console.log("Http server shutting down");
    });

    await tweetReplyQueue.close();
    console.log("Closed tweet reply queue");

    await redisClient.quit();
    console.log("Closed redis client");

    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
