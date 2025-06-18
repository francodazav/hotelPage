import express from "express";
import { infoDb, SECRET_KEY } from "./const/const.js";
import { createTables } from "./tables/tables.js";
import { userRepository } from "./repos/userRepository.js";
import cookieParser from "cookie-parser";
import pkg from "jsonwebtoken";
import { hotelRepository } from "./repos/hotelRepository.js";
import { rsvRepository } from "./repos/rsvRepository.js";
const port = process.env.PORT || 3000;

const { verify, sign } = pkg;
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
  res.status(200).send(result.rows);
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
    .status(200)
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
    capacity,
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
      capacity,
    });
    res.status(200).send(result);
  } catch (error) {
    throw new Error("Problem uploading your hotel");
  }
  res.send(user);
});
app.get("/all-hotels", async (req, res) => {
  try {
    const result = await hotelRepository.getAllHotels();
    res.status(200).send(result);
  } catch (error) {
    throw new Error("Trouble getting all hotels");
  }
});
app.get("/hotel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await hotelRepository.getHotelById(id);
    if (result === null) {
      res
        .status(400)
        .send({ message: "Not hotels found with that specifications" });
    } else {
      res.status(200).send(result);
    }
  } catch (error) {
    throw new Error("Couldn't find an hotel with that id");
  }
});

app.get("/hoteles", async (req, res) => {
  const { lowPrice, highPrice, rate, city, country, name } = req.query;
  console.log("sad");
  let filters = {};
  if (lowPrice & highPrice) {
    filters.lowPrice = lowPrice;
    filters.highPrice = highPrice;
  }
  if (rate) {
    filters.rate = rate;
  }
  if (city) {
    filters.city = city;
  }
  if (country) {
    filters.country = country;
  }
  if (name) {
    filters.name = name;
  }
  try {
    const result = await hotelRepository.searchHotel(filters);
    if (result.length > 0) {
      res.status(200).send(result);
    } else {
      res.status(400).send({ message: "Any hotels was found" });
    }
  } catch (error) {
    // res.status(500).send({ message: "Problem getting the hotels" });
    throw new Error(error);
  }
});
// app.get("/hotel-price", async (req, res) => {
//   try {
//     console.log(req.query);
//     const { minPrice, maxPrice } = req.query;
//     console.log(minPrice, maxPrice);
//     const result = await hotelRepository.getHotelByPrice({
//       minPrice,
//       maxPrice,
//     });
//     if (result && result.length > 0) {
//       res.status(200).send(result);
//     } else {
//       res.status(404).send({ message: "Not hotels found in this range" });
//     }
//   } catch (error) {
//     throw new Error(error);
//   }
// });
// app.get("/hotel/rate", async (req, res) => {
//   const { lowRate, highRate } = req.query;
//   try {
//     const result = await hotelRepository.getHotelRate({ lowRate, highRate });
//     if (result === null) {
//       res
//         .status(400)
//         .send({ message: "Not hotels found with that specifications" });
//     } else {
//       res.status(200).send(result);
//     }
//     if (lowRate <= 0 || highRate > 5) {
//       res.status(400).send({ message: "Invalid range" });
//     }
//   } catch (error) {
//     res.status(500).send({ message: "Problem fetching the hotels" });
//   }
// });
app.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await hotelRepository.deleteHotel(id);
  res.status(200).send(result);
});
app.delete("/delete-all", async (req, res) => {
  const { id } = req.session.user;
  const result = await hotelRepository.deleteAllHotelsUser(id);
  res.status(200).send(result);
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
    capacity,
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
      capacity,
    });
    res.status(200).send(result);
  } catch (error) {
    throw new Error(error);
  }
});
app.post("/disponibility-hotel", async (req, res) => {
  const { hotelId, fechaIn, fechaOut, reason } = req.body;

  try {
    const result = await hotelRepository.changeDisponibility({
      hotelId,
      fechaIn,
      fechaOut,
      reason,
    });
    res.status(200).send(result);
  } catch (error) {
    throw new Error("Problem changing the disponibility of your hotel");
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
    res.status(200).send(result);
  } catch (error) {
    throw new Error(error);
  }
});
app.post("/reservation", async (req, res) => {
  const { id, name, lastname, username, email, type } = req.session.user;
  if (type === 1)
    throw new Error(
      "You are a host, you can't make a reservation. Please create an account as costumer"
    );
  const { hotelId, fechaIn, fechaOut } = req.body;

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
    await rsvRepository.asignDisponibilityRsv({
      hotelId,
      fechaIn,
      fechaOut,
      reason: "reserved",
      rsvConfirmation: result.rsvConfirmation,
    });
    res.status(200).send(res);
  } catch (error) {
    throw new Error(error);
  }
});
app.get("/reservation", async (req, res) => {
  const { id } = req.session.user;
  try {
    const result = await rsvRepository.getReservation(id);
    res.status(200).send(result);
  } catch (error) {
    throw new Error("You don't have any reservations");
  }
});
app.patch("/reservation", async (req, res) => {
  const { id, name, lastname, username, email, type } = req.session.user;
  const { hotelId, fechaIn, fechaOut, rsvId, rsvConfirmation } = req.body;
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
    await rsvRepository.patchDisponibilityRsv({
      hotelId,
      fechaIn,
      fechaOut,
      rsvConfirmation,
      newRsvConfirmation: result.newRsvConfirmation,
    });
    res.status(200).send(result);
  } catch (error) {
    throw new Error("Error updating your reservation");
  }
});
app.delete("/reservation/:rsvConfirmation", async (req, res) => {
  const { rsvConfirmation } = req.params;
  try {
    const result = await rsvRepository.deleteRsv(rsvConfirmation);
    await rsvRepository.deleteDisponibility(rsvConfirmation);
    res.status(200).send(result);
  } catch (error) {
    throw new Error("Problem deleting your reservation");
  }
});
app.delete("/disponibility-hotel", async (req, res) => {
  const { id } = req.body;
  try {
    const result = await hotelRepository.deleteDisponibility(id);
    res.status(200).send(result);
  } catch (error) {
    throw new Error(
      "Some problem has occoured and we can't change the disponibility"
    );
  }
});
app.get("/disponibility/:hotelId", async (req, res) => {
  const { hotelId } = req.params;
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
    res.status(401).send({ message: error });
  }
});
app.get("/hotel/search/disponibility", async (req, res) => {
  const { minPrice, maxPrice, fechaIn, fechaOut, country, city, name } =
    req.query;
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
  console.log("AS");
  try {
    const result = await hotelRepository.searchHotelsDisponibility(filters);
    if (result.length > 0) {
      res.status(200).send(result);
    } else {
      res.status(400).send({ message: "Any hotel was found" });
    }
  } catch (error) {
    throw new Error(error);
  }
});

app.listen(port, () => {
  console.log(`running in port ${port}`);
});
