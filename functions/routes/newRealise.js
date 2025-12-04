
 const express=require('express');
 const router=express.Router();

 const sendNewRealise=require('../controller/NewRealiseMail');

 router.get('/newRealise',sendNewRealise.sendNewRelease);

 exports.router=router;