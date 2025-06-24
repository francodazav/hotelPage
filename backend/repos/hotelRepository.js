import { infoDb } from "../const/const.js";
import { validateHotel } from "../validations/validateHotel.js";
import { createClient } from "@libsql/client";

const db = createClient(infoDb);

export class hotelRepository {
  static async uploadHotel({
    hotelName,
    price,
    photos,
    services,
    direction,
    country,
    city,
    description,
    userId,
    userName,
    userLastname,
    rate,
    capacity,
  }) {
    await validateHotel.validateName(hotelName);

    const result = await db.execute(
      "INSERT INTO hoteles(name,rate,price,direction,country,city,description,photos,services,capacity,user_id,user_name,user_lastname) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        hotelName,
        rate,
        price,
        direction,
        country,
        city,
        description,
        JSON.stringify(photos),
        JSON.stringify(services),
        capacity,
        userId,
        userName,
        userLastname,
      ]
    );
    return result;
  }
  static async getAllHotels() {
    const result = await db.execute("SELECT * FROM hoteles");
    const hoteles = result.rows.map((row) => ({
      ...row,
      photos: JSON.parse(row.photos || "[]"),
      services: JSON.parse(row.services || "[]"),
      userId: row.user_id,
      userName: row.user_name,
      userLastname: row.user_lastname,
    }));
    console.log(hoteles);

    return hoteles;
  }
  static async getHotelById(id) {
    const result = await db.execute("SELECT * FROM hoteles WHERE id = ?", [id]);
    if (result.rows.length === 0) {
      return { message: `Hotel with id ${id} not found` };
    }
    return {
      ...result.rows[0],
      photos: JSON.parse(result.rows[0].photos || "[]"),
      services: JSON.parse(result.rows[0].services || "[]"),
    };
  }
  static async getHotelByName(name) {
    const result = await db.execute("SELECT * FROM hoteles WHERE name LIKE ?", [
      `%${name}%`,
    ]);
    return {
      ...result.rows[0],
      photos: JSON.parse(result.rows[0].photos || "[]"),
      services: JSON.parse(result.rows[0].services || "[]"),
    };
  }
  static async deleteHotel(id) {
    await db.execute("SELECT FROM hoteles WHERE id = ?", [id]);
    if (!result.rows) return error`Hotel with id ${id} not found`;
    await db.execute("DELETE FROM hoteles WHERE id = ?", [id]);
    return { message: "Hotel deleted successfully" };
  }
  static async deleteAllHotelsUser(userId) {
    await db.execute("DELETE FROM hoteles WHERE user_id = ?", [userId]);
    return { message: "All hotels deleted successfully" };
  }
  static async patchHotel({
    hotelId,
    hotelName,
    rate,
    price,
    direction,
    description,
    photos,
    services,
    userId,
    userName,
    userLastname,
    city,
    country,
    capacity,
  }) {
    await validateHotel.validateId(hotelId);
    await db.execute(
      "UPDATE hoteles SET name = ? , rate = ? , price = ? , description = ?, direction = ?, country = ?, city = ?, photos = ? , services = ?,capacity = ?,user_id = ?,user_name = ?, user_lastname =  ?  WHERE id = ?",
      [
        hotelName,
        rate,
        price,
        description,
        direction,
        country,
        city,
        JSON.stringify(photos),
        JSON.stringify(services),
        capacity,
        userId,
        userName,
        userLastname,
        hotelId,
      ]
    );
    return {
      message: "Hotel updated successfully",
      hotelId,
      hotelName,
      rate,
      price,
      direction,
      description,
      photos,
      services,
      userId,
      userName,
      userLastname,
      city,
      country,
      capacity,
    };
  }
  static async changeDisponibility({ hotelId, fechaIn, fechaOut, reason }) {
    const result = await db.execute(
      "SELECT * FROM disponibility WHERE hotel_id = ? AND fecha_in <= ? AND fecha_out >= ?",
      [hotelId, fechaOut, fechaIn]
    );
    console.log(result);
    if (result.rows[0]) {
      return {
        message: `The Hotel is already ocuped for this reason ${reason}`,
      };
    }
    await db.execute(
      "INSERT INTO disponibility(hotel_id,fecha_in,fecha_out,reason) VALUES(?,?,?,?)",
      [hotelId, fechaIn, fechaOut, reason]
    );
    return {
      hotelId,
      fechaIn,
      fechaOut,
      reason,
    };
  }
  static async modifyDisponibility({ hotelId, fechaIn, fechaOut, id }) {
    const result = await db.execute(
      "SELECT * FROM disponibility WHERE hotel_id = ? AND fecha_in <= ? AND fecha_out >= ?",
      [hotelId, fechaOut, fechaIn]
    );
    console.log(result);
    if (result.rows[0]) {
      return {
        message: `The Hotel is already ocuped for this reason ${reason}`,
      };
    }
    await db.execute(
      "UPDATE disponibility SET hotel_id = ? , fecha_in = ?, fecha_out = ? WHERE id = ?",
      [hotelId, fechaIn, fechaOut, id]
    );
    return { hotelId, fechaIn, fechaOut };
  }
  static async deleteDisponibility(id) {
    await db.execute("DELETE FROM disponibility WHERE id = ?", [id]);
    return { message: "Disponibility remove" };
  }
  static async getDisponibility(hotelId) {
    const result = await db.execute(
      "SELECT * FROM disponibility WHERE hotel_id = ?",
      [hotelId]
    );
    return result.rows;
  }
  static async searchHotelsDisponibility(filters = {}) {
    console.log(filters);
    let query = `
       SELECT h.id, d.hotel_id, h.name, h.price, d.fecha_in, d.fecha_out, h.country, h.city, h.direction, h.services, h.photos
        FROM hoteles h
        LEFT JOIN disponibility d ON h.id = d.hotel_id
        WHERE 1=1 
    `;
    const allowedOrderBy = ["price", "rate", "country", "city"];
    const params = [];
    if (filters.minPrice) {
      query += ` AND h.price >= ?`;
      params.push(filters.minPrice);
    }
    if (filters.maxPrice) {
      query += ` AND h.price <= ?`;
      params.push(filters.maxPrice);
    }
    if (filters.fechaIn && filters.fechaOut) {
      query += ` AND NOT EXISTS (
        SELECT 1 FROM disponibility d2
        WHERE d2.hotel_id = h.id
        AND (
          d2.fecha_in <= ? AND d2.fecha_out >= ?
        )
      )`;
      // Parameters for the single overlap condition
      params.push(filters.fechaOut, filters.fechaIn);
    }
    if (filters.country) {
      query += " AND h.country LIKE ?";
      params.push(`%${filters.country}%`);
    }
    if (filters.city) {
      query += " AND h.city LIKE ?";
      params.push(`%${filters.city}%`);
    }
    if (filters.rate) {
      query += " AND rate >= ?";
      params.push(filters.rate);
    }
    if (filters.orderBy && allowedOrderBy.includes(filters.orderBy)) {
      const orderBy = filters.orderBy;
      const sortOrder = filters.sortOrder || "ASC";
      query += ` ORDER BY ${orderBy} ${sortOrder}`;
    }
    if (filters.limit) {
      query += "LIMIT ?";
      params.push(filters.limit);
    }
    if (filters.offset) {
      query += " OFFSET ?";
      params.push(filters.offset);
    }
    console.log(query, params);
    const result = await db.execute(query, params);
    const hoteles = result.rows.map((row) => ({
      ...row,
      photos: JSON.parse(row.photos || "[]"),
      services: JSON.parse(row.services || "[]"),
      userId: row.user_id,
      userName: row.user_name,
      userLastname: row.user_lastname,
    }));

    return hoteles;
  }
  static async searchHotel(filters = {}) {
    const allowedOrderBy = ["price", "rate", "country", "city"];
    let query = "SELECT * FROM hoteles WHERE 1 = 1";
    const params = [];
    if (filters.minPrice) {
      query += ` AND h.price >= ?`;
      params.push(filters.minPrice);
    }
    if (filters.maxPrice) {
      query += ` AND h.price <= ?`;
      params.push(filters.maxPrice);
    }
    if (filters.rate) {
      query += " AND rate >= ?";
      params.push(filters.rate);
    }
    if (filters.city) {
      query += " AND city LIKE ?";
      params.push(`%${filters.city}%`);
    }

    if (filters.country) {
      query += " AND country LIKE ?";
      params.push(`%${filters.country}%`);
    }

    if (filters.orderBy && allowedOrderBy.includes(filters.orderBy)) {
      const orderBy = filters.orderBy;
      const sortOrder = filters.sortOrder || "ASC";
      query += ` ORDER BY ${orderBy} ${sortOrder}`;
    }

    const result = await db.execute(query, params);
    const hoteles = result.rows.map((row) => ({
      ...row,
      photos: JSON.parse(row.photos || "[]"),
      services: JSON.parse(row.services || "[]"),
    }));

    return hoteles;
  }
  static async getHotelRsvPayment(id) {
    const result = await db.execute(
      "SELECT h.id , r.id ,  h.user_id , r.fecha_in, r.fecha_out , h.price, r.rsv_confirm, p.payment_method, p.price, p.transaction_id , p.id FROM hoteles h JOIN reservations r ON h.id = r.hotel_id LEFT JOIN payments p ON r.rsv_confirm = p.transaction_id WHERE h.user_id = ?",
      [id]
    );
    if (!result.rows || result.rows.length === 0) {
      return { message: "No reservations found for this user." };
    }
    const rsv = result.rows.map((row) => ({
      ...row,
      userId: row.user_id,
      fechaIn: row.fecha_in,
      fechaOut: row.fecha_out,
      rsvConfirmation: row.rsv_confirm,
      paymentMethod: row.payment_method,
    }));
    return rsv;
  }
}

//SELECT * FROM hoteles WHERE price > ? AND price < ?
