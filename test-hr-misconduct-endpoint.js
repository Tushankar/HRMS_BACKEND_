const axios = require("axios");

async function testHRMisconductEndpoint() {
  try {
    console.log("🧪 Testing HR misconduct statement data loading...\n");

    // Test with a known employee ID - you can replace this with an actual employee ID
    // First, let's get all applications to find one with misconduct statement data

    const employeeId = process.argv[2] || "67e0f8770c6feb6ba99d11d2"; // Default test ID

    console.log(`📋 Testing with employeeId: ${employeeId}\n`);

    const apiUrl = `https://api.carecompapp.com/onboarding/get-application/${employeeId}`;
    console.log(`🔗 Making request to: ${apiUrl}\n`);

    const response = await axios.get(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    console.log("📊 Full API Response Status:", response.status);
    console.log("\n📦 Response Structure:");
    console.log("  - response.data.message:", response.data?.message);
    console.log("  - response.data.data exists:", !!response.data?.data);
    console.log(
      "  - response.data.data.forms exists:",
      !!response.data?.data?.forms,
    );
    console.log(
      "  - response.data.data.forms.misconductStatement exists:",
      !!response.data?.data?.forms?.misconductStatement,
    );

    console.log("\n📄 Misconduct Statement Data:");
    const misconductData = response.data?.data?.forms?.misconductStatement;

    if (misconductData) {
      console.log("  ✅ Data found!");
      console.log("  - _id:", misconductData._id);
      console.log("  - applicationId:", misconductData.applicationId);
      console.log("  - employeeId:", misconductData.employeeId);
      console.log("  - status:", misconductData.status);
      console.log("  - staffTitle:", misconductData.staffTitle);
      console.log("  - companyName:", misconductData.companyName);
      console.log("  - employeeName:", misconductData.employeeName);
      console.log("  - employmentPosition:", misconductData.employmentPosition);
      console.log("  - dateField1:", misconductData.dateField1);
      console.log("  - dateField2:", misconductData.dateField2);
      console.log(
        "  - signatureLine length:",
        misconductData.signatureLine?.length || 0,
      );
      console.log(
        "  - signatureField length:",
        misconductData.signatureField?.length || 0,
      );
      console.log("  - hrFeedback:", misconductData.hrFeedback);
      console.log("\n✅ Data is being returned correctly from backend!");
    } else {
      console.log("  ❌ No misconduct statement data found");
      console.log("  This could mean:");
      console.log("  - The employee hasn't submitted this form yet");
      console.log("  - The form exists but is empty");

      // Show the entire forms object to debug
      console.log("\n📋 Available forms:");
      const forms = response.data?.data?.forms || {};
      Object.keys(forms).forEach((key) => {
        const form = forms[key];
        if (form) {
          console.log(`  - ${key}: ${form?.status || "no status"}`);
        }
      });
    }

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error occurred:");
    if (error.response) {
      console.log("📊 Status:", error.response.status);
      console.log("📄 Error message:", error.response.data?.message);
      console.log(
        "📄 Full response:",
        JSON.stringify(error.response.data, null, 2),
      );
    } else if (error.request) {
      console.log("❌ No response received from server");
      console.log("📄 Request:", error.request);
    } else {
      console.log("📄 Error:", error.message);
    }
  }
}

testHRMisconductEndpoint();
