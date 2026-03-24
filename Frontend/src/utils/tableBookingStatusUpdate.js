// PATCH route to mark customer as arrived
router.patch('/arrived', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const restaurantId = req.restaurant.restaurantId;

    const booking = await TableBooking.findOneAndUpdate(
      { _id: bookingId, restaurantId, status: 'confirmed' },
      { status: 'arrived' },
      { new: true }
    ).populate('userId', 'fullName phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in confirmed status'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer marked as arrived',
      data: booking
    });

  } catch (error) {
    console.error('Error updating arrival status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating arrival status',
      error: error.message
    });
  }
});

// PATCH route to mark customer as seated
router.patch('/seated', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const restaurantId = req.restaurant.restaurantId;

    const booking = await TableBooking.findOneAndUpdate(
      { _id: bookingId, restaurantId, status: 'arrived' },
      { status: 'seated' },
      { new: true }
    ).populate('userId', 'fullName phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or customer has not arrived yet'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer marked as seated',
      data: booking
    });

  } catch (error) {
    console.error('Error updating seated status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating seated status',
      error: error.message
    });
  }
});

// PATCH route to mark booking as completed
router.patch('/completed', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const restaurantId = req.restaurant.restaurantId;

    const booking = await TableBooking.findOneAndUpdate(
      { _id: bookingId, restaurantId, status: 'seated' },
      { status: 'completed' },
      { new: true }
    ).populate('userId', 'fullName phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or customer is not seated yet'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking marked as completed',
      data: booking
    });

  } catch (error) {
    console.error('Error updating completed status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating completed status',
      error: error.message
    });
  }
});

// PATCH route to mark customer as did not arrive
router.patch('/did-not-arrive', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const restaurantId = req.restaurant.restaurantId;

    const booking = await TableBooking.findOneAndUpdate(
      { _id: bookingId, restaurantId, status: 'confirmed' },
      { status: 'didNotArrived' },
      { new: true }
    ).populate('userId', 'fullName phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not in confirmed status'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer marked as did not arrive',
      data: booking
    });

  } catch (error) {
    console.error('Error updating did not arrive status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating did not arrive status',
      error: error.message
    });
  }
});

// PATCH route to cancel booking
router.patch('/cancel', restaurantAuthMiddleware, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const restaurantId = req.restaurant.restaurantId;

    const booking = await TableBooking.findOneAndUpdate(
      { 
        _id: bookingId, 
        restaurantId, 
        status: { $in: ['pending', 'confirmed', 'didNotArrived'] }
      },
      { 
        status: 'cancelled',
        'cancellation.cancelledBy': 'Restaurant',
        'cancellation.reason': reason
      },
      { new: true }
    ).populate('userId', 'fullName phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be cancelled'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// GET route to get no_show table bookings
router.get('/no-show', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const totalCount = await TableBooking.countDocuments({ 
      restaurantId, 
      status: 'no_show' 
    });
    
    const bookings = await TableBooking.find({ 
      restaurantId, 
      status: 'no_show' 
    })
      .populate('userId', 'fullName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'No-show table bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching no-show bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching no-show bookings',
      error: error.message
    });
  }
});