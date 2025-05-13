  const agriKeywords = [
    "crop", "harvest", "maize", "rice", "cassava", "yam", "tomato",
    "pepper", "onion", "beans", "soybean", "millet", "sorghum", "groundnut",
    "wheat", "plantain", "banana", "potato", "sweet potato", "okra"
  ];
  
  /**
   * Checks if the input text contains any crop-related keyword.
   * @param {string} text - The user input or message to evaluate.
   * @returns {boolean} - True if any crop keyword is found, otherwise false.
   */
  function containsAgriKeyword(text) {
    const cleaned = text.toLowerCase();
    return agriKeywords.some((keyword) => cleaned.includes(keyword));
  }
  
  module.exports = containsAgriKeyword;
  