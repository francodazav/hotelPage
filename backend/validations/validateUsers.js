import { createClient } from "@libsql/client";
import { infoDb } from "../const/const.js";
import bcrypt from "bcrypt";
const db = createClient(infoDb);

export class validateUser {
  static async validateUsername(username) {
    if (username.length < 4)
      throw new Error("username must have at least 4 characters");

    const result = await db.execute(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );

    if (result.rows[0]) throw new Error(`${username} already exists.`);
  }
  static async validateEmail(email) {
    const result = await db.execute("SELECT email FROM users WHERE email = ?", [
      email,
    ]);
    if (result.rows[0]) {
      throw new Error(`${email} is already register`);
    }
  }
  static validatePassword({ password }) {
    const regex = /^(?=.*[A-Z])(?=.*[0-9]).*$/;
    if (regex.test(password))
      throw new Error(
        "Password must have one capital letter and one numbear at least"
      );
  }
  static validateName(name) {
    const regex = /[1-9]/;
    if (regex.test(name))
      throw new Error("names and lastnames can't have numbers");
    if (name.length < 2)
      throw new Error("names and lastnames must have at least two letters");
  }
  static async validateUsernameLogin(username) {
    const result = await db.execute(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );
    if (!result.rows[0])
      throw new Error(`${username} incorret username or password`);
  }
}
