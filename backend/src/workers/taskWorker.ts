import { Worker, Job } from "bullmq";
import redis from "../config/redis";

// Simulated Delay Helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const initWorker = () => {
    const worker = new Worker("background-jobs", async (job: Job) => {
        switch (job.name) {
            case "send-email":
                console.log(`[Worker] Started processing 'send-email' for ${job.data.to}`);
                // Simulate email API latency (e.g. SendGrid or AWS SES)
                await delay(1500);
                console.log(`[Worker] Finished 'send-email' successfully!`);
                break;

            case "generate-report":
                console.log(`[Worker] Started 'generate-report' for department ${job.data.dept}`);
                // Simulate heavy PDF generation or complex aggregation
                await delay(5000);
                console.log(`[Worker] Finished 'generate-report'!`);
                break;

            default:
                console.warn(`[Worker] Unknown job type: ${job.name}`);
        }
    }, {
        connection: redis,
        concurrency: 5, // Process up to 5 jobs simultaneously
    });

    worker.on("completed", (job) => {
        console.log(`[Worker Event] Job ${job.id} has completed.`);
    });

    worker.on("failed", (job, err) => {
        console.error(`[Worker Event] Job ${job?.id} failed with error ${err.message}`);
    });

    return worker;
};
