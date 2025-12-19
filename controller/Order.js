const mongoose = require("mongoose");
const { Order } = require("../model/Order");
const { nanoid } = require("nanoid");
const { Product } = require("../model/Product");
const { returnOrder } = require('../model/ReturnOrder');
const { User } = require("../model/User");
const { sendMail, invoiceTemplate } = require("../services/common");
const axios = require("axios");
const Razorpay = require("razorpay");
const { SendMailClient } = require("zeptomail");
const { log } = require("firebase-functions/logger");
const url = "api.zeptomail.in/";
const token =
  "Zoho-enczapikey PHtE6r1eEOi+j2F89xIAsfO6HsD2YIp4/+piJQIWtIxCDKIHH01Q+I8qm2LlrRt8B6FKEveTwNlt4r2a4brRLWq/NWYeW2qyqK3sx/VYSPOZsbq6x00atV8Sf0TdXYTmdNZv1yPWu97TNA==";

const shiprocketBaseUrl = "https://apiv2.shiprocket.in/v1/external/";
const productDimensions = {
  length: 19,
  breadth: 2.5,
  height: 19,
  weight: 0.35,
};

const getProductsStats = (items) => {
  let totalProductQuantity = 0;
  let totalProductPrice = 0;

  items.forEach((item) => {
    totalProductQuantity += parseInt(item.units);
    totalProductPrice += parseFloat(item.selling_price) * parseInt(item.units);
  });

  return {
    totalProductQuantity,
    totalProductPrice,
    totalLength: productDimensions.length,
    totalBreadth: productDimensions.breadth * totalProductQuantity,
    totalHeight: productDimensions.height,
    totalWeight: productDimensions.weight * totalProductQuantity,
  };
};

// Backend code
// exports.createRazorpayOrder = async (req, res) => {
//   const { amount } = req.body;
//   const instance = new Razorpay({
//     key_id: "rzp_live_3vTiOMXqTXi6Si",
//     key_secret: "YASBZBBF2PyzVlUqDhLFAzKf",
//   });

//   try {
//     const razorpayResponse = await instance.orders.create({
//       amount: amount * 100,
//       currency: "INR",
//       order: req.body.order,
//     });

//     await confirmOrder(razorpayResponse);

//     res.send(razorpayResponse);
//   } catch (error) {
//     res.status(400).json(error);
//   }
// };

// Function to confirm the order with payment details
// const confirmOrder = async (paymentDescription) => {
//   try {
//     console.log("Payment details:", paymentDescription);
//   } catch (err) {
//     console.error("Error confirming order:", err);
//     // Handle error if necessary
//   }
// };

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const instance = new Razorpay({
      key_id: "rzp_live_3vTiOMXqTXi6Si",
      key_secret: "YASBZBBF2PyzVlUqDhLFAzKf",
    });

    const razorpayOrder = await instance.orders.create({
      amount: amount * 100,
      currency: "INR",
    });

    console.log("Payment details:", razorpayOrder);

    return res.status(200).json(razorpayOrder);

  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      pincode,
      state,
      email,
      phone,
      items,
      paymentDetails,
      user
    } = req.body;

    console.log("printing from confirm order:", req.body);

    /* ---------- VALIDATIONS ---------- */
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    if (!paymentDetails?.payMode) {
      return res.status(400).json({ message: "Payment method missing" });
    }

    /* ---------- EMAIL FALLBACK ---------- */
    if (!email && user) {
      try {
        const userDoc = await User.findById(user).select("email");
        if (userDoc) email = userDoc.email;
      } catch (err) {
        console.error("Email fallback failed:", err.message);
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Resolved email:", email);

    /* ---------- PRODUCT STATS ---------- */
    console.log("Items before stats:", items);
    const productStats = getProductsStats(items);

    /* ---------- SHIPROCKET PAYLOAD ---------- */
    const orderPayload = {
      order_id: nanoid(),
      order_date: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
      pickup_location: "Primary 2",
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: addressLine1,
      billing_address_2: addressLine2,
      billing_city: city,
      billing_pincode: Number(pincode),
      billing_state: state,
      billing_country: "India",
      billing_email: email,
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: items,
      payment_method: paymentDetails.payMode,
      sub_total: productStats.totalProductPrice,
      length: productStats.totalLength,
      breadth: productStats.totalBreadth,
      height: productStats.totalHeight,
      weight: productStats.totalWeight,
    };

    console.log("Order Payload:", orderPayload);

    /* ---------- SHIPROCKET API (MANDATORY) ---------- */
    const shiprocketResponse = await axios.post(
      `${shiprocketBaseUrl}orders/create/adhoc`,
      orderPayload,
      {
        headers: {
          Authorization: req.headers.authorization || req.headers.Authorization,
          "Content-Type": "application/json",
        },
      }
    );

    /* ---------- SAVE ORDER (MANDATORY) ---------- */
    const savedOrder = await new Order({
      ...req.body,
      email,
      shiprocketResponse: shiprocketResponse.data,
    }).save();

    console.log("Order saved successfully:", savedOrder._id);

    /* ---------- STOCK UPDATE (OPTIONAL) ---------- */
    try {
      for (const item of items) {
        const product = await Product.findById(item.productid);

        if (!product) {
          console.warn("Product not found:", item.productid);
          continue;
        }

        const size = item.size;
        if (!size) {
          console.warn("Size missing for product:", product._id);
          continue;
        }

        if (!Array.isArray(product.stock) || !product.stock[0]) {
          console.warn("Stock structure invalid for product:", product._id);
          continue;
        }

        const stock = product.stock[0];

        const qtyToReduce = Number(item.units || item.quantity || 0);

        if (!stock.hasOwnProperty(size)) {
          console.warn(`Size ${size} not found in stock for product`, product._id);
          continue;
        }

        if (stock[size] < qtyToReduce) {
          console.warn(
            `Insufficient stock for product ${product._id}, size ${size}`
          );
          continue;
        }

        stock[size] -= qtyToReduce;

        product.markModified("stock"); // IMPORTANT for nested object
        await product.save({ validateBeforeSave: false });

        console.log(
          `Stock updated: Product ${product._id}, Size ${size}, Remaining ${stock[size]}`
        );
      }

      console.log("Stock update process completed");
    } catch (err) {
      console.error("Stock update failed:", err);
    }

    /* ---------- EMAIL (OPTIONAL) ---------- */
    try {
      const client = new SendMailClient({ url, token });
      await client.sendMail({
        from: { address: "support@shamaim.in", name: "Shamaim" },
        to: [{ email_address: { address: email, name: firstName } }],
        subject: "Order Confirmation - Shamaim.in",
        htmlbody: "<b>Your order has been placed successfully.</b>",
      });
      console.log("Order email sent successfully");
    } catch (err) {
      console.error("Email sending failed:", err.message);
    }

    return res.status(200).json(savedOrder);

  } catch (err) {
    console.error("Order creation failed:", err);
    return res.status(500).json({
      message: "Error creating order",
      error: err.message,
    });
  }
};

const crypto = require("crypto");

exports.confirmPrepaidOrder = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      pincode,
      state,
      email,
      phone,
      items,
      paymentDetails,
      user
    } = req.body;

    console.log("printing from confirm prepaid order:", req.body);

    /* ---------- VALIDATIONS ---------- */
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    if (
      !paymentDetails?.razorpay_order_id ||
      !paymentDetails?.razorpay_payment_id ||
      !paymentDetails?.razorpay_signature
    ) {
      return res.status(400).json({ message: "Razorpay payment details missing" });
    }

    /* ---------- RAZORPAY SIGNATURE VERIFY ---------- */
    const body =
      paymentDetails.razorpay_order_id +
      "|" +
      paymentDetails.razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", "YASBZBBF2PyzVlUqDhLFAzKf")
      .update(body)
      .digest("hex");

    if (expectedSignature !== paymentDetails.razorpay_signature) {
      return res.status(400).json({ message: "Invalid Razorpay signature" });
    }

    /* ---------- EMAIL FALLBACK ---------- */
    if (!email && user) {
      try {
        const userDoc = await User.findById(user).select("email");
        if (userDoc) email = userDoc.email;
      } catch (err) {
        console.error("Email fallback failed:", err.message);
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Resolved email:", email);

    /* ---------- PRODUCT STATS ---------- */
    const productStats = getProductsStats(items);

    /* ---------- SHIPROCKET PAYLOAD ---------- */
    const orderPayload = {
      order_id: nanoid(),
      order_date: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
      pickup_location: "Primary 2",

      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: addressLine1,
      billing_address_2: addressLine2,
      billing_city: city,
      billing_pincode: Number(pincode),
      billing_state: state,
      billing_country: "India",
      billing_email: email,
      billing_phone: phone,

      shipping_is_billing: true,
      order_items: items,
      payment_method: "Prepaid",

      sub_total: productStats.totalProductPrice,
      length: productStats.totalLength,
      breadth: productStats.totalBreadth,
      height: productStats.totalHeight,
      weight: productStats.totalWeight
    };

    console.log("Prepaid Order Payload:", orderPayload);

    /* ---------- SHIPROCKET API ---------- */
    const shiprocketResponse = await axios.post(
      `${shiprocketBaseUrl}orders/create/adhoc`,
      orderPayload,
      {
        headers: {
          Authorization: req.headers.authorization || req.headers.Authorization,
          "Content-Type": "application/json"
        }
      }
    );

    /* ---------- SAVE ORDER ---------- */
    const savedOrder = await new Order({
      ...req.body,
      email,
      paymentMethod: "online",
      paymentStatus: "paid",
      shiprocketResponse: shiprocketResponse.data
    }).save();

    console.log("Prepaid order saved:", savedOrder._id);

    /* ---------- STOCK UPDATE ---------- */
    try {
      for (const item of items) {
        const product = await Product.findById(item.productid);

        if (!product) continue;

        const size = item.size;
        if (!size) continue;

        if (!Array.isArray(product.stock) || !product.stock[0]) continue;

        const stock = product.stock[0];
        const qtyToReduce = Number(item.units || 0);

        if (!stock.hasOwnProperty(size)) continue;
        if (stock[size] < qtyToReduce) continue;

        stock[size] -= qtyToReduce;
        product.markModified("stock");

        await product.save({ validateBeforeSave: false });

        console.log("Stock updated successfully");
      }
    } catch (err) {
      console.error("Stock update failed:", err);
    }

    /* ---------- EMAIL ---------- */
    try {
      const client = new SendMailClient({ url, token });
      await client.sendMail({
        from: { address: "support@shamaim.in", name: "Shamaim" },
        to: [{ email_address: { address: email, name: firstName } }],
        subject: "Order Confirmation - Shamaim.in",
        htmlbody: "<b>Your prepaid order has been placed successfully.</b>"
      });
    } catch (err) {
      console.error("Email sending failed:", err.message);
    }

    return res.status(200).json(savedOrder);

  } catch (err) {
    console.error("Prepaid order creation failed:", err);
    return res.status(500).json({
      message: "Error creating prepaid order",
      error: err.message
    });
  }
};


exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndDelete(id);
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json({ err: "err accou " });
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchAllOrders = async (req, res) => {
  let query = Order.find({ deleted: { $ne: true } });
  let totalOrdersQuery = Order.find({ deleted: { $ne: true } });

  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
  }

  const totalDocs = await totalOrdersQuery.count().exec();
  console.log({ totalDocs });

  if (req.query._page && req.query._limit) {
    const pageSize = req.query._limit;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  try {
    const docs = await query.exec();
    res.set("X-Total-Count", totalDocs);
    res.status(200).json(docs);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const response = await axios.post(
      `${shiprocketBaseUrl}orders/cancel`,
      { ids: [orderId] },
      {
        headers: {
          Authorization: req.headers.Authorization,
          "Content-Type": "application/json",
        },
      }
    );
    res.send({ message: "Order has been canceled" });
  } catch (error) {
    res.status(400).json({
      message: "Error canceling order",
      error: error.message,
      err: error,
    });
  }
};

exports.returnOrder = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      pincode,
      state,
      email,
      phone,
      items,
      orderid // fixed typo
    } = req.body;

    let productStats = getProductsStats(items);
    let reqModal = {
      // unique ID here
      order_id: nanoid(),
      order_date: new Date()
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, ""),
      pickup_customer_name: firstName,
      pickup_last_name: lastName,
      pickup_address: addressLine1,
      pickup_address_2: addressLine2,
      pickup_city: city,
      pickup_pincode: pincode,
      pickup_state: state,
      pickup_country: "India",
      pickup_email: email,
      pickup_phone: phone,
      shipping_customer_name: "Niladri",
      shipping_last_name: "Biswas",
      shipping_address: "11B, Bowali Mondal Road",
      shipping_address_2: "",
      shipping_city: "Kolkata",
      shipping_pincode: "700026",
      shipping_country: "India",
      shipping_state: "West Bengal",
      shipping_email: "shamaimlifestyle@gmail.com",
      shipping_phone: "9875505219",
      order_items: items,
      payment_method: "Prepaid",
      sub_total: productStats.totalProductPrice,
      length: productStats.totalLength,
      breadth: productStats.totalBreadth,
      height: productStats.totalHeight,
      weight: productStats.totalWeight,
    };

    const response = await axios.post(
      `${shiprocketBaseUrl}orders/create/return`,
      reqModal,
      {
        headers: {
          Authorization: req.headers.Authorization,
          "Content-Type": "application/json",
        },
      }
    );

    if (response) {
      try {
        const orderId = orderid;
        for (const item of items) {
          const itemId = item.id;
          await Order.findOneAndUpdate(
            { _id: orderId, "items.id": itemId },
            { $set: { "items.$.orderStatus": "returned" } },
            { new: true }
          );
        }

        res.send({ message: "Order has been returned" });
      } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).send({ message: "Error updating order status", error: error.message });
      }
    } else {
      console.error("Return order request unsuccessful:", response.statusText);
      res.status(400).send({ message: "Return order request unsuccessful", error: response.statusText });
    }
  } catch (error) {
    res.status(400).json({
      message: "Error processing return order",
      error: error.message,
    });
  }
};


exports.fetchOrdersByUser = async (req, res) => {
  const id = req.params.id;
  try {
    const orders = await Order.find({ user: id });
    console.log(orders);
    res.status(200).json(orders);
  } catch (err) {
    res.status(400).json(err);
  }
};


exports.fetchOrderByIdFormDb = async (req, res) => {
  try {
    const productId = req.params.productId;
    const order = await Order.findById({ _id: productId });
    const productorder = order;
    const orderId = productorder?.shiprocketResponse[0]?.order_id;
    const response = await axios.get(
      `${shiprocketBaseUrl}orders/show/${orderId}`,
      {
        headers: {
          Authorization: req.headers.Authorization,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json(response.data.data);
  } catch (err) {
    console.log("get err sucessfully");
  }
};

exports.fetchOrderById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const response = await axios.get(
      `${shiprocketBaseUrl}orders/show/${orderId}`,
      {
        headers: {
          Authorization: req.headers.Authorization,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    res.status(400).json({
      message: "Error fetching order",
      error: err.message,
    });
  }
};


exports.fetchproductbasedonId = async (req, res) => {
  const id = req.params.id;
  const data = await Order.findById({ _id: id });
  res.send(data);
}




