const mongoose = require('mongoose');

const tableBookingSlotSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  
  duration: {
    type: Number, // Duration in minutes
    required: true,
    min: 15, // Minimum 15 minutes
    max: 480 // Maximum 8 hours
  },
  
  status: {
    type: Boolean,
    default: true
  },
  
  timeSlots: [{
    time: {
      type: String, // 24-hour format: "09:00", "14:30", etc.
      required: true,
      validate: {
        validator: function(time) {
          // Validate 24-hour format HH:MM
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Time must be in 24-hour format (HH:MM)'
      }
    },
    status: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
tableBookingSlotSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('TableBookingSlot', tableBookingSlotSchema);

const mongoose = require('mongoose');

const tableBookingOffersSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  
  offerType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  
  fixedAmount: {
    type: Number,
    min: 0
  },
  
  coverChargePerPerson: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: Boolean,
    default: true
  },
  
  currency: {
    code: { type: String },     // e.g., "INR"
    name: { type: String },     // e.g., "Indian Rupee"
    symbol: { type: String }    // e.g., "₹"
  }
}, {
  timestamps: true
});

// Index for efficient queries
tableBookingOffersSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('TableBookingOffers', tableBookingOffersSchema);

/**
 * Table Booking Configuration Routes
 * 
 * API Endpoints:
 * GET    /api/restaurants/table-booking/                    - Get table booking configuration
 * PATCH  /api/restaurants/table-booking/toggle             - Enable/disable table reservation booking
 * POST   /api/restaurants/table-booking/time-slots         - Create time slots configuration
 * PATCH  /api/restaurants/table-booking/time-slots         - Update time slots configuration
 * PATCH  /api/restaurants/table-booking/time-slots/status  - Update status of specific time slot
 * POST   /api/restaurants/table-booking/offers             - Create table booking offers
 * PATCH  /api/restaurants/table-booking/offers             - Update table booking offers
 * DELETE /api/restaurants/table-booking/offers             - Delete table booking offers
 * 
 * Authentication: All routes require restaurantAuthMiddleware
 * Validation: time-slots and offers routes require tableReservationBooking = true
 * 
 * Usage Examples:
 * 
 * 1. Get Configuration:
 *    GET /api/restaurants/table-booking/
 *    Headers: { Authorization: "Bearer <restaurant_token>" }
 *    Response: {
 *      tableReservationBooking: boolean,
 *      timeSlots: { duration, timeSlots: [{ _id, time, status }] } | null,
 *      offers: { offerType, percentage, fixedAmount, coverChargePerPerson, status, currency } | null
 *    }
 * 
 * 2. Toggle Table Booking:
 *    PATCH /api/restaurants/table-booking/toggle
 *    Body: { tableReservationBooking: true }
 * 
 * 3. Create Time Slots:
 *    POST /api/restaurants/table-booking/time-slots
 *    Body: { duration: 60 }
 *    Note: Auto-generates slots from restaurant operating hours
 * 
 * 4. Update Time Slots:
 *    PATCH /api/restaurants/table-booking/time-slots
 *    Body: { duration: 30 }
 * 
 * 5. Update Specific Time Slot Status:
 *    PATCH /api/restaurants/table-booking/time-slots/status
 *    Body: { 
 *      timeSlotId: "slot_id_1", 
 *      status: false 
 *    }
 *    Note: Updates status of a single time slot by its MongoDB _id
 * 
 * 6. Create Table Booking Offers:
 *    POST /api/restaurants/table-booking/offers
 *    Body: {
 *      offerType: "percentage",
 *      percentage: 20,
 *      coverChargePerPerson: 100,
 *      status: true,
 *      currency: { code: "INR", name: "Indian Rupee", symbol: "₹" }
 *    }
 * 
 * 7. Update Table Booking Offers:
 *    PATCH /api/restaurants/table-booking/offers
 *    Body: {
 *      offerType: "fixed",
 *      fixedAmount: 50,
 *      coverChargePerPerson: 150,
 *      status: false,
 *      currency: { code: "INR", name: "Indian Rupee", symbol: "₹" }
 *    }
 * 
 * 8. Delete Table Booking Offers:
 *    DELETE /api/restaurants/table-booking/offers
 */

const express = require('express');
const Restaurant = require('../models/Restaurant');
const TableBookingSlot = require('../restaurantModels/TableBookingSlot');
const TableBookingOffers = require('../restaurantModels/TableBookingOffers');
const restaurantAuthMiddleware = require('../middleware/restaurantAuth');
const router = express.Router();

// Helper function to generate time slots based on operating hours
const generateTimeSlots = (openTime, closeTime, duration) => {
  const durationNum = parseInt(duration);
  const slots = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMin;
  let closeMinutes = closeHour * 60 + closeMin;
  
  // Handle overnight operations (e.g., 08:00 to 02:00 next day)
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60; // Add 24 hours for next day
  }
  
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += durationNum) {
    const hour = Math.floor(minutes / 60) % 24; // Use modulo to handle 24+ hours
    const min = minutes % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    slots.push({ time: timeStr, status: true });
  }
  
  return slots;
};

// GET route to fetch table booking configuration
router.get('/', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;

    const [restaurant, timeSlots, offers] = await Promise.all([
      Restaurant.findById(restaurantId).select('tableReservationBooking'),
      TableBookingSlot.findOne({ restaurantId }),
      TableBookingOffers.findOne({ restaurantId })
    ]);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({
      tableReservationBooking: restaurant.tableReservationBooking,
      timeSlots: timeSlots || null,
      offers: offers || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH route to enable/disable table reservation booking
router.patch('/toggle', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { tableReservationBooking } = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { tableReservationBooking },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({
      message: 'Table reservation booking updated successfully',
      tableReservationBooking: restaurant.tableReservationBooking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST route to create table booking time slots
router.post('/time-slots', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { duration } = req.body;
    const durationNum = parseInt(duration);

    if (!duration || isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ message: 'Valid duration is required' });
    }

    // Check if table reservation booking is enabled
    const restaurant = req.restaurantDetails;
    
    if (!restaurant?.tableReservationBooking) {
      return res.status(403).json({ 
        message: 'Table reservation booking is not enabled for this restaurant' 
      });
    }

    // Check if time slots already exist
    const existingSlot = await TableBookingSlot.findOne({ restaurantId });
    if (existingSlot) {
      return res.status(409).json({ 
        message: 'Time slots already exist. Use PATCH to update.' 
      });
    }

    if (!restaurant?.basicInfo?.operatingHours?.openTime || !restaurant?.basicInfo?.operatingHours?.closeTime) {
      return res.status(400).json({ message: 'Restaurant operating hours not found' });
    }

    const { openTime, closeTime } = restaurant.basicInfo.operatingHours;
    const timeSlots = generateTimeSlots(openTime, closeTime, durationNum);

    const slot = new TableBookingSlot({
      restaurantId,
      duration: durationNum,
      timeSlots
    });

    await slot.save();

    res.status(201).json({
      message: 'Time slots created successfully',
      data: slot
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH route to update table booking time slots
router.patch('/time-slots', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { duration } = req.body;
    const durationNum = parseInt(duration);

    if (!duration || isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ message: 'Valid duration is required' });
    }

    // Check if table reservation booking is enabled
    const restaurant = req.restaurantDetails;
    
    if (!restaurant?.tableReservationBooking) {
      return res.status(403).json({ 
        message: 'Table reservation booking is not enabled for this restaurant' 
      });
    }

    // Check if time slots exist
    const existingSlot = await TableBookingSlot.findOne({ restaurantId });
    if (!existingSlot) {
      return res.status(404).json({ 
        message: 'Time slots not found. Use POST to create.' 
      });
    }

    if (!restaurant?.basicInfo?.operatingHours?.openTime || !restaurant?.basicInfo?.operatingHours?.closeTime) {
      return res.status(400).json({ message: 'Restaurant operating hours not found' });
    }

    const { openTime, closeTime } = restaurant.basicInfo.operatingHours;
    const timeSlots = generateTimeSlots(openTime, closeTime, durationNum);

    const slot = await TableBookingSlot.findOneAndUpdate(
      { restaurantId },
      { duration: durationNum, timeSlots },
      { new: true }
    );

    res.json({
      message: 'Time slots updated successfully',
      data: slot
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH route to update status of specific time slot
router.patch('/time-slots/status', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { timeSlotId, status } = req.body;

    if (!timeSlotId) {
      return res.status(400).json({ message: 'timeSlotId is required' });
    }

    if (typeof status !== 'boolean') {
      return res.status(400).json({ message: 'status must be a boolean value' });
    }

    // Check if table reservation booking is enabled
    const restaurant = req.restaurantDetails;
    
    if (!restaurant?.tableReservationBooking) {
      return res.status(403).json({ 
        message: 'Table reservation booking is not enabled for this restaurant' 
      });
    }

    // Find the time slots document
    const existingSlot = await TableBookingSlot.findOne({ restaurantId });
    if (!existingSlot) {
      return res.status(404).json({ 
        message: 'Time slots configuration not found' 
      });
    }

    // Update status of specific time slot
    const updatedSlot = await TableBookingSlot.findOneAndUpdate(
      { 
        restaurantId,
        'timeSlots._id': timeSlotId
      },
      { 
        $set: { 'timeSlots.$.status': status }
      },
      {
        new: true
      }
    );

    if (!updatedSlot) {
      return res.status(404).json({ 
        message: 'Time slot not found with the provided ID' 
      });
    }

    // Find the updated time slot to confirm the change
    const updatedTimeSlot = updatedSlot.timeSlots.find(slot => 
      slot._id.toString() === timeSlotId
    );

    res.json({
      message: `Time slot status updated successfully`,
      data: updatedSlot,
      updatedTimeSlot: updatedTimeSlot
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST route to create table booking offers
router.post('/offers', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { name, offerType, percentage, fixedAmount, coverChargePerPerson, status } = req.body;

    // Check if table reservation booking is enabled
    const restaurant = req.restaurantDetails;
    
    if (!restaurant?.tableReservationBooking) {
      return res.status(403).json({ 
        message: 'Table reservation booking is not enabled for this restaurant' 
      });
    }

    // Check if offers already exist
    const existingOffer = await TableBookingOffers.findOne({ restaurantId });
    if (existingOffer) {
      return res.status(409).json({ 
        message: 'Table booking offers already exist. Use PATCH to update.' 
      });
    }

    const offerData = {
      restaurantId,
      name,
      offerType,
      percentage,
      fixedAmount,
      coverChargePerPerson,
      status
    };

    // Get currency from restaurant model
    if (restaurant?.businessDetails?.currency) {
      offerData.currency = restaurant.businessDetails.currency;
    }

    const offer = new TableBookingOffers(offerData);

    await offer.save();

    res.status(201).json({
      message: 'Table booking offers created successfully',
      data: offer
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH route to update table booking offers
router.patch('/offers', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { name, offerType, percentage, fixedAmount, coverChargePerPerson, status } = req.body;

    // Check if table reservation booking is enabled
    const restaurant = req.restaurantDetails;
    
    if (!restaurant?.tableReservationBooking) {
      return res.status(403).json({ 
        message: 'Table reservation booking is not enabled for this restaurant' 
      });
    }

    // Check if offers exist
    const existingOffer = await TableBookingOffers.findOne({ restaurantId });
    if (!existingOffer) {
      return res.status(404).json({ 
        message: 'Table booking offers not found. Use POST to create.' 
      });
    }

    const offer = await TableBookingOffers.findOneAndUpdate(
      { restaurantId },
      { name, offerType, percentage, fixedAmount, coverChargePerPerson, status },
      { new: true }
    );

    res.json({
      message: 'Table booking offers updated successfully',
      data: offer
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE route to delete table booking offers
router.delete('/offers', restaurantAuthMiddleware, async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;

    // Check if table reservation booking is enabled
    const restaurant = req.restaurantDetails;
    
    if (!restaurant?.tableReservationBooking) {
      return res.status(403).json({ 
        message: 'Table reservation booking is not enabled for this restaurant' 
      });
    }

    // Check if offers exist
    const existingOffer = await TableBookingOffers.findOne({ restaurantId });
    if (!existingOffer) {
      return res.status(404).json({ 
        message: 'Table booking offers not found' 
      });
    }

    await TableBookingOffers.findOneAndDelete({ restaurantId });

    res.json({
      message: 'Table booking offers deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

//get api response :-

{
    "tableReservationBooking": true,
    "timeSlots": {
        "_id": "69b27157655bdf0cbe7610b3",
        "restaurantId": "69009336cda4b52998ffb143",
        "duration": 30,
        "timeSlots": [
            {
                "time": "08:00",
                "status": true,
                "_id": "69b293e7c199118b12f39639"
            },
            {
                "time": "08:30",
                "status": false,
                "_id": "69b293e7c199118b12f3963a"
            },
            {
                "time": "09:00",
                "status": false,
                "_id": "69b293e7c199118b12f3963b"
            },
            {
                "time": "09:30",
                "status": false,
                "_id": "69b293e7c199118b12f3963c"
            },
            {
                "time": "10:00",
                "status": true,
                "_id": "69b293e7c199118b12f3963d"
            },
            {
                "time": "10:30",
                "status": true,
                "_id": "69b293e7c199118b12f3963e"
            },
            {
                "time": "11:00",
                "status": true,
                "_id": "69b293e7c199118b12f3963f"
            },
            {
                "time": "11:30",
                "status": true,
                "_id": "69b293e7c199118b12f39640"
            },
            {
                "time": "12:00",
                "status": true,
                "_id": "69b293e7c199118b12f39641"
            },
            {
                "time": "12:30",
                "status": true,
                "_id": "69b293e7c199118b12f39642"
            },
            {
                "time": "13:00",
                "status": true,
                "_id": "69b293e7c199118b12f39643"
            },
            {
                "time": "13:30",
                "status": true,
                "_id": "69b293e7c199118b12f39644"
            },
            {
                "time": "14:00",
                "status": true,
                "_id": "69b293e7c199118b12f39645"
            },
            {
                "time": "14:30",
                "status": false,
                "_id": "69b293e7c199118b12f39646"
            },
            {
                "time": "15:00",
                "status": true,
                "_id": "69b293e7c199118b12f39647"
            },
            {
                "time": "15:30",
                "status": false,
                "_id": "69b293e7c199118b12f39648"
            },
            {
                "time": "16:00",
                "status": true,
                "_id": "69b293e7c199118b12f39649"
            },
            {
                "time": "16:30",
                "status": true,
                "_id": "69b293e7c199118b12f3964a"
            },
            {
                "time": "17:00",
                "status": true,
                "_id": "69b293e7c199118b12f3964b"
            },
            {
                "time": "17:30",
                "status": true,
                "_id": "69b293e7c199118b12f3964c"
            },
            {
                "time": "18:00",
                "status": true,
                "_id": "69b293e7c199118b12f3964d"
            },
            {
                "time": "18:30",
                "status": true,
                "_id": "69b293e7c199118b12f3964e"
            },
            {
                "time": "19:00",
                "status": true,
                "_id": "69b293e7c199118b12f3964f"
            },
            {
                "time": "19:30",
                "status": true,
                "_id": "69b293e7c199118b12f39650"
            },
            {
                "time": "20:00",
                "status": true,
                "_id": "69b293e7c199118b12f39651"
            },
            {
                "time": "20:30",
                "status": false,
                "_id": "69b293e7c199118b12f39652"
            },
            {
                "time": "21:00",
                "status": true,
                "_id": "69b293e7c199118b12f39653"
            },
            {
                "time": "21:30",
                "status": true,
                "_id": "69b293e7c199118b12f39654"
            },
            {
                "time": "22:00",
                "status": false,
                "_id": "69b293e7c199118b12f39655"
            },
            {
                "time": "22:30",
                "status": true,
                "_id": "69b293e7c199118b12f39656"
            },
            {
                "time": "23:00",
                "status": true,
                "_id": "69b293e7c199118b12f39657"
            },
            {
                "time": "23:30",
                "status": true,
                "_id": "69b293e7c199118b12f39658"
            },
            {
                "time": "00:00",
                "status": true,
                "_id": "69b293e7c199118b12f39659"
            },
            {
                "time": "00:30",
                "status": true,
                "_id": "69b293e7c199118b12f3965a"
            },
            {
                "time": "01:00",
                "status": true,
                "_id": "69b293e7c199118b12f3965b"
            },
            {
                "time": "01:30",
                "status": true,
                "_id": "69b293e7c199118b12f3965c"
            }
        ],
        "createdAt": "2026-03-12T07:55:03.657Z",
        "updatedAt": "2026-03-12T12:43:43.403Z",
        "__v": 0
    },
    "offers": [
        {
            "currency": {
                "code": "INR",
                "name": "Indian Rupee",
                "symbol": "₹"
            },
            "_id": "69b2bf4eb2f1484440d4dd79",
            "restaurantId": "69009336cda4b52998ffb143",
            "name": "FLAT 20% OFF",
            "offerType": "percentage",
            "percentage": 20,
            "coverChargePerPerson": 10,
            "status": true,
            "createdAt": "2026-03-12T13:27:42.153Z",
            "updatedAt": "2026-03-12T13:33:55.302Z",
            "__v": 0
        },
        {
            "currency": {
                "code": "INR",
                "name": "Indian Rupee",
                "symbol": "₹"
            },
            "_id": "69b3d15b72c7a19035cd414e",
            "restaurantId": "69009336cda4b52998ffb143",
            "name": "FLAT 30% OFF",
            "offerType": "percentage",
            "percentage": 30,
            "coverChargePerPerson": 10,
            "status": true,
            "createdAt": "2026-03-13T08:56:59.799Z",
            "updatedAt": "2026-03-13T08:56:59.799Z",
            "__v": 0
        }
    ]
}