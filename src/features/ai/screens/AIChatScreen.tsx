import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  Alert,
  Pressable,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../../stores/userStore";
import { chatRepository } from "../chat-repository";
import { sendChatMessage } from "../chat-service";
import { ChatBubble } from "../components/ChatBubble";
import { ChatInput } from "../components/ChatInput";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";
import type { ChatMessage } from "../chat-repository";

export function AIChatScreen() {
  const userId = useUserStore((s) => s.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlashList<ChatMessage>>(null);

  useEffect(() => {
    if (!userId) return;
    const task = InteractionManager.runAfterInteractions(() => {
      const history = chatRepository.getMessages(userId, 50);
      setMessages(history);
    });
    return () => task.cancel();
  }, [userId]);

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!userId || isLoading) return;

      // Optimistic user message
      const tempMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        userId,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);
      setIsLoading(true);

      setTimeout(scrollToBottom, 50);

      try {
        // sendChatMessage persists user message + calls Claude + persists response
        const assistantMsg = await sendChatMessage(userId, text);

        // Replace temp with persisted version + add assistant response
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempMsg.id);
          // Reload from SQLite to get the persisted user message with real id
          const refreshed = chatRepository.getMessages(userId, 50);
          return refreshed;
        });
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      } finally {
        setIsLoading(false);
        setTimeout(scrollToBottom, 50);
      }
    },
    [userId, isLoading, scrollToBottom],
  );

  const handleClearHistory = useCallback(() => {
    if (!userId) return;
    Alert.alert("Clear Chat", "Remove all chat history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          chatRepository.clearHistory(userId);
          setMessages([]);
        },
      },
    ]);
  }, [userId]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles" size={20} color={colors.brand.primary} />
          <Text style={styles.headerTitle}>AI Coach</Text>
        </View>
        <Pressable onPress={handleClearHistory} hitSlop={8} accessibilityLabel="Clear chat history">
          <Ionicons name="trash-outline" size={20} color={colors.dark.textMuted} />
        </Pressable>
      </View>

      {/* Message list */}
      {messages.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.dark.textMuted} />
          <Text style={styles.emptyTitle}>Ask your coach anything</Text>
          <Text style={styles.emptySubtitle}>
            Get guidance on programming, exercise form, recovery, and more.
          </Text>
        </View>
      ) : (
        <FlashList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble role={item.role} content={item.content} createdAt={item.createdAt} />
          )}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToBottom}
        />
      )}

      {/* Typing indicator */}
      {isLoading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
          <Text style={styles.typingText}>Coach is thinking...</Text>
        </View>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.dark.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    ...typography.heading.h3,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.body.md,
    color: colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
  },
});
