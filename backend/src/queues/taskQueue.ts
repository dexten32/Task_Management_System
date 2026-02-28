import { Queue } from "bullmq";
import redis from "../config/redis";

// Create a queue named "background-jobs" backed by our existing ioredis connection
export const taskQueue = new Queue("background-jobs", {
    connection: redis,
});

// Helper function to easily add jobs from anywhere in our app
export const addJobToQueue = async (jobName: string, jobData: any) => {
    try {
        const job = await taskQueue.add(jobName, jobData, {
            removeOnComplete: true, // Keep Redis memory clean
            removeOnFail: false,    // Keep failed jobs for inspection
            attempts: 3,            // Retry temporary failures
            backoff: {
                type: "exponential",
                delay: 2000,          // 2s, 4s, 8s
            },
        });
        console.log(`[BullMQ] Added job ${job.id} - ${jobName}`);
        return job;
    } catch (error) {
        console.error(`[BullMQ] Failed to add job ${jobName}:`, error);
    }
};
