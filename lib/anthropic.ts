import Anthropic from "@anthropic-ai/sdk";

type TextBlock = { type: "text"; text: string };
type ResearchMessage = { role: "user"; content: string };
type ResearchCreateParams = {
  model: string;
  max_tokens: number;
  messages: ResearchMessage[];
};

type ResearchCreateResponse = { content: TextBlock[] };

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

function preferredProvider(): "openai" | "anthropic" {
  const configured = process.env.AI_PROVIDER?.toLowerCase();
  if (configured === "openai" || configured === "anthropic") return configured;
  return process.env.OPENAI_API_KEY ? "openai" : "anthropic";
}

async function createOpenAIMessage(params: ResearchCreateParams): Promise<ResearchCreateResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: params.max_tokens,
      response_format: { type: "json_object" },
      messages: params.messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text content in OpenAI response");
  return { content: [{ type: "text", text }] };
}

export const anthropic = {
  messages: {
    async create(params: ResearchCreateParams): Promise<ResearchCreateResponse> {
      if (preferredProvider() === "openai") return createOpenAIMessage(params);
      const message = await anthropicClient.messages.create(params);
      const content: TextBlock[] = [];
      for (const block of message.content) {
        if (block.type === "text") {
          content.push({ type: "text", text: (block as { text: string }).text });
        }
      }
      return { content };
    },
  },
};

export const RESEARCH_MODEL = preferredProvider() === "openai" ? OPENAI_MODEL : ANTHROPIC_MODEL;
