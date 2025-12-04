// const { onRequest } = require("firebase-functions/v2/https");s
const express = require("express");
const server = express();
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const productsRouter = require("./routes/Products");
const categoriesRouter = require("./routes/Categories");
const brandsRouter = require("./routes/Brands");
const usersRouter = require("./routes/Users");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const ordersRouter = require("./routes/Order");
const { User } = require("./model/User");
const path = require("path");
const constrouter=require('./routes/ContactUsRouter');
const ShiprocketRouter = require("./routes/Shiprocket");
const newRealise=require('./routes/newRealise');
const opts = {};

const guestRoutes = require('./routes/guestRoute');


server.use(express.static(path.resolve(__dirname, "build")));
server.use(cookieParser());

server.use(cors());
server.use(express.json());

// Error handling middleware
server.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err.message);
    return res.status(400).send('Bad Request');
  }
  next();
});

server.use(express.urlencoded({ extended: true }));

const addAuthTokenToHeader = require("./middleware");
server.use(addAuthTokenToHeader);

server.use("/shiprocket", ShiprocketRouter.router);
server.use("/products", productsRouter.router);
server.use("/categories", categoriesRouter.router);
server.use("/brands", brandsRouter.router);
server.use("/users", usersRouter.router);
server.use("/auth", authRouter.router);
server.use("/cart", cartRouter.router);
server.use("/orders", ordersRouter.router);
server.use('/conatctus',constrouter.router);
server.use('/',newRealise.router);
server.use('/api', guestRoutes);

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(
    "mongodb+srv://shamaimlifestyle:MXJsc3m5nhH0yr8v@shamaimbackend.lraiidg.mongodb.net/"
  );
  console.log("database connected");
}

server.listen(8080,(req,res)=>{
  console.log("server is running on port 8080");
})

// server.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "build", "index.html"));
// });

// exports.helloWorld = onRequest((req, res) => {
//   server(req, res);
// });

