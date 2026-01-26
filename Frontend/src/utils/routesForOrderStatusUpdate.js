// Get order by ID
router.get('/detail/:orderId', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant.restaurantId;

    const order = await Order.findOne({ _id: orderId, restaurantId })
      .populate('userId', 'fullName phone')
      .populate({
        path: 'items.itemId',
        model: 'Item',
        select:
          'category name description images foodTypes currency isAvailable isPopular subcategory attributes customizations addons',
        populate: [
          {
            path: 'subcategory',
            model: 'Subcategory',
            select: 'name'
          },
          {
            path: 'addons',
            model: 'AddonItem',
            select: 'category name description images currency isAvailable attributes'
          }
        ]
      })
      .populate({
        path: 'items.selectedAttribute',
        model: 'Attribute',
        select: 'name'
      })
      .populate({
        path: 'items.selectedAddons.addonId',
        model: 'AddonItem',
        select: 'category name description images currency isAvailable attributes',
        populate: {
          path: 'attributes.attribute',
          model: 'Attribute'
        }
      })
      .populate({
        path: 'items.selectedAddons.selectedAttribute',
        model: 'Attribute',
        select: 'name'
      });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const processedOrders = await processOrdersWithTotals([order]);
    const processedOrder = processedOrders[0];

    res.json({
      success: true,
      message: 'Order retrieved successfully',
      data: processedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update order status to preparing
router.patch('/preparing/:orderId', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant.restaurantId;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, restaurantId, status: 'confirmed' },
      { status: 'preparing' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or cannot be updated to preparing' });
    }

    res.json({
      success: true,
      message: 'Order status updated to preparing',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update order status to ready
router.patch('/ready/:orderId', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant.restaurantId;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, restaurantId, status: 'preparing' },
      { status: 'ready' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or cannot be updated to ready' });
    }

    res.json({
      success: true,
      message: 'Order status updated to ready',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update order status to served
router.patch('/served/:orderId', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant.restaurantId;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, restaurantId, status: 'ready', orderType: 'dine-in' },
      { status: 'served' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found, cannot be updated to served, or not a dine-in order' });
    }

    res.json({
      success: true,
      message: 'Order status updated to served',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update order status to completed
router.patch('/completed/:orderId', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant.restaurantId;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, restaurantId, status: { $in: ['served', 'ready'] } },
      { status: 'completed' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or cannot be updated to completed' });
    }

    res.json({
      success: true,
      message: 'Order status updated to completed',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Cancel order
router.patch('/cancel/:orderId', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant.restaurantId;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, restaurantId, status: { $in: ['confirmed', 'preparing'] } },
      { status: 'cancelled' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or cannot be cancelled' });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});