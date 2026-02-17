import { createServer } from "http";
import app from "./app.js";
import { redisClient } from "./shared/utils/redis-client.js";
import { tweetReplyQueue, worker } from "./features/tweet-reply/tweet-reply.queue.js";
import { SocketService } from "./shared/services/socket.service.js";

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

const httpServer = createServer(app);

const server = httpServer.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
  SocketService.init(httpServer);
  console.log("Socket.io initialised");
});


const shutdown = async (_sig: string) => {
  try {
    const socketService = SocketService.getInstance();
    socketService.getIO().close();
    console.log("Closed Socket.io");

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
