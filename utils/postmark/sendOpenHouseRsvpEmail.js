const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const postmark = require("postmark");

const client = new postmark.ServerClient(
  process.env.POSTMARK_CONTACT_FORM_SERVER_TOKEN
);

// Team members who should receive open house RSVP notifications
const openHouseEmailReceivers = [
  "dinker.s@xrealty.ae",
  "naresh.k@xrealty.ae",
  "suman@xrealty.ae",
  "sahil.manhas@xrealty.ae",
];

const sendOpenHouseRsvpEmail = (content) => {
  const template = `
    <h2>Open House RSVP</h2>
    <p>You have received a new Open House registration from the website.</p>
    <table border="1" cellpadding="10" style="border-collapse: collapse; font-family: Arial, sans-serif;">
      <tr>
        <td style="background-color: #f5f5f5;"><strong>Name:</strong></td>
        <td>${content?.name || ""}</td>
      </tr>
      <tr>
        <td style="background-color: #f5f5f5;"><strong>Email:</strong></td>
        <td>${content?.email || ""}</td>
      </tr>
      <tr>
        <td style="background-color: #f5f5f5;"><strong>Phone:</strong></td>
        <td>${content?.phone || ""}</td>
      </tr>
      <tr>
        <td style="background-color: #f5f5f5;"><strong>Preferred Date:</strong></td>
        <td>${content?.preferredDate || ""}</td>
      </tr>
      <tr>
        <td style="background-color: #f5f5f5;"><strong>Event:</strong></td>
        <td>${content?.eventName || content?.eventSlug || ""}</td>
      </tr>
      <tr>
        <td style="background-color: #f5f5f5;"><strong>Page URL:</strong></td>
        <td>${content?.pageUrl || ""}</td>
      </tr>
      <tr>
        <td style="background-color: #f5f5f5;"><strong>IP Address:</strong></td>
        <td>${content?.ipAddress || ""}</td>
      </tr>
    </table>
  `;

  for (let i = 0; i < openHouseEmailReceivers.length; i++) {
    try {
      client.sendEmail({
        From: "Xperience Realty <donotreply@xrealty.ae>",
        To: openHouseEmailReceivers[i],
        Subject: `Open House RSVP — ${content?.eventName || "New Registration"}`,
        HtmlBody: template,
        TextBody: `Open House RSVP: ${content?.name} - ${content?.email} - ${content?.phone} - ${content?.preferredDate}`,
        MessageStream: "broadcast",
      });
    } catch (err) {
      console.log("[OpenHouseRsvpEmail] Error:", err);
    }
  }
};

module.exports = { sendOpenHouseRsvpEmail };
