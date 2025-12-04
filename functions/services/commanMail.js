const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "shamaimlifestyle@gmail.com", // Correct property name
    pass: "umra wlun hapd ljsn",        // Correct property name
  },
});

function sendNodemail(to, subject, text, html) {
  try {
    const mailOptions = {
      from: "shamaimlifestyle@gmail.com",
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return error;
      } else {
        console.log("Mail sent successfully:", info.response);
        return "Mail sent successfully";
      }
    });
  } catch (error) {
    console.error("Error in sendNodemail function:", error);
    return error;
  }
}

module.exports = { sendNodemail };
