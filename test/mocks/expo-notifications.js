/** Node-environment stub for expo-notifications. */
module.exports = {
  scheduleNotificationAsync: jest.fn(async () => "notification-id"),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  AndroidImportance: { DEFAULT: 3, HIGH: 4, MAX: 5 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: "timeInterval" },
};
