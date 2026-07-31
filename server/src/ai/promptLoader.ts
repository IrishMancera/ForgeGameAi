import fs from 'fs';
import path from 'path';

const promptCache: Map<string, string> = new Map();

export function loadPrompt(fileName: string): string {
  if (promptCache.has(fileName)) {
    return promptCache.get(fileName)!;
  }

  const promptPath = path.join(process.cwd(), 'server', 'src', 'ai', 'prompts', fileName);
  try {
    if (fs.existsSync(promptPath)) {
      const content = fs.readFileSync(promptPath, 'utf-8');
      promptCache.set(fileName, content);
      return content;
    }
  } catch {
    // Fallback if path relative resolution differs in production
  }

  const fallbackPath = path.join(__dirname, 'prompts', fileName);
  if (fs.existsSync(fallbackPath)) {
    const content = fs.readFileSync(fallbackPath, 'utf-8');
    promptCache.set(fileName, content);
    return content;
  }

  return `System prompt for ${fileName}`;
}
