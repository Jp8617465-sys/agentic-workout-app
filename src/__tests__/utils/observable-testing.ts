/**
 * Utilities for testing Legend State observables
 */

/**
 * Get a snapshot of observable value
 */
export function getObservableSnapshot<T>(observable: { get: () => T }): T {
  return observable.get();
}

/**
 * Update an observable and get the new value
 */
export async function setObservableValue<T>(
  observable: { set: (value: T) => void },
  value: T
): Promise<T> {
  observable.set(value);
  return value;
}

/**
 * Create a mock listener for observable changes
 */
export function createObservableListener<T>() {
  const listener = jest.fn<void, [T]>();
  const subscription = { unsubscribe: jest.fn() };

  return {
    listener,
    subscription,
  };
}

/**
 * Assert observable value changed
 */
export function assertObservableChanged<T>(
  listener: jest.Mock<void, [T]>,
  expectedValue: T
) {
  expect(listener).toHaveBeenCalled();
  expect(listener).toHaveBeenCalledWith(expectedValue);
}

/**
 * Assert observable value did not change
 */
export function assertObservableUnchanged<T>(listener: jest.Mock<void, [T]>) {
  expect(listener).not.toHaveBeenCalled();
}
