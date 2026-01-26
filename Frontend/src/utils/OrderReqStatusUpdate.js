// Confirm order request
router.patch('/confirm', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { orderReqId } = req.body;

    if (!orderReqId) {
      return res.status(400).json({ success: false, message: 'orderReqId is required' });
    }

    const orderRequest = await OrderRequest.findOneAndUpdate(
      { _id: orderReqId, restaurantId },
      { 
        $set: {
          status: 'confirmed',
          statusUpdatedBy: 'restaurant'
        }
      },
      { new: true }
    );

    if (!orderRequest) {
      return res.status(404).json({ success: false, message: 'Order request not found' });
    }

    res.json({
      success: true,
      message: 'Order request confirmed successfully',
      data: orderRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Reject order request
router.patch('/reject', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { orderReqId, orderReqReasonId } = req.body;

    if (!orderReqId || !orderReqReasonId) {
      return res.status(400).json({ success: false, message: 'orderReqId and orderReqReasonId are required' });
    }

    const orderRequest = await OrderRequest.findOneAndUpdate(
      { _id: orderReqId, restaurantId },
      { 
        $set: {
          status: 'rejected',
          statusUpdatedBy: 'restaurant',
          orderReqReasonId
        }
      },
      { new: true }
    );

    if (!orderRequest) {
      return res.status(404).json({ success: false, message: 'Order request not found' });
    }

    res.json({
      success: true,
      message: 'Order request rejected successfully',
      data: orderRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.patch('/waiting', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { orderReqId, orderReqReasonId, waitingTime } = req.body;

    if (!orderReqId || !orderReqReasonId || !waitingTime) {
      return res.status(400).json({ success: false, message: 'orderReqId, orderReqReasonId and waitingTime are required' });
    }

    const orderRequest = await OrderRequest.findOneAndUpdate(
      { _id: orderReqId, restaurantId },
      { 
        $set: {
          status: 'waiting',
          statusUpdatedBy: 'restaurant',
          orderReqReasonId,
          waitingTime
        }
      },
      { new: true }
    );

    if (!orderRequest) {
      return res.status(404).json({ success: false, message: 'Order request not found' });
    }

    res.json({
      success: true,
      message: 'Order request set to waiting successfully',
      data: orderRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});