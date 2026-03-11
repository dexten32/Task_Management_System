import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    username: "default",
});

redis.on("error", (err) => {
    console.error("Redis Error:", err);
    process.exit(1);
});

redis.set("tmsync_test", "connected").then(() => {
    return redis.get("tmsync_test");
}).then((val) => {
    console.log("Redis connected successfully. Value:", val);
    process.exit(0);
}).catch(err => {
    console.error("Redis connection failed:", err);
    process.exit(1);
});
