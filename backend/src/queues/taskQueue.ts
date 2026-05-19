import { processBackgroundJob } from "../workers/taskWorker";
import { logger } from "../utils/logger";

// Helper function to easily add jobs from anywhere in our app
export const addJobToQueue = async (jobName: string, jobData: any) => {
    try {
        logger.info(`[Queue] Dispatching job ${jobName}`);
        
        // Process asynchronously without blocking the main thread
        setTimeout(() => {
            processBackgroundJob(jobName, jobData);
        }, 0);

        return { id: Math.random().toString(36).substring(7) };
    } catch (error) {
        logger.error(`[Queue] Failed to add job ${jobName}`, error);
    }
};
