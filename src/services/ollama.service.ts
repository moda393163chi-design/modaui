const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export const generateWithOllama = async (prompt: string, model = "llama2") => {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama generate request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.response ?? data[0]?.generated?.[0]?.text ?? "";
};
