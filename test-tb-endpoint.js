const axios = require("axios");

const BASE_URL = "http://localhost:1111/onboarding";

async function testTBSymptomScreen() {
  try {
    console.log("🧪 Testing TB Symptom Screen endpoint...");

    // Test data matching our frontend structure
    const testData = {
      applicationId: "507f1f77bcf86cd799439011", // dummy ID
      employeeId: "507f1f77bcf86cd799439012", // dummy ID
      formData: {
        name: "John Doe",
        gender: "M",
        dateOfBirth: "1990-01-01",
        lastSkinTest: "Test Clinic",
        testDate: "2024-01-15",
        testResults: "10",
        positive: true,
        negative: false,
        chestXRayNormal: true,
        chestXRayAbnormal: false,
        treatedForLTBI: "yes",
        monthsLTBI: "6",
        treatedForTB: "no",
        monthsTB: "",
        whenTreated: "2023",
        whereTreated: "City Hospital",
        medications: "Isoniazid",
        todaysDate: "2024-10-26",
        hasCough: "yes",
        coughDurationDays: "5",
        mucusColor: "clear",
        coughingUpBlood: "no",
        hasNightSweats: "no",
        hasFevers: "no",
        lostWeight: "no",
        tiredOrWeak: "yes",
        tirednessDurationWeeks: "2",
        hasChestPain: "no",
        hasShortnessOfBreath: "no",
        knowsSomeoneWithSymptoms: "no",
        noSignOfActiveTB: true,
        chestXRayNotNeeded: true,
        discussedSignsAndSymptoms: true,
        clientKnowsToSeekCare: true,
        furtherActionNeeded: false,
        assessorSignature: "Dr. Smith",
        clientSignature: "John Doe",
        signatureDate: "2024-10-26",
      },
      status: "completed",
    };

    console.log("📤 Sending request to:", `${BASE_URL}/save-tb-symptom-screen`);
    console.log("📊 Form data keys:", Object.keys(testData.formData));

    const response = await axios.post(
      `${BASE_URL}/save-tb-symptom-screen`,
      testData
    );

    console.log("✅ Success! Response status:", response.status);
    console.log("📄 Response message:", response.data.message);
    console.log("🔍 Response data keys:", Object.keys(response.data));

    if (response.data.tbSymptomScreen) {
      console.log("💾 Saved document ID:", response.data.tbSymptomScreen._id);
      console.log("📋 Status:", response.data.tbSymptomScreen.status);

      // Check if nested data was mapped correctly
      if (response.data.tbSymptomScreen.basicInfo) {
        console.log(
          "✅ Basic Info mapped:",
          response.data.tbSymptomScreen.basicInfo.fullName
        );
      }
      if (response.data.tbSymptomScreen.symptoms) {
        console.log(
          "✅ Symptoms mapped:",
          Object.keys(response.data.tbSymptomScreen.symptoms)
        );
      }
      if (response.data.tbSymptomScreen.actionTaken) {
        console.log(
          "✅ Action Taken mapped:",
          Object.keys(response.data.tbSymptomScreen.actionTaken)
        );
      }
    }
  } catch (error) {
    console.error("❌ Error occurred:");
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Message:", error.response.data.message);
      console.error("   Error:", error.response.data.error);
    } else {
      console.error("   Network/Server Error:", error.message);
    }
  }
}

// Run the test
testTBSymptomScreen();
