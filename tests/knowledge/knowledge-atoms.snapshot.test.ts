import { readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { KNOWLEDGE_ATOM_HASHES } from "../fixtures/knowledge-atom-hashes.ts";

const HEADING_PATTERN = /\n(###|####) (\[?KA-[A-Z]+-\d+)/;

function extractAtomBlock(content: string, marker: string): string {
  const start = content.indexOf(marker);
  if (start === -1) {
    throw new Error(`Marker ${marker} not found`);
  }
  const remainder = content.slice(start);
  const tail = remainder.slice(marker.length);
  const matchIndex = tail.search(HEADING_PATTERN);
  const end = matchIndex === -1 ? remainder.length : marker.length + matchIndex;
  return remainder.slice(0, end).trim();
}

function hashBlock(block: string): string {
  return createHash("sha256").update(block).digest("hex");
}

describe("knowledge atom snapshots", () => {
  for (const entry of KNOWLEDGE_ATOM_HASHES) {
    it(`keeps ${entry.atomId} aligned with source text`, () => {
      const absolutePath = path.resolve(process.cwd(), entry.path);
      const content = readFileSync(absolutePath, "utf8");
      const block = extractAtomBlock(content, entry.marker);
      expect(hashBlock(block)).toBe(entry.hash);
    });
  }
});
