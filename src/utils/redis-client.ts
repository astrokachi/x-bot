import "dotenv/config";
import { createClient } from "redis";

export const redisClient = createClient({url: process.env.REDIS_URL});

redisClient.on('error', (err) => {
    console.error("Redis error: ", err);
});

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis cloud.')
    } catch (error) {
        console.error("Failed to connect to Redis: ", error);
    }
})();
