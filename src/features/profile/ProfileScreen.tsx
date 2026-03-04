import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

export function ProfileScreen() {
  const { name, experienceLevel, trainingGoal, unitSystem, setUser } =
    useUserStore();
  const {
    hapticsEnabled,
    defaultRestSeconds,
    setHapticsEnabled,
    setDefaultRestSeconds,
  } = useSettingsStore();

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "IT";

  return (
    <View style={styles.container}>
      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{name || "Trainer"}</Text>
        <Text style={styles.level}>
          {experienceLevel} | {trainingGoal.replace(/_/g, " ")}
        </Text>
      </View>

      {/* Unit System */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setUser({ unitSystem: "metric" })}
            style={[
              styles.toggleOption,
              unitSystem === "metric" && styles.toggleOptionActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                unitSystem === "metric" && styles.toggleTextActive,
              ]}
            >
              Metric (kg)
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setUser({ unitSystem: "imperial" })}
            style={[
              styles.toggleOption,
              unitSystem === "imperial" && styles.toggleOptionActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                unitSystem === "imperial" && styles.toggleTextActive,
              ]}
            >
              Imperial (lbs)
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Haptics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.dark.textSecondary} />
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: colors.dark.surfaceElevated, true: colors.brand.primary + "80" }}
            thumbColor={hapticsEnabled ? colors.brand.primary : colors.dark.textMuted}
          />
        </View>
      </View>

      {/* Default Rest Timers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Rest Timers</Text>
        <RestTimerRow
          label="Compound"
          seconds={defaultRestSeconds.compound}
          onDecrease={() =>
            setDefaultRestSeconds(
              "compound",
              Math.max(30, defaultRestSeconds.compound - 15),
            )
          }
          onIncrease={() =>
            setDefaultRestSeconds(
              "compound",
              Math.min(600, defaultRestSeconds.compound + 15),
            )
          }
        />
        <RestTimerRow
          label="Isolation"
          seconds={defaultRestSeconds.isolation}
          onDecrease={() =>
            setDefaultRestSeconds(
              "isolation",
              Math.max(15, defaultRestSeconds.isolation - 15),
            )
          }
          onIncrease={() =>
            setDefaultRestSeconds(
              "isolation",
              Math.min(300, defaultRestSeconds.isolation + 15),
            )
          }
        />
        <RestTimerRow
          label="Cardio"
          seconds={defaultRestSeconds.cardio}
          onDecrease={() =>
            setDefaultRestSeconds(
              "cardio",
              Math.max(0, defaultRestSeconds.cardio - 15),
            )
          }
          onIncrease={() =>
            setDefaultRestSeconds(
              "cardio",
              Math.min(120, defaultRestSeconds.cardio + 15),
            )
          }
        />
      </View>
    </View>
  );
}

function RestTimerRow({
  label,
  seconds,
  onDecrease,
  onIncrease,
}: {
  label: string;
  seconds: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const display = s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`;

  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={onDecrease} style={styles.stepperButton} hitSlop={8}>
          <Ionicons name="remove" size={18} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.stepperValue}>{display}</Text>
        <Pressable onPress={onIncrease} style={styles.stepperButton} hitSlop={8}>
          <Ionicons name="add" size={18} color={colors.dark.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    paddingTop: 56,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...typography.heading.h2,
    color: "#FFFFFF",
  },
  name: {
    ...typography.heading.h2,
    color: colors.dark.textPrimary,
    marginTop: 12,
  },
  level: {
    ...typography.body.md,
    color: colors.dark.textMuted,
    textTransform: "capitalize",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.dark.surface,
    borderRadius: 8,
    padding: 4,
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
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingLabel: {
    ...typography.body.md,
    color: colors.dark.textPrimary,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    ...typography.numeric.sm,
    color: colors.dark.textPrimary,
    minWidth: 40,
    textAlign: "center",
  },
});
