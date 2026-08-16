/**
 * Setup for the jest-expo (React Native environment) config.
 *
 * This file was referenced by jest.config.js but never existed; the reference also
 * used an invalid key (`setupFilesAfterSetup`), so Jest ignored it rather than
 * erroring on the missing path. Both are fixed — this is the real setup file.
 *
 * Component tests (*.test.tsx) belong to this config. Pure TypeScript
 * service/repository tests run under jest.unit.config.js in a node environment
 * and do not load this file.
 */

// Reanimated ships its own Jest mock; without it any component using
// useSharedValue/useAnimatedStyle throws on render.
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock("expo-haptics", () => require("./test/mocks/expo-haptics"));
jest.mock("expo-notifications", () => require("./test/mocks/expo-notifications"));
jest.mock("expo-secure-store", () => require("./test/mocks/expo-secure-store"));
jest.mock("expo-sqlite", () => require("./test/mocks/expo-sqlite"));

// Silence the RN animation-helper warning that fires on every gesture-handler import.
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), {
  virtual: true,
});
