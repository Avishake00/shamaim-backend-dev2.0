const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: Number },
  name:{type:String,required:true},
  role: { type: String, required: true, default:'user' },
  addresses: { type: [Schema.Types.Mixed] }, 
  // for addresses, we can make a separate Schema like orders. but in this case we are fine
  name: { type: String },
  salt: Buffer,
  resetPasswordToken: {type: String, default:''},
  resetPasswordExpires: {type: String, default:''}

},{timestamps: true});

const virtual = userSchema.virtual('id');
virtual.get(function () {
  return this._id;
});
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });


exports.User = mongoose.model('User', userSchema);
