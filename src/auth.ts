import * as argon2 from "argon2";


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

