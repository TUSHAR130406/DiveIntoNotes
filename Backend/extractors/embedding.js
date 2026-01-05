// const OpenAI=require("openai");
// const openai=new OpenAI({apiKey:process.env.__KEY__});

// async function getEmbedding(text) {
//   try {
//     const response = await openai.embeddings.create({
//       model: "text-embedding-3-small",
//       input: text
//     });
//     return response.data[0].embedding;
//   } catch (err) {
//     console.error("Embedding generation failed:", err);
//     throw err;
//   }
// }

// module.exports=getEmbedding;