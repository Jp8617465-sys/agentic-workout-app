/**
 * Common test utilities and helpers
 */

/**
 * Wait for async operations to complete
 */
export async function waitFor(
  predicate: () => boolean,
  timeout: number = 1000
): Promise<void> {
  const startTime = Date.now();
  while (!predicate()) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a resolved promise with a value
 */
export function resolved<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

/**
 * Create a rejected promise with an error
 */
export function rejected<T>(error: Error): Promise<T> {
  return Promise.reject(error);
}

/**
 * Mock a function that returns resolved/rejected promise
 */
export function mockAsyncFunction<T>(value: T, shouldReject: boolean = false) {
  return jest.fn().mockImplementation(() => {
    if (shouldReject) {
      return Promise.reject(new Error("Async operation failed"));
    }
    return Promise.resolve(value);
  });
}

/**
 * Get all keys from an object (useful for testing object equality)
 */
export function getObjectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Deep clone an object (for test data mutation prevention)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Partial type override for testing
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Create an error with a custom message and code
 */
export function createError(
  message: string,
  code?: string
): Error & { code?: string } {
  const error = new Error(message) as Error & { code?: string };
  if (code) {
    error.code = code;
  }
  return error;
}
