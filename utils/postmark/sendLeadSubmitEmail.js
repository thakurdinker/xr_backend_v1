const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const leadSumitEmailReceivers = [
  "dinker.s@xrealty.ae",
  "naresh.k@xrealty.ae",
  "suman@xrealty.ae",
  "sahil.manhas@xrealty.ae",
];

// Career Page Receivers
const leadSubmitReceiversCareers = [
  "dinker.s@xrealty.ae",
  "garima.s@xrealty.ae",
];

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

// Newsletter Submission
const sendNewsletterSubmitEmail = (email) => {
  let template = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4; padding:20px 0;">
  <tr>
    <td align="center">

      <!-- Main Container -->
      <table width="350px" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-collapse:collapse;">
        
        <!-- HEADER -->
        <tr>
          <td align="left" style="border-bottom:1px solid #eeeeee;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="left" width="100%">
                  <a href="https://www.xrealty.ae?utm_source=newsletter&utm_medium=email&utm_campaign=subscription" target="_blank" style="text-decoration:none;">
                    <img src="https://licephan.sirv.com/EDM/xr_banner_dark.jpg"
                         alt="Xperience Realty Real Estate"
                         border="0"
                         style="display:block; width:100%; max-width:100%; height:auto;">
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY TITLE -->
        <tr>
          <td align="left" style="padding:30px 30px 10px 30px; font-family:Arial, sans-serif; font-size:24px; line-height:32px; color:#222222; font-weight:bold;">
            You're Subscribed! 🎉
          </td>
        </tr>

        <!-- BODY TEXT -->
        <tr>
          <td align="left" style="padding:0 30px 20px 30px; font-family:Arial, sans-serif; font-size:15px; line-height:23px; color:#555555;">
            Thank you for subscribing to our newsletter! You will now receive the latest updates, market insights, exclusive real estate opportunities, and special announcements directly in your inbox.
            <br><br>
            We're excited to keep you informed and part of our growing community.
          </td>
        </tr>

        <!-- SPACER -->
        <tr>
          <td style="padding:10px 30px;"></td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding:20px 30px 5px 30px; border-top:1px solid #eeeeee; font-family:Arial, sans-serif; font-size:12px; line-height:18px; color:#999999;">
            Stay connected with us
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:0 30px 20px 30px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:0 8px;">
                  <a href="https://www.facebook.com/people/Xperience-Realty-Real-Estate/61562378023612" target="_blank" style="font-family:Arial, sans-serif; font-size:12px; color:#007bff; text-decoration:none;">
                    Facebook
                  </a>
                </td>
                <td align="center" style="padding:0 8px;">
                  <a href="https://www.instagram.com/xperience.realty" target="_blank" style="font-family:Arial, sans-serif; font-size:12px; color:#007bff; text-decoration:none;">
                    Instagram
                  </a>
                </td>
                <td align="center" style="padding:0 8px;">
                  <a href="https://www.linkedin.com/company/xrealty-ae" target="_blank" style="font-family:Arial, sans-serif; font-size:12px; color:#007bff; text-decoration:none;">
                    LinkedIn
                  </a>
                </td>
                <td align="center" style="padding:0 8px;">
                  <a href="https://www.youtube.com/@xrealtyae" target="_blank" style="font-family:Arial, sans-serif; font-size:12px; color:#007bff; text-decoration:none;">
                    YouTube
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER SMALL TEXT -->
        <tr>
          <td align="center" style="padding:0 30px 20px 30px; font-family:Arial, sans-serif; font-size:11px; line-height:16px; color:#bbbbbb;">
            © ${new Date().getFullYear()} Xperience Realty Real Estate. All rights reserved.<br>
            You are receiving this email because you subscribed to our newsletter.
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
  `;

  try {
    client.sendEmail({
      From: "Xperience Realty <donotreply@xrealty.ae>",
      To: email,
      Subject: "You're now subscribed",
      HtmlBody: template,
      TextBody: `You're now subscribed`,
      MessageStream: "outbound",
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  sendLeadSubmitEmail,
  sendCareerSubmitEmail,
  sendNewsletterSubmitEmail,
};
