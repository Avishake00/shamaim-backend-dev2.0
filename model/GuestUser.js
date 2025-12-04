const mongoose = require('mongoose');
const { Schema } = mongoose;

const guestUserSchema = new Schema({
    name: { type: String },
    email: { type: String },
    cart: [
        {
            productId: { type: String },
            price: { type: Number },
            qty: { type: Number },
            size: {
                name: { type: String },
                inStock: { type: Boolean }
            }
        }
    ],
    address: {
        street: { type: String },
        city: { type: String },
        pinCode: { type: String },
        state: { type: String },
        phone: { type: String }
    }
},
    {
        timestamps: true
    });

exports.GuestUser = mongoose.model('GuestUser', guestUserSchema);
