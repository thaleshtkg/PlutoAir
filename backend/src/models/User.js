import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

export class User {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [user] = await db('users')
      .insert({
        full_name: userData.full_name,
        email: userData.email,
        mobile: userData.mobile,
        password_hash: hashedPassword,
        is_guest: userData.is_guest || false,
      })
      .returning('*');

    return user;
  }

  static async findByEmail(email) {
    return db('users').where({ email }).first();
  }

  static async findById(id) {
    return db('users').where({ id }).first();
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getByUsername(username) {
    // In this case, we'll treat 'admin' as the guest user
    if (username === 'admin') {
      return {
        id: 'admin-user',
        email: 'admin@demo.com',
        full_name: 'Demo Admin',
        is_guest: true,
        password_hash: await bcrypt.hash('admin@123', 10),
      };
    }
    return db('users').where({ email: username }).first();
  }
}
