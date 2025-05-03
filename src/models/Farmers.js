const mongoose = require('mongoose');
const farmerSchema = new mongoose.Schema({
   phone:{
      type:String,
      required:true,
      unique:true
   },
   location:{
        type:String
   }
},{
    timestamps:true
});

const Farmer = mongoose.model('Farmer', farmerSchema);
module.exports = Farmer;