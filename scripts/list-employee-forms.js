/*
  Usage: node scripts/list-employee-forms.js <employeeId>
  Run from backend/ directory. Requires NODE_ENV and .env configured for DB connection.
*/

const mongoose = require('mongoose');
const path = require('path');

// Load DB connection (assumes backend/database/conn.js exports mongoose connection or connects on require)
require('../database/conn');

const models = {
  OnboardingApplication: require('../database/Models/OnboardingApplication'),
  PersonalInformation: require('../database/Models/PersonalInformation'),
  ProfessionalExperience: require('../database/Models/ProfessionalExperience'),
  WorkExperience: require('../database/Models/WorkExperience'),
  Education: require('../database/Models/Education'),
  References: require('../database/Models/References'),
  EmploymentApplication: require('../database/Models/EmploymentApplication'),
  I9Form: require('../database/Models/I9Form'),
  W4Form: require('../database/Models/W4Form'),
  W9Form: require('../database/Models/W9Form'),
  EmergencyContact: require('../database/Models/EmergencyContact'),
  DirectDeposit: require('../database/Models/DirectDeposit'),
  MisconductStatement: require('../database/Models/MisconductStatement'),
  CodeOfEthics: require('../database/Models/CodeOfEthics'),
  ServiceDeliveryPolicy: require('../database/Models/ServiceDeliveryPolicy'),
  NonCompeteAgreement: require('../database/Models/NonCompeteAgreement'),
  BackgroundCheck: require('../database/Models/BackgroundCheck'),
  TBSymptomScreen: require('../database/Models/TBSymptomScreen'),
  OrientationChecklist: require('../database/Models/OrientationChecklist'),
  PCAJobDescription: require('../database/Models/PCAJobDescription'),
  CNAJobDescription: require('../database/Models/CNAJobDescription'),
  LPNJobDescription: require('../database/Models/LPNJobDescription'),
  RNJobDescription: require('../database/Models/RNJobDescription')
};

const [,, employeeId] = process.argv;
if (!employeeId) {
  console.error('Please provide an employeeId as the first argument');
  process.exit(1);
}

(async () => {
  try {
    console.log('Searching for onboarding applications for employeeId:', employeeId);

    const apps = await models.OnboardingApplication.find({ $or: [{ employeeId }, { employeeId: mongoose.Types.ObjectId.isValid(employeeId) ? mongoose.Types.ObjectId(employeeId) : null }] }).lean();

    if (!apps || apps.length === 0) {
      console.log('No OnboardingApplication documents found');
      process.exit(0);
    }

    for (const app of apps) {
      console.log('\nApplication:', app._id.toString());
      console.log('  employeeId:', app.employeeId?.toString());
      console.log('  applicationStatus:', app.applicationStatus);
      console.log('  completedForms:', app.completedForms || []);

      // For each model, attempt to find a document with this applicationId
      for (const [name, Model] of Object.entries(models)) {
        if (name === 'OnboardingApplication') continue;
        try {
          const doc = await Model.findOne({ applicationId: app._id }).lean();
          if (doc) {
            console.log(`  Found ${name}: id=${doc._id.toString()} status=${doc.status || doc.applicationStatus || 'n/a'}`);
          }
        } catch (err) {
          // ignore missing models
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
