const fs = require("fs");
const JSZip = require("jszip");
const xml2js = require("xml2js");

async function extractPptxText(filePath) {
  // Read the pptx file as binary
  const buffer = fs.readFileSync(filePath);

  // Load zip structure of pptx
  const zip = await JSZip.loadAsync(buffer);

  let fullText = "";

  // Get all slide files
  const slides = Object.keys(zip.files).filter(name =>
    name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
  );

  for (const slide of slides) {
    // Read each slide XML as string
    const xml = await zip.files[slide].async("string");

    // Parse XML into JS object
    const parsed = await xml2js.parseStringPromise(xml);

    // Collect all text nodes (<a:t>)
    const texts = [];
    const walk = node => {
      if (typeof node === "object") {
        for (const key in node) {
          if (key === "a:t" && Array.isArray(node[key])) {
            node[key].forEach(tNode => {
              if (typeof tNode === "string") texts.push(tNode);
            });
          } else if (Array.isArray(node[key])) {
            node[key].forEach(walk);
          } else if (typeof node[key] === "object") {
            walk(node[key]);
          }
        }
      }
    };
    walk(parsed);

    // Join all text from this slide
    fullText += texts.join(" ") + "\n";
  }

  return fullText.trim(); // remove trailing newline
}

module.exports = extractPptxText;
