
const contactus=require('../model/ContactUsModel');
const { SendMailClient } = require("zeptomail");

const contact=contactus.Contact;

exports.getContactUs=async(req,res)=>{
  const token ="Zoho-enczapikey PHtE6r1eEOi+j2F89xIAsfO6HsD2YIp4/+piJQIWtIxCDKIHH01Q+I8qm2LlrRt8B6FKEveTwNlt4r2a4brRLWq/NWYeW2qyqK3sx/VYSPOZsbq6x00atV8Sf0TdXYTmdNZv1yPWu97TNA==";
  const url = "api.zeptomail.in/";
  let client = new SendMailClient({ url, token });
 const{email,name,query}=req.body;

 let data=await new contact(req.body);

 try{
  await data.save();
  client
  .sendMail({
    from: {
      address: "support@shamaim.in",
      name: "shamaim",
    },
    to: [
      {
        email_address: {
          address: email,
          name: name,
        },
      },
    ],
    subject: "Order Confirmation -Thank You for contactus with Shamaim.in!",
    htmlbody: "<div><b> Thank you for choosing Shamaim.in, your trusted online destination for trendy and fashionable clothing. We are delighted to inform you that your complained register sucessfully we will reach out sortly .</b></div>",
  })
  .then((resp) =>
     console.log("Email send sucessfully"))
  .catch((error) => {
    console.log("err accoured");
  });

  res.status(201).json({"sucess":"your complained register sucessfully"});

 }
 catch(err){
   return res.json({"err":"err accoured while sending the data to you"});
 }

}
