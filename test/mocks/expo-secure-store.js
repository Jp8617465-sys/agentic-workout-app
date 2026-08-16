/**
 * Node-environment stub for expo-secure-store.
 *
 * The real module ships untranspiled ESM, which the ts-jest/node unit config
 * cannot parse. Tests that reach this module (via src/lib/supabase.ts) mock the
 * Supabase client anyway — this stub only needs to make the graph resolvable.
 */
const store = new Map();

module.exports = {
  getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
  setItemAsync: jest.fn(async (key, value) => {
    store.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key) => {
    store.delete(key);
  }),
  isAvailableAsync: jest.fn(async () => true),
  __reset: () => store.clear(),
};
