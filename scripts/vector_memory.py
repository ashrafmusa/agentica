import json
import math
import os
from pathlib import Path
from datetime import datetime

# Simple Vector Memory (RAG Simulation)
# Uses basic TF-IDF style similarity for lightweight semantic retrieval

class VectorMemory:
    def __init__(self, storage_path=".Agentica/vector_store.json"):
        self.storage_path = Path(storage_path)
        self.data = self.load()

    def load(self):
        if self.storage_path.exists():
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"documents": [], "vocabulary": {}}

    def save(self):
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2)

    def _tokenize(self, text):
        return set(text.lower().split())

    def add_document(self, id, text, metadata=None):
        tokens = list(self._tokenize(text))
        doc = {
            "id": id,
            "text": text,
            "tokens": tokens,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat()
        }
        self.data["documents"].append(doc)
        self.save()
        print(f"[+] Added document to vector store: {id}")

    def search(self, query, top_k=3):
        query_tokens = self._tokenize(query)
        results = []

        for doc in self.data["documents"]:
            doc_tokens = set(doc["tokens"])
            intersection = query_tokens.intersection(doc_tokens)
            # Simple Jaccard similarity
            score = len(intersection) / len(query_tokens.union(doc_tokens)) if query_tokens.union(doc_tokens) else 0
            results.append((score, doc))

        results.sort(key=lambda x: x[0], reverse=True)
        return results[:top_k]

if __name__ == "__main__":
    vm = VectorMemory()
    # Test
    # vm.add_document("test-1", "How to fix React hooks error")
    print(f"[*] Vector Store contains {len(vm.data['documents'])} documents.")
