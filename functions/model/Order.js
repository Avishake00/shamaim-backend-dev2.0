const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentMethods = {
  values: ["card", "cash"],
  message: "enum validator failed for payment Methods",
};
const orderSchema = new Schema(
  {
    items: { type: [Schema.Types.Mixed], required: true },
    totalAmount: { type: Number },
    totalItems: { type: Number },
    user: { type: Schema.Types.ObjectId },
    paymentDetails: { type: [Schema.Types.Mixed] },
    payMode: { type: String },
    shiprocketResponse: { type: [Schema.Types.Mixed] }, // Adjust the type as per the structure of the Shiprocket response
    // status: { type: String, default: 'pending' },
    orderStatus:{type:String},
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "canceled", "returned"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const virtual = orderSchema.virtual("id");
virtual.get(function () {
  return this._id;
});
orderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});



exports.Order = mongoose.model("Order", orderSchema);
