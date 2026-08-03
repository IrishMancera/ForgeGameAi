export interface RAGDocument {
  id: string;
  projectId: string;
  workspace: string;
  fileType: 'DOCX' | 'TXT' | 'XLSX' | 'PDF' | 'CSV' | 'JSON' | 'Markdown' | 'GDD';
  title: string;
  content: string;
  chunks: RAGChunk[];
  createdAt: string;
}

export interface RAGChunk {
  id: string;
  documentId: string;
  projectId: string;
  workspace: string;
  fileType: string;
  snippet: string;
  vector: number[];
  metadata: Record<string, unknown>;
}

class RAGEngine {
  private documentStore: Map<string, RAGDocument> = new Map();
  private chunkIndex: RAGChunk[] = [];

  constructor() {
    this.seedDefaultKnowledgeBase();
  }

  private seedDefaultKnowledgeBase(): void {
    const defaultDocs: Array<{ title: string; type: RAGDocument['fileType']; workspace: string; content: string }> = [
      {
        title: 'Haunted Hotel - Core Economy & Gacha Blueprint',
        type: 'DOCX',
        workspace: 'economy-lab',
        content: `Haunted Hotel economy relies on Gold (soft currency) and Gem Shards (premium currency). Gold sink includes Room Upgrades (Tier 1 to Tier 10) and Staff Training. Gem Shards buy Energy Refills and Spirit Keys for Gacha Summons. Drop rate for Legendary Spirits is 1.5% with a pity counter at 80 summons. Target soft-to-hard currency conversion ratio is 100 Gold : 1 Gem.`,
      },
      {
        title: 'Player Progression & Level Curves',
        type: 'XLSX',
        workspace: 'progression',
        content: `Level XP progression curve formula: XP_Required = 100 * (Level ^ 1.85). Max level cap is 60. Content unlocks: Tier 2 Rooms at Level 5, Boss Raids at Level 15, PvP Arena at Level 25. Average play-time to max level is 45 days for casual players and 18 days for hardcore players.`,
      },
      {
        title: 'Player Motivation Archetype Audit',
        type: 'Markdown',
        workspace: 'player-psychology',
        content: `Bartle archetype distribution for Haunted Hotel: Achievers (40%), Explorers (30%), Socializers (20%), Killers (10%). Stamina pressure should be capped at 120 units with 6-minute recharge rate to prevent player burnout while maintaining D1 retention target of 45%.`,
      },
    ];

    for (const doc of defaultDocs) {
      this.indexDocument('default-project', doc.title, doc.type, doc.workspace, doc.content);
    }
  }

  public indexDocument(
    projectId: string,
    title: string,
    fileType: RAGDocument['fileType'],
    workspace: string,
    content: string
  ): RAGDocument {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const chunks = this.chunkText(content, 200, 40).map((snippet, idx) => ({
      id: `${docId}-chunk-${idx}`,
      documentId: docId,
      projectId,
      workspace,
      fileType,
      snippet,
      vector: this.computeSimpleVector(snippet),
      metadata: { title, chunkIndex: idx },
    }));

    const document: RAGDocument = {
      id: docId,
      projectId,
      workspace,
      fileType,
      title,
      content,
      chunks,
      createdAt: new Date().toISOString(),
    };

    this.documentStore.set(docId, document);
    this.chunkIndex.push(...chunks);
    return document;
  }

  public search(query: string, projectId?: string, workspace?: string, topK: number = 4): RAGChunk[] {
    const queryVector = this.computeSimpleVector(query);
    const queryTerms = query.toLowerCase().split(/\s+/);

    return this.chunkIndex
      .filter((chunk) => {
        if (projectId && chunk.projectId !== 'default-project' && chunk.projectId !== projectId) return false;
        if (workspace && chunk.workspace !== workspace) return true; // Prefer workspace, fallback if needed
        return true;
      })
      .map((chunk) => {
        const similarity = this.cosineSimilarity(queryVector, chunk.vector);
        const keywordBonus = queryTerms.reduce((score, term) => {
          return chunk.snippet.toLowerCase().includes(term) ? score + 0.15 : score;
        }, 0);
        return { chunk, score: similarity + keywordBonus };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.chunk);
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let i = 0;

    while (i < words.length) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) chunks.push(chunk);
      i += chunkSize - overlap;
    }
    return chunks.length > 0 ? chunks : [text];
  }

  private computeSimpleVector(text: string): number[] {
    const vec = new Array(32).fill(0);
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (let i = 0; i < clean.length; i++) {
      const charCode = clean.charCodeAt(i);
      vec[i % 32] += charCode;
    }
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vec.map((val) => val / norm);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }
}

export const ragEngine = new RAGEngine();
