import { infoDb } from "../const/const.js";
import { createClient } from "@libsql/client";

const db = createClient(infoDb);
export class validateHotel {
  static async validateName(name) {
    const result = await db.execute("SELECT name FROM hoteles WHERE name = ?", [
      name,
    ]);
    if (result.rows[0]) throw new Error(`${name} its already register`);
  }
  static async validatePrice(price) {
    if (price <= 0) throw new Error("The price must be higher than 0");
  }
  static async validateId(id) {
    const result = await db.execute("SELECT id FROM hoteles WHERE id = ?", [
      id,
    ]);
    if (!result.rows[0]) throw new Error("Id not found");
  }
}
