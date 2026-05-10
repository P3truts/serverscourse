import express from "express";
import { Request, Response } from "express";
import { middlewareErrorHandler, middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import { config } from "./config.js";
import { BadRequestError } from "./error.js";


/// config

const app = express();
const port = 8080;

app.use(express.static("./app"));
app.use(express.json());
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);

//app.get("/app", (req, res) => {
//    res.sendFile("src/app/logo.png", { root: "./src/app" });
//});

app.get("/api/healthz", middlewareLogResponses, middlewareMetricsInc, handlerReadiness);
app.get("/admin/metrics", middlewareLogResponses, handlerMetrics);
app.post("/admin/reset", middlewareLogResponses, handlerResetMetrics);
//app.post("/api/validate_chirp", middlewareLogResponses, handlerValidateChirp);
app.post("/api/validate_chirp", (req, res, next) => {
    Promise.resolve(handlerValidateChirp(req, res)).catch(next);
})

app.use(middlewareErrorHandler);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


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
    const body = req.body;
    // console.log(`The body is: `);
    // console.log(body);
    if (body.body.length > 140) {
        res.status(400);
        throw new BadRequestError("Chirp is too long. Max length is 140");
    } else {
        const cleanedBody = cleanBody(body.body);
        res.status(200);
        sendResponse(res, cleanedBody);
    }
}


/// private methods

function sendResponse(res: Response, cleanedBody: string = "") {
    let respBody;
    if (res.statusCode === 400) {
        respBody = {
            error: "Chirp is too long"
        };
    } else {
        respBody = {
            cleanedBody: cleanedBody
        };
    }
    res.header("Content-Type", "application/json");
    const body = JSON.stringify(respBody);
    res.send(body);
}

function cleanBody(body: string) {
    let bodyWords = body.split(" ");
    for (const index in bodyWords) {
        const lowerWord = bodyWords[index].toLowerCase();
        // console.log(lowerWord);
        if (lowerWord === "kerfuffle" || lowerWord === "sharbert" || lowerWord === "fornax") {
            bodyWords[index] = "****";
            // console.log(bodyWords);
        }
    }

    return bodyWords.join(" ");
}
