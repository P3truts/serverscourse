import express from "express";
import { Request, Response } from "express";
import { middlewareErrorHandler, middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import { config } from "./config.js";
import { BadRequestError, ForbiddenError } from "./error.js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createUser } from "./db/queries/users.js";
import { NewChirp, NewUser } from "./db/schema.js";
import { truncateTable } from "./db/queries/tables.js";
import { createChirp } from "./db/queries/chirps.js";


/// db config
const migrationClient = postgres(config.db.dbURL, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);


/// api config

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
app.post("/admin/reset", (req, res, next) => {
    Promise.resolve(handlerResetMetrics(req, res)).catch(next);
});
app.post("/api/users", (req, res, next) => {
    Promise.resolve(handlerCreateUser(req, res)).catch(next);
});
app.post("/api/chirps", (req, res, next) => {
    Promise.resolve(handlerCreateChirp(req, res)).catch(next);
});


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
    console.log(`Hits: ${config.api.fileServerHits}`);
    res.send(`
        <html>
          <body>
            <h1>Welcome, Chirpy Admin</h1>
            <p>Chirpy has been visited ${config.api.fileServerHits} times!</p>
          </body>
        </html>
    `);
}

async function handlerResetMetrics(req: Request, res: Response) {
    console.log("Reset metrics...");
    config.api.fileServerHits = 0;
    if (config.api.platform !== "dev") {
        throw new ForbiddenError("Not allowed!");
    }
    await truncateTable("users");
    res.send("OK");
}


async function handlerCreateUser(req: Request, res: Response) {
    console.log("Create user...");
    const body = req.body;
    // console.log(body);
    if (!body.email) {
        res.status(400);
        throw new BadRequestError("Email is missing!");
    }
    const newUser = await createUser(body);
    res.status(201);
    sendResponse(res, newUser);
}


async function handlerCreateChirp(req: Request, res: Response) {
    console.log("Create chirp...");
    const body = req.body;
    // console.log(body);
    if (!body.body || !body.userId) {
        res.status(400);
        throw new BadRequestError("Email is missing!");
    }
    validateChirp(body.body);
    //console.log(body);
    const newChirp = await createChirp(body);
    res.status(201);
    sendResponse(res, newChirp);
}


/// private methods

function sendResponse(res: Response, resBody: object = {}) {
    console.log("Send response...");
    res.header("Content-Type", "application/json");
    const body = JSON.stringify(resBody);
    res.send(body);
}

function validateChirp(body: string) {
    console.log("Validate chirp...");
    // console.log(`The body is: `);
    // console.log(body);
    if (body.length > 140) {
        throw new BadRequestError("Chirp is too long. Max length is 140");
    }
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
