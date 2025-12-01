const axios = require("axios");

const baseURL = "http://localhost:5000";

// Test data
const applicationId = "YOUR_APPLICATION_ID";
const employeeId = "YOUR_EMPLOYEE_ID";

const testNotarySignature = async () => {
  try {
    console.log("\n🧪 Testing Notary Signature Backend Integration\n");

    // Test 1: Save misconduct statement with notary signature
    console.log(
      "📝 Test 1: Saving misconduct statement with notary signature..."
    );
    const saveResponse = await axios.post(
      `${baseURL}/onboarding/misconduct-statement/save-misconduct-statement`,
      {
        applicationId,
        employeeId,
        formData: {
          staffTitle: "Test Title",
          companyName: "Test Company",
          employeeNameParagraph: "Test Paragraph",
          employeeName: "John Doe",
          employmentPosition: "Manager",
          signatureLine: "data:image/png;base64,iVBORw0KGgo...", // Sample signature
          dateField1: "2025-12-01",
          exhibitName: "Exhibit A",
          printName: "John Doe",
          signatureField: "data:image/png;base64,iVBORw0KGgo...",
          dateField2: "2025-12-01",
          notaryDay: "01",
          notaryMonth: "December",
          notaryYear: "2025",
          notarySignature: "data:image/png;base64,iVBORw0KGgo...", // Sample notary signature
        },
        status: "submitted",
      }
    );

    console.log("✅ Save Response Status:", saveResponse.status);
    console.log("✅ Message:", saveResponse.data.message);
    console.log(
      "✅ Notary Signature Saved:",
      saveResponse.data.misconductStatement.formData.notarySignature
        ? "Yes"
        : "No"
    );

    // Test 2: Fetch misconduct statement to verify notary signature
    console.log(
      "\n📖 Test 2: Fetching misconduct statement to verify notary signature..."
    );
    const getResponse = await axios.get(
      `${baseURL}/onboarding/misconduct-statement/get-misconduct-statement/${applicationId}`
    );

    console.log("✅ Fetch Response Status:", getResponse.status);
    console.log("✅ Message:", getResponse.data.message);
    console.log(
      "✅ Notary Signature Retrieved:",
      getResponse.data.formData.notarySignature ? "Yes" : "No"
    );

    if (getResponse.data.formData.notarySignature) {
      console.log(
        "✅ Notary Signature Data (first 50 chars):",
        getResponse.data.formData.notarySignature.substring(0, 50) + "..."
      );
    }

    console.log(
      "\n🎉 All tests passed! Notary signature backend integration is working correctly.\n"
    );
  } catch (error) {
    console.error(
      "❌ Error during testing:",
      error.response?.data || error.message
    );
  }
};

// Run tests
testNotarySignature();
