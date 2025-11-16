// File: config/passport.config.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model'); // Import User model

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback" // Route Google sẽ gọi lại
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Lấy thông tin user từ Google
      const { id, displayName, emails, photos } = profile;
      const email = emails[0].value;
      const avatar = photos[0].value;
      const fullName = displayName;

      // 2. Tìm xem user đã tồn tại trong DB chưa (dựa vào googleId)
      let user = await User.findOne({ googleId: id });

      if (user) {
        // 3. Nếu đã tồn tại, trả về user đó
        return done(null, user);
      }
      
      // 4. Nếu chưa tồn tại, kiểm tra xem email đã được đăng ký bằng tay chưa
      user = await User.findOne({ email: email });
      if(user) {
         // Nếu email đã đăng ký (nhưng chưa liên kết Google), cập nhật googleId
         user.googleId = id;
         await user.save();
         return done(null, user);
      }

      const newUser = new User({
        googleId: id,
        email: email,
        fullName: fullName,
        avatar: avatar,
        password: id + Date.now().toString(), 
      });

      await newUser.save();
      return done(null, newUser);

    } catch (err) {
      return done(err, false);
    }
  }
));

