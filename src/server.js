const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const analyticsRoutes = require("./routes/analyticsRoutes");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "AI-Based E-Commerce Data Analysis System",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/analytics", analyticsRoutes);

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(port, host, () => {
  console.log(`Server running on ${host}:${port}`);
});
