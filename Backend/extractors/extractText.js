const extractPdf = require("./extractPdf");
const extractPptx = require("./extractPptx");
const chunkText=require("../chunking/chunkText.js")


async function extractText(filePath, mimetype) {
  let text=" ";

 
  if (mimetype === "application/pdf") {
    
    text= await extractPdf(filePath);
  }

 
  else if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    text= await extractPptx(filePath);
  }else throw new Error("Unsupported file type");

  const chunks=chunkText(text);
  return{
    fullText:text,
    chunks
  };
  
}

module.exports = extractText;
