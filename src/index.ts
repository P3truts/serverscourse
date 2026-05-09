import express from "express";
import { Request, Response } from "express";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import { config } from "./config.js";


/// config

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


app.get("/api/healthz", middlewareLogResponses, middlewareMetricsInc, handlerReadiness);
app.get("/admin/metrics", middlewareLogResponses, handlerMetrics);
app.post("/admin/reset", middlewareLogResponses, handlerResetMetrics);
app.post("/api/validate_chirp", middlewareLogResponses, handlerValidateChirp);


/// endpoints

async function handlerReadiness(req: Request, res: Response) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}

async function handlerMetrics(req: Request, res: Response) {
    res.set("Content-Type", "text/html; charset=utf-8");
    console.log(`Hits: ${config.fileServerHits}`);
    res.send(`
        <html>
          <body>
            <h1>Welcome, Chirpy Admin</h1>
            <p>Chirpy has been visited ${config.fileServerHits} times!</p>
          </body>
        </html>
    `);
}

async function handlerResetMetrics(req: Request, res: Response) {
    console.log("Reset metrics...");
    config.fileServerHits = 0;
    res.send("OK");
}

async function handlerValidateChirp(req: Request, res: Response) {
    console.log("Validate chirp...");
    const body = await readJson(req, res);
    // console.log(`The body is: `);
    // console.log(body);
    if (body.body.length > 140) {
        res.status(400);
        sendResponse(res);
    } else {
        res.status(200);
        sendResponse(res);
    }
}


/// private methods

type requestData = {
    body: string;
};

type validatedData = {
    valid: boolean;
};

type errorResponse = {
    error: string;
};

async function readJson(req: Request, res: Response) {
    let body = ""; // 1. Initialize

    return new Promise<any>((resolve, reject) => {
        // 2. Listen for data events
        req.on("data", (chunk) => {
            body += chunk;
        });

        // 3. Listen for end events
        req.on("end", () => {
            try {
                const parsedBody = JSON.parse(body);
                // now you can use `parsedBody` as a JavaScript object
                // console.log(`The parsed body is: `);
                // console.log(parsedBody);
                resolve(parsedBody);
            } catch (error) {
                res.status(400).send("Invalid JSON");
                reject(error);
            }
        });

        req.on("error", (err) => {
            reject(err);
        });
    });
}

async function sendResponse(res: Response) {
    let respBody;
    if (res.statusCode === 400) {
        respBody = {
            error: "Chirp is too long"
        };
    } else {
        respBody = {
            valid: true
        };
    }
    res.header("Content-Type", "application/json");
    const body = JSON.stringify(respBody);
    res.send(body);
}
