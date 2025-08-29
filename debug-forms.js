const mongoose = require("mongoose");
require("./database/conn"); // Connect to database

const OnboardingApplication = require("./database/Models/OnboardingApplication");
const EmploymentApplication = require("./database/Models/EmploymentApplication");
const I9Form = require("./database/Models/I9Form");
const W4Form = require("./database/Models/W4Form");
const EmergencyContact = require("./database/Models/EmergencyContact");
const MisconductStatement = require("./database/Models/MisconductStatement");
const CodeOfEthics = require("./database/Models/CodeOfEthics");
const BackgroundCheck = require("./database/Models/BackgroundCheck");
const TBSymptomScreen = require("./database/Models/TBSymptomScreen");

async function debugFormStatuses() {
  try {
    // Find the application
    const applicationId = "68ac0fcb02be1191737b4070"; // The ID from the error
    
    console.log("=== DEBUGGING FORM STATUSES ===");
    console.log("Application ID:", applicationId);
    
    const application = await OnboardingApplication.findById(applicationId);
    console.log("\nApplication Status:", application?.applicationStatus);
    console.log("Completed Forms:", application?.completedForms);
    console.log("Completion Percentage:", application?.completionPercentage);
    
    // Check each required form
    const forms = [
      { model: EmploymentApplication, name: "Employment Application" },
      { model: I9Form, name: "I-9 Form" },
      { model: W4Form, name: "W-4 Form" },
      { model: EmergencyContact, name: "Emergency Contact" },
      { model: MisconductStatement, name: "Staff Statement of Misconduct" },
      { model: CodeOfEthics, name: "Code of Ethics" },
      { model: BackgroundCheck, name: "Background Check Form" },
      { model: TBSymptomScreen, name: "TB Symptom Screen" }
    ];
    
    console.log("\n=== FORM STATUS BREAKDOWN ===");
    
    for (const form of forms) {
      const allForms = await form.model.find({ applicationId });
      const completedForms = await form.model.find({ applicationId, status: "completed" });
      
      console.log(`\n${form.name}:`);
      console.log(`  Total records: ${allForms.length}`);
      console.log(`  Completed records: ${completedForms.length}`);
      
      if (allForms.length > 0) {
        allForms.forEach((formDoc, index) => {
          console.log(`  Record ${index + 1}: status = "${formDoc.status}", id = ${formDoc._id}`);
        });
      } else {
        console.log("  No records found");
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Debug error:", error);
    process.exit(1);
  }
}

debugFormStatuses();
