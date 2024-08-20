const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const postmark = require("postmark");

const FRONTEND_URL =
  process.env.ENV === "development"
    ? "http://localhost:5173"
    : process.env.FRONTEND_URL;

// Send an email:
const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

const generateResetLink = (email, content) => {
  const resetToken = content; // Replace with actual token generation logic
  const frontendUrl = FRONTEND_URL; // Ensure this is set in your .env file
  return `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
    email
  )}`;
};

const sendResetEmail = ({ email, content }) => {
  const resetLink = generateResetLink(email, content);
  content = `
    <html>
      <body style="background-color: #f9fafb; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #111827; text-align: center; margin-bottom: 20px;">Password Reset Request</h1>
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 20px;">Hello,</p>
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 20px;">We received a request to reset your password. Please click the link below to reset your password:</p>
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${resetLink}" style="font-size: 16px; color: #ffffff; background-color: #3b82f6; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 20px;">If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
          <p style="font-size: 16px; color: #6b7280;">Thank you,<br>Xperience Realty Team</p>
        </div>
      </body>
    </html>
  `;

  client.sendEmail({
    From: "Xperience Realty <donotreply@xrealty.ae>",
    To: email,
    Subject: "Password Reset",
    HtmlBody: content,
    TextBody: `Hello,\n\nWe received a request to reset your password. Please click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email or contact support if you have questions.\n\nThank you,\nXperience Realty Team`,
    MessageStream: "reset-links",
  });
};

module.exports = {
  sendResetEmail,
};
