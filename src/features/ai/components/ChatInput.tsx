import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";
import { useSettingsStore } from "../../../stores/settingsStore";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  "What's my plan today?",
  "Why this weight?",
  "I'm feeling sore",
  "Suggest a substitute",
];

export function ChatInput({ onSend, disabled = false }: Props) {
  const [text, setText] = useState("");
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const fire = useCallback(
    (content: string) => {
      if (!content.trim() || disabled) return;
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSend(content.trim());
    },
    [disabled, onSend, hapticsEnabled],
  );

  const handleTextSend = useCallback(() => {
    fire(text);
    setText("");
  }, [text, fire]);

  return (
    <View style={styles.wrapper}>
      {/* Quick prompt chips */}
      <View style={styles.chipsRow}>
        {QUICK_PROMPTS.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => fire(prompt)}
            style={styles.chip}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={prompt}
          >
            <Text style={styles.chipText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>

      {/* Text input + send */}
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask your coach..."
          placeholderTextColor={colors.dark.textMuted}
          style={styles.input}
          multiline
          maxLength={500}
          returnKeyType={Platform.OS === "ios" ? "send" : "default"}
          onSubmitEditing={Platform.OS === "ios" ? handleTextSend : undefined}
          blurOnSubmit={Platform.OS === "ios"}
          editable={!disabled}
          accessibilityLabel="Chat message input"
        />
        <Pressable
          onPress={handleTextSend}
          disabled={!text.trim() || disabled}
          style={[styles.sendButton, (!text.trim() || disabled) && styles.sendButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons
            name="send"
            size={18}
            color={!text.trim() || disabled ? colors.dark.textMuted : "#FFFFFF"}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.dark.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.dark.border,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  chip: {
    backgroundColor: colors.dark.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brand.primary + "40",
    minHeight: 32,
    justifyContent: "center",
  },
  chipText: {
    ...typography.label.sm,
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    ...typography.body.md,
    color: colors.dark.textPrimary,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.dark.surfaceElevated,
  },
});
