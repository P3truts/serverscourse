import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, getBearerToken, hashPassword, makeJWT, validateJWT } from "./auth.js";
describe("Password Hashing", () => {
    const password1 = "correctPassword123!";
    const password2 = "anotherPassword456!";
    let hash1;
    let hash2;
    beforeAll(async () => {
        hash1 = await hashPassword(password1);
        hash2 = await hashPassword(password2);
    });
    it("should return true for the correct password", async () => {
        const result = await checkPasswordHash(password1, hash1);
        expect(result).toBe(true);
    });
    it("should return false for the incorrect password", async () => {
        const result = await checkPasswordHash(password2, hash1);
        expect(result).toBe(false);
    });
    it("should make JWT", async () => {
        const userId = "1234";
        const token = makeJWT(userId, 10000, hash1);
        expect(() => validateJWT(token, hash1)).not.toThrow();
    });
    it("should throw error on invalid token", async () => {
        const invalidToken = "tokenString";
        expect(() => validateJWT(invalidToken, hash1)).toThrow();
    });
    it("should throw error on expired token", async () => {
        const userId = "1234";
        const token = makeJWT(userId, 1, hash1);
        setTimeout(() => {
            expect(() => validateJWT(token, hash1)).toThrow();
        }, 10);
    });
    it("should get bearer token", async () => {
        const req = {
            headers: {
                authorization: "Bearer 12345token"
            },
            get(header) {
                return this.headers[header.toLowerCase()];
            }
        };
        const res = getBearerToken(req);
        expect(res).toBe("12345token");
    });
    it("should throw error on missing auth header", async () => {
        const req = {
            headers: {},
            get(header) {
                return this.headers[header.toLowerCase()];
            }
        };
        expect(() => getBearerToken(req)).toThrow();
    });
    it("should throw error on missing bearer token", async () => {
        const req = {
            headers: {
                authorization: "Password 12345token"
            },
            get(header) {
                return this.headers[header.toLowerCase()];
            }
        };
        expect(() => getBearerToken(req)).toThrow();
    });
});
