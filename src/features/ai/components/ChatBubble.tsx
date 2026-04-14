import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";
import type { ChatRole } from "../chat-repository";

interface Props {
  role: ChatRole;
  content: string;
  createdAt: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const ChatBubble = memo(function ChatBubble({ role, content, createdAt }: Props) {
  const isUser = role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.content, isUser ? styles.contentUser : styles.contentAssistant]}>
          {content}
        </Text>
        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAssistant]}>
          {formatTime(createdAt)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  rowUser: {
    alignItems: "flex-end",
  },
  rowAssistant: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: colors.brand.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.dark.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  content: {
    ...typography.body.md,
    lineHeight: 20,
  },
  contentUser: {
    color: "#FFFFFF",
  },
  contentAssistant: {
    color: colors.dark.textPrimary,
  },
  time: {
    ...typography.body.sm,
    fontSize: 10,
    marginTop: 4,
  },
  timeUser: {
    color: "rgba(255,255,255,0.65)",
    textAlign: "right",
  },
  timeAssistant: {
    color: colors.dark.textMuted,
  },
});
