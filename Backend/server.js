const express = require("express");
const multer = require("multer");
const cors = require("cors");

const path = require("path");
require("dotenv").config();
const extractText = require("./extractors/extractText");
//const getEmbedding = require("./extractors/embedding"); // embedding function
// const { spawn } = require("child_process");
const { askGeminiFromContext } = require("./llm/geminiClient");
const { askGeminiGeneral } = require("./llm/generalgemini");

const { randomUUID } = require("crypto");

const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const auth = require("./middleware/auth");

const Document = require("./models/Document");
const Chunk = require("./models/Chunk");
const fs = require("fs");


const app = express();
app.use(express.json());
app.use(cors());


app.use("/auth", authRoutes);
// What this line means

// It maps your router:

// router.post("/signup")
// router.post("/login")

const PORT = 8000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = randomUUID() + ext;
    cb(null, uniqueName);
  },
});


const upload = multer({ storage });


// async function getLocalEmbeddings(chunks) {
//   return new Promise((resolve, reject) => {
//     const py = spawn("python3", ["./generate_embeddings.py"]);

//     let output = "";
//     py.stdout.on("data", (data) => {
//       output += data.toString();
//     });

//     py.stderr.on("data", (data) => {
//       console.error("Python error:", data.toString());
//     });

//     py.on("close", (code) => {
//       if (code !== 0) return reject(`Python exited with ${code}`);
//       resolve(JSON.parse(output));
//     });

//     // Send chunks to Python stdin
//     py.stdin.write(JSON.stringify(chunks));
//     py.stdin.end();
//   });
// }

async function getLocalEmbeddings(texts) {
  const response = await fetch("http://127.0.0.1:5000/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts })
  });

  if (!response.ok) {
    throw new Error("Embedding service failed");
  }

  const data = await response.json();
  return data.embeddings;
}


app.post("/upload",auth, upload.single("file"), async (req, res) => {
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


//     // Get embeddings from local Python model
    const embeddings = await getLocalEmbeddings(chunks);

//     const embeddedChunks = chunks.map((chunk, i) => ({
//   text: chunk,
//   embedding: embeddings[i],
//   originalFileName: req.file.originalname,
//   storedFileName: req.file.filename,
// }));


//     // Store in memory (for now)
//     memoryStore.push(...embeddedChunks);//... add chunks individually and not altogether as a list

// Create Document record, we now replace emmeory store the above commented one was befpre
const document = await Document.create({
  userId: req.userId,
  originalFileName: req.file.originalname,
  storedFileName: req.file.filename,
  mimeType: req.file.mimetype
});

// 2️ Prepare Chunk documents
const chunkDocs = chunks.map((chunk, i) => ({
  userId: req.userId,
  documentId: document._id,
  text: chunk,
  embedding: embeddings[i]
}));


await Chunk.insertMany(chunkDocs);





    res.json({
      message: "File processed successfully",
      documentId: document._id,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      totalChunks: chunks.length,
      previewChunks: chunks.slice(0, 2),
      embeddingSize: embeddings[0]?.length || 0
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


function centeredExpansion(sentences, scores, bestIdx, bestScore) {
  let left = bestIdx - 1;
  let right = bestIdx + 1;

  const selected = [
    { index: bestIdx, text: sentences[bestIdx], score: bestScore }
  ];
  
    const DELTA = 0.12;
    const min_sim= 0.4;

  // Expand left
  while (left >= 0) {
    const score = scores[left];

    if ( score>=min_sim && (bestScore - score) <= DELTA) {
      selected.unshift({
        index: left,
        text: sentences[left],
        score
      });
      left--;
    } else {
      break;
    }
  }

  // Expand right
  while (right < sentences.length) {
    const score = scores[right];

    if ( score>=min_sim && (bestScore - score) <= DELTA) {
      selected.push({
        index: right,
        text: sentences[right],
        score
      });
      right++;
    } else {
      break;
    }
  }

  return selected;
}

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

// const EXISTENCE_THRESHOLD = 0.18;
 const TOP_K_CHUNKS = 3;



// app.post("/query",auth, async (req, res) => {
//   try {
//     const { query } = req.body;

//     if (!query) {
//       return res.status(400).json({ error: "Query is required" });
//     }

//     // 1. Get embedding for query
//     const [queryEmbedding] = await getLocalEmbeddings([query]);

//     // let bestMatch = null;
//     // let bestScore = -1;

// const chunks = await Chunk.find({ userId: req.userId });
//  if (chunks.length === 0) {
//       return res.json({
//         confidence: "low",
//         message: "No notes found for this user."
//       });
//     }

//     const rankedChunks = chunks
//       .map(chunk => ({
//         ...chunk.toObject(),
//         similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
//       }))
//       .sort((a, b) => b.similarity - a.similarity);

//     const topChunks = rankedChunks.slice(0, TOP_K_CHUNKS);
//     const bestChunkScore = topChunks[0].similarity;
    
//       if (bestChunkScore < EXISTENCE_THRESHOLD) {
//       return res.json({
//         confidence: "low",
//         similarity: bestChunkScore,
//         message:
//           "This topic does not appear in your notes. Do you want to consult external AI?"
//       });
//     }




//    const document = await Document.findById(topChunks[0].documentId);


//     //snetence refinement
//     // 1. Split top chunk into sentences
// const sentences = splitIntoSentences(chunk.text);

// // 2. Embed sentences (on the fly)
// const sentenceEmbeddings = await getLocalEmbeddings(sentences);

// // 3. Find most relevant sentence(s)
// let bestSentence = null;
// let bestSentenceScore = -1;
// let bestSentenceIdx = -1;
// const sentenceScores = [];



// for (let i = 0; i < sentences.length; i++) {
//   const score = cosineSimilarity(queryEmbedding, sentenceEmbeddings[i]);
//   sentenceScores[i]=score;

//   if (score > bestSentenceScore) {
//     bestSentenceScore = score;
//     bestSentence = sentences[i];

//         bestSentenceIdx = i;

//   }
// }

// const expandedSentences = centeredExpansion(
//   sentences,
//   sentenceScores,
//   bestSentenceIdx,
//   bestSentenceScore
// );

// const finalAnswer = expandedSentences
//   .map(s => s.text)
//   .join(" ");


//     const geminiContext = topChunks.map(c => c.text).join("\n\n");
    
//    const answer = await askGeminiFromContext({
//       query,
//       context: geminiContext
//     });


//     // 3. Return best chunk
//     // CONFIDENCE CHECK
// if (bestSentenceScore < CONFIDENCE_THRESHOLD) {
//   return res.json({
//     confidence: "low",
//     query,
// fileName: document.originalFileName,
//     chunkSimilarity: bestScore,
//     sentenceSimilarity: bestSentenceScore,
//     sourceChunk: bestMatch.text,
//     context: bestMatch.text,
//     message:
//       "Your notes may not fully cover this question. Do you want to consult an external AI using only your notes?"
//   });
// }

// // HIGH CONFIDENCE RESPONSE
// return res.json({
//   confidence: "high",
//   query,
//   fileName: document.originalFileName,
//   chunkSimilarity: bestScore,
//   sentenceSimilarity: bestSentenceScore,
//   answer: finalAnswer,
//   sourceChunk: bestMatch.text
// });





//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });



///queryupdated
app.post("/query", auth, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // 1️⃣ Embed query
    const [queryEmbedding] = await getLocalEmbeddings([query]);

    // 2️⃣ Fetch user chunks
    const chunks = await Chunk.find({ userId: req.userId });
    if (chunks.length === 0) {
      return res.json({
        confidence: "low",
        message: "No notes found for this user."
      });
    }

    // 3️⃣ Rank chunks (still needed for shortlisting)
    const rankedChunks = chunks
      .map(chunk => ({
        ...chunk.toObject(),
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity);

    // 4️⃣ Take top-K (NO threshold)
    const topChunks = rankedChunks.slice(0, TOP_K_CHUNKS);

    const geminiContext = topChunks
      .map(c => c.text)
      .join("\n\n");

    // 5️⃣ Ask Gemini to VALIDATE + ANSWER
    const geminiResult = await askGeminiFromContext({
      query,
      context: geminiContext
    });

    // ❌ OLD: similarity threshold decision
    // ✅ NEW: Gemini-based decision
    if (!geminiResult.found) {
      return res.json({
        confidence: "low",
        context: topChunks
          .slice(0, 2)
          .map(c => c.text)
          .join("\n\n"),
        message:
          "Your notes do not contain this information. Do you want to consult external AI?"
      });
    }

    // 6️⃣ Sentence refinement (UNCHANGED, UI-only)
    const baseChunk = topChunks[0];
    const sentences = splitIntoSentences(baseChunk.text);

    const sentenceEmbeddings = await getLocalEmbeddings(sentences);

    const sentenceScores = sentences.map((s, i) =>
      cosineSimilarity(queryEmbedding, sentenceEmbeddings[i])
    );

    const bestSentenceIdx = sentenceScores.indexOf(
      Math.max(...sentenceScores)
    );

    const expandedSentences = centeredExpansion(
      sentences,
      sentenceScores,
      bestSentenceIdx,
      sentenceScores[bestSentenceIdx]
    );

    const evidenceSentences = expandedSentences.map(s => s.text);

    // 7️⃣ Fetch source filename
    const document = await Document.findById(baseChunk.documentId);

    // 8️⃣ Final response (FOUND IN NOTES)
    return res.json({
      confidence: "high",               // 🔥 semantic confidence
      answer: geminiResult.answer,      // 🔥 Gemini answer
      evidence: evidenceSentences,
      source: document?.originalFileName
    });

  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Query failed" });
  }
});





/// document list
app.get("/documents", auth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.userId })
      .sort({ uploadedAt: -1 })
      .select("_id originalFileName uploadedAt");

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

///download a document
app.get("/documents/:id/download", auth, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!doc) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(__dirname, "uploads", doc.storedFileName);

    res.download(filePath, doc.originalFileName);
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});

//delete query
app.delete("/documents/:id", auth, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    //  Delete all chunks for this document
    await Chunk.deleteMany({ documentId: doc._id });

   //  Delete document record
    await Document.deleteOne({ _id: doc._id });

    res.json({ message: "Document deleted successfully" });




    //  Delete file from disk
    const filePath = path.join(__dirname, "uploads", doc.storedFileName);
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("File already missing:", filePath);
    }

    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});






app.post("/query/llm", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Query is required"
      });
    }

    const answer = await askGeminiGeneral({ query });

    return res.json({
      source: "external_ai",
      answer
    });

  } catch (err) {
    console.error("External Gemini error:", err);

    return res.status(500).json({
      error: err.message || "External AI failed"
    });
  }
});






app.get("/", (req, res) => {
  res.send("Backend is running");
});

connectDB();


app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});