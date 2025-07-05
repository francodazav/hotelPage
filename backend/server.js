import dotenv from "dotenv";
import express from "express";

import { SECRET_KEY } from "./const/const.js";
import { createTables } from "./tables/tables.js";
import { userRepository } from "./repos/userRepository.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { hotelRepository } from "./repos/hotelRepository.js";
import { rsvRepository } from "./repos/rsvRepository.js";
import { paymentRepository } from "./repos/paymentRepository.js";
import {
  validateDisponibilitySchema,
  validateHotelsSchema,
  validateReservationSchema,
  validateUserSchema,
} from "./schemas/schemas.js";
import { corsMiddleware } from "./cors/cors.js";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import uploader from "imgbb-uploader";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
const upload = multer({ dest: "uploads/" });
const port = process.env.PORT || 3000;
const { verify, sign } = jwt;
createTables();
const app = express();
app.disable("x-powered-by");
app.use(corsMiddleware());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5174");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  const token = req.cookies.access_token;
  req.session = { user: null };
  if (!token) {
    return next();
  }
  try {
    const data = verify(token, SECRET_KEY);
    req.session.user = data;
  } catch (error) {
    console.warn("Invalid or expired token detected:", error.message);
    req.session.user = null;
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }
  next();
});

app.get("/all-users", async (req, res) => {
  const result = await userRepository.getUsers();
  res.status(200).send(result.rows);
});

app.post("/sign-up", async (req, res) => {
  try {
    const data = validateUserSchema(req.body);
    if (!data.success) res.status(400).send({ data });
    const { username, name, lastname, email, password, type } = data.data;

    const result = await userRepository.registerUser({
      username,
      name,
      lastname,
      email,
      password,
      type,
    });
    res.send(result);
  } catch (error) {
    res.status(400).send({ message: "Username or email already exists" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const publicUser = await userRepository.loginUser({
      username,
      password,
    });
    if (publicUser.message)
      return res.status(401).send({ message: "Invalid username or password" });
    const token = sign(publicUser, SECRET_KEY, {
      expiresIn: "1h",
    });
    res
      .cookie("access_token", token, {
        httpOnly: true, //solo la puedo usar en el servidor
        secure: process.env.NODE_ENV === "production", //Solo puede acceder en https
        sameSite: "strict", //solo se usa dentro del mismo dominio
        maxAge: 60 * 60 * 1000, // 1 hour
      })
      .status(200)
      .send(publicUser, token);
  } catch (error) {
    res.status(400).send({ message: "Invalid username or password" });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  console.log(req.session.user);
  res.status(200).send("user logout successfully");
});
app.post("/upload-hotel", upload.array("photos"), async (req, res) => {
  if (!req.session.user)
    return res.status(401).send("You must be logged in to upload a hotel");
  const { id, name, lastname, username, type } = req.session.user;
  if (type === 2)
    res
      .status(402)
      .send(
        "You are not authorize to upload a hotel, please contact the admin"
      );
  const parsed = JSON.parse(req.body.data);
  const data = validateHotelsSchema(parsed);
  if (data.success === false)
    return res.status(400).send({ message: "Invalid data" });
  const {
    hotelName,
    rate,
    price,
    direction,
    description,
    services,
    country,
    city,
    capacity,
  } = data.data;
  console.log(process.env.DROPBOX_ACCESS_TOKEN);
  const photos = {};
  console.log("Archivos recibidos:", req.files);
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    try {
      const filePath = file.path;
      const fileBuffer = fs.readFileSync(filePath);

      const result = await uploader(process.env.IMGBB_API_KEY, file.path);

      photos[`photo${i + 1}`] = result.display_url;
    } catch (error) {
      console.error("❌ Error uploading:", error);
    } finally {
      fs.unlinkSync(file.path); // limpiar archivo local
    }
  }
  try {
    const result = await hotelRepository.uploadHotel({
      userId: id,
      userName: name,
      userLastname: lastname,
      hotelName,
      username,
      rate,
      price,
      direction,
      description,
      photos,
      services,
      country,
      city,
      capacity,
    });
    res.status(200).send({ message: "Spot uploaded successfully" });
  } catch (error) {
    throw new Error(error);
    // res.status(500).send({
    //   message: "Problem uploading the hotel, please try again later.",
    // });
  }
});
app.get("/my-hotels", async (req, res) => {
  try {
    console.log(req.session.user);
    const { id } = req.session.user;
    console.log(id);
    const result = await hotelRepository.getUserHotels(id);
    res.status(200).send(result);
  } catch (error) {
    throw new Error(error);
  }
});
app.get("/all-hotels", async (req, res) => {
  try {
    const result = await hotelRepository.getAllHotels();
    res.status(200).send(result);
  } catch (error) {
    res.status(444).send("Problem fetching all the hotels");
  }
});
app.get("/hotel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id) || parseInt(id) <= 0)
      return res.status(400).send({ message: "Invalid hotel ID" });
    const result = await hotelRepository.getHotelById(id);
    if (result === null) {
      res
        .status(400)
        .send({ message: "Not hotels found with that specifications" });
    } else {
      res.status(200).send(result);
    }
  } catch (error) {
    res.status(404).send("Hotel not found");
  }
});
app.get("/hotel/name/:name", async (req, res) => {
  const { name } = req.params;
  if (name.length === 0)
    return res.status(400).send({ message: "Hotel name cannot be empty" });
  try {
    const result = await hotelRepository.getHotelByName(name);
    if (result.length > 0) {
      res.status(200).send(result);
    } else {
      res
        .status(404)
        .send({ message: "Could'nt find any hotel with that name" });
    }
  } catch (error) {
    res.status(404).send({ message: "Error finding the hotel name" });
  }
});

app.get("/hoteles", async (req, res) => {
  const {
    minPrice,
    maxPrice,
    fechaIn,
    fechaOut,
    country,
    city,
    name,
    orderBy,
    sortOrder,
  } = req.query;
  console.log("user", req.session.user);
  let filters = {};
  if (minPrice) filters.minPrice = minPrice;
  if (maxPrice) filters.maxPrice = maxPrice;
  if (fechaIn && fechaOut) {
    filters.fechaIn = fechaIn;
    filters.fechaOut = fechaOut;
  }
  if (country) {
    const countrySpaces = country.replace("-", " ");
    filters.country = countrySpaces;
  }
  if (name) {
    filters.name = name;
  }
  if (city) filters.city = city;

  if (orderBy) {
    filters.orderBy = orderBy;
  }
  if (sortOrder) {
    filters.sortOrder = sortOrder;
  }
  try {
    const result = await hotelRepository.searchHotelsDisponibility(filters);
    if (result.length > 0) {
      res.status(200).send(result);
    } else {
      res.status(400).send({ message: "Any hotel was found" });
    }
  } catch (error) {
    res
      .status(404)
      .send({ message: "Problem getting the hotels disponibility" });
  }
});
app.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (isNaN(id) || parseInt(id) <= 0)
    return res.status(400).send({ message: "Invalid hotel ID" });
  try {
    const result = await hotelRepository.deleteHotel(id);
    res.status(200).send(result);
  } catch (error) {
    res.status(404).send({
      message: "Problem deleting your hotel, please try again later.",
    });
  }
});
app.delete("/delete-all", async (req, res) => {
  if (!req.session.user)
    return res.status(401).send("You must be logged in to delete all hotels");
  const { id } = req.session.user;
  const result = await hotelRepository.deleteAllHotelsUser(id);
  res.status(200).send(result);
});
app.patch("/modify-hotel", async (req, res) => {
  const { name, lastname, id } = req.session.user;
  const data = validateHotelsSchema(req.body);
  console.log(data);
  if (!data.success) return res.status(400).send({ message: "Invalid data" });
  const {
    hotelId,
    hotelName,
    rate,
    price,
    description,
    direction,
    photos,
    services,
    city,
    country,
    capacity,
  } = data.data;
  try {
    const result = await hotelRepository.patchHotel({
      hotelName,
      userLastname: lastname,
      userName: name,
      hotelId,
      hotelName,
      rate,
      price,
      description,
      direction,
      photos,
      services,
      userId: id,
      city,
      country,
      capacity,
    });
    res.status(200).send(result);
  } catch (error) {
    res
      .status(500)
      .send("Problem modifying the hotel, please try again later.");
  }
});
app.post("/disponibility-hotel", async (req, res) => {
  const data = validateDisponibilitySchema(req.body);
  if (!data.success) return res.status(400).send({ message: "Invalid data" });
  const { hotelId, fechaIn, fechaOut, reason } = data.data;

  try {
    const result = await hotelRepository.changeDisponibility({
      hotelId,
      fechaIn,
      fechaOut,
      reason,
    });
    if (result.message) {
      res.status(400).send({ message: result.message });
    }
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      message: "Problem creating the disponibility, please try again later.",
    });
  }
});
app.patch("/disponibility-hotel", async (req, res) => {
  const { id, hotelId, fechaIn, fechaOut } = req.body;
  try {
    const result = await hotelRepository.modifyDisponibility({
      hotelId,
      fechaIn,
      fechaOut,
      id,
    });
    if (result.message) res.status(400).send({ message: result.message });
    res.status(200).send(result);
  } catch (error) {
    res
      .status(500)
      .send("Problem modifying the disponibility, please try again later.");
  }
});
app.post("/reservation", async (req, res) => {
  const { id, name, lastname, username, email, type } = req.session.user;

  if (type === 1)
    res
      .status(401)
      .send({ message: "You can't make a reservation as an admin" });

  const data = validateReservationSchema(req.body);
  if (!data.success) return res.status(400).send({ message: "Invalid data" });
  const { hotelId, fechaIn, fechaOut, price, paymentMethod } = data.data;
  try {
    const result = await rsvRepository.createRsv({
      userId: id,
      name,
      lastname,
      email,
      hotelId,
      fechaIn,
      fechaOut,
      username,
    });
    console.log(result);
    if (result.message) res.status(400).send({ message: result.message });
    await rsvRepository.asignDisponibilityRsv({
      hotelId,
      fechaIn,
      fechaOut,
      reason: "reserved",
      rsvConfirmation: result.rsvConfirmation,
    });
    await paymentRepository.registerPayment({
      price,
      paymentMethod,
      transactionId: result.rsvConfirmation,
      rsvId: result.id,
    });
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error making your reservation" });
  }
});
app.get("/reservation", async (req, res) => {
  const { id } = req.session.user;
  try {
    const result = await rsvRepository.getReservation(id);
    res.status(200).send(result);
  } catch (error) {
    res
      .status(404)
      .send({ message: "Any reservation was found for this user" });
  }
});
app.patch("/reservation", async (req, res) => {
  const { id, name, lastname, username, email } = req.session.user;
  const {
    hotelId,
    fechaIn,
    fechaOut,
    rsvId,
    rsvConfirmation,
    price,
    paymentMethod,
  } = req.body;
  try {
    const result = await rsvRepository.patchRsv({
      userId: id,
      name,
      lastname,
      username,
      email,
      hotelId,
      fechaIn,
      fechaOut,
      rsvId,
    });
    if (result.message) res.status(400).send({ message: result.message });
    await rsvRepository.patchDisponibilityRsv({
      hotelId,
      fechaIn,
      fechaOut,
      rsvConfirmation,
      newRsvConfirmation: result.newRsvConfirmation,
    });

    await paymentRepository.patchPaymenth({
      price,
      paymentMethod,
      transactionId: result.newRsvConfirmation,
      rsvId: result.newRsvConfirmation,
    });

    res.status(200).send(result);
  } catch (error) {
    throw new Error(error);
  }
});
app.delete("/reservation/:rsvConfirmation", async (req, res) => {
  const { rsvConfirmation } = req.params;
  try {
    const result = await rsvRepository.deleteRsv(rsvConfirmation);
    await rsvRepository.deleteDisponibility(rsvConfirmation);
    await paymentRepository.deletePayment(rsvConfirmation);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      message: "Problem deleting the reservation, please try again later.",
    });
  }
});
app.delete("/disponibility-hotel", async (req, res) => {
  const { id } = req.body;
  try {
    const result = await hotelRepository.deleteDisponibility(id);
    res.status(200).send(result);
  } catch (error) {
    res.status(404).send({
      message: "Problem deleting the disponibility, please try again later.",
    });
  }
});
app.get("/disponibility/:hotelId", async (req, res) => {
  const { hotelId } = req.params;
  if (isNaN(hotelId) || parseInt(hotelId) <= 0)
    return res.status(400).send({ message: "Invalid hotel ID" });
  try {
    const result = await hotelRepository.getDisponibility(hotelId);
    if (result === null) {
      res
        .status(400)
        .send({ message: "Not hotels found with that specifications" });
    } else {
      res.status(200).send(result);
    }
  } catch (error) {
    res.status(401).send({ message: "Problem getting the disponibility" });
  }
});
app.get("/payments", async (req, res) => {
  const { id, type } = req.session.user;
  if (type === 2)
    return res
      .status(401)
      .send({ message: "You are not authorize to see the payments" });

  try {
    const result = await paymentRepository.getPaymentsByUserId(id);
    if (result.length > 0) {
      res.status(200).send(result);
    } else {
      res.status(404).send({ message: "No payments found for this user" });
    }
  } catch (error) {
    res.status(500).send({ message: "Problem getting the payments" });
  }
});
app.get("/hotel/rsv/payment", async (req, res) => {
  const { id, type } = req.session.user;
  if (type === 2)
    return res.status(401).send({
      message: "You are not authorize to see the reservations and payments",
    });
  try {
    const result = await hotelRepository.getHotelRsvPayment(id);
    if (result.message) {
      res.status(400).send({ message: result.message });
    }
    console.log(result);
    res.status(200).send(result);
  } catch (error) {
    throw new Error(error);
  }
});
app.listen(port, () => {
  console.log(`running in port ${port}`);
});
