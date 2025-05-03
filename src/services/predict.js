const puppeteer = require('puppeteer');
const path = require('path');  // For path resolution
const log = require('../utils/logger');  

async function runPrediction(imageUrl) {
  try{
    const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const filePath = path.join(__dirname, '..', 'utils', 'predictor.html');
  await page.goto('file://' + filePath);

  // Wait for model to load (with extended timeout)
  await page.waitForFunction(() => window.modelLoaded === true, { timeout: 60000 });

  // Check if the predictFromUrl function is available
  const prediction = await page.evaluate(async (imageUrl) => {
    if (typeof predictFromUrl !== 'function') {
      // throw new Error('predictFromUrl function is not defined!');
      log.fatal('predictFromUrl function is not defined!');
      return null;
    }
    return await predictFromUrl(imageUrl);
  }, imageUrl);

  await browser.close();
  
  return prediction;
  }catch(err){
    log.error(`Error in runPrediction: ${err.message}`);
    // throw new Error("Prediction failed.");
  }
}

module.exports = { runPrediction };
