import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export const generateText = async (
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
  } = {}
): Promise<AIResponse> => {
  const { model = 'claude-3-5-sonnet-20241022', maxTokens = 4096, temperature = 0.7 } = options;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    return {
      content: content.text,
      usage: response.usage ? {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('AI generation failed. Please try again.');
  }
};

export const generateStructured = async <T>(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<T> => {
  const promptWithInstructions = `${systemPrompt}

IMPORTANT: Your response must be valid JSON only. No markdown, no explanation, no additional text. Just pure JSON.`;

  const result = await generateText(promptWithInstructions, userPrompt, options);
  
  try {
    const parsed = JSON.parse(result.content);
    return parsed as T;
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
};

export const streamText = async (
  systemPrompt: string,
  userPrompt: string,
  onChunk: (chunk: string) => void,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<AIResponse> => {
  const { model = 'claude-3-5-sonnet-20241022', maxTokens = 4096, temperature = 0.7 } = options;

  const stream = await anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let fullContent = '';
  
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      const text = (chunk.delta as { text?: string }).text || '';
      fullContent += text;
      onChunk(text);
    }
  }

  return { content: fullContent };
};

export const fallbackResponse = {
  error: 'AI service is temporarily unavailable. Please try again later.',
  fallback: true,
};