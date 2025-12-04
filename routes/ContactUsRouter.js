
const express=require('express');
const contactus=require('../controller/CountactUs');

const router=express.Router();
router.post('/contactus',contactus.getContactUs);

exports.router=router;