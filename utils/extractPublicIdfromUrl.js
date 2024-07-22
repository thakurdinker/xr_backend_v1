function extractPublicIdfromUrl(url) {
  // Extract the desired part by splitting the pathname
  const parts = url.split("/");

  // Return the last two parts joined by a slash
  return parts.slice(-2).join("/").split(".")[0];
}

module.exports = extractPublicIdfromUrl;
