/**
 * Node-environment stub for expo-sqlite.
 *
 * Repository-layer unit tests supply their own query doubles; this stub exists
 * so importing a module that reaches src/lib/database.ts does not blow up the
 * ts-jest/node runtime.
 */
const noopStatement = {
  executeSync: jest.fn(() => ({ getAllSync: () => [] })),
  finalizeSync: jest.fn(),
};

const makeDb = () => ({
  execSync: jest.fn(),
  execAsync: jest.fn(async () => undefined),
  runSync: jest.fn(() => ({ changes: 0, lastInsertRowId: 0 })),
  runAsync: jest.fn(async () => ({ changes: 0, lastInsertRowId: 0 })),
  getAllSync: jest.fn(() => []),
  getAllAsync: jest.fn(async () => []),
  getFirstSync: jest.fn(() => null),
  getFirstAsync: jest.fn(async () => null),
  prepareSync: jest.fn(() => noopStatement),
  withTransactionSync: jest.fn((fn) => fn()),
  withTransactionAsync: jest.fn(async (fn) => fn()),
  closeSync: jest.fn(),
});

module.exports = {
  openDatabaseSync: jest.fn(makeDb),
  openDatabaseAsync: jest.fn(async () => makeDb()),
  SQLiteProvider: ({ children }) => children,
  useSQLiteContext: jest.fn(makeDb),
};
