#!/usr/bin/env python3
import sys
import os
import re
import json
from pathlib import Path
import subprocess # Added import for subprocess
from scripts.vector_memory import VectorMemory

# Initialize Vector Memory (RAG-Enhanced)
vm = VectorMemory()

def get_soul_memory(task_description, k=3):
    """
    Retrieves the top K relevant patterns/decisions from the ReasoningBank
    and formats them as a 'Soul Memory' block for agent injection.
    """
    try:
        soul_block = [
            "## SOUL MEMORY (Semantic RAG & Wisdom)",
            "Based on your past successful decisions, apply these patterns:",
            ""
        ]

        # 2. Get Vector/Semantic results (RAG)
        vector_results = vm.search(task_description, top_k=k)

        # Incorporate Vector Results
        if vector_results:
            soul_block.append("### Semantic Wisdom (Vector Search)")
            soul_block.append("")
            for score, doc in vector_results:
                if score > 0.1: # Threshold for relevance
                    soul_block.append(f"### Pattern: {doc['id']}")
                    soul_block.append(f"- **Wisdom**: {doc['text']}")
                    soul_block.append(f"- **Confidence**: {score:.2f} (Semantic)")
                    soul_block.append("")

        # 1. Get Keyword/TF-IDF similarity from decisions.json (existing logic)
        cmd = ["python", "scripts/reasoning_bank.py", "retrieve", task_description, "--k", str(k)]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            # If there's an error with reasoning_bank.py, still return vector results if any
            if len(soul_block) > 3: # Check if vector results were added beyond initial header
                soul_block.append(f"<!-- Reasoning Bank Retrieval Error: {result.stderr} -->")
                return "\n".join(soul_block)
            else:
                return f"<!-- Soul Retrieval Error: {result.stderr} -->"

        data = json.loads(result.stdout)
        matches = data.get("results", [])

        if matches:
            if len(soul_block) > 3: # If vector results were already added, add a separator
                soul_block.append("### Past Wisdom (Keyword Search)")
                soul_block.append("")
            else: # If no vector results, use the original header for keyword results
                soul_block = [
                    "## SOUL MEMORY (Past Wisdom)",
                    "Based on your past successful decisions, apply these patterns to the current task:",
                    ""
                ]

            for match in matches:
                decision = match.get("decision", "N/A")
                task = match.get("task", "N/A")
                similarity = match.get("similarity", 0)
                soul_block.append(f"### Pattern: {task}")
                soul_block.append(f"- **Wisdom**: {decision}")
                soul_block.append(f"- **Context**: Similarity {similarity:.2f}")
                soul_block.append("")
        elif len(soul_block) <= 3: # If no matches from either source (only initial header)
            return ""

        return "\n".join(soul_block)

    except Exception as e:
        return f"<!-- Soul Injection Failed: {str(e)} -->"

if __name__ == "__main__":
    # Ensure UTF-8 output on Windows
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        print("Usage: python soul_inject.py 'task description'")
        sys.exit(1)

    task = sys.argv[1]
    print(get_soul_memory(task))
