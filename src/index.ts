import express from "express";
import { Request, Response } from "express";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import { config } from "./config.js";

const app = express();
const port = 8080;

app.use(express.static("./app"));
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);

//app.get("/app", (req, res) => {
//    res.sendFile("src/app/logo.png", { root: "./src/app" });
//});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


app.get("/healthz", middlewareLogResponses, middlewareMetricsInc, handlerReadiness);
app.get("/metrics", middlewareLogResponses, handlerMetrics);
app.get("/reset", middlewareLogResponses, handlerResetMetrics);


async function handlerReadiness(req: Request, res: Response) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}

async function handlerMetrics(req: Request, res: Response) {
    console.log(`Hits: ${config.fileServerHits}`);
    res.send(`Hits: ${config.fileServerHits}`);
}

async function handlerResetMetrics(req: Request, res: Response) {
    console.log("Reset metrics...");
    config.fileServerHits = 0;
    res.send("OK");
}
