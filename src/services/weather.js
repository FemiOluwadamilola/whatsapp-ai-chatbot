const axios = require("axios");
const log = require("../utils/logger");
require("dotenv").config();

const API_KEY = process.env.OPENWEATHER_API_KEY;

const getWeatherForecast = async (location) => {
  try {
    // Current weather data
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=metric&appid=${API_KEY}`;

    const [currentRes, forecastRes] = await Promise.all([
      axios.get(currentUrl),
      axios.get(forecastUrl),
    ]);

    const currentData = currentRes.data;
    const forecastList = forecastRes.data.list.slice(0, 8); // Next 24 hours (3h x 8 = 24h)

    const description = currentData.weather[0].description.toLowerCase();
    const temp = currentData.main.temp;
    const humidity = currentData.main.humidity;

    // Check for rain in the next 24 hours
    const rainIncoming = forecastList.some(
      (f) => f.weather[0].main.toLowerCase().includes("rain")
    );

    let advice = "";

    if (description.includes("rain") || rainIncoming) {
      advice = "🌧️ *Rain Alert*: Rain is expected soon. Please protect your crops and ensure proper drainage on your farm.";
    } else {
      advice = "☀️ *Dry Weather*: No rain is expected in the next 24 hours. Consider setting up or maintaining your irrigation system to keep crops healthy.";
    }

    return `🌦️ Weather in *${currentData.name}*:\n- ${description}\n- 🌡 Temp: ${temp}°C\n- 💧 Humidity: ${humidity}%\n\n${advice}`;
  } catch (err) {
    log.error("Weather API Error:", err.message);
    return "❌ I couldn’t fetch the weather forecast right now. Please check the location and try again.";
  }
};

module.exports = getWeatherForecast;
