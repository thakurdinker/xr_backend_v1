module.exports = function modifyCloudinaryUrl(url) {
  const insertionPoint = "/upload/";
  const transformation = "w_720,f_auto,q_auto/";

  if (url && url.includes(insertionPoint)) {
    const index = url.indexOf(insertionPoint) + insertionPoint.length;
    return url.slice(0, index) + transformation + url.slice(index);
  }
  return url;
};
