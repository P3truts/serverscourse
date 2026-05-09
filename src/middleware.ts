import { Request, Response } from "express";
import { config } from "./config.js";

export async function middlewareLogResponses(req: Request, res: Response, next: Function) {
    res.on("finish", () => {
        if (res.statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        }
    });
    next();
}

export async function middlewareMetricsInc(req: Request, res: Response, next: Function) {
    console.log("Server Request Hit!");
    config.fileServerHits++;
    next();
}
