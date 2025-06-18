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
    await validateHotel.validatePrice(price);

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
        photos,
        services,
        userId,
        userName,
        userLastname,
        capacity,
      ]
    );
    return result;
  }
  static async getAllHotels() {
    const result = await db.execute("SELECT * FROM hoteles");
    return result.rows;
  }
  static async getHotelById(id) {
    const result = await db.execute("SELECT * FROM hoteles WHERE id = ?", [id]);
    return result.rows[0];
  }
  static async getHotelByName(name) {
    const result = await db.execute("SELECT * FROM hoteles WHERE name LIKE ?", [
      `%${name}%`,
    ]);
    return result.rows;
  }
  static async getHotelByPrice({ minPrice, maxPrice }) {
    const result = await db.execute(
      `SELECT * FROM hoteles WHERE price >= ? AND price <= ?`,
      [minPrice, maxPrice]
    );
    return result.rows;
  }
  static async deleteHotel(id) {
    const result = await db.execute("DELETE FROM hoteles WHERE id = ?", [id]);
    return result;
  }
  static async deleteAllHotelsUser(userId) {
    const result = await db.execute("DELETE FROM hoteles WHERE user_id = ?", [
      userId,
    ]);
    return result;
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
    const result = await db.execute(
      "UPDATE hoteles SET name = ? , rate = ? , price = ? , description = ?, direction = ?, country = ?, city = ?, photos = ? , services = ?,capacity = ?,user_id = ?,user_name = ?, user_lastname =  ?  WHERE id = ?",
      [
        hotelName,
        rate,
        price,
        description,
        direction,
        country,
        city,
        photos,
        services,
        capacity,
        userId,
        userName,
        userLastname,
        hotelId,
      ]
    );
    return result.rows[0];
  }
  static async changeDisponibility({ hotelId, fechaIn, fechaOut, reason }) {
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
    let query = `
       SELECT h.id, d.hotel_id, h.name, h.price, d.fecha_in, d.fecha_out, h.country, h.city, h.direction, h.services, h.photos
        FROM hoteles h
        JOIN disponibility d ON h.id = d.hotel_id
        WHERE 1=1 
    `;
    console.log(filters);
    const params = [];
    console.log(query);
    if (filters.minPrice) {
      query += ` AND h.price >= ?`;
      params.push(filters.minPrice);
    }
    if (filters.maxPrice) {
      query += ` AND h.price <= ?`;
      params.push(filters.maxPrice);
    }
    if (filters.fechaIn && filters.fechaOut) {
      query += ` AND (d.fecha_out < ? OR d.fecha_in > ?)`;
      params.push(filters.fechaIn, filters.fechaOut);
    }
    if (filters.country) {
      query += " AND h.country LIKE ?";
      params.push(`%${filters.country}%`);
    }
    if (filters.city) {
      query += " AND h.city LIKE ?";
      params.push(`%${filters.city}%`);
    }
    if (filters.name) {
      query += " AND h.name LIKE ?";
      params.push(`%${filters.name}%`);
    }
    try {
      const result = await db.execute(query, params);
      console.log(query);
      console.log(params);
      return result.rows;
    } catch (error) {
      throw new Error();
    }
  }
  static async searchHotel(filters = {}) {
    let query = "SELECT * FROM hoteles WHERE 1 = 1";
    const params = [];
    if (filters.minPrice && filters.maxPrice) {
      query += " AND (price > ? AND price < ?)";
      params.push(filters.minPrice, filters.maxPrice);
    }
    if (filters.rate) {
      query += " AND rate > ?";
      params.push(filters.rate);
    }
    if (filters.city) {
      query += "AND city LIKE ?";
      params.push(`%${filters.city}%`);
    }

    if (filters.country) {
      query += " AND country LIKE ?";
      params.push(`%${filters.country}%`);
    }
    if (filters.name) {
      query += " AND h.name LIKE ?";
      params.push(`%${filters.name}%`);
    }
    try {
      console.log(query);
      console.log(params);
      const result = await db.execute(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(error);
    }
  }
}

//SELECT * FROM hoteles WHERE price > ? AND price < ?
