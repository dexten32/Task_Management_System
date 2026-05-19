// backend/src/utils/logger.ts

export type LogLevel = "debug" | "info" | "warn" | "error";

class AppLogger {
  private isProd = process.env.NODE_ENV === "production";

  private formatMeta(meta: any[]) {
    if (!meta || meta.length === 0) return undefined;
    if (meta.length === 1) return meta[0];
    return meta;
  }

  private writeLog(level: LogLevel, message: string, ...meta: any[]) {
    const timestamp = new Date().toISOString();
    const formattedMeta = this.formatMeta(meta);

    if (this.isProd) {
      // In production, output structured JSON to stdout/stderr for automated collection
      const logPayload = {
        timestamp,
        level,
        message,
        ...(formattedMeta !== undefined && { meta: formattedMeta }),
      };
      process.stdout.write(JSON.stringify(logPayload) + "\n");
    } else {
      // Colorful human-readable output in development
      const colors = {
        debug: "\x1b[36m", // Cyan
        info: "\x1b[32m",  // Green
        warn: "\x1b[33m",  // Yellow
        error: "\x1b[31m", // Red
        reset: "\x1b[0m",
      };

      const metaString = formattedMeta ? ` | ${JSON.stringify(formattedMeta)}` : "";
      const color = colors[level] || colors.reset;
      console.info(
        `[${timestamp}] ${color}${level.toUpperCase()}${colors.reset}: ${message}${metaString}`
      );
    }
  }

  debug(msg: string, ...meta: any[]) {
    if (!this.isProd) this.writeLog("debug", msg, ...meta);
  }

  info(msg: string, ...meta: any[]) {
    this.writeLog("info", msg, ...meta);
  }

  warn(msg: string, ...meta: any[]) {
    this.writeLog("warn", msg, ...meta);
  }

  error(msg: string, error?: any, ...meta: any[]) {
    const errPayload = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    this.writeLog("error", msg, { error: errPayload, ...meta });
  }
}

export const logger = new AppLogger();
