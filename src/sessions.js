import crypto from 'node:crypto';

const sessions = new Map();

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

function generateCode() {
  let code;
  do {
    code = '';
    const bytes = crypto.randomBytes(CODE_LENGTH);
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    }
  } while (sessions.has(code));
  return code;
}

export function createSession(title, items) {
  if (typeof title !== 'string' || title.trim() === '') {
    return { error: 'Title is required', status: 400 };
  }

  if (!Array.isArray(items)) {
    return { error: 'Items must be an array', status: 400 };
  }

  if (items.length < 2 || items.length > 20) {
    return { error: 'Items must contain between 2 and 20 entries', status: 400 };
  }

  for (const item of items) {
    if (typeof item !== 'string' || item.trim() === '') {
      return { error: 'Each item must be a non-empty string', status: 400 };
    }
  }

  const trimmedTitle = title.trim();
  const trimmedItems = items.map(item => item.trim());
  const code = generateCode();

  const session = {
    code,
    title: trimmedTitle,
    items: trimmedItems,
    votes: [],
  };

  sessions.set(code, session);

  return { data: session };
}

export function getSession(code) {
  return sessions.get(code);
}

// Exposed for testing cleanup
export function clearSessions() {
  sessions.clear();
}
