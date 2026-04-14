import { chatRepository, type ChatMessage } from "./chat-repository";

// Mock expoDb
jest.mock("../../lib/database", () => ({
  expoDb: {
    getAllSync: jest.fn(),
    getFirstSync: jest.fn(),
    runSync: jest.fn(),
  },
}));

// Mock uuid generator for predictable IDs
jest.mock("../../lib/uuid", () => ({
  generateId: jest.fn(() => "test-id-123"),
}));

import { expoDb } from "../../lib/database";

const mockDb = expoDb as jest.Mocked<typeof expoDb>;

const USER_ID = "user-abc-123";

function makeRow(overrides?: Partial<{
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
}>) {
  return {
    id: "msg-1",
    user_id: USER_ID,
    role: "user",
    content: "Hello",
    created_at: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("chatRepository.getMessages", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns messages in chronological order (oldest first)", () => {
    mockDb.getAllSync.mockReturnValueOnce([
      makeRow({ id: "msg-3", created_at: "2026-01-01T12:00:00.000Z", content: "Third" }),
      makeRow({ id: "msg-2", created_at: "2026-01-01T11:00:00.000Z", content: "Second" }),
      makeRow({ id: "msg-1", created_at: "2026-01-01T10:00:00.000Z", content: "First" }),
    ]); // DB returns DESC, repository reverses to ASC

    const messages = chatRepository.getMessages(USER_ID);

    expect(messages[0].content).toBe("First");
    expect(messages[1].content).toBe("Second");
    expect(messages[2].content).toBe("Third");
  });

  it("maps database row fields to ChatMessage interface", () => {
    mockDb.getAllSync.mockReturnValueOnce([
      makeRow({ id: "row-id", role: "assistant", content: "Hello!", created_at: "2026-01-01T10:00:00.000Z" }),
    ]);

    const [msg] = chatRepository.getMessages(USER_ID);

    expect(msg.id).toBe("row-id");
    expect(msg.userId).toBe(USER_ID);
    expect(msg.role).toBe("assistant");
    expect(msg.content).toBe("Hello!");
    expect(msg.createdAt).toBe("2026-01-01T10:00:00.000Z");
  });

  it("returns empty array when no messages", () => {
    mockDb.getAllSync.mockReturnValueOnce([]);

    const messages = chatRepository.getMessages(USER_ID);

    expect(messages).toEqual([]);
  });

  it("passes userId and limit to the query", () => {
    mockDb.getAllSync.mockReturnValueOnce([]);

    chatRepository.getMessages(USER_ID, 25);

    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE user_id = ?"),
      [USER_ID, 25],
    );
  });

  it("uses default limit of 50", () => {
    mockDb.getAllSync.mockReturnValueOnce([]);

    chatRepository.getMessages(USER_ID);

    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.any(String),
      [USER_ID, 50],
    );
  });
});

describe("chatRepository.getRecentForContext", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns messages in chronological order for Claude context", () => {
    mockDb.getAllSync.mockReturnValueOnce([
      makeRow({ content: "Newer", created_at: "2026-01-01T11:00:00.000Z" }),
      makeRow({ content: "Older", created_at: "2026-01-01T10:00:00.000Z" }),
    ]);

    const messages = chatRepository.getRecentForContext(USER_ID);

    expect(messages[0].content).toBe("Older");
    expect(messages[1].content).toBe("Newer");
  });

  it("uses default limit of 20", () => {
    mockDb.getAllSync.mockReturnValueOnce([]);

    chatRepository.getRecentForContext(USER_ID);

    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.any(String),
      [USER_ID, 20],
    );
  });
});

describe("chatRepository.insertMessage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("inserts a message and returns it with generated id and timestamp", () => {
    const result = chatRepository.insertMessage({
      userId: USER_ID,
      role: "user",
      content: "Test message",
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO chat_messages"),
      expect.arrayContaining([USER_ID, "user", "Test message"]),
    );

    expect(result.id).toBe("test-id-123");
    expect(result.userId).toBe(USER_ID);
    expect(result.role).toBe("user");
    expect(result.content).toBe("Test message");
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("inserts assistant messages correctly", () => {
    const result = chatRepository.insertMessage({
      userId: USER_ID,
      role: "assistant",
      content: "AI response here",
    });

    expect(result.role).toBe("assistant");
    expect(result.content).toBe("AI response here");
    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["assistant", "AI response here"]),
    );
  });
});

describe("chatRepository.clearHistory", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes all messages for the user", () => {
    chatRepository.clearHistory(USER_ID);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM chat_messages"),
      [USER_ID],
    );
  });

  it("does not affect other users' messages", () => {
    chatRepository.clearHistory(USER_ID);

    // The query should scope to only this user
    const [sql, params] = mockDb.runSync.mock.calls[0] as unknown as [string, string[]];
    expect(sql).toContain("WHERE user_id = ?");
    expect(params).toEqual([USER_ID]);
  });
});
