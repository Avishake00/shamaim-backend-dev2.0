// routes/shipmentRoutes.js

const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');

// Route to create a shipment
router.post('/shipment', shipmentController.createShipment);

module.exports = router;
