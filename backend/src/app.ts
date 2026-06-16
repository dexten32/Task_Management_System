import dotenv from "dotenv";
dotenv.config();
import express from "express";
import userRoutes from "./routes/userRoutes";
import taskRoutes from "./routes/taskRoutes";
import cors from "cors";
import departmentRoutes from "./routes/departmentRoutes";
import roleRoutes from "./routes/roleRoutes";
import { PrismaClient } from "@prisma/client";
import logsRoutes from "./routes/logsRoutes";
import priorityRoutes from "./routes/priorityRoutes";
import compression from "compression";
import { globalLimiter } from "./middlewares/rateLimiter";
import promBundle from "express-prom-bundle";
import { metricsRegistry } from "./utils/metrics";

const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(compression());
app.use(express.json());

// Apply global rate limiting to all requests
app.use(globalLimiter);

// Prometheus HTTP metrics middleware
const metricsMiddleware = promBundle({
  autoregister: false, // We will manually expose /metrics to include Prisma metrics
  includeMethod: true, 
  includePath: true, 
  promRegistry: metricsRegistry
});
app.use(metricsMiddleware);

// Custom /metrics endpoint to merge prom-client and Prisma metrics
app.get("/metrics", async (req, res) => {
  try {
    const appMetrics = await metricsRegistry.metrics();
    const prismaMetrics = await prisma.$metrics.prometheus();
    res.set("Content-Type", metricsRegistry.contentType);
    res.end(`${appMetrics}\n${prismaMetrics}`);
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [
      "http://localhost:3000",
      "http://192.168.1.37:3000",
      "http://192.168.1.34:3000",
      "https://tmsync.in",
      "https://www.tmsync.in",
      "https://task-management-system-cyan-five.vercel.app",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                        allowedOrigins.some(o => o.includes('*') && new RegExp(o.replace('*', '.*')).test(origin));
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS Warning] Blocked request from unauthorized origin: "${origin}". Allowed origins configured:`, allowedOrigins);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);

// Test route
app.get("/", (req, res) => {
  res.send("Backend API is running");
});

// Mount API routes

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/logs", logsRoutes);

app.use("/api/priorities", priorityRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Global error handler:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  },
);

app.listen(5000, "0.0.0.0", () => {
  console.log(`Backend server running on port http://localhost:5000`);
});

export default app;
