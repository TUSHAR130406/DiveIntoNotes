const express = require("express");
const multer = require("multer");
const path = require("path");

const extractText = require("./extractors/extractText");

const app = express();
const PORT = 8000;



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");// error and where to upload
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });



app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    //  Check file presence
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    
    const extractedText = await extractText(
      req.file.path,
      req.file.mimetype
    );

    res.json({
      message: "File processed successfully",
      filename: req.file.filename,
      totalChunks: extractedText.chunks.length,
      previewChunks: extractedText.chunks.slice(0, 2),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
