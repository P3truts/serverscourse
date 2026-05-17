import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { BadRequestError } from "./error.js";
export async function hashPassword(password) {
    try {
        const hashedPassword = await argon2.hash(password);
        return hashedPassword;
    }
    catch (err) {
        throw Error(`Argon2 hash failed with error: ${err}`);
    }
}
export async function checkPasswordHash(password, hash) {
    try {
        const isValid = await argon2.verify(hash, password);
        return isValid;
    }
    catch (err) {
        throw Error(`Argon2 password verification failed with error: ${err}`);
    }
}
export function makeJWT(userId, expiresIn, secret) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = {
        iss: "chirpy",
        sub: userId,
        iat: issuedAt,
        exp: issuedAt + expiresIn
    };
    const token = jwt.sign(payload, secret);
    return token;
}
export function validateJWT(tokenString, secret) {
    try {
        const decoded = jwt.verify(tokenString, secret);
        return decoded.sub;
    }
    catch (err) {
        throw Error(`Validating JWT token failed with error: ${err}`);
    }
}
export function getBearerToken(req) {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
        throw new BadRequestError("Authorization header is missing!");
    }
    if (!authHeader.startsWith("Bearer")) {
        throw new BadRequestError("Bearer token is missing!");
    }
    const tokenString = authHeader.split(" ")[1];
    console.log(tokenString);
    return tokenString;
}
