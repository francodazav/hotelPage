import { createClient } from "@libsql/client";
import { infoDb } from "../const/const.js";
const db = createClient(infoDb);

export class validateUser {
  static async validateUsername(username) {
    const result = await db.execute(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );

    if (result.rows[0]) {
      console.log(result.rows[0]);
      return `${username} is already register`;
    }
  }
  static async validateEmail(email) {
    const result = await db.execute("SELECT email FROM users WHERE email = ?", [
      email,
    ]);
    if (result.rows[0]) {
      return { message: `${email} is already register` };
    }
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
