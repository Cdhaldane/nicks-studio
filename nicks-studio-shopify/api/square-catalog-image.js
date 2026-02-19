/**
 * Get catalog image URL
 * GET /api/square-catalog-image?id={imageId}
 */
const { getSquareClient, sendJSON } = require('./_utils');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return sendJSON(res, { error: 'Image ID is required' }, 400);
    }

    const squareClient = getSquareClient();
    const response = await squareClient.catalog.get({ objectId: id });
    const imageUrl = response.object?.imageData?.url;

    if (imageUrl) {
      res.redirect(imageUrl);
    } else {
      sendJSON(res, { error: 'Image not found' }, 404);
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    sendJSON(
      res,
      {
        error: 'Failed to fetch image',
        message: error.message,
      },
      500
    );
  }
};
