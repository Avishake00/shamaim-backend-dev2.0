
const { SendMailClient } = require("zeptomail");
const { User } = require("../model/User");

const url = "api.zeptomail.in/";
const token = "Zoho-enczapikey PHtE6r1eEOi+j2F89xIAsfO6HsD2YIp4/+piJQIWtIxCDKIHH01Q+I8qm2LlrRt8B6FKEveTwNlt4r2a4brRLWq/NWYeW2qyqK3sx/VYSPOZsbq6x00atV8Sf0TdXYTmdNZv1yPWu97TNA==";


exports.sendNewRelease = async (req, res) => {
  try {
    let client = new SendMailClient({ url, token });
    const users = await User.find({}, "email").exec();
    const emails = users.map((user) => user.email);

    const sendMailPromises = emails.map((email) => {
      return client.sendMail({
        from: {
          address: "noreply@shamaim.in",
          name: "noreply"
        },
        to: [
          {
            email_address: {
              address: email,
              name: "User"
            }
          }
        ],
        subject: "New Release Notification",
        htmlbody: "<div><b>We are excited to announce a new release on our e-commerce platform! Visit our website to check it out.</b></div>",
      });
    });

    await Promise.all(sendMailPromises);

    res.status(200).send("All emails sent successfully");
  } catch (error) {
    console.error("Error sending emails: ", error);
    res.status(500).send("An error occurred while sending emails");
  }
};
