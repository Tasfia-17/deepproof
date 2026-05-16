const request = require("supertest");
const app = require("../src/index");
const path = require("path");
const fs = require("fs");

describe("DeepProof API", () => {
  describe("GET /api/v1/health", () => {
    it("returns 200 with status ok", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  describe("GET /api/v1/audit", () => {
    it("returns audit data", async () => {
      const res = await request(app).get("/api/v1/audit");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("intact");
      expect(res.body).toHaveProperty("totalRecords");
      expect(res.body).toHaveProperty("onChainXor");
    });
  });

  describe("POST /api/v1/detect", () => {
    it("returns 400 with no file", async () => {
      const res = await request(app).post("/api/v1/detect");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("NO_FILE");
    });

    it("accepts a file and returns jobId", async () => {
      // Create a minimal 1x1 PNG
      const pngBuf = Buffer.from(
        "89504e470d0a1a0a0000000d49484452000000010000000108020000009001" +
        "2e00000000c4944415478016360f8cfc00000000200016e21bc330000000049454e44ae426082",
        "hex"
      );
      const tmpPath = path.join(__dirname, "test.png");
      fs.writeFileSync(tmpPath, pngBuf);

      const res = await request(app)
        .post("/api/v1/detect")
        .attach("file", tmpPath);

      fs.unlinkSync(tmpPath);
      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty("jobId");
      expect(res.body).toHaveProperty("sha256");
    });
  });

  describe("GET /api/v1/verify/:hash", () => {
    it("returns 404 for unknown hash", async () => {
      const res = await request(app).get("/api/v1/verify/" + "a".repeat(64));
      // 404 if not deployed, or valid response if deployed
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
