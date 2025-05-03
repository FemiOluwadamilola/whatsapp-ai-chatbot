const NIGERIAN_LOCATIONS = [
    "lagos", "abuja", "ibadan", "kano", "kaduna", "port harcourt", "benin", "maiduguri",
    "jos", "zaria", "enugu", "uyo", "owerri", "ilorin", "calabar", "yola", "aba", "osogbo",
    "minna", "bauchi", "makurdi", "awka", "ado ekiti", "ekpoma", "ikot ekpene", "sokoto", "gombe"
  ];
  
  const STATE_TO_CITY = {
    "oyo": "ibadan",
    "fct": "abuja",
    "rivers": "port harcourt",
    "edo": "benin",
    "borno": "maiduguri",
    "plateau": "jos",
    "kaduna": "kaduna",
    "kano": "kano",
    "enugu": "enugu",
    "akwa ibom": "uyo",
    "imo": "owerri",
    "kwara": "ilorin",
    "cross river": "calabar",
    "adamawa": "yola",
    "abia": "aba",
    "osun": "osogbo",
    "niger": "minna",
    "bauchi": "bauchi",
    "benue": "makurdi",
    "anambra": "awka",
    "ekiti": "ado ekiti",
    "delta": "warri",
    "sokoto": "sokoto",
    "gombe": "gombe"
  };
  
  function extractLocation(text) {
    const lower = text.toLowerCase();
  
    // First check for cities
    for (const location of NIGERIAN_LOCATIONS) {
      if (lower.includes(location)) {
        return capitalizeEachWord(location);
      }
    }
  
    // Then check for state names
    for (const [state, city] of Object.entries(STATE_TO_CITY)) {
      if (lower.includes(state)) {
        return capitalizeEachWord(city);
      }
    }
  
    return null;
  }
  
  function capitalizeEachWord(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }
  
  module.exports = extractLocation;
  