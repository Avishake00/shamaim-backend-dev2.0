const express = require("express");
const {
  confirmOrder,
  createRazorpayOrder,
  fetchOrdersByUser,
  deleteOrder,
  updateOrder,
  fetchAllOrders,
  cancelOrder,
  returnOrder,
  fetchOrderById,
  fetchOrderByIdFormDb,
  fechallproductsdummy,
  fetchproductbasedonId
  
} = require("../controller/Order");

const router = express.Router();
//  /orders is already added in base path
router
  .post("/", confirmOrder)
  .post("/create", createRazorpayOrder)
  .get("/own/:id", fetchOrdersByUser)
  .delete("/:id", deleteOrder)
  .patch("/:id", updateOrder)
  .get("/", fetchAllOrders)
  .get("/order/:orderId",fetchOrderById)
  .get("/product/:productId",fetchOrderByIdFormDb)
  .post("/:orderId/cancel", cancelOrder)
  .post("/:orderId/return", returnOrder)
  .get('/productOrder/:id',fetchproductbasedonId)


exports.router = router;
