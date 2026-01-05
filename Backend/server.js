const express = require("express");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const extractText = require("./extractors/extractText");
//const getEmbedding = require("./extractors/embedding"); // embedding function
const { spawn } = require("child_process");

const app = express();
app.use(express.json())
;const PORT = 8000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const memoryStore = [];

async function getLocalEmbeddings(chunks) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["./generate_embeddings.py"]);

    let output = "";
    py.stdout.on("data", (data) => {
      output += data.toString();
    });

    py.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    py.on("close", (code) => {
      if (code !== 0) return reject(`Python exited with ${code}`);
      resolve(JSON.parse(output));
    });

    // Send chunks to Python stdin
    py.stdin.write(JSON.stringify(chunks));
    py.stdin.end();
  });
}



app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const extractedData = await extractText(req.file.path, req.file.mimetype);
    const rawChunks = extractedData.chunks;

// FORCE chunks to be only non-empty strings
const chunks = rawChunks
  .map(c => {
    if (typeof c === "string") return c;
    if (typeof c === "object" && c.text) return c.text;
    return null;
  })
  .filter(c => typeof c === "string" && c.trim().length > 0);


    // Get embeddings from local Python model
    const embeddings = await getLocalEmbeddings(chunks);

    const embeddedChunks = chunks.map((chunk, i) => ({
  text: chunk,
  embedding: embeddings[i],
  originalFileName: req.file.originalname,
  storedFileName: req.file.filename,
}));


    // Store in memory (for now)
    memoryStore.push(...embeddedChunks);//... add chunks individually and not altogether as a list

    res.json({
      message: "File processed successfully",
      filename: req.file.filename,
      totalChunks: chunks.length,
      previewChunks: chunks.slice(0, 2),
      previewEmbeddings: embeddedChunks.slice(0, 2).map(c => c.embedding.length),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// app.post("/query", async (req, res) => {
//   try {
//     const { query } = req.body;

//     if (!query) {
//       return res.status(400).json({ error: "Query is required" });
//     }

//     // 1. Get embedding for query
//     const [queryEmbedding] = await getLocalEmbeddings([query]);

//     let bestMatch = null;
//     let bestScore = -1;

//     // 2. Compare with all stored chunks
//     for (const item of memoryStore) {
//       const score = cosineSimilarity(queryEmbedding, item.embedding);

//       if (score > bestScore) {
//         bestScore = score;
//         bestMatch = item;
//       }
//     }

//     // 3. Return best chunk
//     res.json({
//       query,
//       similarity: bestScore,
//       chunkText: bestMatch.text
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });


function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
// function normalizeText(text) {
//   return text
//     .replace(/\r/g, "")
//     .replace(/\s+/g, " ")
//     .replace(/\n+/g, "\n")
//     .trim();
// }

// function splitByLines(text) {
//   return text
//     .split("\n")
//     .map(l => l.trim())
//     .filter(l => l.length > 0);
// }

// function splitByAnchors(line) {
//   return line
//     .split(/(?=\d{2}-\d{2}-\d{4})|(?=\d+\.)|(?=•)|(?=- )/)
//     .map(s => s.trim())
//     .filter(Boolean);
// }

// function splitByWordCount(text, maxWords = 40) {
//   const words = text.split(" ");
//   const parts = [];

//   for (let i = 0; i < words.length; i += maxWords) {
//     parts.push(words.slice(i, i + maxWords).join(" "));
//   }

//   return parts;
// }

// function adaptiveSentenceSplit(text) {
//   const normalized = normalizeText(text);
//   const lines = splitByLines(normalized);

//   let units = [];

//   for (const line of lines) {
//     const anchored = splitByAnchors(line);

//     for (const part of anchored) {
//       if (part.split(" ").length > 40) {
//         units.push(...splitByWordCount(part));
//       } else {
//         units.push(part);
//       }
//     }
//   }

//   return units.filter(u => u.length > 5);
// }


// function centeredExpansion(sentences, scores, bestIdx, bestScore) {
//   let left = bestIdx - 1;
//   let right = bestIdx + 1;

//   const selected = [
//     { index: bestIdx, text: sentences[bestIdx], score: bestScore }
//   ];

//   // Expand left
//   while (left >= 0) {
//     const score = scores[left];

//     if (score >= MIN_SIM || (bestScore - score) <= DELTA) {
//       selected.unshift({
//         index: left,
//         text: sentences[left],
//         score
//       });
//       left--;
//     } else {
//       break;
//     }
//   }

//   // Expand right
//   while (right < sentences.length) {
//     const score = scores[right];

//     if (score >= MIN_SIM || (bestScore - score) <= DELTA) {
//       selected.push({
//         index: right,
//         text: sentences[right],
//         score
//       });
//       right++;
//     } else {
//       break;
//     }
//   }

//   return selected;
// }

function splitIntoSentences(text) {
  const clean = text
    .replace(/\s+/g, " ")
    .trim();

  return clean
    // split BEFORE date patterns like 06-11-2025
    .split(/(?=\d{2}-\d{2}-\d{4})|(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}



app.post("/query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // 1. Get embedding for query
    const [queryEmbedding] = await getLocalEmbeddings([query]);

    let bestMatch = null;
    let bestScore = -1;

    // 2. Compare with all stored chunks
    for (const item of memoryStore) {
      const score = cosineSimilarity(queryEmbedding, item.embedding);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }
     

    //snetence refinement
    // 1. Split top chunk into sentences
const sentences = splitIntoSentences(bestMatch.text);

// 2. Embed sentences (on the fly)
const sentenceEmbeddings = await getLocalEmbeddings(sentences);

// 3. Find most relevant sentence(s)
let bestSentence = null;
let bestSentenceScore = -1;
let bestSentenceIdx = -1;
const sentenceScores = [];



for (let i = 0; i < sentences.length; i++) {
  const score = cosineSimilarity(queryEmbedding, sentenceEmbeddings[i]);

  if (score > bestSentenceScore) {
    bestSentenceScore = score;
    bestSentence = sentences[i];
    sentenceScores[i]=score;

        bestSentenceIdx = i;

  }
}

// const expandedSentences = centeredExpansion(
//   sentences,
//   sentenceScores,
//   bestSentenceIdx,
//   bestSentenceScore
// );

// const finalAnswer = expandedSentences
//   .map(s => s.text)
//   .join(" ");



    // 3. Return best chunk
    res.json({
  query,
  chunkSimilarity: bestScore,
  sentenceSimilarity: bestSentenceScore,
  fileName: bestMatch.originalFileName, 
  relevantText:bestSentence,
  context: bestMatch.text
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