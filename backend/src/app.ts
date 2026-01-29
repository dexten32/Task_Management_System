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

const prisma = new PrismaClient();
const app = express();


// Middleware
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://192.168.1.37:3000",
      "http://192.168.1.34:3000",
      "https://tmsync.in",
      "https://www.tmsync.in",
    ], // Allow both frontend URLs
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
console.log("priorityRoutes import:", priorityRoutes);

app.use("/api/priorities", priorityRoutes);
console.log("Priority routes mounted");

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
