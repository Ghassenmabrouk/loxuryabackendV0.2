const express = require('express');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Database connection
const connectDatabase = require('./config/connect');
connectDatabase();
const Driver = require('./models/driver');
const Form = require('./models/form');

// Routes
const userrouter = require('./routes/auth/user');
const editrouter = require('./routes/auth/edit');
const loginrouter = require('./routes/auth/login');
const logoutrouter = require('./routes/auth/logout');
const confirmrouter = require('./routes/auth/confirm');
const resetrouter = require('./routes/auth/restpassword');
const updateduserrouter = require('./routes/auth/updateduser');
const checkuser = require('./routes/auth/checkuser');
const userslistrouter = require('./routes/auth/userslist');
const productRouter = require('./routes/auth/product');
const contactRouter = require('./routes/auth/contact');
const fulleditRouter = require('./routes/auth/full-edit');
const passwordsrouter = require('./routes/topsecret/changepwd');
const hotelrouter = require('./routes/auth/hotel');
const newsrouter = require('./routes/inside/news');
const viprouter = require('./routes/auth/vipaccess');
const eventsrouter = require('./routes/inside/events');
const paymentrouter = require('./routes/topsecret/payment');
const carrierrouter = require('./routes/auth/carrer');
const jobsRouter = require('./routes/inside/jobs');
const formrouter = require('./routes/auth/form');
const requestsrouter = require('./routes/inside/request');
const rolerouter = require('./routes/topsecret/role');
const tagsrouter = require('./routes/topsecret/tags');
const Adashboardrouter = require('./routes/topsecret/dashboard');
const recentrouter = require('./routes/topsecret/recent');
const paymeneventstrouter = require('./routes/topsecret/payment-events');
const messagerouter = require('./routes/inside/message');
const restaurantrouter = require('./routes/inside/restaurant');
const paymentresaurantsrouter = require('./routes/topsecret/payment-restaurant');
const openaiRoutes = require('./routes/topsecret/Ai');
const driverrouter = require('./routes/mobile/driver');
const riderouter = require('./routes/mobile/ride');
const mnotificationrouter = require('./routes/mobile/notification');
const savedLocationsRouter = require('./routes/mobile/savedLocations');
// Create an Express app
const app = express();
const port = 3100;

// CORS configuration - must be defined before using
const allowedOrigins = [
  'https://ubcgtubcgt.netlify.app',
  'http://localhost:4200',
  'http://192.168.1.30:19006',
  'http://localhost:8081',
  'https://loxuryabackend.onrender.com',
  'https://loxuryabackendv0-1.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:10, // Limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to specific routes
app.use('/login', limiter);
app.use('/register', limiter);

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }

    req.user = decoded; // Add the decoded JWT to req.user
    next();
  });
};

// Routes
app.use('/updateduser', verifyToken, updateduserrouter);
app.use('/edit', verifyToken, editrouter);
app.use('/logout', verifyToken, logoutrouter);
app.use('/confirm', confirmrouter);
app.use('/api', verifyToken, checkuser);
app.use('/api1', verifyToken, userslistrouter);
app.use('/login', loginrouter);
app.use('/register', userrouter);
app.use('/resetpassword', resetrouter);
app.use('/api2', productRouter);
app.use('/api4', contactRouter);
app.use('/fulledit', verifyToken, fulleditRouter);
app.use('/password', verifyToken, passwordsrouter);
app.use('/hotels', verifyToken, hotelrouter);
app.use('/news', verifyToken, newsrouter);
app.use('/vip', verifyToken, viprouter);
app.use('/events', verifyToken, eventsrouter);
app.use('/payment', verifyToken, paymentrouter);
app.use('/jobs', verifyToken, jobsRouter);
app.use('/carrier', carrierrouter);
app.use('/form', formrouter);
app.use('/requests', verifyToken, requestsrouter);
app.use('/role', verifyToken, rolerouter);
app.use('/tags', verifyToken, tagsrouter);
app.use('/Adashboard', verifyToken, Adashboardrouter);
app.use('/recent', verifyToken, recentrouter);
app.use('/paymentevents', verifyToken, paymeneventstrouter);
app.use('/message', verifyToken, messagerouter);
app.use('/resto', verifyToken, restaurantrouter);
app.use('/paymentrestaurants', verifyToken, paymentresaurantsrouter);
app.use('/ride', verifyToken, riderouter);
app.use('/driver', verifyToken, driverrouter);
app.use('/mnotification',verifyToken, mnotificationrouter);
app.use('/api/openai', openaiRoutes);
app.use('/saved-locations', verifyToken, savedLocationsRouter);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO instances
const driverIo = new Server(server, {
  path: '/driver-socket',
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const notificationIo = new Server(server, {
  path: '/notification-socket',
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Socket.IO logic for driver location updates
driverIo.on('connection', (socket) => {
  console.log('Driver connected:', socket.id);

  socket.on('driverLocationUpdate', async ({ driverId, rideId, location }) => {
    try {
      const updatedDriver = await Driver.findOneAndUpdate(
        { _id: driverId },
        { 'location.latitude': location.latitude, 'location.longitude': location.longitude, updatedAt: Date.now() },
        { new: true }
      );

      if (!updatedDriver) {
        console.error(`Driver with ID ${driverId} not found.`);
        return;
      }

      console.log(`Updated location for driver ${driverId}:`, location);

      const ride = await Form.findById(rideId);
      if (ride) {
        driverIo.emit('locationUpdated', {
          driverId,
          rideId,
          location,
          customerId: ride.userId,
        });
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Driver disconnected:', socket.id);
  });
});

// Socket.IO logic for notifications
notificationIo.on('connection', (socket) => {
  console.log('User connected for notifications:', socket.id);

  // Listen for user-specific notifications
  socket.on('subscribeToNotifications', (userId) => {
    console.log(`User ${userId} subscribed to notifications`);
    socket.join(userId); // Join a room for the user
  });

  // Handle ride reminders
  socket.on('sendRideReminder', ({ userId, message }) => {
    console.log(`Sending ride reminder to user ${userId}:`, message);
    notificationIo.to(userId).emit('rideReminder', { message });
  });

  // Handle general alerts
  socket.on('sendAlert', ({ userId, message }) => {
    console.log(`Sending alert to user ${userId}:`, message);
    notificationIo.to(userId).emit('alert', { message });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected from notifications:', socket.id);
  });
});

// 404 handler
app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = { app };
