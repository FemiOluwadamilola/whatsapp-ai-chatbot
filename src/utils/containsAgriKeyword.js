const agriKeywords = [
    "plant", "farming", "farm", "agriculture", "soil", "crop", "harvest",
    "fertilizer", "compost", "greenhouse", "irrigation", "pesticide",
    "disease", "germination", "seeds", "livestock", "tractor", "agronomy",
    "climate", "weather", "yield", "weeding", "organic",
  ];
  
  function containsAgriKeyword(text) {
    const cleaned = text.toLowerCase();
    return agriKeywords.some((keyword) => cleaned.includes(keyword));
  }

  module.exports = containsAgriKeyword;