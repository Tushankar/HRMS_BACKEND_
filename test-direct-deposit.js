/**
 * Test Direct Deposit Form Save & Load Flow
 *
 * This script tests the complete flow:
 * 1. Create/Update Direct Deposit form with accounts data
 * 2. Fetch the form and verify accounts are properly reconstructed
 */

const axios = require("axios");

const BASE_URL = "https://api.carecompapp.com/api"; // Update with your actual URL

// Test data
const testApplicationId = "YOUR_APPLICATION_ID"; // Replace with actual ID
const testEmployeeId = "YOUR_EMPLOYEE_ID"; // Replace with actual ID

const testFormData = {
  companyName: "Care Smart LLC / 39 18167860",
  employeeName: "John Doe",
  employeeNumber: "123456",
  accounts: [
    {
      action: "add",
      accountType: "checking",
      accountHolderName: "John Doe",
      routingNumber: "123456789",
      accountNumber: "9876543210",
      bankName: "Chase Bank",
      depositType: "",
      depositPercent: "50",
      depositAmount: "",
      depositRemainder: false,
      lastFourDigits: "3210",
    },
    {
      action: "add",
      accountType: "savings",
      accountHolderName: "Jane Doe",
      routingNumber: "987654321",
      accountNumber: "1234567890",
      bankName: "Bank of America",
      depositType: "",
      depositPercent: "30",
      depositAmount: "",
      depositRemainder: false,
      lastFourDigits: "7890",
    },
    {
      action: "",
      accountType: "",
      accountHolderName: "",
      routingNumber: "",
      accountNumber: "",
      bankName: "",
      depositType: "",
      depositPercent: "",
      depositAmount: "",
      depositRemainder: false,
      lastFourDigits: "",
    },
  ],
  employeeSignature: "John Doe",
  employeeDate: "12/15/2024",
  employerName: "Manager Name",
  employerSignature: "Manager Name",
  employerDate: "12/15/2024",
};

async function testDirectDepositFlow() {
  try {
    console.log("\n=== TESTING DIRECT DEPOSIT FORM ===\n");

    // Step 1: Save Form
    console.log("Step 1: SAVING FORM DATA...");
    console.log("Request payload:", {
      applicationId: testApplicationId,
      employeeId: testEmployeeId,
      formData: testFormData,
      status: "completed",
    });

    const saveResponse = await axios.post(
      `${BASE_URL}/onboarding/save-direct-deposit-form`,
      {
        applicationId: testApplicationId,
        employeeId: testEmployeeId,
        formData: testFormData,
        status: "completed",
      },
      { withCredentials: true }
    );

    console.log("✅ Form Saved Successfully!");
    console.log("Response:", saveResponse.data);

    // Step 2: Fetch Form
    console.log("\n\nStep 2: FETCHING FORM DATA...");
    console.log(`Request: GET /get-direct-deposit/${testApplicationId}`);

    const getResponse = await axios.get(
      `${BASE_URL}/onboarding/get-direct-deposit/${testApplicationId}`,
      { withCredentials: true }
    );

    console.log("✅ Form Fetched Successfully!");
    const fetchedForm = getResponse.data.directDeposit;

    // Step 3: Verify Data Integrity
    console.log("\n\nStep 3: VERIFYING DATA INTEGRITY...\n");

    // Check Account 1
    console.log("Account 1 Verification:");
    console.log(
      `  Routing Number: ${
        fetchedForm.accounts[0].routingNumber
      } (Expected: 123456789) ${
        fetchedForm.accounts[0].routingNumber === "123456789" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Account Number: ${
        fetchedForm.accounts[0].accountNumber
      } (Expected: 9876543210) ${
        fetchedForm.accounts[0].accountNumber === "9876543210" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Bank Name: ${
        fetchedForm.accounts[0].bankName
      } (Expected: Chase Bank) ${
        fetchedForm.accounts[0].bankName === "Chase Bank" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Account Type: ${
        fetchedForm.accounts[0].accountType
      } (Expected: checking) ${
        fetchedForm.accounts[0].accountType === "checking" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Holder Name: ${
        fetchedForm.accounts[0].accountHolderName
      } (Expected: John Doe) ${
        fetchedForm.accounts[0].accountHolderName === "John Doe" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Deposit Percent: ${
        fetchedForm.accounts[0].depositPercent
      } (Expected: 50) ${
        fetchedForm.accounts[0].depositPercent === "50" ? "✅" : "❌"
      }`
    );

    // Check Account 2
    console.log("\nAccount 2 Verification:");
    console.log(
      `  Routing Number: ${
        fetchedForm.accounts[1].routingNumber
      } (Expected: 987654321) ${
        fetchedForm.accounts[1].routingNumber === "987654321" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Account Number: ${
        fetchedForm.accounts[1].accountNumber
      } (Expected: 1234567890) ${
        fetchedForm.accounts[1].accountNumber === "1234567890" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Bank Name: ${
        fetchedForm.accounts[1].bankName
      } (Expected: Bank of America) ${
        fetchedForm.accounts[1].bankName === "Bank of America" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Account Type: ${
        fetchedForm.accounts[1].accountType
      } (Expected: savings) ${
        fetchedForm.accounts[1].accountType === "savings" ? "✅" : "❌"
      }`
    );

    // Check Top Level Fields
    console.log("\nTop Level Fields Verification:");
    console.log(
      `  Company Name: ${
        fetchedForm.companyName
      } (Expected: Care Smart LLC / 39 18167860) ${
        fetchedForm.companyName === "Care Smart LLC / 39 18167860" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Employee Name: ${fetchedForm.employeeName} (Expected: John Doe) ${
        fetchedForm.employeeName === "John Doe" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Employee Number: ${fetchedForm.employeeNumber} (Expected: 123456) ${
        fetchedForm.employeeNumber === "123456" ? "✅" : "❌"
      }`
    );
    console.log(
      `  Employee Signature: ${
        fetchedForm.employeeSignature
      } (Expected: John Doe) ${
        fetchedForm.employeeSignature === "John Doe" ? "✅" : "❌"
      }`
    );

    // Final Summary
    console.log("\n\n=== TEST SUMMARY ===");
    const allFieldsCorrect =
      fetchedForm.accounts[0].routingNumber === "123456789" &&
      fetchedForm.accounts[0].accountNumber === "9876543210" &&
      fetchedForm.accounts[1].routingNumber === "987654321" &&
      fetchedForm.accounts[1].accountNumber === "1234567890" &&
      fetchedForm.employeeName === "John Doe" &&
      fetchedForm.employeeNumber === "123456";

    if (allFieldsCorrect) {
      console.log("✅ ALL TESTS PASSED! Data is correctly saved and fetched.");
    } else {
      console.log("❌ SOME TESTS FAILED! Check the data above.");
    }

    console.log("\nFull Fetched Data:");
    console.log(JSON.stringify(fetchedForm, null, 2));
  } catch (error) {
    console.error("❌ Error during testing:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testDirectDepositFlow();
