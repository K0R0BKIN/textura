const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-4o-mini';
const MAX_DEFINITION_CHARS = 58;

function clampDefinition(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_DEFINITION_CHARS) return normalized;
  const truncated = normalized.slice(0, MAX_DEFINITION_CHARS - 1).trimEnd();
  return `${truncated}…`;
}

function stripCodeFences(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;

  const payloadRecord = payload as Record<string, unknown>;

  const outputText = payloadRecord.output_text;
  if (typeof outputText === 'string') return outputText;

  const output = payloadRecord.output;
  if (!Array.isArray(output)) return null;

  const chunks: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const type = (part as Record<string, unknown>).type;
      const text = (part as Record<string, unknown>).text;
      if (type === 'output_text' && typeof text === 'string') {
        chunks.push(text);
      }
    }
  }

  if (chunks.length === 0) return null;
  return chunks.join('\n');
}

function summarizeOpenAiPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  const status = typeof record.status === 'string' ? record.status : null;
  const error = record.error;

  const output = record.output;
  const outputSummary = Array.isArray(output)
    ? output.map((item) => {
        if (!item || typeof item !== 'object') {
          return { type: null as string | null, contentTypes: [] as string[] };
        }

        const itemRecord = item as Record<string, unknown>;
        const itemType =
          typeof itemRecord.type === 'string' ? itemRecord.type : null;
        const content = itemRecord.content;
        const contentTypes = Array.isArray(content)
          ? content
              .map((part) =>
                part && typeof part === 'object'
                  ? (part as Record<string, unknown>).type
                  : null,
              )
              .filter((type): type is string => typeof type === 'string')
          : [];

        return { type: itemType, contentTypes };
      })
    : null;

  return { status, error, outputSummary };
}

function coerceTerms(body: unknown) {
  if (!body || typeof body !== 'object') return [];
  const terms = (body as Record<string, unknown>).terms;
  if (!Array.isArray(terms)) return [];

  const normalized = terms
    .filter((term): term is string => typeof term === 'string')
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
    .slice(0, 6);

  return Array.from(new Set(normalized));
}

function coerceJsonBody(body: unknown) {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function buildSchema(terms: string[]) {
  const properties: Record<string, unknown> = {};
  for (const term of terms) {
    properties[term] = {
      type: 'string',
      maxLength: MAX_DEFINITION_CHARS,
    };
  }

  return {
    type: 'object',
    properties,
    required: terms,
    additionalProperties: false,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).send('Missing OPENAI_API_KEY');
  }

  const body = coerceJsonBody(req.body);
  if (body === null) {
    return res.status(400).send('Invalid JSON body');
  }

  const terms = coerceTerms(body);
  if (terms.length === 0) {
    return res.status(200).json({ definitions: {} });
  }

  const inputText = `Return JSON only. For each term, write a concise definition (≤ ${MAX_DEFINITION_CHARS} chars). Terms: ${terms.join(', ')}`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input: inputText,
      max_output_tokens: 256,
      text: {
        format: {
          type: 'json_schema',
          name: 'definitions',
          schema: buildSchema(terms),
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    return res.status(502).send(errorText || 'OpenAI request failed');
  }

  const payload = (await response.json()) as unknown;
  const summary = summarizeOpenAiPayload(payload);

  if (process.env.NODE_ENV !== 'production') {
    console.debug('OpenAI payload summary', summary);
  }

  if (summary?.status && summary.status !== 'completed') {
    return res
      .status(502)
      .send(`OpenAI response not completed (${summary.status})`);
  }

  const outputText = extractOutputText(payload);

  if (!outputText) {
    return res.status(502).send('OpenAI produced no output text');
  }

  const normalizedOutput = stripCodeFences(outputText);
  if (process.env.NODE_ENV !== 'production') {
    console.debug('OpenAI raw output', normalizedOutput);
  }

  const definitions: Record<string, string> = {};

  const tryParseJson = () => {
    try {
      const parsed = JSON.parse(normalizedOutput);
      if (parsed && typeof parsed === 'object') {
        for (const [key, value] of Object.entries(
          parsed as Record<string, unknown>,
        )) {
          if (typeof value !== 'string') continue;
          const cleaned = clampDefinition(value);
          if (cleaned.length === 0) continue;
          const lowerKey = key.trim().toLowerCase();
          definitions[lowerKey] = cleaned;
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('OpenAI JSON parse failed', error);
      }
    }
  };

  tryParseJson();

  if (Object.keys(definitions).length === 0) {
    const heuristics = parseKeyValueLines(normalizedOutput);
    for (const [key, value] of Object.entries(heuristics)) {
      if (!definitions[key]) {
        definitions[key] = value;
      }
    }
  }

  const canonicalDefinitions: Record<string, string> = {};
  const lowerToTerm = new Map<string, string>();
  for (const term of terms) {
    lowerToTerm.set(term.toLowerCase(), term);
  }

  for (const [lowerKey, value] of Object.entries(definitions)) {
    const term = lowerToTerm.get(lowerKey);
    if (term) {
      canonicalDefinitions[term] = value;
    }
  }

  if (Object.keys(canonicalDefinitions).length === 0) {
    return res.status(502).send('OpenAI returned no definitions');
  }

  return res.status(200).json({ definitions: canonicalDefinitions });
}

function parseKeyValueLines(text: string) {
  const map = {} as Record<string, string>;
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^([^:—–-]+)[:—–-]\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const value = clampDefinition(match[2].trim());
    if (key && value) {
      map[key] = value;
    }
  }
  return map;
}
