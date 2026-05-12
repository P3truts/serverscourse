import { config } from "./config.js";
import { BadRequestError, ForbiddenError } from "./error.js";
import { createUser, getUserByEmail } from "./db/queries/users.js";
import { truncateTable } from "./db/queries/tables.js";
import { createChirp, getChirp, getChirps } from "./db/queries/chirps.js";
import { checkPasswordHash, hashPassword } from "./auth.js";
export async function handlerReadiness(req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}
export async function handlerMetrics(req, res) {
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
export async function handlerResetMetrics(req, res) {
    console.log("Reset metrics...");
    config.api.fileServerHits = 0;
    if (config.api.platform !== "dev") {
        throw new ForbiddenError("Not allowed!");
    }
    await truncateTable("users");
    res.send("OK");
}
export async function handlerCreateUser(req, res) {
    console.log("Create user...");
    const body = req.body;
    // console.log(body);
    if (!body.email || !body.password) {
        res.status(400);
        throw new BadRequestError("Email or password is missing!");
    }
    //validatePassword(body.password);
    const hashedPass = await hashPassword(body.password);
    // console.log(hashedPass);
    const preUser = { email: body.email, hashedPassword: hashedPass };
    const { hashedPassword, ...safeUser } = await createUser(preUser);
    // console.log(hashedPassword);
    res.status(201);
    sendResponse(res, safeUser);
}
export async function handlerChirps(req, res) {
    console.log("Get chirps...");
    const chirps = await getChirps();
    res.status(200);
    sendResponse(res, chirps);
}
export async function handlerCreateChirp(req, res) {
    console.log("Create chirp...");
    const body = req.body;
    // console.log(body);
    if (!body.body || !body.userId) {
        res.status(400);
        throw new BadRequestError("Email is missing!");
    }
    validateChirp(body.body);
    //console.log(body);
    const preChirp = { body: body.body, userId: body.userId };
    const newChirp = await createChirp(preChirp);
    res.status(201);
    sendResponse(res, newChirp);
}
export async function handlerChirp(req, res) {
    console.log("Get chirp...");
    const chirpId = req.params.id;
    const chirp = await getChirp(chirpId);
    if (chirp) {
        res.status(200);
    }
    else {
        res.status(404);
    }
    sendResponse(res, chirp);
}
export async function handlerLogin(req, res) {
    console.log("Login user...");
    const body = req.body;
    if (!body.email || !body.password) {
        res.status(400);
        throw new BadRequestError("Email or password is missing!");
    }
    const { hashedPassword, ...safeUser } = await getUserByEmail(body.email);
    // console.log(hashedPassword);
    // console.log(body.password);
    const isValidPassword = await checkPasswordHash(body.password, hashedPassword);
    if (isValidPassword) {
        res.status(200);
        sendResponse(res, safeUser);
    }
    else {
        res.status(401);
        sendResponse(res, { error: "Incorrect email or password" });
    }
}
/// private methods
function sendResponse(res, resBody = {}) {
    console.log("Send response...");
    res.header("Content-Type", "application/json");
    const body = JSON.stringify(resBody);
    res.send(body);
}
function validateChirp(body) {
    console.log("Validate chirp...");
    // console.log(`The body is: `);
    // console.log(body);
    if (body.length > 140) {
        throw new BadRequestError("Chirp is too long. Max length is 140");
    }
}
function cleanBody(body) {
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
function validatePassword(password) {
    if (password.length < 10) {
        throw new BadRequestError("Password is too short. Must be minimum 10 characters!");
    }
    else if (!([...password].some(char => /[A-Z]/.test(char)))) {
        throw new BadRequestError("Password must contain at least a capital letter!");
    }
    else if (!([...password].some(char => /\d/.test(char)))) {
        throw new BadRequestError("Password must contain at least a digit!");
    }
    else if (!([...password].some(char => /[^a-zA-Z0-9]/.test(char)))) {
        throw new BadRequestError("Password must contain at least a special character!");
    }
}
