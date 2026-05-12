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
import { createChirp, getChirp, getChirps } from "./db/queries/chirps.js";


export async function handlerReadiness(req: Request, res: Response) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}

export async function handlerMetrics(req: Request, res: Response) {
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

export async function handlerResetMetrics(req: Request, res: Response) {
    console.log("Reset metrics...");
    config.api.fileServerHits = 0;
    if (config.api.platform !== "dev") {
        throw new ForbiddenError("Not allowed!");
    }
    await truncateTable("users");
    res.send("OK");
}

export async function handlerCreateUser(req: Request, res: Response) {
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

export async function handlerChirps(req: Request, res: Response) {
    console.log("Get chirps...");
    const chirps = await getChirps();
    res.status(200);
    sendResponse(res, chirps);
}

export async function handlerCreateChirp(req: Request, res: Response) {
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

export async function handlerChirp(req: Request, res: Response) {
    console.log("Get chirp...");
    const chirpId = req.params.id as string;
    const chirp = await getChirp(chirpId);
    if (chirp) {
        res.status(200);
    } else {
        res.status(404);
    }
    sendResponse(res, chirp);
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
