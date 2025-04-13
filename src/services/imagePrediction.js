const tf = require("@tensorflow/tfjs");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

let model;
const classNames = [
  "Tomato__Target_Spot",
  "Tomato__Tomato_mosaic_virus",
  "Tomato__Tomato_YellowLeaf__Curl_Virus",
  "Tomato_Bacterial_spot",
  "Tomato_Early_blight",
  "Tomato_healthy",
  "Tomato_Late_blight",
  "Tomato_Leaf_Mold",
  "Tomato_Septoria_leaf_spot",
  "Tomato_Spider_mites_Two_spotted_spider_mite"
];

const loadModel = async () => {
  const modelPath = path.resolve(__dirname, "../../Tomato_Image_Model/model.json");
  model = await tf.loadLayersModel(`file://${modelPath}`);
  logger.info("✅ AI Model loaded");
};

const predictImage = async (imagePath) => {
  const buffer = fs.readFileSync(imagePath);
  let imageTensor = tf.node.decodeImage(buffer, 3);
  imageTensor = tf.image.resizeBilinear(imageTensor, [224, 224])
    .div(255.0)
    .expandDims(0);
  const prediction = model.predict(imageTensor);
  const predictedIndex = prediction.argMax(-1).dataSync()[0];
  return classNames[predictedIndex].replace(/_/g, ' ').toUpperCase();
};

module.exports = { loadModel, predictImage };

