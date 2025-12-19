type ApiKeyCandidate = { value?: string; label: string };

const sanitize = (value?: string) => {
  if (!value || value === "undefined") return undefined;
  return value;
};

const mask = (value: string) => (value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : "set");

const readCandidates = (): ApiKeyCandidate[] => [
  { value: typeof process !== "undefined" ? process.env.API_KEY : undefined, label: "API_KEY" },
  { value: typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined, label: "GEMINI_API_KEY" },
  { value: typeof process !== "undefined" ? (process as any).env?.VITE_API_KEY : undefined, label: "VITE_API_KEY" },
  { value: typeof import.meta !== "undefined" ? (import.meta as any).env?.API_KEY : undefined, label: "import.meta.env.API_KEY" },
  { value: typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_API_KEY : undefined, label: "import.meta.env.VITE_API_KEY" },
  { value: typeof import.meta !== "undefined" ? (import.meta as any).env?.GEMINI_API_KEY : undefined, label: "import.meta.env.GEMINI_API_KEY" },
];

export const resolveApiKey = () => {
  const candidates = readCandidates();
  const hit = candidates.find((c) => sanitize(c.value));

  if (!hit) return { key: undefined as string | undefined, hasKey: false, label: "missing", source: undefined };

  const key = sanitize(hit.value)!;
  return {
    key,
    hasKey: true,
    label: mask(key),
    source: hit.label,
  };
};

export const requireApiKey = () => {
  const { key, source } = resolveApiKey();
  if (!key) throw new Error("API key missing. Set API_KEY or GEMINI_API_KEY in your environment before running jusDNCE.");
  return { key, source };
};
