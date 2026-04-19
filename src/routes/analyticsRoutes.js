const express = require("express");
const { listQueries, executeQuery } = require("../services/analyticsService");

const router = express.Router();

router.get("/queries", (_req, res) => {
  res.json({
    queries: listQueries()
  });
});

router.get("/:key", async (req, res) => {
  try {
    const payload = await executeQuery(req.params.key);
    res.json(payload);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to execute query."
    });
  }
});

module.exports = router;
