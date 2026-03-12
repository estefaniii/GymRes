import type { LLMProviderInterface, LLMResponse, GenerateOptions } from "./provider.js";
import { ClaudeProvider } from "./claude.js";
import { GeminiProvider } from "./gemini.js";
import { GroqProvider } from "./groq.js";
import { OpenRouterProvider } from "./openrouter.js";

export type { LLMProviderInterface, LLMResponse, GenerateOptions };

const providers: Record<string, LLMProviderInterface> = {};

function initProviders() {
  const claude = new ClaudeProvider();
  const gemini = new GeminiProvider();
  const groq = new GroqProvider();
  const openrouter = new OpenRouterProvider();

  if (claude.isAvailable()) providers.claude = claude;
  if (gemini.isAvailable()) providers.gemini = gemini;
  if (groq.isAvailable()) providers.groq = groq;
  if (openrouter.isAvailable()) providers.openrouter = openrouter;
}

// ─── Detect fatal (non-retryable) errors that should trigger provider fallback ───
function isFatalProviderError(err: unknown): boolean {
  const msg = (err as any)?.message?.toLowerCase() || "";
  const status = (err as any)?.status;
  // Credit/billing exhausted, auth invalid, account suspended
  if (status === 400 && msg.includes("credit")) return true;
  if (status === 401) return true;   // Invalid API key
  if (status === 403) return true;   // Forbidden / suspended
  if (msg.includes("credit balance")) return true;
  if (msg.includes("billing")) return true;
  if (msg.includes("quota")) return true;
  if (msg.includes("exceeded") && !msg.includes("rate")) return true;
  return false;
}

// ─── Fallback provider: wraps multiple providers, tries next on fatal errors ───
class FallbackProvider implements LLMProviderInterface {
  name: string;
  private chain: LLMProviderInterface[];

  constructor(chain: LLMProviderInterface[]) {
    this.chain = chain;
    this.name = chain.map((p) => p.name).join(" > ");
  }

  isAvailable(): boolean {
    return this.chain.length > 0;
  }

  async generate(prompt: string, systemPrompt?: string, options?: GenerateOptions): Promise<LLMResponse> {
    let lastError: unknown;

    for (const provider of this.chain) {
      try {
        return await provider.generate(prompt, systemPrompt, options);
      } catch (err) {
        lastError = err;
        if (isFatalProviderError(err)) {
          console.log(`  [LLM] ${provider.name} fallo (${(err as Error).message?.slice(0, 60)}), intentando siguiente proveedor...`);
          continue;
        }
        // Non-fatal errors (rate limit already handled inside provider) — rethrow
        throw err;
      }
    }

    throw lastError || new Error("Todos los proveedores LLM fallaron");
  }
}

function buildFallbackChain(priorityKeys: string[]): LLMProviderInterface {
  if (Object.keys(providers).length === 0) initProviders();

  const chain: LLMProviderInterface[] = [];
  for (const key of priorityKeys) {
    if (providers[key]) chain.push(providers[key]);
  }

  if (chain.length === 0) {
    throw new Error("No hay proveedores LLM disponibles. Revisa tus API keys en .env");
  }

  // If only one provider, return directly (no wrapper overhead)
  if (chain.length === 1) return chain[0];
  return new FallbackProvider(chain);
}

export function getProvider(name?: string): LLMProviderInterface {
  if (Object.keys(providers).length === 0) initProviders();
  if (name && providers[name]) return providers[name];
  return buildFallbackChain(["claude", "gemini", "groq", "openrouter"]);
}

export function getFastProvider(): LLMProviderInterface {
  return buildFallbackChain(["groq", "gemini", "claude", "openrouter"]);
}

export function getResearchProvider(): LLMProviderInterface {
  return buildFallbackChain(["claude", "gemini", "openrouter"]);
}

export function listAvailableProviders(): string[] {
  if (Object.keys(providers).length === 0) initProviders();
  return Object.keys(providers);
}

export async function generate(
  prompt: string,
  systemPrompt?: string,
  options?: GenerateOptions & { provider?: string }
): Promise<LLMResponse> {
  const provider = getProvider(options?.provider);
  return provider.generate(prompt, systemPrompt, options);
}
