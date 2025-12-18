const express = require('express');

const router = express.Router();

router.get('/getActiveCouponCode', async (req, res) => {

    try {
        const activeCouponCode = {
            code: "FORYOU50",
            amountValue: 548,
        };

        res.status(200).json(activeCouponCode);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }



});

module.exports = router;