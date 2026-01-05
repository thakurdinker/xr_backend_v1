const dotenv = require("dotenv");
const path = require("path");
const { default: axios } = require("axios");
dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const n8nurl = process.env.N8N_FROM_SUBMIT_URL;

const sendFormSubmitDataN8N = async (data) => {
  try {
    const response = await axios.post(n8nurl, data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  sendFormSubmitDataN8N,
};
