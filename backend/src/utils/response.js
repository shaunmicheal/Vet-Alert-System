// Every successful response uses the same shape: { success: true, data: ... }
const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

module.exports = { sendSuccess };
