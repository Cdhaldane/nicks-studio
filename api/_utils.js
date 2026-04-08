/**
 * Shared utilities for Vercel Serverless Functions
 */

const { SquareClient, SquareEnvironment } = require('square');

// Fix BigInt serialization for JSON responses
const bigIntReplacer = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Custom JSON response that handles BigInt
const sendJSON = (res, data, status = 200) => {
  res
    .status(status)
    .setHeader('Content-Type', 'application/json')
    .send(JSON.stringify(data, bigIntReplacer));
};

// Initialize Square Client (reused across functions)
const getSquareClient = () => {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment:
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
};

const getLocationId = () => process.env.SQUARE_LOCATION_ID;

module.exports = {
  bigIntReplacer,
  sendJSON,
  getSquareClient,
  getLocationId,
};
