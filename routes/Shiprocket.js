const express = require("express");
const {
  getToken,
  createOrder,
  fetchOrderById,
  fetchAllOrders,
  cancelOrder,
  returnOrder,
} = require("../controller/Shiprocket");

const router = express.Router();
//  /orders is already added in base path
router
  .post("/create", createOrder)
  .get("/:orderId", fetchOrderById)
  .get("/", fetchAllOrders)
  .post("/:orderId/cancel", cancelOrder)
  .post("/return", returnOrder);

exports.router = router;
