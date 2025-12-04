const express = require('express');
const { fetchUserById, updateUser,updatePassword,getAllUser } = require('../controller/User');

const router = express.Router();
//  /users is already added in base path
router.get('/own/:id', fetchUserById)
      .patch('/:id', updateUser)
      .post('/forgetpassword',updatePassword)
      .get('/',getAllUser)

exports.router = router;

// "user":"6627ed431893c63b24bd32ae",
//  "product": "60aeb16e0aeb452264b9a890", 
//   "quantity": 2,
//   "size": "M",
//   "color": "red"