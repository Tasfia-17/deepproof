require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const logger = require("./lib/logger");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMIT_EXCEEDED" },
});
app.use("/api/", limiter);

// API key auth (skip in dev)
app.use("/api/v1", (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    const key = req.headers["x-api-key"];
    if (!key) return res.status(401).json({ error: "API_KEY_REQUIRED" });
  }
  next();
});

app.use("/api/v1/upload",      require("./routes/upload"));
app.use("/api/v1/detect",      require("./routes/detect"));
app.use("/api/v1/verify",      require("./routes/verify"));
app.use("/api/v1/nodes",       require("./routes/nodes"));
app.use("/api/v1/lineage",     require("./routes/lineage"));
app.use("/api/v1/certificate", require("./routes/certificate"));
app.use("/api/v1/audit",       require("./routes/audit"));
app.use("/api/v1/health",      require("./routes/health"));

try {
  const spec = YAML.load(path.join(__dirname, "../openapi.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));
} catch (_) {}

app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.status || 500).json({ error: err.code || "INTERNAL_ERROR", message: err.message });
});

app.listen(PORT, () => logger.info(`DeepProof API on port ${PORT}`));
module.exports = app;
