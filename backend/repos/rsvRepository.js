import { infoDb } from "../const/const.js";
import { createClient } from "@libsql/client";
import crypto from "crypto";

const db = createClient(infoDb);

export class rsvRepository {
  static async createRsv({
    userId,
    name,
    lastname,
    email,
    hotelId,
    fechaIn,
    fechaOut,
    username,
  }) {
    console.log(
      "info",
      userId,
      name,
      lastname,
      email,
      hotelId,
      fechaIn,
      fechaOut,
      username
    );
    const result = await db.execute(
      "SELECT * FROM disponibility WHERE hotel_id = ? AND (fecha_in < ? AND fecha_out > ?)",
      [hotelId, fechaOut, fechaIn]
    );
    console.log(result.rows[0]);
    if (result.rows[0]) {
      return {
        message: "The Hotel is already ocuped for this reason ",
      };
    }
    const rsvConfirmation = rsvValidation.createRsvConfirmation();
    try {
      const id = crypto.randomUUID();
      await db.execute(
        "INSERT into reservations (id,hotel_id,user_id,name,lastname,username,email,rsv_confirm,fecha_in,fecha_out) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [
          id,
          hotelId,
          userId,
          name,
          lastname,
          username,
          email,
          rsvConfirmation,
          fechaIn,
          fechaOut,
        ]
      );

      return {
        id,
        hotelId,
        userId,
        name,
        lastname,
        email,
        rsvConfirmation,
        fechaIn,
        fechaOut,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
  static async asignDisponibilityRsv({
    hotelId,
    fechaIn,
    fechaOut,
    reason,
    rsvConfirmation,
  }) {
    const result = await db.execute(
      "SELECT * FROM disponibility WHERE hotel_id = ? AND (fecha_in <= ? AND fecha_out >= ?)",
      [hotelId, fechaOut, fechaIn]
    );
    console.log(result.rows);
    if (result.rows.length > 0) {
      return {
        message: "The Hotel is already ocuped for this reason " + reason,
      };
    }
    await db.execute(
      "INSERT INTO disponibility(hotel_id,fecha_in,fecha_out,reason,rsv_confirm) VALUES(?,?,?,?,?)",
      [hotelId, fechaIn, fechaOut, reason, rsvConfirmation]
    );
    return { hotelId, fechaIn, fechaOut, reason };
  }
  static async getReservation(id) {
    try {
      const result = await db.execute(
        "SELECT h.name,r.hotel_id ,h.id, r.rsv_confirm, r.user_id, r.fecha_in, r.fecha_out , h.photos , p.price , p.transaction_id FROM reservations r  JOIN hoteles h ON h.id = r.hotel_id JOIN payments p ON p.transaction_id = r.rsv_confirm WHERE r.user_id = ?",
        [id]
      );
      const reservations = result.rows.map((rsv) => {
        const name = rsv.name;
        const fechaIn = rsv.fecha_in;
        const fechaOut = rsv.fecha_out;
        const price = rsv.price;
        const rsvConfirm = rsv.rsv_confirm;
        return { name, fechaIn, fechaOut, price, rsvConfirm };
      });
      return reservations;
    } catch (error) {
      throw new Error(error);
    }
  }
  static async patchRsv({
    rsvId,
    name,
    lastname,
    username,
    email,
    hotelId,
    fechaIn,
    fechaOut,
    userId,
  }) {
    const newRsvConfirmation = rsvValidation.createRsvConfirmation();
    try {
      const result = await db.execute(
        "SELECT * FROM disponibility WHERE hotel_id = ? AND fecha_in <= ? AND fecha_out >= ?",
        [hotelId, fechaOut, fechaIn]
      );
      if (result.rows[0]) {
        return {
          message: `The Hotel is already ocuped`,
        };
      }
      await db.execute(
        "UPDATE reservations SET hotel_id = ? ,user_id = ? ,name = ?,lastname = ?,username = ?,email = ?,rsv_confirm = ?,fecha_in = ?,fecha_out = ? WHERE id = ?",
        [
          hotelId,
          userId,
          name,
          lastname,
          username,
          email,
          newRsvConfirmation,
          fechaIn,
          fechaOut,
          rsvId,
        ]
      );
      return {
        hotelId,
        userId,
        name,
        lastname,
        username,
        email,
        newRsvConfirmation,
        fechaIn,
        fechaOut,
        rsvId,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
  static async patchDisponibilityRsv({
    hotelId,
    fechaIn,
    fechaOut,
    rsvConfirmation,
    newRsvConfirmation,
  }) {
    console.log(
      hotelId,
      fechaIn,
      fechaOut,
      rsvConfirmation,
      newRsvConfirmation
    );
    const reason = "reserved";
    try {
      const result = await db.execute(
        "SELECT id FROM disponibility WHERE rsv_confirm = ?",
        [rsvConfirmation]
      );
      console.log(result.rows);
      const { id } = result.rows[0];
      await db.execute(
        "UPDATE disponibility SET hotel_id = ? , fecha_in = ?, fecha_out = ?,  rsv_confirm = ?, reason = ? WHERE id = ?",
        [hotelId, fechaIn, fechaOut, newRsvConfirmation, reason, id]
      );
    } catch (error) {
      throw new Error(error);
    }
  }
  static async deleteRsv(rsvConfirmation) {
    await db.execute("DELETE FROM reservations WHERE rsv_confirm = ?", [
      rsvConfirmation,
    ]);
    return { message: "Reservation delete it correctly" };
  }
  static async deleteDisponibility(rsvConfirmation) {
    await db.execute("DELETE FROM disponibility WHERE rsv_confirm = ?", [
      rsvConfirmation,
    ]);
  }
}

export class rsvValidation {
  static createRsvConfirmation() {
    const bytes = crypto.randomBytes(Math.ceil(10 * 0.75)); // Cada 3 bytes -> 4 caracteres base64
    return bytes
      .toString("base64") // Genera base64
      .replace(/\+/g, "0") // Reemplaza + por 0
      .replace(/\//g, "0") // Reemplaza / por 0
      .slice(0, 6) // Recorta a la longitud deseada
      .toUpperCase();
  }
}
