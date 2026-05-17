import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { BadRequestError } from "./error.js";
import { Request } from "express";


export async function hashPassword(password: string): Promise<string> {
    try {
        const hashedPassword = await argon2.hash(password);
        return hashedPassword;
    } catch (err) {
        throw Error(`Argon2 hash failed with error: ${err}`);
    }
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    try {
        const isValid = await argon2.verify(hash, password);
        return isValid;
    } catch (err) {
        throw Error(`Argon2 password verification failed with error: ${err}`);
    }
}

export function makeJWT(userId: string, expiresIn: number, secret: string): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload: Payload = {
        iss: "chirpy",
        sub: userId,
        iat: issuedAt,
        exp: issuedAt + expiresIn
    }
    const token = jwt.sign(payload, secret);
    return token;
}

export function validateJWT(tokenString: string, secret: string): string {
    try {
        const decoded = jwt.verify(tokenString, secret);
        return decoded.sub as string;
    } catch (err) {
        throw Error(`Validating JWT token failed with error: ${err}`);
    }
}

export function getBearerToken(req: Request): string {
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

/// types

type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;
