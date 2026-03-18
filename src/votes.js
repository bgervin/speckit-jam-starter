import { getSession } from './sessions.js';

export function castVote(code, voterName, allocations) {
  const session = getSession(code.toUpperCase());
  if (!session) {
    return { error: 'Session not found', status: 404 };
  }

  if (typeof voterName !== 'string' || voterName.trim() === '') {
    return { error: 'Voter name is required', status: 400 };
  }

  if (
    allocations === null ||
    allocations === undefined ||
    typeof allocations !== 'object' ||
    Array.isArray(allocations)
  ) {
    return { error: 'Allocations must be an object', status: 400 };
  }

  const allocKeys = Object.keys(allocations);
  const itemsSet = new Set(session.items);
  if (
    allocKeys.length !== itemsSet.size ||
    !allocKeys.every(k => itemsSet.has(k))
  ) {
    return { error: 'Allocations must include exactly the session items', status: 400 };
  }

  for (const val of Object.values(allocations)) {
    if (!Number.isInteger(val) || val < 0) {
      return { error: 'Each allocation must be a non-negative integer', status: 400 };
    }
  }

  const sum = Object.values(allocations).reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    return { error: 'Allocations must sum to exactly $100', status: 400 };
  }

  const trimmedName = voterName.trim();
  const duplicate = session.votes.some(
    v => v.voterName.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    return { error: 'This name has already voted in this session', status: 400 };
  }

  const vote = { voterName: trimmedName, allocations };
  session.votes.push(vote);

  return { data: vote };
}
