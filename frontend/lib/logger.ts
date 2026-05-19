// frontend/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class TelemetryLogger {
  private isProduction = process.env.NODE_ENV === 'production';

  private logToTelemetry(level: LogLevel, message: string, meta?: any) {
    if (this.isProduction) {
      // In production, send log to monitoring service (Sentry, custom API, etc.)
      // Example: Sentry.captureMessage(message, { level, extra: meta });
    }
  }

  debug(message: string, ...meta: any[]) {
    if (!this.isProduction) {
      console.debug(`%c[DEBUG] %c${message}`, "color: #7f8c8d; font-weight: bold;", "", ...meta);
    }
  }

  info(message: string, ...meta: any[]) {
    if (!this.isProduction) {
      console.log(`%c[INFO] %c${message}`, "color: #3498db; font-weight: bold;", "", ...meta);
    } else {
      this.logToTelemetry('info', message, meta);
    }
  }

  warn(message: string, ...meta: any[]) {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, ...meta);
    } else {
      this.logToTelemetry('warn', message, meta);
    }
  }

  error(message: string, error?: Error, ...meta: any[]) {
    if (!this.isProduction) {
      console.error(`[ERROR] ${message}`, error, ...meta);
    } else {
      this.logToTelemetry('error', message, { error: error?.message, stack: error?.stack, ...meta });
    }
  }
}

export const logger = new TelemetryLogger();
