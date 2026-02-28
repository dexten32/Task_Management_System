import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD;
const redisTls = process.env.REDIS_TLS === "true";

const redis = new Redis({
    host: redisHost,
    port: redisPort,
    username: "default",
    password: redisPassword,
    tls: redisTls ? {} : undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    retryStrategy: (times) => {
        // End reconnecting after a certain number of attempts
        if (times > 3) {
            console.warn("Redis connection failed after 3 attempts. Caching will be disabled for this session.");
            return null;
        }
        return Math.min(times * 100, 2000);
    },
});

redis.on("connect", () => {
    console.log("Connected to Redis successfully");
});

redis.on("error", (err) => {
    console.error("Redis error:", err.message);
});

export default redis;
