require("dotenv").config({ path: "../../vars/.env" });

var postmark = require("postmark");

// Send an email:
var client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

const sendResetEmail = ({ email, content }) => {
  client.sendEmail({
    From: "Xperience Realty donotreply@xrealty.ae",
    To: "dinker.s@xrealty.ae",
    Subject: "Password Reset",
    HtmlBody: content,
    TextBody: "Reset Password Link",
    MessageStream: "reset-links",
  });
};

module.exports = {
  sendResetEmail,
};
