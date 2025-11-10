const express = require('express');
const router = express.Router();
const CareerApplication = require('../../models/carrier'); // Adjust the path
const EventPayment = require('../../models/eventpayment'); // Import EventPayment model
const Payment = require('../../models/payment'); // VIP payments model
const User = require('../../models/user'); // Import User model

router.get('/recent-activities', async (req, res) => {
  try {
    // Fetch recent data
    const vipPayments = await Payment.find().sort({ createdAt: -1 }).limit(5); // VIP payments
    const jobApplications = await CareerApplication.find().sort({ createdAt: -1 }).limit(5); // Job applications
    const eventPayments = await EventPayment.find()
      .populate('eventId', 'name') // Include event name
      .sort({ createdAt: -1 })
      .limit(5); // Event payments

    // Fetch user names for VIP payments
    const vipActivities = await Promise.all(
      vipPayments.map(async (payment) => {
        console.log(`Fetching user for email: ${payment.email}`); // Debug log

        // Query User model
        const user = await User.findOne({ email: payment.email });
        console.log(`Found user: ${user?.firstName || 'None'} ${user?.lastName || ''}`); // Log result

        return {
          type: 'VIP Purchase',
          user: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          details: `Bought ${payment.items?.[0]?.name || 'a package'}`,
          time: payment.createdAt,
        };
      })
    );

    // Map and unify other activities
    const recentActivities = [
      ...vipActivities,
      ...jobApplications.map((job) => ({
        type: 'Job Application',
        user: job.fullName || 'Unknown User',
        details: `Applied for ${job.position || 'a position'}`,
        time: job.createdAt,
      })),
      ...eventPayments.map((eventPayment) => ({
        type: 'Event Payment',
        user: eventPayment.fullName || 'Unknown User',
        details: `Paid for event: ${eventPayment.eventId?.name || 'an event'}`,
        time: eventPayment.createdAt,
      })),
    ];

    // Sort all activities by time (most recent first)
    const sortedActivities = recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Return sorted activities
    res.json(sortedActivities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Failed to fetch recent activities' });
  }
});

module.exports = router;
