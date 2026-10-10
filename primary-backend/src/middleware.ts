import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config.js";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    
    let token: string | undefined;

    if (authHeader) {
        const parts = authHeader.split(" ");
        // If it starts with "Bearer ", use parts[1]. Otherwise, use the raw token (parts[0]).
        token = parts.length > 1 ? parts[1] : parts[0];
    }

    if (!token) {
        return res.status(409).json({
            message: "No token provided, you are not logged in"
        });
    }

    try {
        const payload = jwt.verify(token, JWT_PASSWORD);
        // @ts-ignore
        req.id = payload.id;
        next();
    } catch (error) {
        console.log("Failed token:", token);
        return res.status(403).json({
            message: "you are not logged in"
        });
    }
};