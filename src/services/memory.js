const Farmer = require('../models/Farmers');
const log = require('../utils/logger');

const getFarmerByPhone = async (phone) => {
  try {
    const farmer = await Farmer.findOne({phone});
    return farmer;
    }catch (error) {
        log.error('Error fetching farmer by phone:', error.message);
        return null;
    }
    }

const createFarmer = async (farmerData) => {
  try {
    const newFarmer = new Farmer(farmerData);
    await newFarmer.save();
  } catch (error) {
    log.error('Error creating farmer:', error.message);
    return null;
  }
}

module.exports = {
  getFarmerByPhone,
  createFarmer
};