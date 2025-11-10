const express = require('express');
const router = express.Router();
const Payment = require('../../models/payment'); // Ensure correct model path
const User = require('../../models/user'); // Ensure correct model path

// Fetch recent activities and monthly statistics
router.get('/dashboard-data', async (req, res) => {
  try {
    // Fetch recent activities
    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5);
    const recentActivities = recentPayments.map(payment => ({
      name: payment.fullName,
      activity: payment.items.map(item => item.name).join(', '),
      time: payment.createdAt,
      amount: payment.amount,
    }));

    // Calculate total revenue for the current month
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const totalRevenue = await Payment.aggregate([
      { $match: { createdAt: { $gte: currentMonthStart } } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);

    // Calculate revenue percentage difference
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
    const lastMonthRevenue = await Payment.aggregate([
      { $match: { createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);

    const percentageDifference =
      lastMonthRevenue[0] && totalRevenue[0]
        ? ((totalRevenue[0].totalAmount - lastMonthRevenue[0].totalAmount) /
            lastMonthRevenue[0].totalAmount) *
          100
        : 0;

    res.status(200).json({
      recentActivities,
      totalRevenue: totalRevenue[0]?.totalAmount || 0,
      percentageDifference,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
