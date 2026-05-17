process.loadEnvFile();
const apiConfig = {
    fileServerHits: 0,
    platform: envOrThrow(process.env.PLATFORM),
    JWTSecret: envOrThrow(process.env.SECRET),
};
const migrationConfig = {
    migrationsFolder: "./src/db"
};
const dbConfig = {
    dbURL: envOrThrow(process.env.DB_URL),
    migrationConfig: migrationConfig
};
export const config = {
    api: apiConfig,
    db: dbConfig
};
function envOrThrow(key) {
    // console.log(key);
    if (!key) {
        throw Error("Environment key is missing!");
    }
    else {
        return key;
    }
}
