const axios = require("axios");

// Test the background check HR feedback endpoint (like HRNotesInput sends)
async function testBackgroundCheckHRFeedback() {
  try {
    console.log("🧪 Testing Background Check HR Feedback Save...\n");

    // This mimics the exact payload sent from HRNotesInput when HR sends notes
    const payload = {
      applicationId: "68ac0fcb02be1191737b4070", // Valid application ID
      employeeId: "67e0f8770c6feb6ba99d11d2", // Valid employee ID
      hrFeedback: {
        comment:
          "Test HR feedback - please review and submit corrected information",
        reviewedAt: new Date(),
      },
      status: "under_review",
    };

    console.log("📤 Payload being sent:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("\n---\n");

    const response = await axios.post(
      "http://localhost:1111/onboarding/save-background-check",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    console.log("✅ Success! Response:");
    console.log("Status:", response.status);
    console.log("Data:", response.data);
  } catch (error) {
    console.log("❌ Error occurred:");
    console.log("Status:", error.response?.status);
    console.log("Status Text:", error.response?.statusText);
    console.log("Error Message:", error.message);
    console.log("Response Data:", error.response?.data);

    if (error.response?.status === 400) {
      console.log("\n🔍 This is the 400 error you're seeing!");
      console.log("Response headers:", error.response.headers);
    }
  }
}

testBackgroundCheckHRFeedback();
