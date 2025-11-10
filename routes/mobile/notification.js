const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Form = require('../../models/form'); // Import the form schema

// Ensure the output and temp directories exist
const outputDir = path.join(__dirname, '../../uploads/generatedaudios');
const tempDir = path.join(__dirname, '../../temp');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper function to calculate time difference in minutes
const getTimeDifferenceInMinutes = (pickupDate, pickupTime) => {
  const now = new Date(); // Current server time in UTC
  now.setMinutes(now.getMinutes() + 60); // Adjust to UTC+1 (local time)

  const [year, month, day] = pickupDate.split('-');
  const [time, modifier] = pickupTime.split(' '); // Handle AM/PM
  let [hours, minutes] = time.split(':');

  // Convert to 24-hour format
  if (modifier === 'PM' && hours !== '12') {
    hours = parseInt(hours, 10) + 12;
  }
  if (modifier === 'AM' && hours === '12') {
    hours = '00'; // Midnight
  }

  // Create a Date object for the pickup time in UTC+1
  const pickupDateTimeLocal = new Date(year, month - 1, day, hours, minutes);

  // Calculate the difference in milliseconds
  const differenceInMs = pickupDateTimeLocal - now;

  // Convert the difference to minutes
  return Math.floor(differenceInMs / (1000 * 60));
};

// Function to handle audio notification generation
const sendAudioNotification = (ride, audioFiles) => {
  console.log(`Sending audio notification for Ride ID: ${ride._id}`);
  console.log('Audio files to play:', audioFiles);

  // Example logic to send the audio files
  // Replace this with your actual notification logic (e.g., push notification, play audio on the client, etc.)
};

// Route to get the closest ride notification (manual trigger, optional)
router.get('/closest-ride-notification', async (req, res) => {
  try {
    console.log('Request received for /closest-ride-notification');
    const userId = req.user.id; // Ensure req.user.id is available

    if (!userId) {
      console.error('User not authenticated. req.user.id is missing.');
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    console.log('Fetching rides for user:', userId);
    const rides = await Form.find({ userId });

    if (rides.length === 0) {
      console.log('No rides found for user:', userId);
      return res.status(404).json({ message: 'No rides found for this user.' });
    }

    console.log('Rides found:', rides.length);

    // Find the closest ride
    let closestRide = null;
    let smallestDifference = Infinity;

    for (const ride of rides) {
      const { pickupDate, pickupTime } = ride;
      const timeDifferenceInMinutes = getTimeDifferenceInMinutes(pickupDate, pickupTime);

      console.log(`Ride ID: ${ride._id}, Time difference: ${timeDifferenceInMinutes} minutes`);

      // Only consider rides in the future
      if (timeDifferenceInMinutes >= 0 && timeDifferenceInMinutes < smallestDifference) {
        smallestDifference = timeDifferenceInMinutes;
        closestRide = ride;
      }
    }

    if (!closestRide) {
      console.log('No upcoming rides found.');
      return res.status(200).json({ message: 'No notification needed at this time.' });
    }

    console.log('Closest ride:', closestRide);
    console.log('Pickup date:', closestRide.pickupDate);
    console.log('Pickup time:', closestRide.pickupTime);
    console.log('Time difference in minutes:', smallestDifference);

    // Determine which notification to generate
    let audioFiles = [];
    if (smallestDifference <= 5) {
      console.log('Generating final notification (≤ 5 minutes)');
      audioFiles = ['driverwaiting.mp3', 'haveagoodride.mp3'];
    } else if (smallestDifference <= 10) {
      console.log('Generating 10-minute notification (≤ 10 minutes)');
      audioFiles = ['youhavearidein.mp3', '10min.mp3'];
    } else if (smallestDifference <= 20) {
      console.log('Generating 20-minute notification (≤ 20 minutes)');
      audioFiles = ['youhavearidein.mp3', '20min.mp3'];
    } else if (smallestDifference <= 30) {
      console.log('Generating 30-minute notification (≤ 30 minutes)');
      audioFiles = ['youhavearidein.mp3', '30min.mp3'];
    } else {
      console.log('No notification needed (ride is > 30 minutes away)');
      return res.status(200).json({ message: 'No notification needed at this time.' });
    }

    console.log('Audio files to play:', audioFiles);
    res.status(200).json({ audioFiles, timeDifferenceInMinutes: smallestDifference });
  } catch (error) {
    console.error('Error fetching closest ride:', error);
    res.status(500).json({ message: 'An error occurred while fetching the closest ride.' });
  }
});

const sendPushNotification = (userId, message) => {
  console.log(`🔔 Sending push notification to User ${userId}: ${message}`);
  
  // Emit notification via WebSockets (if you use Socket.IO)
  if (global.io) {
    global.io.to(userId.toString()).emit('pushNotification', { message });
  }
};

// Driver presses "I'm Waiting" → Notify user
router.post('/driver-waiting/:rideId', async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Form.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Notify the user in German
    const notificationMessage = "🚖 Ihr Fahrer wartet auf Sie! Bitte begeben Sie sich zum Abholpunkt.";

    sendPushNotification(ride.userId, notificationMessage);

    res.status(200).json({ message: 'Notification sent successfully.' });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ message: 'Error sending notification' });
  }
});

module.exports = router;
