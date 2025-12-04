const { User } = require("../model/User");
const mongoose = require("mongoose");
const sendZohoMail = require("./zohomail");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client("253251908610-1d8pm8fcsapoodmdpf4slat8a5eusrcg.apps.googleusercontent.com");
const {sendNodemail}=require('../services/commanMail');

exports.loginUser = async (req, res) => {
  try {
    const { email } = req.body;
    
    let user = await User.findOne({ email });

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    if (!user) {
      // If user does not exist, create a new user with email and otp
      user = new User({ email, otp });
      await user.save();
    } else {
      // If user exists, update the otp
      user.otp = otp;
      await user.save();
    }

    // HTML body for the OTP email
    const htmlBody = `<div>
      <p>The OTP is valid only for 5 minutes.</p>
      <p>Content for sending a mail to verify the OTP: ${otp}</p>
    </div>`;

    // Send the OTP email
    await sendNodemail(email, "shamaimUser", "OTP Verification", htmlBody);

    res.send("OTP sent successfully");
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Server error" });
  }
};


exports.verifyOtp = async (req, res) => {
  let { email, otp } = req.body;
  try {

    let CurrentDate = new Date();
    // get user detaila for Otp and updateAt time for cheking time is not greter than 5
    let getUserDetails = await User.findOne({ email });
    let id=getUserDetails.id;
      console.log(id);
    // check  otp time diff is not greter than 5 
    if ((CurrentDate.getMinutes() - getUserDetails.updatedAt.getMinutes()) < 35) {
      if (getUserDetails.otp == otp) {
        res.status(200).send({"id":id});
      } else {
        res.status(200).send("otp not match");
      }
    } else {
      res.send("otp time out please resend again");
    }
  } catch (err) {
    res.status(500).send("interneal server err");
  }
};

exports.checkAuth = async (req, res) => {
  try {
    const _id = req.params.id;

    // Validate the _id
    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Fetch the user
    const user = await User.findOne({ _id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send the user data
    res.send(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.verifyGoogleToken = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "253251908610-1d8pm8fcsapoodmdpf4slat8a5eusrcg.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();

    if (payload) {
      res.json({ success: true, payload });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: "Invalid Google Token" });
  }
};

exports.insertGoogleEmail=async(req,res)=>{
  let {email}=req.query;
  try{
 let user=await User.findOne({email});
 let getUserDetails;
  if(!user){
    let user= new User({email});
    await user.save();
    getUserDetails=await User.findOne({email});
    
  }

  if(user){
    res.send(user.id);
  }
  else if(getUserDetails){
    res.send(getUserDetails.id)
  }
  }
  catch(error){
    res.send(error);
  }
}


