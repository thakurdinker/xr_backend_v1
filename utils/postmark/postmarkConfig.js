// Require:
var postmark = require("postmark");

// Send an email:
var client = new postmark.ServerClient("a508600e-13d9-42be-8820-98639764fcc0");

export function sendResetEmail(content, receiver) {
  client.sendEmail({
    From: "marketing@propertyinvestmenthub.com",
    To: "dinker.s@xrealty.ae",
    Subject: "Hello from Postmark",
    HtmlBody: "<strong>Hello</strong> dear Postmark user.",
    TextBody: "Hello from Postmark!",
    MessageStream: "reset-links",
  });
}
