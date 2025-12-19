const express = require('express');

const router = express.Router();

router.get('/getActiveCouponCode', async (req, res) => {

    try {
        const activeCouponCodeArray = [
            {
                code: "FORYOU50",
                amountValue: 50,
            },
            {
                code: "TEST@25",
                amountValue: 548,
            }
        ];

        res.status(200).json(activeCouponCodeArray);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }



});

module.exports = router;