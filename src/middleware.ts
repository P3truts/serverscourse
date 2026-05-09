import { Request, Response } from "express";

export async function middlewareLogResponses(req: Request, res: Response, next: Function) {
    res.on("finish", () => {
        if (res.statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        }
    });
    next();
}
