const mongoose = require('mongoose');
const EmploymentApplication = require('./database/Models/EmploymentApplication');
require('dotenv').config();

async function migrateEmploymentApplications() {
  try {
    console.log('🔄 Connecting to database...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrportal';
    console.log('🔗 Connecting to:', mongoUri.replace(/\/\/.*@/, '//***:***@'));

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    console.log('🔄 Finding Employment Applications without background check fields...');

    // Find all Employment Applications that don't have background check fields
    const applications = await EmploymentApplication.find({
      $or: [
        { 'applicantInfo.height': { $exists: false } },
        { 'applicantInfo.weight': { $exists: false } },
        { 'applicantInfo.eyeColor': { $exists: false } },
        { 'applicantInfo.hairColor': { $exists: false } },
        { 'applicantInfo.dateOfBirth': { $exists: false } },
        { 'applicantInfo.sex': { $exists: false } },
        { 'applicantInfo.race': { $exists: false } }
      ]
    });

    console.log(`📊 Found ${applications.length} Employment Application documents that need migration`);

    let updatedCount = 0;
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      console.log(`${i + 1}/${applications.length} - Processing ID: ${app._id}`);

      // Ensure applicantInfo exists
      if (!app.applicantInfo) {
        app.applicantInfo = {};
      }

      // Add missing background check fields as empty strings/null
      const updates = [];

      if (app.applicantInfo.height === undefined) {
        app.applicantInfo.height = '';
        updates.push('height');
      }
      if (app.applicantInfo.weight === undefined) {
        app.applicantInfo.weight = '';
        updates.push('weight');
      }
      if (app.applicantInfo.eyeColor === undefined) {
        app.applicantInfo.eyeColor = '';
        updates.push('eyeColor');
      }
      if (app.applicantInfo.hairColor === undefined) {
        app.applicantInfo.hairColor = '';
        updates.push('hairColor');
      }
      if (app.applicantInfo.dateOfBirth === undefined) {
        app.applicantInfo.dateOfBirth = null;
        updates.push('dateOfBirth');
      }
      if (app.applicantInfo.sex === undefined) {
        app.applicantInfo.sex = '';
        updates.push('sex');
      }
      if (app.applicantInfo.race === undefined) {
        app.applicantInfo.race = '';
        updates.push('race');
      }

      if (updates.length > 0) {
        await app.save();
        updatedCount++;
        console.log(`✅ Updated Employment Application ID: ${app._id} - Added fields: ${updates.join(', ')}`);
      }
    }

    console.log(`🎉 Migration completed! Updated ${updatedCount} documents.`);

    // Verify a few documents to make sure migration worked
    if (applications.length > 0) {
      // Check specific document the user mentioned
      const targetDocId = "68cd669b21dec4327dd0d44f"; // From user's example
      let verifyDoc;

      try {
        verifyDoc = await EmploymentApplication.findById(targetDocId);
        console.log(`🔍 Verification - Document ${targetDocId}:`);
        console.log(`   applicantInfo exists: ${!!verifyDoc?.applicantInfo}`);
        if (verifyDoc?.applicantInfo) {
          console.log(`   height: '${verifyDoc.applicantInfo.height}'`);
          console.log(`   weight: '${verifyDoc.applicantInfo.weight}'`);
          console.log(`   eyeColor: '${verifyDoc.applicantInfo.eyeColor}'`);
          console.log(`   hairColor: '${verifyDoc.applicantInfo.hairColor}'`);
          console.log(`   dateOfBirth: ${verifyDoc.applicantInfo.dateOfBirth}`);
          console.log(`   sex: '${verifyDoc.applicantInfo.sex}'`);
          console.log(`   race: '${verifyDoc.applicantInfo.race}'`);
        }
      } catch (verifyError) {
        console.log(`⚠️  Could not verify specific document ${targetDocId}, using first available document`);

        // Fallback to first document
        const firstUpdated = await EmploymentApplication.findById(applications[0]._id);
        console.log(`🔍 Verification - Document ${firstUpdated._id}:`);
        console.log(`   height: '${firstUpdated.applicantInfo.height}'`);
        console.log(`   weight: '${firstUpdated.applicantInfo.weight}'`);
        console.log(`   eyeColor: '${firstUpdated.applicantInfo.eyeColor}'`);
        console.log(`   hairColor: '${firstUpdated.applicantInfo.hairColor}'`);
        console.log(`   dateOfBirth: ${firstUpdated.applicantInfo.dateOfBirth}`);
        console.log(`   sex: '${firstUpdated.applicantInfo.sex}'`);
        console.log(`   race: '${firstUpdated.applicantInfo.race}'`);
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

migrateEmploymentApplications().catch(console.error);
