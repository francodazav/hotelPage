import { infoDb } from "../const/const.js";
import { createClient } from "@libsql/client";

const db = createClient(infoDb);

export const createTables = async () => {
  await db.execute(
    "CREATE TABLE IF NOT EXISTS hoteles(id INTEGER PRIMARY KEY AUTOINCREMENT ,name VARCHAR(120),rate FLOAT,price FLOAT,direction TEXT NOT NULL,country VARCHAR(36) NOT NULL, city VARCHAR(36) NOT NULL,description TEXT NOT NULL,photos TEXT NOT NULL,services TEXT NOT NULL,capacity INTEGER NOT NULL,user_id VARCHAR(36),user_name VARCHAR(36), user_lastname VARCHAR(36))"
  );
  await db.execute(
    "CREATE TABLE IF NOT EXISTS users(id VARCHAR(36) PRIMARY KEY  ,name VARCHAR(18) NOT NULL,lastname VARCHAR(18) NOT NULL,username VARCHAR(18) UNIQUE NOT NULL,email VARCHAR(40)  UNIQUE NOT NULL,password VARCHAR(255) NOT NULL,type INTEGER NOT NULL)"
  );
  await db.execute(
    "CREATE TABLE IF NOT EXISTS reservations(id VARCHAR(36) PRIMARY KEY,hotel_id INTEGER NOT NULL,user_id VARCHAR(36) NOT NULL, name VARCHAR(36) NOT NULL, lastname VARCHAR(36) NOT NULL,username VARCHAR(36) NOT NULL,email VARCHAR(40) NOT NULL,rsv_confirm VARCHAR(12) NOT NULL UNIQUE, fecha_in DATE NOT NULL, fecha_out DATE NOT NULL)"
  );
  await db.execute(
    "CREATE TABLE IF NOT EXISTS disponibility(id INTEGER PRIMARY KEY AUTOINCREMENT,hotel_id INT , fecha_in DATE NOT NULL, fecha_out NOT NULL, reason VARCHAR(36) NOT NULL, rsv_confirm VARCHAR(6))"
  );
  await db.execute(
    "CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT,rsv_id VARCHAR(36), price DECIMAL NOT NULL, payment_method VARCHAR(12) NOT NULL , transaction_id VARCHAR(36) NOT NULL, payment_date TIMESTAMP)"
  );
};
