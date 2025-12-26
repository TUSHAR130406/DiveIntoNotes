const extractPdf = require("./extractPdf");
const extractPptx = require("./extractPptx");


async function extractText(filePath, mimetype) {

 
  if (mimetype === "application/pdf") {
    
    return await extractPdf(filePath);
  }

 
  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return await extractPptx(filePath);
  }

 
  throw new Error("Unsupported file type");
}

module.exports = extractText;
