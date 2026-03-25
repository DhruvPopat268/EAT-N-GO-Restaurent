router.get('/', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10, date, slot } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { restaurantId };
    
    // Date range filter
    if (date) {
      const { startDate, endDate } = JSON.parse(date);
      if (startDate && endDate) {
        filter['bookingTimings.date'] = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (startDate) {
        filter['bookingTimings.date'] = { $gte: startDate };
      } else if (endDate) {
        filter['bookingTimings.date'] = { $lte: endDate };
      }
    }
    
    // Slot filter
    if (slot) filter['bookingTimings.slotTime'] = slot;
    
    const totalCount = await TableBooking.countDocuments(filter);
    
    const bookings = await TableBooking.find(filter)
      .populate('userId', 'fullName phone')
      .sort({ 'bookingTimings.date': -1, 'bookingTimings.slotTime': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Table bookings retrieved successfully',
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
    console.error('Error fetching table bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table bookings',
      error: error.message
    });
  }
});

// GET route to get pending table bookings
router.get('/pending', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10, date, slot } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { restaurantId, status: 'pending' };
    
    // Date range filter
    if (date) {
      const { startDate, endDate } = JSON.parse(date);
      if (startDate && endDate) {
        filter['bookingTimings.date'] = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (startDate) {
        filter['bookingTimings.date'] = { $gte: startDate };
      } else if (endDate) {
        filter['bookingTimings.date'] = { $lte: endDate };
      }
    }
    
    // Slot filter
    if (slot) filter['bookingTimings.slotTime'] = slot;
    
    const totalCount = await TableBooking.countDocuments(filter);
    
    const bookings = await TableBooking.find(filter)
      .populate('userId', 'fullName phone')
      .sort({ 'bookingTimings.date': -1, 'bookingTimings.slotTime': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Pending table bookings retrieved successfully',
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
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending bookings',
      error: error.message
    });
  }
});

// GET route to get confirmed table bookings
router.get('/confirmed', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10, date, slot } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { restaurantId, status: 'confirmed' };
    
    // Date range filter
    if (date) {
      const { startDate, endDate } = JSON.parse(date);
      if (startDate && endDate) {
        filter['bookingTimings.date'] = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (startDate) {
        filter['bookingTimings.date'] = { $gte: startDate };
      } else if (endDate) {
        filter['bookingTimings.date'] = { $lte: endDate };
      }
    }
    
    // Slot filter
    if (slot) filter['bookingTimings.slotTime'] = slot;
    
    const totalCount = await TableBooking.countDocuments(filter);
    
    const bookings = await TableBooking.find(filter)
      .populate('userId', 'fullName phone')
      .sort({ 'bookingTimings.date': -1, 'bookingTimings.slotTime': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Confirmed table bookings retrieved successfully',
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
    console.error('Error fetching confirmed bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching confirmed bookings',
      error: error.message
    });
  }
});

// GET route to get arrived table bookings
router.get('/arrived', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10, date, slot } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { restaurantId, status: 'arrived' };
    
    // Date range filter
    if (date) {
      const { startDate, endDate } = JSON.parse(date);
      if (startDate && endDate) {
        filter['bookingTimings.date'] = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (startDate) {
        filter['bookingTimings.date'] = { $gte: startDate };
      } else if (endDate) {
        filter['bookingTimings.date'] = { $lte: endDate };
      }
    }
    
    // Slot filter
    if (slot) filter['bookingTimings.slotTime'] = slot;
    
    const totalCount = await TableBooking.countDocuments(filter);
    
    const bookings = await TableBooking.find(filter)
      .populate('userId', 'fullName phone')
      .sort({ 'bookingTimings.date': -1, 'bookingTimings.slotTime': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Arrived table bookings retrieved successfully',
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
    console.error('Error fetching arrived bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching arrived bookings',
      error: error.message
    });
  }
});

// GET route to get seated table bookings
router.get('/seated', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10, date, slot } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { restaurantId, status: 'seated' };
    
    // Date range filter
    if (date) {
      const { startDate, endDate } = JSON.parse(date);
      if (startDate && endDate) {
        filter['bookingTimings.date'] = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (startDate) {
        filter['bookingTimings.date'] = { $gte: startDate };
      } else if (endDate) {
        filter['bookingTimings.date'] = { $lte: endDate };
      }
    }
    
    // Slot filter
    if (slot) filter['bookingTimings.slotTime'] = slot;
    
    const totalCount = await TableBooking.countDocuments(filter);
    
    const bookings = await TableBooking.find(filter)
      .populate('userId', 'fullName phone')
      .sort({ 'bookingTimings.date': -1, 'bookingTimings.slotTime': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Seated table bookings retrieved successfully',
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
    console.error('Error fetching seated bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seated bookings',
      error: error.message
    });
  }
});

// GET route to get completed table bookings
router.get('/completed', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10, date, slot } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { restaurantId, status: 'completed' };
    
    // Date range filter
    if (date) {
      const { startDate, endDate } = JSON.parse(date);
      if (startDate && endDate) {
        filter['bookingTimings.date'] = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (startDate) {
        filter['bookingTimings.date'] = { $gte: startDate };
      } else if (endDate) {
        filter['bookingTimings.date'] = { $lte: endDate };
      }
    }
    
    // Slot filter
    if (slot) filter['bookingTimings.slotTime'] = slot;
    
    const totalCount = await TableBooking.countDocuments(filter);
    
    const bookings = await TableBooking.find(filter)
      .populate('userId', 'fullName phone')
      .sort({ 'bookingTimings.date': -1, 'bookingTimings.slotTime': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Completed table bookings retrieved successfully',
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
    console.error('Error fetching completed bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching completed bookings',
      error: error.message
    });
  }
});

// GET route to get cancelled table bookings
router.get('/cancelled', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10, date, slot } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { restaurantId, status: 'cancelled' };
    
    // Date range filter
    if (date) {
      const { startDate, endDate } = JSON.parse(date);
      if (startDate && endDate) {
        filter['bookingTimings.date'] = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (startDate) {
        filter['bookingTimings.date'] = { $gte: startDate };
      } else if (endDate) {
        filter['bookingTimings.date'] = { $lte: endDate };
      }
    }
    
    // Slot filter
    if (slot) filter['bookingTimings.slotTime'] = slot;
    
    const totalCount = await TableBooking.countDocuments(filter);
    
    const bookings = await TableBooking.find(filter)
      .populate('userId', 'fullName phone')
      .sort({ 'bookingTimings.date': -1, 'bookingTimings.slotTime': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Cancelled table bookings retrieved successfully',
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
    console.error('Error fetching cancelled bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cancelled bookings',
      error: error.message
    });
  }
});

// GET route to get not arrived table bookings
router.get('/not-arrived', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { page = 1, limit = 10, date, slot } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { restaurantId, status: 'notArrived' };
    
    // Date range filter
    if (date) {
      const { startDate, endDate } = JSON.parse(date);
      if (startDate && endDate) {
        filter['bookingTimings.date'] = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (startDate) {
        filter['bookingTimings.date'] = { $gte: startDate };
      } else if (endDate) {
        filter['bookingTimings.date'] = { $lte: endDate };
      }
    }
    
    // Slot filter
    if (slot) filter['bookingTimings.slotTime'] = slot;
    
    const totalCount = await TableBooking.countDocuments(filter);
    
    const bookings = await TableBooking.find(filter)
      .populate('userId', 'fullName phone')
      .sort({ 'bookingTimings.date': -1, 'bookingTimings.slotTime': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Not arrived table bookings retrieved successfully',
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
    console.error('Error fetching not arrived bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching not arrived bookings',
      error: error.message
    });
  }
});