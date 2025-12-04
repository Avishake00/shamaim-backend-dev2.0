const { Order } = require("../model/Order");
const { nanoid } = require("nanoid");
const { Product } = require("../model/Product");
const {returnOrder}=require('../model/ReturnOrder');
const { User } = require("../model/User");
const { sendMail, invoiceTemplate } = require("../services/common");
const axios = require("axios");
const Razorpay = require("razorpay");
const { SendMailClient } = require("zeptomail");
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
exports.createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;
  const instance = new Razorpay({
    key_id: "rzp_live_3vTiOMXqTXi6Si",
    key_secret: "YASBZBBF2PyzVlUqDhLFAzKf",
  });

  try {
    const razorpayResponse = await instance.orders.create({
      amount: amount * 100,
      currency: "INR",
      order: req.body.order,
    });

    await confirmOrder(razorpayResponse);

    res.send(razorpayResponse);
  } catch (error) {
    res.status(400).json(error);
  }
};
// Function to confirm the order with payment details
const confirmOrder = async (paymentDescription) => {
  try {
    console.log("Payment details:", paymentDescription);
    console.log(paymentDescription);
  } catch (err) {
    console.error("Error confirming order:", err);
    // Handle error if necessary
  }
};

exports.confirmOrder = async (req, res) => {
  // Extract required fields from the request body
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
      paymentDetails,
    } = req.body;

    for (let item of items) {
      const productId = item.id;
      if (productId) {
        const product = await Product.findOne({ _id: productId });
        // Continue with product processing
      } else {
        // Handle the case where product ID is not available
        console.log("not found");
      }
    }

    // Create Shiprocket order payload
    const productStats = getProductsStats(items);
    const orderPayload = {
      // create a unique ID here
      order_id: nanoid(),
      order_date: new Date()
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, ""),
      pickup_location: "Primary 2",
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: addressLine1,
      billing_address_2: addressLine2,
      billing_city: city,
      billing_pincode: parseInt(pincode),
      billing_state: state,
      billing_country: "India",
      billing_email: email,
      billing_phone: phone,
      shipping_is_billing: true,
      shipping_customer_name: "",
      shipping_last_name: "",
      shipping_address: "",
      shipping_address_2: "",
      shipping_city: "",
      shipping_pincode: "",
      shipping_country: "",
      shipping_state: "",
      shipping_email: "",
      shipping_phone: "",
      order_items: items,
      payment_method: paymentDetails.payMode,
      sub_total: productStats.totalProductPrice,
      length: productStats.totalLength,
      breadth: productStats.totalBreadth,
      height: productStats.totalHeight,
      weight: productStats.totalWeight,
    };

    // Make request to Shiprocket API to create order
    const response = await axios.post(
      `${shiprocketBaseUrl}orders/create/adhoc`,
      orderPayload,
      {
        headers: {
          Authorization: req.headers.Authorization,
          "Content-Type": "application/json",
        },
      }
    );

    // Save the order to the database
    const order = new Order({
      ...req.body,
      shiprocketResponse: response.data,
    });

    const savedOrder = await order.save();

    // items decresed after sucessfully order
    for (let item of items) {
      const productId = item.productid;
      const productSize = await Product.findById(productId);
      const size = item.size.name;
      const stock = productSize.stock[0];
      let productStock = stock[size];
      if (productStock > 0) {
        stock[size] -= item.units;
        const product = await Product.findByIdAndUpdate(
          productId,
          { stock: stock },
          { new: true }
        );
      }
    }
    let client = new SendMailClient({ url, token });

    // send mail to before getting the order
    client
      .sendMail({
        from: {
          address: "support@shamaim.in",
          name: "shamaim",
        },
        to: [
          {
            email_address: {
              address: email,
              name: firstName,
            },
          },
        ],
        subject: "Order Confirmation -Thank You for Shopping with Shamaim.in!",
        htmlbody: "<div><b> Thank you for choosing Shamaim.in, your trusted online destination for trendy and fashionable clothing. We are delighted to inform you that your order has been successfully placed and is being processed with great care and attention to detail. This email serves as confirmation of your purchase.</b></div>",
      })
      .then((resp) =>
         console.log("Email send sucessfully"))
      .catch((error) => {
        console.log("err accoured");
      });

    res.send(savedOrder).status(200);
  } catch (err) {
    res.status(500).json({
      message: "Error creating order",
      error: err.message,
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

    if (response ) {
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


exports.fetchproductbasedonId=async(req,res)=>{
const id=req.params.id;
const data=await Order.findById({_id:id});
res.send(data);
}




