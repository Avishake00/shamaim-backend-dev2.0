const axios = require("axios");

const shiprocketBaseUrl = "https://apiv2.shiprocket.in/v1/external/";

const productDimensions = {
  length: 30,
  breadth: 15,
  height: 10,
  weight: 0.5,
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
    totalLength: productDimensions.length * totalProductQuantity,
    totalBreadth: productDimensions.breadth * totalProductQuantity,
    totalHeight: productDimensions.height * totalProductQuantity,
    totalWeight: productDimensions.weight * totalProductQuantity,
  };
};

exports.createOrder = async (req, res) => {
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
      payMode,
    } = req.body;
    let productStats = getProductsStats(items);
    let reqModal = {
      // create a unique ID here
      order_id: "542847284",
      order_date: new Date()
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, ""),
      pickup_location: "Primary",
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: addressLine1,
      billing_address_2: addressLine2,
      billing_city: city,
      billing_pincode: pincode,
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
      payment_method: payMode,
      sub_total: productStats.totalProductPrice,
      length: productStats.totalLength,
      breadth: productStats.totalBreadth,
      height: productStats.totalHeight,
      weight: productStats.totalWeight,
    };
    const response = await axios.post(
      `${shiprocketBaseUrl}orders/create/adhoc`,
      reqModal,
      {
        headers: {
          Authorization: req.headers.Authorization,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(201).json(response.data);
  } catch (err) {
    res.status(400).json({
      message: "Error creating order",
      error: err.message,
    });
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

exports.fetchAllOrders = async (req, res) => {
  try {
    const response = await axios.get(`${shiprocketBaseUrl}orders`, {
      headers: {
        Authorization: req.headers.Authorization,
        "Content-Type": "application/json",
      },
    });
    res.status(200).json(response.data);
  } catch (err) {
    res.status(400).json({
      message: "Error fetching orders",
      error: err.message,
    });
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
    } = req.body;
    let productStats = getProductsStats(items);
    let reqModal = {
      // unique ID here
      order_id: "",
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
    res.send({ message: "Order has been returned" });
  } catch (error) {
    res.status(400).json({
      message: "Error canceling order",
      error: error.message,
    });
  }
};
