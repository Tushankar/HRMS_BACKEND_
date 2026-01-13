const axios = require("axios");

async function testMisconductStatementSave() {
  try {
    console.log(
      "🧪 Testing misconduct statement save with proper data structure..."
    );

    // Use an existing application ID from the database
    const applicationId = "68ac0fcb02be1191737b4070";
    const employeeId = "67e0f8770c6feb6ba99d11d2";

    const formData = {
      staffTitle: "RN",
      companyName: "Healthcare Plus",
      employeeNameParagraph: "John Doe",
      employeeName: "John Doe",
      employmentPosition: "Registered Nurse",
      signatureLine:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      dateField1: "2025-01-15",
      exhibitName: "Exhibit 2",
      printName: "John Doe",
      signatureField:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      dateField2: "2025-01-15",
      notaryDay: "15",
      notaryMonth: "01",
      notaryYear: "2025",
      signingMethod: "digital",
    };

    const requestData = {
      applicationId,
      employeeId,
      formData,
      status: "submitted",
    };

    console.log("📤 Request data:", JSON.stringify(requestData, null, 2));

    const response = await axios.post(
      "http://3.18.215.185/onboarding/misconduct-statement/save-misconduct-statement",
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "✅ Success! Response:",
      JSON.stringify(response.data, null, 2)
    );

    // Now test retrieving the data
    console.log("\n🔍 Testing data retrieval...");
    const getResponse = await axios.get(
      `http://3.18.215.185/onboarding/misconduct-statement/get-misconduct-statement/${applicationId}`
    );

    console.log(
      "✅ Retrieval Success! Response:",
      JSON.stringify(getResponse.data, null, 2)
    );
  } catch (error) {
    console.error("❌ Error occurred:");
    if (error.response) {
      console.log("📊 Status:", error.response.status);
      console.log("📄 Error message:", error.response.data.message);
      console.log("📄 Full error:", error.response.data);
    } else {
      console.log("📄 Error:", error.message);
    }
  }
}

testMisconductStatementSave();
