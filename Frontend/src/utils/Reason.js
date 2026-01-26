const mongoose = require('mongoose');

const orderStatusReasonSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    
    reasonType: {
      type: String,
      enum: ['waiting', 'rejected'],
      required: true
    },
    
    reasonText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    
    isActive: {
      type: Boolean,
      default: true
    },
    
    createdBy: {
      type: String,
      enum: ['restaurant', 'admin'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

orderStatusReasonSchema.index({ restaurantId: 1, reasonType: 1, isActive: 1 });

module.exports = mongoose.model('OrderStatusReason', orderStatusReasonSchema);

// Create order status reason
router.post('/action-reasons', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { reasonType, reasonText } = req.body;

    if (!reasonType || !reasonText) {
      return res.status(400).json({ success: false, message: 'reasonType and reasonText are required' });
    }

    const reason = new OrderStatusReason({
      restaurantId,
      reasonType,
      reasonText,
      createdBy: 'restaurant'
    });

    await reason.save();

    res.json({
      success: true,
      message: 'Reason created successfully',
      data: reason
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get order status reasons
router.get('/action-reasons', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { reasonType } = req.query;

    const filter = { restaurantId, isActive: true };
    if (reasonType) filter.reasonType = reasonType;

    const reasons = await OrderStatusReason.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Reasons retrieved successfully',
      data: reasons
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update order status reason
router.patch('/action-reasons/:reasonId', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { reasonId } = req.params;
    const { reasonText, isActive } = req.body;

    const updateData = {};
    if (reasonText !== undefined) updateData.reasonText = reasonText;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const reason = await OrderStatusReason.findOneAndUpdate(
      { _id: reasonId, restaurantId },
      updateData,
      { new: true }
    );

    if (!reason) {
      return res.status(404).json({ success: false, message: 'Reason not found' });
    }

    res.json({
      success: true,
      message: 'Reason updated successfully',
      data: reason
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get active order status reasons
router.get('/active-reasons', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { reasonType } = req.query;

    const filter = { restaurantId, isActive: true };
    if (reasonType) filter.reasonType = reasonType;

    const reasons = await OrderStatusReason.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Active reasons retrieved successfully',
      data: reasons
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});