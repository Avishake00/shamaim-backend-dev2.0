const axios = require("axios");

let shiprocketAuthToken = null;

const authenticateShiprocket = async () => {
  console.log("Authenticating Shiprocket");
  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: "kunalkamat3@gmail.com",
        password: "kunal@shiprocket",
      }
    );
    shiprocketAuthToken = response.data.token;
    console.log("Authentication successful. Token:", shiprocketAuthToken);
  } catch (error) {
    console.error("Authentication failed:", error.response.data);
  }
};

const addAuthTokenToHeader = async (req, res, next) => {
  if (!shiprocketAuthToken) {
  await authenticateShiprocket();
  }
  if (shiprocketAuthToken) {
    req.headers["Authorization"] = `Bearer ${shiprocketAuthToken}`;
    req.headers["Content-Type"] = "application/json";
  }
  next();
};

module.exports = addAuthTokenToHeader;
