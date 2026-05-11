import express from "express";
import { Request, Response } from "express";
import { middlewareErrorHandler, middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import { config } from "./config.js";
import { BadRequestError, ForbiddenError } from "./error.js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createUser } from "./db/queries/users.js";
import { NewUser } from "./db/schema.js";
import { truncateTable } from "./db/queries/tables.js";


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
//app.post("/api/validate_chirp", middlewareLogResponses, handlerValidateChirp);
app.post("/api/validate_chirp", (req, res, next) => {
    Promise.resolve(handlerValidateChirp(req, res)).catch(next);
});
app.post("/api/users", (req, res, next) => {
    Promise.resolve(handlerCreateUser(req, res)).catch(next);
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

async function handlerValidateChirp(req: Request, res: Response) {
    console.log("Validate chirp...");
    const body = req.body;
    // console.log(`The body is: `);
    // console.log(body);
    if (body.body.length > 140) {
        res.status(400);
        throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    const cleanedBody = { cleanedBody: cleanBody(body.body) };
    res.status(200);
    sendResponse(res, cleanedBody);
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


/// private methods

function sendResponse(res: Response, resBody: object = {}) {
    res.header("Content-Type", "application/json");
    const body = JSON.stringify(resBody);
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
