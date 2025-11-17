const mongoose = require('mongoose');
const OnboardingApplication = require('./database/Models/OnboardingApplication');
require('dotenv').config();

async function testProfessionalCertificates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('Connected to MongoDB');

    // Find the application
    const applicationId = '691b09aad44c1fb01d5ac719';
    const application = await OnboardingApplication.findById(applicationId);
    
    if (!application) {
      console.log('❌ Application not found');
      return;
    }

    console.log('✅ Application found:', application._id);
    console.log('📋 Current professionalCertificates:', application.professionalCertificates);
    console.log('🔑 Available keys:', Object.keys(application.professionalCertificates || {}));
    
    // Check PCA documents specifically
    const pcaDocuments = application.professionalCertificates?.PCA || [];
    console.log('📄 PCA Documents:', pcaDocuments);
    console.log('📊 PCA Document count:', pcaDocuments.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testProfessionalCertificates();