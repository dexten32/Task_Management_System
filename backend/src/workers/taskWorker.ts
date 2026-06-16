import { logger } from "../utils/logger";
import { queueJobsTotal, queueJobDurationSeconds } from "../utils/metrics";

// Simulated Delay Helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const processBackgroundJob = async (jobName: string, jobData: any) => {
    const endTimer = queueJobDurationSeconds.startTimer({ job_name: jobName });
    let status = "success";
    try {
        switch (jobName) {
            case "send-email":
                logger.info(`[Worker] Started processing 'send-email' for ${jobData.to}`);
                // Simulate email API latency (e.g. SendGrid or AWS SES)
                await delay(1500);
                logger.info(`[Worker] Finished 'send-email' successfully!`);
                break;

            case "generate-report":
                logger.info(`[Worker] Started 'generate-report' for department ${jobData.dept}`);
                // Simulate heavy PDF generation or complex aggregation
                await delay(5000);
                logger.info(`[Worker] Finished 'generate-report'!`);
                break;

            default:
                logger.warn(`[Worker] Unknown job type: ${jobName}`);
                status = "unknown";
        }
    } catch (err: any) {
        status = "error";
        logger.error(`[Worker Event] Job ${jobName} failed`, err);
    } finally {
        endTimer();
        queueJobsTotal.inc({ job_name: jobName, status });
    }
};

export const initWorker = () => {
    logger.info("[Worker] In-memory worker initialized.");
};
