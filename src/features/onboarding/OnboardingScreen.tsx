import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { ExperienceLevel, TrainingGoal, Equipment } from "../../types";

type OnboardingStep = "goals" | "experience" | "equipment" | "frequency";

const TRAINING_GOALS: { value: TrainingGoal; label: string; icon: string }[] = [
  { value: "strength", label: "Build Strength", icon: "barbell" },
  { value: "hypertrophy", label: "Build Muscle", icon: "body" },
  { value: "endurance", label: "Improve Endurance", icon: "heart" },
  { value: "general_fitness", label: "General Fitness", icon: "fitness" },
  { value: "weight_loss", label: "Weight Loss", icon: "flame" },
  { value: "athletic_performance", label: "Athletic Performance", icon: "trophy" },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: "beginner", label: "Beginner", description: "Less than 1 year of training" },
  { value: "intermediate", label: "Intermediate", description: "1-3 years of consistent training" },
  { value: "advanced", label: "Advanced", description: "3-5+ years, strong foundation" },
  { value: "elite", label: "Elite", description: "5+ years, competition-level" },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbells" },
  { value: "kettlebell", label: "Kettlebells" },
  { value: "cable", label: "Cable Machine" },
  { value: "machine", label: "Machines" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "band", label: "Resistance Bands" },
  { value: "squat_rack", label: "Squat Rack" },
  { value: "bench", label: "Bench" },
  { value: "pull_up_bar", label: "Pull-up Bar" },
  { value: "dip_station", label: "Dip Station" },
];

const STEPS: OnboardingStep[] = ["goals", "experience", "equipment", "frequency"];

export function OnboardingScreen() {
  const setUser = useUserStore((s) => s.setUser);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const setEquipment = useUserStore((s) => s.setEquipment);
  const setFrequency = useUserStore((s) => s.setFrequency);

  const [step, setStep] = useState<OnboardingStep>("goals");
  const [selectedGoal, setSelectedGoal] = useState<TrainingGoal>("general_fitness");
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>("beginner");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>(["bodyweight"]);
  const [selectedFrequency, setSelectedFrequency] = useState(3);

  const stepIndex = STEPS.indexOf(step);
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (step === "goals") {
      setUser({ trainingGoal: selectedGoal });
      setStep("experience");
    } else if (step === "experience") {
      setUser({ experienceLevel: selectedLevel });
      setStep("equipment");
    } else if (step === "equipment") {
      setEquipment(selectedEquipment);
      setStep("frequency");
    } else if (step === "frequency") {
      setFrequency(selectedFrequency);
      completeOnboarding();
    }
  }, [step, selectedGoal, selectedLevel, selectedEquipment, selectedFrequency, setUser, setEquipment, setFrequency, completeOnboarding]);

  const handleBack = useCallback(() => {
    if (step === "experience") setStep("goals");
    else if (step === "equipment") setStep("experience");
    else if (step === "frequency") setStep("equipment");
  }, [step]);

  const toggleEquipment = useCallback((item: Equipment) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.progressSegment, i <= stepIndex && styles.progressSegmentActive]}
          />
        ))}
      </View>

      {stepIndex > 0 && (
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {step === "goals" && (
          <>
            <Text style={styles.title}>What's your primary goal?</Text>
            <Text style={styles.description}>This helps us tailor your training program.</Text>
            <View style={styles.optionsGrid}>
              {TRAINING_GOALS.map((goal) => (
                <Pressable
                  key={goal.value}
                  style={[styles.optionCard, selectedGoal === goal.value && styles.optionCardSelected]}
                  onPress={() => setSelectedGoal(goal.value)}
                >
                  <Ionicons
                    name={goal.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={selectedGoal === goal.value ? colors.brand.primary : colors.dark.textSecondary}
                  />
                  <Text
                    style={[styles.optionLabel, selectedGoal === goal.value && styles.optionLabelSelected]}
                  >
                    {goal.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === "experience" && (
          <>
            <Text style={styles.title}>Your training experience?</Text>
            <Text style={styles.description}>We'll adjust programming complexity accordingly.</Text>
            <View style={styles.optionsList}>
              {EXPERIENCE_LEVELS.map((level) => (
                <Pressable
                  key={level.value}
                  style={[styles.listOption, selectedLevel === level.value && styles.listOptionSelected]}
                  onPress={() => setSelectedLevel(level.value)}
                >
                  <View style={styles.listOptionContent}>
                    <Text
                      style={[styles.listOptionLabel, selectedLevel === level.value && styles.optionLabelSelected]}
                    >
                      {level.label}
                    </Text>
                    <Text style={styles.listOptionDescription}>{level.description}</Text>
                  </View>
                  {selectedLevel === level.value && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.brand.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === "equipment" && (
          <>
            <Text style={styles.title}>Available equipment?</Text>
            <Text style={styles.description}>Select all equipment you have access to.</Text>
            <View style={styles.optionsGrid}>
              {EQUIPMENT_OPTIONS.map((item) => {
                const isSelected = selectedEquipment.includes(item.value);
                return (
                  <Pressable
                    key={item.value}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => toggleEquipment(item.value)}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
                    )}
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === "frequency" && (
          <>
            <Text style={styles.title}>Weekly training days?</Text>
            <Text style={styles.description}>How many days per week can you train?</Text>
            <View style={styles.frequencyContainer}>
              <Text style={styles.frequencyValue}>{selectedFrequency}</Text>
              <Text style={styles.frequencyUnit}>days per week</Text>
              <View style={styles.frequencyButtons}>
                {[2, 3, 4, 5, 6].map((n) => (
                  <Pressable
                    key={n}
                    style={[styles.freqButton, selectedFrequency === n && styles.freqButtonSelected]}
                    onPress={() => setSelectedFrequency(n)}
                  >
                    <Text
                      style={[styles.freqButtonText, selectedFrequency === n && styles.freqButtonTextSelected]}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Pressable onPress={handleNext} style={styles.nextButton}>
        <Text style={styles.nextButtonText}>{isLastStep ? "Get Started" : "Continue"}</Text>
        {!isLastStep && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    paddingTop: 60,
  },
  progressBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: colors.brand.primary,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
  },
  title: {
    ...typography.heading.h1,
    color: colors.dark.textPrimary,
    marginBottom: 8,
  },
  description: {
    ...typography.body.lg,
    color: colors.dark.textSecondary,
    marginBottom: 24,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    width: "47%",
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 80,
    justifyContent: "center",
  },
  optionCardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.dark.surfaceElevated,
  },
  optionLabel: {
    ...typography.label.lg,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  optionLabelSelected: {
    color: colors.dark.textPrimary,
  },
  optionsList: {
    gap: 12,
  },
  listOption: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  listOptionSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.dark.surfaceElevated,
  },
  listOptionContent: {
    flex: 1,
  },
  listOptionLabel: {
    ...typography.label.lg,
    color: colors.dark.textSecondary,
  },
  listOptionDescription: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  frequencyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  frequencyValue: {
    ...typography.numeric.lg,
    color: colors.brand.primary,
    fontSize: 64,
    lineHeight: 72,
  },
  frequencyUnit: {
    ...typography.body.lg,
    color: colors.dark.textSecondary,
    marginTop: 4,
    marginBottom: 32,
  },
  frequencyButtons: {
    flexDirection: "row",
    gap: 12,
  },
  freqButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  freqButtonSelected: {
    backgroundColor: colors.brand.primary,
  },
  freqButtonText: {
    ...typography.label.lg,
    color: colors.dark.textSecondary,
  },
  freqButtonTextSelected: {
    color: "#FFFFFF",
  },
  nextButton: {
    backgroundColor: colors.brand.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 40,
    gap: 8,
    minHeight: 56,
  },
  nextButtonText: {
    ...typography.heading.h3,
    color: "#FFFFFF",
  },
});
