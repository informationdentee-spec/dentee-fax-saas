import fs from "fs";
import path from "path";

export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: string;
  context?: Record<string, any>;
}

class Logger {
  private logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(level: LogLevel, message: string, error?: Error, context?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      error: error ? error.message : undefined,
      context,
    };

    // コンソールに出力
    const consoleMessage = `[${timestamp}] [${level}] ${message}${error ? `\nError: ${error.message}\nStack: ${error.stack}` : ""}`;
    if (level === LogLevel.ERROR) {
      console.error(consoleMessage);
    } else if (level === LogLevel.WARN) {
      console.warn(consoleMessage);
    } else {
      console.log(consoleMessage);
    }

    // ファイルに書き込み（非同期）
    const logFileName = `${new Date().toISOString().split("T")[0]}.log`;
    const logFilePath = path.join(this.logDir, logFileName);
    const logLine = JSON.stringify(logEntry) + "\n";

    fs.appendFile(logFilePath, logLine, (err) => {
      if (err) {
        console.error("Failed to write log file:", err);
      }
    });
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.writeLog(LogLevel.ERROR, message, error, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.writeLog(LogLevel.WARN, message, undefined, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.writeLog(LogLevel.INFO, message, undefined, context);
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === "development") {
      this.writeLog(LogLevel.DEBUG, message, undefined, context);
    }
  }
}

export const logger = new Logger();
