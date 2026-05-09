import express from "express";
import { middlewareLogResponses } from "./middleware.js";
const app = express();
const port = 8080;
app.use(express.static("./app"));
app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);
//app.get("/app", (req, res) => {
//    res.sendFile("src/app/logo.png", { root: "./src/app" });
//});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
app.get("/healthz", middlewareLogResponses, handlerReadiness);
async function handlerReadiness(req, resp) {
    resp.set("Content-Type", "text/plain; charset=utf-8");
    resp.send("OK");
}
