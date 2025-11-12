export interface KnowledgeAtomSource {
  atomId: string;
  path: string;
  marker: string;
  hash: string;
}

const KNOWLEDGE_DOC = "docs/# Phase 4 – Expert Brain with examples.txt";

export const KNOWLEDGE_ATOM_HASHES: KnowledgeAtomSource[] = [
  {
    atomId: "KA-PROD-01",
    path: KNOWLEDGE_DOC,
    marker: "#### [KA-PROD-01]",
    hash: "4ba93d907f6b8af53c146e12281c0332fa20818cc8ae3c7be4c49f35819491ff",
  },
  {
    atomId: "KA-FNA-02",
    path: KNOWLEDGE_DOC,
    marker: "#### [KA-FNA-02]",
    hash: "246db84d014af6430e6f508e3a170d8ea0d15892bef0bbd35d1639be54780753",
  },
  {
    atomId: "KA-ETH-01",
    path: KNOWLEDGE_DOC,
    marker: "#### [KA-ETH-01]",
    hash: "6a51b80aa1381800ba708a0266fed54cb2441f61752fb382760f05f89bdf4d2a",
  },
  {
    atomId: "KA-PSY-05",
    path: KNOWLEDGE_DOC,
    marker: "### KA-PSY-05",
    hash: "b05e9f0809cc1f823acd1529cac6becbeac1a4c5faa4c40e0bccb6292fae1c8f",
  },
];
