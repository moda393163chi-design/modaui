import OpenAI from "openai";

export const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "MY_OPENAI_API_KEY") {
    throw new Error("OPENAI_API_KEY not configured");
  }
  return new OpenAI({ apiKey });
};

export const generateWithOpenAI = async (prompt: string, model = "gpt-4") => {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }]
  });
  return response.choices?.[0]?.message?.content ?? "";
};
