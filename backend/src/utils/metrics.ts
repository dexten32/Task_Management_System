import promClient from "prom-client";

// Initialize default Node.js metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics();

// Custom Metrics for background jobs
export const queueJobsTotal = new promClient.Counter({
  name: "queue_jobs_total",
  help: "Total number of background queue jobs processed",
  labelNames: ["job_name", "status"], // status: "success" | "error"
});

export const queueJobDurationSeconds = new promClient.Histogram({
  name: "queue_job_duration_seconds",
  help: "Duration of background queue jobs in seconds",
  labelNames: ["job_name"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30], // Buckets for latency ranges
});

export const metricsRegistry = promClient.register;
