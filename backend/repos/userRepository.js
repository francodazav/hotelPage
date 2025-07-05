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
    console.log(username);
    const usernameVal = await validateUser.validateUsername(username);
    if (usernameVal) throw new Error(usernameVal);
    const validateEmail = await validateUser.validateEmail(email);
    if (validateEmail) return { message: "Email already exists" };
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users(id,name,lastname,username,email,password,type) VALUES(?,?,?,?,?,?,?)",
      [id, name, lastname, username, email, hashedPassword, type]
    );
    return {
      id,
      name,
      lastname,
      username,
      email,
      type,
    };
  }
  static async loginUser({ username, password }) {
    await validateUser.validateUsernameLogin(username);

    const result = await db.execute(
      "SELECT username,password,type,id,name,lastname,email FROM users WHERE username = ?",
      [username]
    );
    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) return { message: "Invalid username or password" };

    const { name, lastname, id, email, type } = result.rows[0];

    return { name, lastname, id, email, type, username };
  }
}
