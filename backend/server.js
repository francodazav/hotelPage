import express from "express";
import { createClient } from "@libsql/client";
import { infoDb, SECRET_KEY } from "./const/const.js";
import { createTables } from "./tables/tables.js";
import { userRepository } from "./repos/userRepository.js";
import cookieParser from "cookie-parser";
import pkg from "jsonwebtoken";
import { hotelRepository } from "./repos/hotelRepository.js";
const port = process.env.PORT || 3000;

const { verify, sign } = pkg;
const db = createClient(infoDb);
createTables();
const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  const token = req.cookies.access_token;
  let data = null;
  req.session = { user: null };
  try {
    data = verify(token, SECRET_KEY);
    req.session.user = data;
  } catch (error) {
    req.session.user = null;
  }
  next();
});

app.get("/all-users", async (req, res) => {
  const result = await userRepository.getUsers();
  res.send(result.rows);
});

app.post("/sign-up", async (req, res) => {
  try {
    const { username, name, lastname, email, password, type } = req.body;
    const result = await userRepository.registerUser({
      username,
      name,
      lastname,
      email,
      password,
      type,
    });
    res.send(result.rows[0]);
  } catch (error) {}
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const publicUser = await userRepository.loginUser({
    username,
    password,
  });
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
    .send(publicUser, token);
});

app.get("/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).send("user logout successfully");
});
app.post("/upload-hotel", async (req, res) => {
  if (!req.session.user) throw new Error("You must login to upload an hotel");
  const { id, name, lastname, username } = req.session.user;
  const {
    hotelName,
    rate,
    price,
    direction,
    description,
    photos,
    services,
    country,
    city,
  } = req.body;
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
    });
    res.send(result);
  } catch (error) {
    throw new Error("Problem uploading your hotel");
  }
  res.send(user);
});
app.get("/all-hotels", async (req, res) => {
  try {
    const result = await hotelRepository.getAllHotels();
    res.send(result);
  } catch (error) {
    throw new Error("Trouble getting all hotels");
  }
});
app.get("/hotel-id", async (req, res) => {
  try {
    const { id } = req.body;
    const result = await hotelRepository.getHotelById(id);
    res.send(result);
  } catch (error) {
    throw new Error("Couldn't find an hotel with that id");
  }
});
app.get("/hotel-name", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await hotelRepository.getHotelByName(name);
    res.send(result);
  } catch (error) {
    throw new Error("Hotel not found");
  }
});
app.get("/hotel-location", async (req, res) => {
  try {
    const { location } = req.body;
    const result = await hotelRepository.getHotelByLocation(location);
    res.send(result);
  } catch (error) {
    throw new Error("Any hotel were find at that location");
  }
});
app.get("/hotel-price", async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.body;
    const result = await hotelRepository.getHotelByPrice({
      minPrice,
      maxPrice,
    });
    res.send(result);
  } catch (error) {
    throw new Error("We don't have an hotel in that range of price");
  }
});
app.delete("/delete", async (req, res) => {
  const { id } = req.body;
  const result = await hotelRepository.deleteHotel(id);
  res.send(result);
});
app.delete("/delete-all", async (req, res) => {
  const { id } = req.session.user;
  const result = await hotelRepository.deleteAllHotelsUser(id);
  res.send(result);
});
app.patch("/modify-hotel", async (req, res) => {
  const { name, lastname, id } = req.session.user;
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
  } = req.body;
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
    });
    res.send(result);
  } catch (error) {
    throw new Error(error);
  }
});
app.listen(port, () => {
  console.log(`running in port ${port}`);
});
