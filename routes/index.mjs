import express from "express";

const router = express.Router();

router.get("/", function (req, res, next) {
  res.send("Welcome on Track-API, A academic Node/Express Project!");
});

export default router;
