require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./database/conn");

// Import all form models
const EmploymentApplication = require("./database/Models/EmploymentApplication");
const I9Form = require("./database/Models/I9Form");
const W4Form = require("./database/Models/W4Form");
const W9Form = require("./database/Models/W9Form");
const EmergencyContact = require("./database/Models/EmergencyContact");
const DirectDeposit = require("./database/Models/DirectDeposit");
const MisconductStatement = require("./database/Models/MisconductStatement");
const CodeOfEthics = require("./database/Models/CodeOfEthics");
const ServiceDeliveryPolicy = require("./database/Models/ServiceDeliveryPolicy");
const NonCompeteAgreement = require("./database/Models/NonCompeteAgreement");
const BackgroundCheck = require("./database/Models/BackgroundCheck");
const TBSymptomScreen = require("./database/Models/TBSymptomScreen");
const OrientationChecklist = require("./database/Models/OrientationChecklist");
const JobDescriptionAcknowledgment = require("./database/Models/JobDescriptionAcknowledgment");
const PCAJobDescription = require("./database/Models/PCAJobDescription");
const CNAJobDescription = require("./database/Models/CNAJobDescription");
const LPNJobDescription = require("./database/Models/LPNJobDescription");
const RNJobDescription = require("./database/Models/RNJobDescription");

async function fixHrFeedbackArrays() {
  try {
    await connectDB();
    console.log("🚀 Starting HR Feedback Migration...");

    const models = [
      { name: "EmploymentApplication", model: EmploymentApplication },
      { name: "I9Form", model: I9Form },
      { name: "W4Form", model: W4Form },
      { name: "W9Form", model: W9Form },
      { name: "EmergencyContact", model: EmergencyContact },
      { name: "DirectDeposit", model: DirectDeposit },
      { name: "MisconductStatement", model: MisconductStatement },
      { name: "CodeOfEthics", model: CodeOfEthics },
      { name: "ServiceDeliveryPolicy", model: ServiceDeliveryPolicy },
      { name: "NonCompeteAgreement", model: NonCompeteAgreement },
      { name: "BackgroundCheck", model: BackgroundCheck },
      { name: "TBSymptomScreen", model: TBSymptomScreen },
      { name: "OrientationChecklist", model: OrientationChecklist },
      { name: "JobDescriptionAcknowledgment", model: JobDescriptionAcknowledgment },
      { name: "PCAJobDescription", model: PCAJobDescription },
      { name: "CNAJobDescription", model: CNAJobDescription },
      { name: "LPNJobDescription", model: LPNJobDescription },
      { name: "RNJobDescription", model: RNJobDescription }
    ];

    let totalFixed = 0;

    for (const { name, model } of models) {
      console.log(`\n📋 Checking ${name}...`);
      
      // Find all documents where hrFeedback is an array
      const docsWithArrayFeedback = await model.find({
        hrFeedback: { $type: "array" }
      });

      console.log(`   Found ${docsWithArrayFeedback.length} documents with array hrFeedback`);

      if (docsWithArrayFeedback.length > 0) {
        for (const doc of docsWithArrayFeedback) {
          console.log(`   Fixing document ${doc._id}`);
          
          // Convert array to single object (take the last/most recent feedback)
          let newHrFeedback = null;
          
          if (doc.hrFeedback && Array.isArray(doc.hrFeedback) && doc.hrFeedback.length > 0) {
            const lastFeedback = doc.hrFeedback[doc.hrFeedback.length - 1];
            
            // Check if it's a job description form (uses 'notes' and 'timestamp')
            const isJobDescriptionForm = ['PCAJobDescription', 'CNAJobDescription', 'LPNJobDescription', 'RNJobDescription'].includes(name);
            
            if (isJobDescriptionForm) {
              newHrFeedback = {
                notes: lastFeedback.notes || lastFeedback.comment || "",
                reviewedBy: lastFeedback.reviewedBy || null,
                timestamp: lastFeedback.timestamp || lastFeedback.reviewedAt || new Date()
              };
            } else {
              newHrFeedback = {
                comment: lastFeedback.comment || lastFeedback.notes || "",
                reviewedBy: lastFeedback.reviewedBy || null,
                reviewedAt: lastFeedback.reviewedAt || lastFeedback.timestamp || new Date()
              };
            }
          }

          // Update the document directly in the database
          await model.updateOne(
            { _id: doc._id },
            { $set: { hrFeedback: newHrFeedback } }
          );
          
          totalFixed++;
        }
      }
    }

    console.log(`\n✅ Migration completed! Fixed ${totalFixed} documents total.`);
    
    // Verify the fix worked
    console.log("\n🔍 Verifying migration...");
    for (const { name, model } of models) {
      const remainingArrays = await model.countDocuments({
        hrFeedback: { $type: "array" }
      });
      
      if (remainingArrays > 0) {
        console.log(`❌ ${name}: Still has ${remainingArrays} documents with array hrFeedback`);
      } else {
        console.log(`✅ ${name}: All hrFeedback fields are now objects`);
      }
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

// Run the migration
fixHrFeedbackArrays();
