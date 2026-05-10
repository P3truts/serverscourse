import { config } from "./config.js";
import { BadRequestError } from "./error.js";
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
    config.api.fileServerHits++;
    next();
}
export async function middlewareErrorHandler(error, req, res, next) {
    console.log(error);
    if (error instanceof (BadRequestError)) {
        res.status(400).json({
            error: error.message
        });
    }
    else {
        res.status(500).json({
            error: "Something went wrong on our end"
        });
    }
    next();
}
