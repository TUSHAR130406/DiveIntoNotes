function chunkText(text, options = {}) {
    const maxWords = options.maxWords || 400;
    const overlap = options.overlap || 50;

    const words = text
        .replace(/\s+/g, " ")
        .trim()
        .split(" ");

    const chunks = [];
    let start = 0;
    let chunkIndex = 0;

    while (start < words.length) {
        const end = start + maxWords;
        const chunkWords = words.slice(start, end);

        chunks.push({
            chunkIndex,
            text: chunkWords.join(" "),
            wordCount: chunkWords.length
        });

        chunkIndex++;
        start = end - overlap; // overlap for context
        if (start < 0) start = 0;
    }

    return chunks;
}

module.exports = chunkText;
