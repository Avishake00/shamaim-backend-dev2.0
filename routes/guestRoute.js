const express = require('express');
const { GuestUser } = require('../model/GuestUser');
const { confirmOrder } = require('../controller/Order');

const router = express.Router();

router.get('/getCart/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await GuestUser.findById(id).populate({
            path: 'cart.productId',
            model: 'Product'
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const subtotal = user.cart.reduce((total, item) => {
            return total + (item.price * item.qty);
        }, 0);

        res.status(200).json({
            cart: user.cart,
            subtotal: subtotal
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/addToCart', async (req, res) => {
    try {
        const { productId, price, qty, size } = req.body;

        const item = {
            productId: productId,
            price: price,
            qty: qty,
            size: size
        }

        console.log(item);

        const newUser = new GuestUser({
            name: 'guest',
            email: 'guest',
            cart: [item]
        });

        await newUser.save();

        res.status(200).json({ message: "Item added to cart", guestUserId: newUser._id });
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

router.put('/addToCart/:id', async (req, res) => {
    try {
        const { productId, price, qty, size } = req.body;
        const { id } = req.params;

        const user = await GuestUser.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if product with same size already exists
        const productExists = user.cart.some(
            item =>
                item.productId.toString() === productId &&
                item.size === size
        );

        if (productExists) {
            return res.status(400).json({ message: "Product already in cart with same size." });
        }

        user.cart.push({
            productId,
            price,
            qty,
            size: size
        });

        await user.save();

        res.status(200).json({ message: "Item added to cart" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.put('/clearCart/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await GuestUser.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.cart = [];

        await user.save();

        res.status(200).json({ message: "Cart is cleared" });
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

router.put('/updateCartQty/:userId/:id', async (req, res) => {
    try {
        const { userId, id } = req.params;
        const { qty } = req.body;

        const user = await GuestUser.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const item = user.cart.find(item => item.id === id);
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        item.qty = qty;

        await user.save();

        res.status(200).json({ message: "Item quantity updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

router.put('/removeCartItem/:userId/:itemId', async (req, res) => {
    try {
        const { userId, itemId } = req.params;

        const user = await GuestUser.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.cart = user.cart.filter(item => item._id.toString() !== itemId);

        await user.save();

        res.status(200).json({ message: "Item removed from cart successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/addAddress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { data } = req.body;

        const user = await GuestUser.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isUpdate =
            user.address &&
            (user.address.street ||
                user.address.city ||
                user.address.state ||
                user.address.pinCode ||
                user.address.phone);

        user.name = data.name;
        user.email = data.email;

        user.address = {
            street: data.street,
            city: data.city,
            state: data.state,
            pinCode: data.pinCode,
            phone: data.phone,
        };

        await user.save();

        res.status(200).json({
            message: isUpdate
                ? "Shipping address updated successfully."
                : "Shipping address added successfully.",
            address: {
                name: user.name,
                email: user.email,
                address: user.address,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/getGuestAddress/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await GuestUser.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.name === "guest" || user.email === "guest" || !user.address) {
            return res.status(200).json({});
        }

        const address = {
            name: user.name, email: user.email, address: user.address
        };

        res.status(200).json(address);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;