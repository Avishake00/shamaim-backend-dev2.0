
const mongoose=require('mongoose');

const {Schema}=mongoose;

const constusSchema=new Schema({
    name:{type:String ,required:true},
    email:{type:String,required:true},
    query:{type:String,required:true}
})

exports.Contact=mongoose.model('Contactus',constusSchema);