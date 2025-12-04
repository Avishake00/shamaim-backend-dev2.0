
const {mongoose, Types}=require('mongoose');

const {Schema}=require('mongoose');


const returnorderSchema=new Schema({
    
        items: { type: [Schema.Types.Mixed], required: true },
        totalAmount: { type: Number },
        totalItems: { type: Number },
        user: { type: Schema.Types.ObjectId },
        paymentDetails: { type: [Schema.Types.Mixed] },
        payMode: { type: String },
        shiprocketResponse: { type: [Schema.Types.Mixed] }, // Adjust the type as per the structure of the Shiprocket response
        // status: { type: String, default: 'pending' },
        status: {
          type: String,
          enum: ["pending", "shipped", "delivered", "canceled", "returned"],
          default: "pending",
        },
      },
      { timestamps: true }
    );
    
    const virtual = returnorderSchema.virtual("id");
    virtual.get(function () {
      return this._id;
    });
    returnorderSchema.set("toJSON", {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        delete ret._id;
      },
    });
    

exports.returnOrder=mongoose.model('returnoreder',returnorderSchema);
