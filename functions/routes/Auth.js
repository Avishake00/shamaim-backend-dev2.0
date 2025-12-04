const express = require('express');
const {loginUser, checkAuth,verifyGoogleToken,verifyOtp,insertGoogleEmail} = require('../controller/Auth');

const router = express.Router();
//  /auth is already added in base path
router.post('/login',  loginUser)
.get('/check/:id', checkAuth)
.post('/google',verifyGoogleToken)
.post('/verify',verifyOtp)
.get('/getEmail/',insertGoogleEmail)
exports.router = router;
