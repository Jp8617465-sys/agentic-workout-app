import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "./useAuth";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

export function AuthScreen() {
  const navigation = useNavigation();
  const { session, loading, error, signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-dismiss if already signed in
  if (!loading && session) {
    navigation.goBack();
    return null;
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password, name.trim());
      } else {
        await signIn(email.trim(), password);
      }
      if (!error) navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Cloud Sync</Text>
        <Text style={styles.subtitle}>
          Your workouts are already saved locally. Sign in to back them up and access AI coaching.
        </Text>

        {/* Mode toggle */}
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setIsSignUp(false)}
            style={[styles.toggleOption, !isSignUp && styles.toggleOptionActive]}
          >
            <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsSignUp(true)}
            style={[styles.toggleOption, isSignUp && styles.toggleOptionActive]}
          >
            <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>
              Create Account
            </Text>
          </Pressable>
        </View>

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={colors.dark.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.dark.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.dark.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              {isSignUp ? "Create Account" : "Sign In"}
            </Text>
          )}
        </Pressable>

        <Text style={styles.offlineNote}>
          The app works fully offline without an account.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: "flex-end",
  },
  cancelText: {
    ...typography.body.md,
    color: colors.brand.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  title: {
    ...typography.heading.h1,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.dark.surface,
    borderRadius: 8,
    padding: 4,
    marginTop: 8,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  toggleOptionActive: {
    backgroundColor: colors.brand.primary,
  },
  toggleText: {
    ...typography.label.md,
    color: colors.dark.textSecondary,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...typography.body.md,
    color: colors.dark.textPrimary,
  },
  errorBox: {
    backgroundColor: colors.semantic.danger + "20",
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    ...typography.body.sm,
    color: colors.semantic.danger,
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
  offlineNote: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    textAlign: "center",
  },
});
