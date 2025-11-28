const express = require('express'); 
const cors = require('cors'); // <-- Tốt
const mongoose = require('mongoose');
const passport = require('passport');
require('dotenv').config();

require('./config/passport.config'); 

const authRoutes = require('./routes/auth.routes');
const cvRoutes = require('./routes/cv.routes'); 
const publicRoutes = require('./routes/public.routes');
const userRoutes = require('./routes/user.routes');
const aiRoutes = require('./routes/ai.routes'); 
const notificationRoutes = require('./routes/notification.routes'); 

const app = express();
const port = process.env.PORT || 5000;


const whitelist = [
    'http://localhost:5173', // Cổng 5173
    'http://localhost:5174', // Cổng 5174 (lỗi mới nhất của bạn)
    'https://resumebuilder11111.netlify.app', 
    /^https:\/\/([a-zA-Z0-9-]+\-\-)?resumebuilder11111\.netlify\.app$/ 
];

const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép nếu origin nằm trong whitelist,
        // hoặc nếu origin là 'undefined' (ví dụ: request từ Postman, server-to-server)
        if (!origin || whitelist.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(passport.initialize());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Đã kết nối thành công tới MongoDB!"))
  .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

app.use('/api/auth', authRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(port, () => {
  console.log(`🚀 Backend server đang chạy tại http://localhost:${port}`);
});