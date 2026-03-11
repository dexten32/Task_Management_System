import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "../config/redis";

// Unauthenticated Global Limiter: 1000 requests per 15 minutes (rolling window, per IP)
const unauthGlobalRateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "global_unauth_limit",
    points: 1000,
    duration: 15 * 60, // Per 15 minutes
});

// Authenticated Global Limiter: 1500 requests per 15 minutes (rolling window, per User ID)
const authGlobalRateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "global_auth_limit",
    points: 1500,
    duration: 15 * 60, // Per 15 minutes
});

// Auth Route Limiter: 10 requests per 15 minutes (rolling window, per IP)
const authRateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "auth_limit",
    points: 10,
    duration: 15 * 60,
});

export const globalLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reqUser = req.user as any;

        // If the request is authenticated, use the authenticated limiter against their User ID
        if (reqUser?.id) {
            await authGlobalRateLimiter.consume(reqUser.id);
        } else {
            // Unauthenticated requests are limited by IP address against the 1000-req limit
            const key = req.ip || req.socket.remoteAddress || "unknown_ip";
            await unauthGlobalRateLimiter.consume(key);
        }

        next();
    } catch (error) {
        res.status(429).json({ message: "Too many requests, please try again later." });
    }
};

export const authLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = req.ip || req.socket.remoteAddress || "unknown_ip";
        await authRateLimiter.consume(key);
        next();
    } catch (error: any) {
        let retryAfterMs = 0;
        if (error && error.msBeforeNext) {
            retryAfterMs = error.msBeforeNext;
        } else {
            // Fallback to 15 minutes if not available
            retryAfterMs = 15 * 60 * 1000;
        }
        res.status(429).json({
            message: "Too many authentication attempts, please try again later.",
            retryAfterMs: retryAfterMs
        });
    }
};
