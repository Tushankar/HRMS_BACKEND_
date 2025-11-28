const express = require("express");
const axios = require("axios");
const router = express.Router();

// Static US states data (reliable fallback)
const US_STATES = [
  { name: "Alabama" },
  { name: "Alaska" },
  { name: "Arizona" },
  { name: "Arkansas" },
  { name: "California" },
  { name: "Colorado" },
  { name: "Connecticut" },
  { name: "Delaware" },
  { name: "Florida" },
  { name: "Georgia" },
  { name: "Hawaii" },
  { name: "Idaho" },
  { name: "Illinois" },
  { name: "Indiana" },
  { name: "Iowa" },
  { name: "Kansas" },
  { name: "Kentucky" },
  { name: "Louisiana" },
  { name: "Maine" },
  { name: "Maryland" },
  { name: "Massachusetts" },
  { name: "Michigan" },
  { name: "Minnesota" },
  { name: "Mississippi" },
  { name: "Missouri" },
  { name: "Montana" },
  { name: "Nebraska" },
  { name: "Nevada" },
  { name: "New Hampshire" },
  { name: "New Jersey" },
  { name: "New Mexico" },
  { name: "New York" },
  { name: "North Carolina" },
  { name: "North Dakota" },
  { name: "Ohio" },
  { name: "Oklahoma" },
  { name: "Oregon" },
  { name: "Pennsylvania" },
  { name: "Rhode Island" },
  { name: "South Carolina" },
  { name: "South Dakota" },
  { name: "Tennessee" },
  { name: "Texas" },
  { name: "Utah" },
  { name: "Vermont" },
  { name: "Virginia" },
  { name: "Washington" },
  { name: "West Virginia" },
  { name: "Wisconsin" },
  { name: "Wyoming" },
  { name: "District of Columbia" },
];

// Static countries with states data
const COUNTRIES_WITH_STATES = {
  "United States": US_STATES,
  Canada: [
    { name: "Alberta" },
    { name: "British Columbia" },
    { name: "Manitoba" },
    { name: "New Brunswick" },
    { name: "Newfoundland and Labrador" },
    { name: "Nova Scotia" },
    { name: "Ontario" },
    { name: "Prince Edward Island" },
    { name: "Quebec" },
    { name: "Saskatchewan" },
    { name: "Northwest Territories" },
    { name: "Nunavut" },
    { name: "Yukon" },
  ],
  India: [
    { name: "Andhra Pradesh" },
    { name: "Arunachal Pradesh" },
    { name: "Assam" },
    { name: "Bihar" },
    { name: "Chhattisgarh" },
    { name: "Goa" },
    { name: "Gujarat" },
    { name: "Haryana" },
    { name: "Himachal Pradesh" },
    { name: "Jharkhand" },
    { name: "Karnataka" },
    { name: "Kerala" },
    { name: "Madhya Pradesh" },
    { name: "Maharashtra" },
    { name: "Manipur" },
    { name: "Meghalaya" },
    { name: "Mizoram" },
    { name: "Nagaland" },
    { name: "Odisha" },
    { name: "Punjab" },
    { name: "Rajasthan" },
    { name: "Sikkim" },
    { name: "Tamil Nadu" },
    { name: "Telangana" },
    { name: "Tripura" },
    { name: "Uttar Pradesh" },
    { name: "Uttarakhand" },
    { name: "West Bengal" },
    { name: "Delhi" },
  ],
  Australia: [
    { name: "New South Wales" },
    { name: "Victoria" },
    { name: "Queensland" },
    { name: "Western Australia" },
    { name: "South Australia" },
    { name: "Tasmania" },
    { name: "Australian Capital Territory" },
    { name: "Northern Territory" },
  ],
  "United Kingdom": [
    { name: "England" },
    { name: "Scotland" },
    { name: "Wales" },
    { name: "Northern Ireland" },
  ],
};

// Static countries list
const COUNTRIES_LIST = [
  { country: "United States", cities: [] },
  { country: "Canada", cities: [] },
  { country: "United Kingdom", cities: [] },
  { country: "Australia", cities: [] },
  { country: "India", cities: [] },
  { country: "Germany", cities: [] },
  { country: "France", cities: [] },
  { country: "Italy", cities: [] },
  { country: "Spain", cities: [] },
  { country: "Mexico", cities: [] },
  { country: "Brazil", cities: [] },
  { country: "China", cities: [] },
  { country: "Japan", cities: [] },
  { country: "South Korea", cities: [] },
  { country: "Philippines", cities: [] },
  { country: "Vietnam", cities: [] },
  { country: "Nigeria", cities: [] },
  { country: "South Africa", cities: [] },
  { country: "Egypt", cities: [] },
  { country: "Kenya", cities: [] },
];

// Proxy endpoint to get all countries
router.get("/countries", async (req, res) => {
  console.log("📍 GET /api/location/countries called");
  try {
    const response = await axios.get(
      "https://countriesnow.space/api/v0.1/countries",
      { timeout: 5000 }
    );
    console.log("✅ Countries fetched from external API");
    res.json(response.data);
  } catch (error) {
    console.error(
      "⚠️ Error fetching countries from external API:",
      error.message
    );
    console.log("📋 Using fallback countries data");
    // Return fallback data if API fails
    res.json({
      error: false,
      msg: "countries retrieved (fallback)",
      data: COUNTRIES_LIST,
    });
  }
});

// Proxy endpoint to get states by country
router.post("/states", async (req, res) => {
  const { country } = req.body;
  console.log("📍 POST /api/location/states called for country:", country);

  if (!country) {
    return res.status(400).json({
      error: true,
      msg: "Country is required",
      data: { states: [] },
    });
  }

  // Check if we have static data for this country first (more reliable)
  if (COUNTRIES_WITH_STATES[country]) {
    console.log("✅ Using static states data for:", country);
    return res.json({
      error: false,
      msg: "states retrieved",
      data: {
        name: country,
        states: COUNTRIES_WITH_STATES[country],
      },
    });
  }

  // Try external API for other countries
  try {
    const response = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/states",
      { country },
      { timeout: 5000 }
    );
    console.log("✅ States fetched from external API for:", country);
    res.json(response.data);
  } catch (error) {
    console.error("⚠️ Error fetching states from external API:", error.message);
    res.json({
      error: true,
      msg: "Failed to fetch states for this country",
      data: { states: [] },
    });
  }
});

// Proxy endpoint to get cities by country and state
router.post("/cities", async (req, res) => {
  const { country, state } = req.body;
  console.log("📍 POST /api/location/cities called for:", country, "-", state);

  if (!country || !state) {
    return res.status(400).json({
      error: true,
      msg: "Country and state are required",
      data: [],
    });
  }

  try {
    const response = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/state/cities",
      { country, state },
      { timeout: 5000 }
    );
    console.log("✅ Cities fetched from external API");
    res.json(response.data);
  } catch (error) {
    console.error("⚠️ Error fetching cities from external API:", error.message);
    // Return empty cities - user can type manually
    res.json({
      error: false,
      msg: "Cities not available - please type manually",
      data: [],
    });
  }
});

module.exports = router;
