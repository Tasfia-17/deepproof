const express = require("express");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const { getRecord } = require("../lib/chain");
const router = express.Router();

// GET /api/v1/certificate/:hash
router.get("/:hash", async (req, res, next) => {
  try {
    const record = await getRecord(req.params.hash);
    if (!record || record.timestamp === 0n) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    const verdict = Number(record[3]) === 1 ? "AUTHENTIC" : "SYNTHETIC";
    const confidence = Number(record[4]);
    const timestamp = new Date(Number(record[8]) * 1000).toISOString();
    const verifyUrl = `${process.env.FRONTEND_URL || "https://deepproof.ai"}/verify/${req.params.hash}`;

    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="deepproof-cert-${req.params.hash.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    doc.fontSize(24).text("DeepProof Nexus", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(18).text("Authenticity Certificate", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).text(`Content Hash: ${req.params.hash}`, { width: 500 });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(verdict === "AUTHENTIC" ? "green" : "red").text(`Verdict: ${verdict}`, { width: 500 });
    doc.fillColor("black");
    doc.fontSize(12).text(`Confidence: ${confidence}%`, { width: 500 });
    doc.moveDown(0.5);
    doc.text(`Model: ${record[5]}`, { width: 500 });
    doc.text(`Timestamp: ${timestamp}`, { width: 500 });
    doc.text(`Registrar: ${record[7]}`, { width: 500 });
    doc.moveDown(1);
    doc.text(`Evidence: https://storagescan.0g.ai/tx/${record[9]}`, { width: 500, link: `https://storagescan.0g.ai/tx/${record[9]}` });
    doc.moveDown(2);

    doc.image(qrDataUrl, { fit: [150, 150], align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text("Scan to verify on-chain", { align: "center" });

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
