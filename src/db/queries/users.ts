import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { NewUser, users } from "../schema.js";

export async function createUser(user: NewUser) {
    // console.log("Apparently NewUser with hashedPassword and not password field!");
    // console.log(user);
    const [result] = await db
        .insert(users)
        .values(user)
        .onConflictDoNothing()
        .returning();

    return result;
}

export async function getUserByEmail(email: string) {
    const [result] = await db.select().from(users).where(eq(users.email, email));

    // console.log(result);
    return result;
}

