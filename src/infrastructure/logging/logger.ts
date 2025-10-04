import { getEnvironment } from "../environment";
import { getRequestId } from "./request-context";

export enum LogLevel {
	DEBUG = "DEBUG",
	INFO = "INFO",
	WARN = "WARN",
	ERROR = "ERROR",
	CRITICAL = "CRITICAL",
}

export interface LogContext {
	[key: string]: unknown;
}

const SENSITIVE_KEYS = [
	"access_token",
	"accessToken",
	"refresh_token",
	"refreshToken",
	"password",
	"secret",
	"key",
	"token",
	"auth",
	"authorization",
	"bearer",
	"api_key",
	"apiKey",
	"client_secret",
	"clientSecret",
	"private_key",
	"privateKey",
	"session",
	"cookie",
	"credentials",
	"jwt",
];

function sanitizeValue(value: unknown): unknown {
	if (value === null || value === undefined) {
		return value;
	}

	if (typeof value === "string") {
		try {
			const toJSON = JSON.parse(value);
			return sanitizeValue(toJSON);
		} catch (_: unknown) {
			return value;
		}
	}

	if (Array.isArray(value)) {
		return value.map(sanitizeValue);
	}

	if (typeof value === "object") {
		const sanitized: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			const lowerKey = key.toLowerCase();
			const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
				lowerKey.includes(sensitiveKey.toLowerCase())
			);

			if (isSensitive) {
				sanitized[key] = "[REDACTED]";
			} else {
				(sanitized[key] as unknown) = sanitizeValue(val);
			}
		}
		return sanitized;
	}

	return value;
}

function sanitizeMessage(message: string): string {
	// Redact common token patterns in messages
	return message
		.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, "Bearer [REDACTED]")
		.replace(/token[=:]\s*[A-Za-z0-9\-._~+/]+=*/gi, "token=[REDACTED]")
		.replace(/key[=:]\s*[A-Za-z0-9\-._~+/]+=*/gi, "key=[REDACTED]")
		.replace(/password[=:]\s*\S+/gi, "password=[REDACTED]");
}

class Logger {
	private static instance: Logger;
	private functionName: string;
	private logLevel: LogLevel;

	private constructor(functionName: string = "unknown") {
		this.functionName = functionName;
		const env = getEnvironment();
		this.logLevel = 'INFO' as LogLevel;
	}

	public static getInstance(functionName?: string): Logger {
		if (
			!Logger.instance ||
			(functionName && Logger.instance.functionName !== functionName)
		) {
			Logger.instance = new Logger(functionName);
		}
		return Logger.instance;
	}

	private formatMessage(level: string, message: string, context?: LogContext): string {
		const sanitizedMessage = sanitizeMessage(message);
		const contextStr = context ? ` ${JSON.stringify(sanitizeValue(context))}` : "";
		const requestId = getRequestId();
		const requestIdPart = requestId !== "no-request-id" ? `[req:${requestId.substring(0, 8)}]` : "";

		return `[${this.functionName}] ${requestIdPart} ${sanitizedMessage}${contextStr}`;
	}

	private shouldLog(level: LogLevel): boolean {
		const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
		const currentLevelIndex = levels.indexOf(this.logLevel);
		const messageLevelIndex = levels.indexOf(level);
		return messageLevelIndex >= currentLevelIndex;
	}

	public debug(message: string, context?: LogContext): void {
		if (!this.shouldLog(LogLevel.DEBUG)) return;
		console.debug(this.formatMessage("DEBUG", message, context));
	}

	public info(message: string, context?: LogContext): void {
		if (!this.shouldLog(LogLevel.INFO)) return;
		console.info(this.formatMessage("INFO", message, context));
	}

	public warn(message: string, context?: LogContext): void {
		if (!this.shouldLog(LogLevel.WARN)) return;
		console.warn(this.formatMessage("WARN", message, context));
	}

	public error(
		message: string,
		error?: Error | unknown,
		context?: LogContext,
	): void {
		const errorContext = error instanceof Error
			? { error: error.message, stack: error.stack, ...context }
			: { ...(error ? { error: String(error) } : {}), ...context };

		if (!this.shouldLog(LogLevel.ERROR)) return;
		console.error(this.formatMessage("ERROR", message, errorContext));
	}

	public critical(
		message: string,
		error?: Error | unknown,
		context?: LogContext,
	): void {
		const errorContext = error instanceof Error
			? { error: error.message, stack: error.stack, ...context }
			: { error: String(error), ...context };

		if (!this.shouldLog(LogLevel.CRITICAL)) return;
		console.error(this.formatMessage("CRITICAL", message, errorContext));
	}

	public setFunctionName(functionName: string): void {
		this.functionName = functionName;
	}
}

export function createLogger(functionName: string): Logger {
	return Logger.getInstance(functionName);
}

export default Logger;
