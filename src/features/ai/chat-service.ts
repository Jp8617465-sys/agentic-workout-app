import { supabase } from "../../lib/supabase";
import { chatRepository } from "./chat-repository";
import type { ChatMessage } from "./chat-repository";

const EDGE_TIMEOUT_MS = 15_000;

export async function sendChatMessage(
  userId: string,
  content: string,
): Promise<ChatMessage> {
  // 1. Persist user message immediately
  const userMsg = chatRepository.insertMessage({ userId, role: "user", content });

  // 2. Load context window (last 20 messages for Claude)
  const contextMessages = chatRepository.getRecentForContext(userId, 20).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // 3. Call edge function
  let assistantContent: string;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error("Not authenticated");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EDGE_TIMEOUT_MS);

    const { data, error } = await supabase.functions.invoke("ai-coach", {
      body: { mode: "chat", userId, messages: contextMessages },
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (error) throw error;
    assistantContent = (data as { response?: string })?.response ?? "I couldn't generate a response. Please try again.";
  } catch (err) {
    const isNetwork = err instanceof Error && (
      err.message.includes("network") ||
      err.message.includes("abort") ||
      err.message.includes("fetch")
    );
    assistantContent = isNetwork
      ? "You appear to be offline. Connect to the internet to chat with your AI coach."
      : "Something went wrong. Please try again in a moment.";
  }

  // 4. Persist assistant message
  const assistantMsg = chatRepository.insertMessage({
    userId,
    role: "assistant",
    content: assistantContent,
  });

  return assistantMsg;
}
