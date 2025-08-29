const mongoose = require("mongoose");
const connectURL = process.env.MONGO__ULI;



const connectDB = async () => {
  if (!connectURL) {
    throw new Error("DATABASE_URL environment variable is not defined.");
  }
  try {
    const connection = await mongoose.connect(connectURL);
    console.log("Database Connected Successfully");
    return connection;
  } catch (error) {
    console.error("Database Connection Error:", error.message);
    process.exit(1); // Exit process with failure code
  }
};

module.exports = connectDB;
