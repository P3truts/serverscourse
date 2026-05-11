import type { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();

type APIConfig = {
    fileServerHits: number;
    platform: string;
}

type DBConfig = {
    migrationConfig: MigrationConfig;
    dbURL: string;
}

type appConfig = {
    api: APIConfig;
    db: DBConfig;
}

const apiConfig: APIConfig = {
    fileServerHits: 0,
    platform: envOrThrow(process.env.PLATFORM)
}

const migrationConfig: MigrationConfig = {
    migrationsFolder: "./src/db"
}

const dbConfig: DBConfig = {
    dbURL: envOrThrow(process.env.DB_URL),
    migrationConfig: migrationConfig
}

export const config: appConfig = {
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
