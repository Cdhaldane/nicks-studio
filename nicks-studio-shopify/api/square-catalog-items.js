/**
 * Get catalog items
 * GET /api/square-catalog-items
 */
const { getSquareClient, sendJSON } = require('./_utils');

module.exports = async (req, res) => {
  try {
    const squareClient = getSquareClient();

    // Match the original server.js code exactly
    const response = await squareClient.catalog.list({ types: 'ITEM' });

    // Collect all items from paginated response
    const items = [];
    for await (const item of response) {
      items.push(item);
    }

    // Fetch images for items
    const imageIds = items
      .flatMap(item => item.itemData?.imageIds || [])
      .filter(Boolean);

    let images = {};
    if (imageIds.length > 0) {
      const imageResponse = await squareClient.catalog.batchGet({
        objectIds: imageIds,
      });
      images = (imageResponse.objects || []).reduce((acc, img) => {
        acc[img.id] = img.imageData?.url;
        return acc;
      }, {});
    }

    // Attach image URLs to items
    const itemsWithImages = items.map(item => ({
      ...item,
      itemData: {
        ...item.itemData,
        images: (item.itemData?.imageIds || []).map(id => ({
          id,
          url: images[id],
        })),
      },
    }));

    sendJSON(res, { objects: itemsWithImages });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    sendJSON(
      res,
      {
        error: 'Failed to fetch catalog',
        message: error.message,
      },
      500
    );
  }
};
