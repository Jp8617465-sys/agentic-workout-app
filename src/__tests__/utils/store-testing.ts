/**
 * Utilities for testing Zustand stores
 */
import { renderHook, act } from "@testing-library/react-native";

/**
 * Render a Zustand hook and return state/actions
 */
export function renderStore<T>(hook: () => T) {
  const { result } = renderHook(hook);
  return result;
}

/**
 * Act on store updates
 */
export async function actOnStore(callback: () => void | Promise<void>) {
  await act(async () => {
    await callback();
  });
}

/**
 * Assert store state matches expected values
 */
export function assertStoreState<T extends object>(
  actual: T,
  expected: Partial<T>
) {
  for (const [key, value] of Object.entries(expected)) {
    expect((actual as any)[key]).toEqual(value);
  }
}

/**
 * Get current state snapshot of a Zustand store
 */
export function getStoreSnapshot<T>(hook: () => T): T {
  const { result } = renderHook(hook);
  return result.current;
}

/**
 * Update store and return new state
 */
export async function updateStore<T>(
  hook: () => T,
  updater: (state: T) => void | Promise<void>
): Promise<T> {
  const { result } = renderHook(hook);

  await act(async () => {
    await updater(result.current);
  });

  return result.current;
}
