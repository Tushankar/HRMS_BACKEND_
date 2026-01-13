const axios = require("axios");

async function testMisconductStatement() {
  const BASE_URL = "http://3.18.215.185/onboarding/misconduct-statement";

  // Test data with digital signature
  const testData = {
    applicationId: "67e0f8770c6feb6ba99d11d2", // Use a real application ID
    employeeId: "67e0f8770c6feb6ba99d11d2", // Use a real employee ID
    formData: {
      staffInfo: {
        staffTitle: "RN",
        employeeName: "John Doe",
        employmentPosition: "Registered Nurse",
      },
      acknowledgment: {
        understandsCodeOfConduct: true,
        noMisconductHistory: true,
        formReadAndUnderstood: true,
      },
      // Digital signature fields
      employeeSignature:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      signatureDate: new Date(),
      signingMethod: "digital",
    },
    status: "completed",
  };

  try {
    console.log("🧪 Testing misconduct statement save...");
    console.log("📤 Request data:", JSON.stringify(testData, null, 2));

    const response = await axios.post(
      `${BASE_URL}/save-misconduct-statement`,
      testData
    );

    console.log("✅ Success!");
    console.log("📊 Response status:", response.status);
    console.log("📄 Response data:", response.data);
  } catch (error) {
    console.log("❌ Error occurred:");
    console.log("📊 Status:", error.response?.status);
    console.log("📄 Error message:", error.response?.data?.message);
    console.log("📄 Full error:", error.response?.data);
    console.log("🔍 Error details:", error.message);
  }
}

testMisconductStatement();
