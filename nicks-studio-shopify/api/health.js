/**
 * Health check endpoint
 * GET /api/health
 */
module.exports = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Square API Proxy',
    timestamp: new Date().toISOString(),
  });
};
