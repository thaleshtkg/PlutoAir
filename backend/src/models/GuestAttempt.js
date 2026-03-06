import db from '../db/connection.js';

export class GuestAttempt {
  static async getOrCreate(identifier) {
    let attempt = await db('guest_login_attempts').where({ identifier }).first();

    if (!attempt) {
      [attempt] = await db('guest_login_attempts')
        .insert({ identifier, attempt_count: 0 })
        .returning('*');
    }

    return attempt;
  }

  static async increment(identifier) {
    const attempt = await this.getOrCreate(identifier);

    const updated = await db('guest_login_attempts')
      .where({ identifier })
      .update({ attempt_count: attempt.attempt_count + 1 })
      .returning('*');

    return updated[0];
  }

  static async getAttemptCount(identifier) {
    const attempt = await db('guest_login_attempts').where({ identifier }).first();
    return attempt?.attempt_count || 0;
  }

  static async isLimitReached(identifier) {
    const count = await this.getAttemptCount(identifier);
    const limit = parseInt(process.env.GUEST_SESSION_LIMIT || '20');
    return count >= limit;
  }

  static async getAttemptsRemaining(identifier) {
    const count = await this.getAttemptCount(identifier);
    const limit = parseInt(process.env.GUEST_SESSION_LIMIT || '20');
    return Math.max(0, limit - count);
  }
}
