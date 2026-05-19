import { logger } from "./utils/logger";

// Globally intercept and override standard console logs in production
if (process.env.NODE_ENV === "production") {
  console.log = (...args) => logger.info(args.join(" "));
  console.info = (...args) => logger.info(args.join(" "));
  console.warn = (...args) => logger.warn(args.join(" "));
  console.error = (...args) => {
    const err = args.find(a => a instanceof Error);
    logger.error(args.filter(a => !(a instanceof Error)).join(" "), err);
  };
}

import app from "./app";

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});

import prisma from "./config/prisma";
import { initWorker } from "./workers/taskWorker";

// Start background workers
initWorker();

const gracefulShutdown = async () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(async () => {
        console.log('Closed out remaining connections');
        await prisma.$disconnect();
        process.exit(0);
    });

    // Force close server after 10 secs
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
