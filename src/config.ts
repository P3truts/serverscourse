import type { MigrationConfig } from "drizzle-orm/migrator";

await process.loadEnvFile();

type APIConfig = {
    fileServerHits: number;
}

type DBConfig = {
    migrationConfig: MigrationConfig;
    dbURL: string;
}

const apiConfig: APIConfig = {
    fileServerHits: 0
}

const migrationConfig: MigrationConfig = {
    migrationsFolder: "./src/db"
}

const dbConfig: DBConfig = {
    dbURL: envOrThrow(process.env.DB_URL),
    migrationConfig: migrationConfig
}

export const config = {
    api: apiConfig,
    db: dbConfig
};

function envOrThrow(key: string | undefined) {
    // console.log(key);
    if (!key) {
        throw Error("Environment key is missing!");
    } else {
        return key;
    }
}
