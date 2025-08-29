const mongoose = require('mongoose');
require('dotenv').config();

const OnboardingApplication = require('./database/Models/OnboardingApplication');

async function checkApplications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO__ULI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find existing applications
    const applications = await OnboardingApplication.find({}).limit(5);
    
    console.log(`\nFound ${applications.length} applications:`);
    applications.forEach((app, index) => {
      console.log(`${index + 1}. ID: ${app._id}`);
      console.log(`   Employee ID: ${app.employeeId || 'N/A'}`);
      console.log(`   Status: ${app.status || 'N/A'}`);
      console.log(`   Created: ${app.createdAt || 'N/A'}`);
      console.log('---');
    });

    if (applications.length === 0) {
      console.log('❌ No applications found in the database');
      console.log('This explains why you\'re getting "application not found" error');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkApplications();
