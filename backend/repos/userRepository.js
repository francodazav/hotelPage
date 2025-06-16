import { createClient } from "@libsql/client";
import { infoDb } from "../const/const.js";
import randomUUID from "randomuuid/randomUUID.js";
import bcrypt from "bcrypt";
import { validateUser } from "../validations/validateUsers.js";
const db = createClient(infoDb);

export class userRepository {
  static async getUsers() {
    const result = await db.execute("SELECT * FROM users");
    return result;
  }
  static async registerUser({
    username,
    password,
    name,
    lastname,
    email,
    type,
  }) {
    try {
      await validateUser.validateUsername(username);
      await validateUser.validateEmail(email);
      await validateUser.validatePassword(password);
      await validateUser.validateName(name);
      await validateUser.validateName(lastname);

      const id = randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await db.execute(
        "INSERT INTO users(id,name,lastname,username,email,password,type) VALUES(?,?,?,?,?,?,?)",
        [id, name, lastname, username, email, hashedPassword, type]
      );
      return result;
    } catch (error) {
      console.error(error);
    }
  }
  static async loginUser({ username, password }) {
    await validateUser.validateUsernameLogin(username);

    const result = await db.execute(
      "SELECT username,password,type,id,name,lastname,email FROM users WHERE username = ?",
      [username]
    );
    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) throw new Error("username or password incorret");

    const { name, lastname, id, email, type } = result.rows[0];

    return { name, lastname, id, email, type, username };
  }
}
