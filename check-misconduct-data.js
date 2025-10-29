const mongoose = require("./database/conn");
const MisconductStatement = require("./database/Models/MisconductStatement");

async function checkExistingData() {
  try {
    console.log("🔍 Checking existing misconduct statement data...");

    const applicationId = "68ac0fcb02be1191737b4070";

    const existing = await MisconductStatement.findOne({
      applicationId: applicationId,
    });

    if (existing) {
      console.log("📄 Existing data:", JSON.stringify(existing, null, 2));
    } else {
      console.log("📄 No existing misconduct statement found");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkExistingData();
