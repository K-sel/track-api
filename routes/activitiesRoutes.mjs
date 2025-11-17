import express from "express";

const router = express.Router();

router.get("/", function (req, res, next) {
  res.send("Get from Activites routes");
});

export default router;
