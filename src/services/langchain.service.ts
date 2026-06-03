import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const createLangChainAgent = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY not configured for LangChain agent");
  }
  return new ChatGoogleGenerativeAI({
    apiKey,
    model: "gemini-pro"
  });
};
