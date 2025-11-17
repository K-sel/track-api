import express from "express";
import createError from "http-errors";
import logger from "morgan";
import activitiesRoutes from "./routes/activitiesRoutes.mjs";
import usersRoutes from "./routes/usersRoutes.mjs";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.mjs"
if (!process.env.SECRET_KEY) {
  throw new Error("SECRET_KEY is missing in environment variables");
}

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log(`✅ MongoDB connecté`))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRoutes)
app.use("/api/activities", activitiesRoutes);
app.use("/users", usersRoutes);

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
