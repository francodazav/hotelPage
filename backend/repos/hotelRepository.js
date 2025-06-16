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
  }) {
    try {
      await validateHotel.validateName(hotelName);
      await validateHotel.validatePrice(price);

      const result = await db.execute(
        "INSERT INTO hoteles(name,rate,price,direction,country,city,description,photos,services,user_id,user_name,user_lastname) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
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
        ]
      );
      return result;
    } catch (error) {
      throw new Error("Problem uploading");
    }
  }
  static async getAllHotels() {
    const result = await db.execute("SELECT * FROM hoteles");
    return result.rows;
  }
  static async getHotelById(id) {
    try {
      const result = await db.execute("SELECT * FROM hoteles WHERE id = ?", [
        id,
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error("Couldn't find the hotel");
    }
  }
  static async getHotelByName(name) {
    const result = await db.execute("SELECT * FROM hoteles WHERE name LIKE ?", [
      `%${name}%`,
    ]);
    return result.rows;
  }
  static async getHotelByLocation(location) {
    try {
      console.log(location);
      const result = await db.execute(
        "SELECT * FROM hoteles WHERE location LIKE ?",
        [`%${location}%`]
      );
      console.log(result);
      return result.rows;
    } catch (error) {
      throw new Error("Any hotel found at that location");
    }
  }
  static async getHotelByPrice({ minPrice, maxPrice }) {
    try {
      const result = await db.execute(
        `SELECT * FROM hoteles WHERE price >= ? AND price <= ?`,
        [minPrice, maxPrice]
      );
      return result.rows;
    } catch (error) {
      throw new Error("Not hotel found in that range");
    }
  }
  static async deleteHotel(id) {
    try {
      const result = await db.execute("DELETE FROM hoteles WHERE id = ?", [id]);
      return result;
    } catch (error) {
      throw new Error("Error deleting your hotel");
    }
  }
  static async deleteAllHotelsUser(userId) {
    try {
      const result = await db.execute("DELETE FROM hoteles WHERE user_id = ?", [
        userId,
      ]);
      return result;
    } catch (error) {
      throw new Error("Error deleting your hotels");
    }
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
  }) {
    try {
      await validateHotel.validateId(hotelId);
      const result = await db.execute(
        "UPDATE hoteles SET name = ? , rate = ? , price = ? , description = ?, direction = ?, country = ?, city = ?, photos = ? , services = ?,user_id = ?,user_name = ?, user_lastname =  ?  WHERE id = ?",
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
          userId,
          userName,
          userLastname,
          hotelId,
        ]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(error);
    }
  }
}

//SELECT * FROM hoteles WHERE price > ? AND price < ?
