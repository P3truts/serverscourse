import { sql } from "drizzle-orm";
import { db } from "../index.js";

export async function truncateTable(tableName: string) {
    const [result] = await db.execute(sql.raw(`TRUNCATE TABLE ${tableName} CASCADE;`));
    return result;
}
