const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/";
const token = "Zoho-enczapikey PHtE6r1eEOi+j2F89xIAsfO6HsD2YIp4/+piJQIWtIxCDKIHH01Q+I8qm2LlrRt8B6FKEveTwNlt4r2a4brRLWq/NWYeW2qyqK3sx/VYSPOZsbq6x00atV8Sf0TdXYTmdNZv1yPWu97TNA==";
let client = new SendMailClient({ url, token });

async function sendZohoMail(email, name, subject, htmlbody) {
    try {
        await client.sendMail({
            from: {
                address: "admin@shamaim.in",
                name: "shamaimlifestyle"
            },
            to: [
                {
                    email_address: {
                        address: email,
                        name: name
                    }
                }
            ],
            subject: subject,
            htmlbody: htmlbody,
        });
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error.message || error);
    }
}

module.exports = { sendZohoMail };



