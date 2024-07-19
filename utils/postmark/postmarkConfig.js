require("dotenv").config({ path: "../../vars/.env" });

var postmark = require("postmark");

// Send an email:
var client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

const sendResetEmail = ({ email, content }) => {
  client.sendEmail({
    From: "marketing@propertyinvestmenthub.com",
    To: "dinker.s@xrealty.ae",
    Subject: "Hello from Postmark",
    HtmlBody: "<strong>Hello</strong> dear Postmark user.",
    TextBody: "Hello from Postmark!",
    MessageStream: "reset-links",
  });
};

module.exports = {
  sendResetEmail,
};
