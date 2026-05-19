import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isProd = process.env.NODE_ENV === "production";

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        // In production, only capture warnings and errors. In development, log queries and info too.
        log: isProd 
          ? [
              { emit: "event", level: "warn" },
              { emit: "event", level: "error" },
            ]
          : [
              { emit: "event", level: "query" },
              { emit: "event", level: "info" },
              { emit: "event", level: "warn" },
              { emit: "event", level: "error" },
            ],
    });

// Bind Prisma events to our centralized structured logger
(prisma as any).$on("query", (e: any) => {
  logger.debug(`DB Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
});

(prisma as any).$on("info", (e: any) => {
  logger.info(`Prisma: ${e.message}`);
});

(prisma as any).$on("warn", (e: any) => {
  logger.warn(`Prisma: ${e.message}`);
});

(prisma as any).$on("error", (e: any) => {
  logger.error(`Prisma error: ${e.message}`);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
