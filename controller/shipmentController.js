// controllers/shipmentController.js

// Import Shiprocket SDK or use HTTP requests directly
// Example using Axios for HTTP requests
const axios = require('axios');

// Define functions to interact with Shiprocket API
exports.createShipment = async (req, res) => {
    try {
        // Fetch shipping details from request body
        const { name, address, email, phone } = req.body;

        // Make API call to Shiprocket to create a shipment
        const response = await axios.post('SHIPROCKET_API_ENDPOINT', {
            name,
            address,
            email,
            phone
            // Add other necessary details like weight, mode of shipping, etc.
        }, {
            headers: {
                'Authorization': 'Bearer YOUR_SHIPROCKET_API_KEY'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
