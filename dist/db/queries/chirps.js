import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { chirps } from "../schema.js";
export async function createChirp(chirp) {
    const [result] = await db
        .insert(chirps)
        .values(chirp)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function getChirps() {
    const result = await db.select().from(chirps).orderBy(sql `${chirps.createdAt} ASC`);
    return result;
}
export async function getChirp(id) {
    const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
    return result;
}
