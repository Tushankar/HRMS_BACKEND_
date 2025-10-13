/**
 * Script to fix existing Background Check records with empty applicantInfo
 * Run this to populate empty fields with data from Employment Application
 */

const mongoose = require("mongoose");
const BackgroundCheck = require("./database/Models/BackgroundCheck");
const EmploymentApplication = require("./database/Models/EmploymentApplication");

const fixBackgroundCheckData = async () => {
  try {
    console.log("🔧 Starting Background Check data fix...\n");

    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/HRMS" || process.env.MONGO_URI);
    console.log("✅ Connected to database\n");

    // Find all background checks with empty or incomplete applicantInfo
    const backgroundChecks = await BackgroundCheck.find({});
    console.log(`📋 Found ${backgroundChecks.length} background check records\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const bgCheck of backgroundChecks) {
      console.log(`\n📝 Checking Background Check ID: ${bgCheck._id}`);
      console.log(`   Application ID: ${bgCheck.applicationId}`);

      // Check if physical fields are missing
      const needsFix = 
        !bgCheck.applicantInfo?.height ||
        !bgCheck.applicantInfo?.weight ||
        !bgCheck.applicantInfo?.eyeColor ||
        !bgCheck.applicantInfo?.hairColor;

      if (!needsFix) {
        console.log("   ✅ Physical fields already present, skipping");
        skippedCount++;
        continue;
      }

      console.log("   ⚠️  Physical fields missing, attempting to fix...");

      // Try to find corresponding Employment Application
      const empApp = await EmploymentApplication.findOne({
        applicationId: bgCheck.applicationId,
      });

      if (!empApp) {
        console.log("   ❌ No Employment Application found, cannot fix");
        continue;
      }

      console.log("   📄 Found Employment Application");

      // Merge data from Employment Application
      const updatedApplicantInfo = {
        lastName: bgCheck.applicantInfo?.lastName || empApp.applicantInfo?.lastName || "",
        firstName: bgCheck.applicantInfo?.firstName || empApp.applicantInfo?.firstName || "",
        middleInitial: bgCheck.applicantInfo?.middleInitial || empApp.applicantInfo?.middleName || "",
        socialSecurityNumber: bgCheck.applicantInfo?.socialSecurityNumber || empApp.applicantInfo?.ssn || "",
        height: bgCheck.applicantInfo?.height || empApp.applicantInfo?.height || "",
        weight: bgCheck.applicantInfo?.weight || empApp.applicantInfo?.weight || "",
        eyeColor: bgCheck.applicantInfo?.eyeColor || empApp.applicantInfo?.eyeColor || "",
        hairColor: bgCheck.applicantInfo?.hairColor || empApp.applicantInfo?.hairColor || "",
        dateOfBirth: bgCheck.applicantInfo?.dateOfBirth || empApp.applicantInfo?.dateOfBirth || null,
        sex: bgCheck.applicantInfo?.sex || empApp.applicantInfo?.sex || "",
        race: bgCheck.applicantInfo?.race || empApp.applicantInfo?.race || "",
        address: {
          street: bgCheck.applicantInfo?.address?.street || empApp.applicantInfo?.address || "",
          city: bgCheck.applicantInfo?.address?.city || empApp.applicantInfo?.city || "",
          state: bgCheck.applicantInfo?.address?.state || empApp.applicantInfo?.state || "",
          zipCode: bgCheck.applicantInfo?.address?.zipCode || empApp.applicantInfo?.zip || "",
        },
      };

      console.log("   📊 Updated physical fields:");
      console.log("      Height:", updatedApplicantInfo.height || "NOT SET");
      console.log("      Weight:", updatedApplicantInfo.weight || "NOT SET");
      console.log("      Eye Color:", updatedApplicantInfo.eyeColor || "NOT SET");
      console.log("      Hair Color:", updatedApplicantInfo.hairColor || "NOT SET");

      // Update the background check
      bgCheck.applicantInfo = updatedApplicantInfo;
      bgCheck.markModified('applicantInfo');
      await bgCheck.save();

      console.log("   ✅ Background Check updated successfully");
      fixedCount++;
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 Fix complete!");
    console.log(`   ✅ Fixed: ${fixedCount} records`);
    console.log(`   ⏭️  Skipped: ${skippedCount} records (already had data)`);
    console.log("=".repeat(70) + "\n");

    await mongoose.connection.close();
    console.log("✅ Database connection closed\n");

  } catch (error) {
    console.error("❌ Error fixing background check data:", error);
    process.exit(1);
  }
};

// Run the fix
fixBackgroundCheckData();
