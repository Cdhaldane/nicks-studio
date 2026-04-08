/**
 * Get items by category
 * GET /api/square-catalog-category?id={categoryId}
 */
const { getSquareClient, sendJSON } = require('./_utils');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return sendJSON(res, { error: 'Category ID is required' }, 400);
    }

    const squareClient = getSquareClient();
    const response = await squareClient.catalog.searchItems({
      categoryIds: [id],
    });

    sendJSON(res, { objects: response.items || [] });
  } catch (error) {
    console.error('Error fetching category:', error);
    sendJSON(
      res,
      {
        error: 'Failed to fetch category',
        message: error.message,
      },
      500
    );
  }
};
