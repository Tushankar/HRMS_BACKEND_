const mongoose = require("mongoose");
require("./database/conn");

const EmergencyContact = require("./database/Models/EmergencyContact");

async function debugEmergencyContact() {
  try {
    console.log("=== DEBUGGING EMERGENCY CONTACT STATUS ISSUE ===");
    
    // Find all emergency contact forms
    const forms = await EmergencyContact.find({}).sort({ updatedAt: -1 });
    console.log(`\nFound ${forms.length} emergency contact forms in database\n`);
    
    forms.forEach((form, index) => {
      console.log(`Form ${index + 1}:`);
      console.log(`  ID: ${form._id}`);
      console.log(`  Application ID: ${form.applicationId}`);
      console.log(`  Employee ID: ${form.employeeId}`);
      console.log(`  Status: ${form.status}`);
      console.log(`  Created: ${form.createdAt}`);
      console.log(`  Updated: ${form.updatedAt}`);
      console.log(`  Staff Name: ${form.staffName}`);
      console.log("---");
    });
    
    // Check schema enum values
    console.log("\n=== CHECKING SCHEMA ENUM VALUES ===");
    const schema = EmergencyContact.schema.paths.status;
    if (schema && schema.enumValues) {
      console.log("Valid status values:", schema.enumValues);
    }
    
    // Find any forms with invalid status
    console.log("\n=== CHECKING FOR INVALID STATUS VALUES ===");
    const validStatuses = ["draft", "completed", "submitted", "approved", "rejected"];
    
    for (const form of forms) {
      if (!validStatuses.includes(form.status)) {
        console.log(`⚠️  INVALID STATUS FOUND:`);
        console.log(`   Form ID: ${form._id}`);
        console.log(`   Status: "${form.status}"`);
        console.log(`   Type: ${typeof form.status}`);
        console.log(`   All form data:`, JSON.stringify(form.toObject(), null, 2));
      }
    }
    
  } catch (error) {
    console.error("Error debugging emergency contact:", error);
  } finally {
    process.exit(0);
  }
}

debugEmergencyContact();
