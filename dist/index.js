import express from "express";
import { middlewareErrorHandler, middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import { config } from "./config.js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { handlerReadiness, handlerChirps, handlerCreateChirp, handlerCreateUser, handlerMetrics, handlerResetMetrics, handlerChirp } from "./handlers.js";
/// db config
const migrationClient = postgres(config.db.dbURL, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);
/// api start config
const app = express();
const port = 8080;
app.use(express.static("./app"));
app.use(express.json());
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);
//app.get("/app", (req, res) => {
//    res.sendFile("src/app/logo.png", { root: "./src/app" });
//});
/// endpoints
// admin
app.get("/api/healthz", middlewareLogResponses, middlewareMetricsInc, handlerReadiness);
app.get("/admin/metrics", middlewareLogResponses, handlerMetrics);
app.post("/admin/reset", (req, res, next) => {
    Promise.resolve(handlerResetMetrics(req, res)).catch(next);
});
// users
app.post("/api/users", (req, res, next) => {
    Promise.resolve(handlerCreateUser(req, res)).catch(next);
});
// chirps
app.get("/api/chirps", middlewareLogResponses, handlerChirps);
app.get("/api/chirps/:id", middlewareLogResponses, handlerChirp);
app.post("/api/chirps", (req, res, next) => {
    Promise.resolve(handlerCreateChirp(req, res)).catch(next);
});
/// api end config
app.use(middlewareErrorHandler);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
