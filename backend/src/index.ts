import app from "./app";

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

import prisma from "./config/prisma";
import { initWorker } from "./workers/taskWorker";

// Start background workers
const worker = initWorker();

const gracefulShutdown = async () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(async () => {
        console.log('Closed out remaining connections');
        await worker.close();
        console.log('Worker shut down');
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
