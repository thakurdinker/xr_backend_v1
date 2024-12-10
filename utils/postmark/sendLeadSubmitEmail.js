const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const leadSumitEmailReceivers = [
  "dinker.s@xrealty.ae",
  "naresh.k@xrealty.ae",
  "suman@xrealty.ae",
];

// Career Page Receivers
const leadSubmitReceiversCareers = ["dinker.s@xrealty.ae"];

const postmark = require("postmark");

// Send an email:
const client = new postmark.ServerClient(
  process.env.POSTMARK_CONTACT_FORM_SERVER_TOKEN
);

const sendLeadSubmitEmail = (content) => {
  let template = `
 <h2>Form Submission</h2>
            <p>You have received a new enquiry from the website</p>
            <table border="1" cellpadding="10">
                <tr>
                    <td><strong>Name:</strong></td>
                    <td>${content?.firstname} ${content?.lastname}</td>
                </tr>
                <tr>
                    <td><strong>Email:</strong></td>
                    <td>${content?.email}</td>
                </tr>
                <tr>
                    <td><strong>Phone:</strong></td>
                    <td>${content?.phone}</td>
                </tr>
                <tr>
                    <td><strong>Message:</strong></td>
                    <td>${content?.message}</td>
                </tr>
                 <tr>
                    <td><strong>Page Url:</strong></td>
                    <td>${content?.pageUrl}</td>
                </tr>
                <tr>
                    <td><strong>Ip Address:</strong></td>
                    <td>${content?.ipAddress}</td>
                </tr>
            </table>
  `;

  for (let i = 0; i < leadSumitEmailReceivers.length; i++) {
    try {
      client.sendEmail({
        From: "Xperience Realty <donotreply@xrealty.ae>",
        To: leadSumitEmailReceivers[i],
        Subject: "Website Form Submission",
        HtmlBody: template,
        TextBody: `Lead Submit`,
        MessageStream: "broadcast",
      });
    } catch (err) {
      console.log(err);
    }
  }
};

// Career Page Lead
const sendCareerSubmitEmail = (content) => {
  let template = `
 <h2>Form Submission</h2>
            <p>You have received a new enquiry from the website</p>
            <table border="1" cellpadding="10">
                <tr>
                    <td><strong>Name:</strong></td>
                    <td>${content?.firstname} ${content?.lastname}</td>
                </tr>
                <tr>
                    <td><strong>Email:</strong></td>
                    <td>${content?.email}</td>
                </tr>
                <tr>
                    <td><strong>Phone:</strong></td>
                    <td>${content?.phone}</td>
                </tr>
                <tr>
                    <td><strong>Message:</strong></td>
                    <td>${content?.message}</td>
                </tr>
                 <tr>
                    <td><strong>Page Url:</strong></td>
                    <td>${content?.pageUrl}</td>
                </tr>
                <tr>
                    <td><strong>Ip Address:</strong></td>
                    <td>${content?.ipAddress}</td>
                </tr>
                  <tr>
                    <td><strong>View Resume:</strong></td>
                    <td>${content?.resumeUrl}</td>
                </tr>
                 <tr>
                    <td><strong>File Name:</strong></td>
                    <td>${content?.original_fileName}</td>
                </tr>
            </table>
  `;

  for (let i = 0; i < leadSubmitReceiversCareers.length; i++) {
    try {
      client.sendEmail({
        From: "Xperience Realty <donotreply@xrealty.ae>",
        To: leadSubmitReceiversCareers[i],
        Subject: "Career Page Form Submission",
        HtmlBody: template,
        TextBody: `Lead Submit`,
        MessageStream: "broadcast",
      });
    } catch (err) {
      console.log(err);
    }
  }
};

module.exports = {
  sendLeadSubmitEmail,
  sendCareerSubmitEmail,
};
