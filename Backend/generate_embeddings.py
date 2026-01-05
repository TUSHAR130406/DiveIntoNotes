# generate_embeddings.py
import sys
import json
from sentence_transformers import SentenceTransformer

def main():
    # Read input from stdin
    input_data = sys.stdin.read()

    try:
        chunks = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    # Ensure chunks is a list
    if isinstance(chunks, str):
        chunks = [chunks]
    if not isinstance(chunks, list):
        print(json.dumps({"error": "Input must be a list of strings"}))
        sys.exit(1)

    # Clean chunks: keep only non-empty strings
    clean_chunks = []
    for c in chunks:
        if isinstance(c, str) and c.strip():
            clean_chunks.append(c)

    if not clean_chunks:
        print(json.dumps({"error": "No valid text chunks"}))
        sys.exit(1)

    # Load model
    model = SentenceTransformer("all-MiniLM-L6-v2")

    # Encode chunks
    embeddings = model.encode(clean_chunks, show_progress_bar=True).tolist()

    # Output embeddings
    print(json.dumps(embeddings))


if __name__ == "__main__":
    main()
