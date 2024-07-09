require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5003;
const PDF_DIR = path.join(__dirname, "pdfs");

// Create the PDFs directory if it doesn't exist
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR);
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

app.get("/", (req, res) => {
  res.send("Backend Running!");
});

app.post("/convert", async (req, res) => {
  const html = req.body;

  if (!html) {
    return res.status(400).json({ error: "HTML content is required" });
  }

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      timeout: 60000,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 60000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
    });

    await page.close();
    await browser.close();

    const pdfId = uuidv4();
    const pdfPath = path.join(PDF_DIR, `${pdfId}.pdf`);

    fs.writeFileSync(pdfPath, pdfBuffer);

    res.json({ url: `${req.protocol}://${req.get("host")}/pdfs/${pdfId}` });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.get("/pdfs/:id", (req, res) => {
  const pdfPath = path.join(PDF_DIR, `${req.params.id}.pdf`);

  if (fs.existsSync(pdfPath)) {
    res.sendFile(pdfPath);
  } else {
    res.status(404).json({ error: "PDF not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
