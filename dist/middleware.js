import { config } from "./config.js";
export async function middlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        if (res.statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        }
    });
    next();
}
export async function middlewareMetricsInc(req, res, next) {
    console.log("Server Request Hit!");
    config.fileServerHits++;
    next();
}
