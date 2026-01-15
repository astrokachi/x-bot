import app from "./app";
import { redisClient } from "./utils/redis-client";
import { tweetReplyQueue, worker } from "./queue/tweet-reply.queue";

const PORT = process.env.PORT || 8080;

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
