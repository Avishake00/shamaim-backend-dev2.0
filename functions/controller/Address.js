const {User} =require('../model/User');

async function RemoveAddress(){
    const{userID,address}=req.query;
    if(userID){
        let data=await User.findById({_id:userID});
        
    }

}
module.exports={RemoveAddress};