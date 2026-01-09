import express from "express";
import createError from "http-errors";
import logger from "morgan";
import cors from "cors";
import fs from "fs";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import activitiesRoutes from "./routes/activitiesRoutes.mjs";
import usersRoutes from "./routes/usersRoutes.mjs";
import mediasRoutes from "./routes/mediasRoutes.mjs";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.mjs"

if (!process.env.SECRET_KEY) {
  throw new Error("SECRET_KEY is missing in environment variables");
}

mongoose
  .connect(process.env.DATABASE_URL)
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

const app = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://track-front.onrender.com']
    : true,
  credentials: true
};

app.use(cors(corsOptions));

app.use("/", () => function (req, res, next) {
  res.send("Bienvenue sur track API. Une API REST pour le tracking d'activités sportives en temps réel, développée avec Node.js, Express et MongoDB. Documentation disponible ici https://track-api-uhxq.onrender.com/api-docs/");
});

const openApiDocument = yaml.load(fs.readFileSync("./openapi.yml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use(logger("dev"));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use("/api/auth", authRoutes)
app.use("/api/activities", activitiesRoutes);
app.use("/api/medias", mediasRoutes);
app.use("/api/users", usersRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});


export default app;
