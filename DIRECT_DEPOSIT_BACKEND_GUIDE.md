# Direct Deposit Form - Complete Backend & Frontend Guide

## Overview

The Direct Deposit Form has been fully implemented with proper save/load functionality, status tracking, and HR review capabilities.

## Backend Implementation

### 1. Database Model (`DirectDeposit.js`)

The model stores Direct Deposit form data with the following structure:

```javascript
{
  applicationId: ObjectId,
  employeeId: ObjectId,

  // Company & Employee Info
  companyName: String,
  employeeName: String,
  employeeNumber: String,

  // Account 1, 2, 3 (Flat Structure)
  accounts_1_action: String,
  accounts_1_accountType: String,
  accounts_1_accountHolderName: String,
  accounts_1_routingNumber: String,
  accounts_1_accountNumber: String,
  accounts_1_bankName: String,
  accounts_1_depositType: String,
  accounts_1_depositPercent: String,
  accounts_1_depositAmount: String,
  accounts_1_depositRemainder: Boolean,
  accounts_1_lastFourDigits: String,

  // Repeat for accounts_2 and accounts_3...

  // Signature Fields
  employeeSignature: String,
  employeeDate: String,
  employerName: String,
  employerSignature: String,
  employerDate: String,

  // Status & Feedback
  status: String (draft|completed|submitted|under_review|approved|rejected),
  hrFeedback: {
    comment: String,
    reviewedBy: ObjectId,
    reviewedAt: Date
  },

  // File Upload
  employeeUploadedForm: {
    fileName: String,
    filePath: String,
    uploadedAt: Date,
    fileSize: Number
  },

  timestamps: true
}
```

### 2. Backend Endpoints

#### POST `/onboarding/save-direct-deposit-form`

**Purpose**: Save or update Direct Deposit form data

**Request Body**:

```javascript
{
  applicationId: "ObjectId",
  employeeId: "ObjectId",
  formData: {
    companyName: "Care Smart LLC / 39 18167860",
    employeeName: "John Doe",
    employeeNumber: "123456",
    accounts: [
      {
        action: "add|update|replace",
        accountType: "checking|savings",
        accountHolderName: "John Doe",
        routingNumber: "123456789",
        accountNumber: "9876543210",
        bankName: "Chase Bank",
        depositType: "",
        depositPercent: "50",
        depositAmount: "",
        depositRemainder: false,
        lastFourDigits: "3210"
      },
      // ... accounts 2 and 3
    ],
    employeeSignature: "John Doe",
    employeeDate: "12/15/24",
    employerName: "Manager Name",
    employerSignature: "Manager Name",
    employerDate: "12/15/24"
  },
  status: "completed"
}
```

**Response**:

```javascript
{
  success: true,
  message: "Direct Deposit form saved successfully",
  directDepositForm: { ...savedData },
  completionPercentage: 75
}
```

**What it does**:

1. Validates applicationId and employeeId
2. Checks if form already exists (update) or creates new (create)
3. Maps nested formData.accounts array to flat database fields
4. Detects if form has meaningful data
5. Updates application's completedForms array
6. Saves status (draft/completed)

#### GET `/onboarding/get-direct-deposit/:applicationId`

**Purpose**: Fetch saved Direct Deposit form data

**Response**:

```javascript
{
  message: "Direct Deposit form retrieved successfully",
  directDeposit: {
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
        depositPercent: "50",
        depositAmount: "",
        depositRemainder: false,
        lastFourDigits: "3210"
      },
      // ... accounts 2 and 3
    ],
    employeeSignature: "John Doe",
    employeeDate: "12/15/24",
    employerName: "Manager Name",
    employerSignature: "Manager Name",
    employerDate: "12/15/24",
    status: "completed",
    hrFeedback: null,
    // ... other fields
  }
}
```

**What it does**:

1. Finds form by applicationId
2. Reconstructs accounts array from flat database fields
3. Maps all database fields to frontend field names
4. Returns complete form data

### 3. Key Features

✅ **Automatic Data Reconstruction**: Flat database structure is automatically converted to nested accounts array
✅ **Status Tracking**: Forms are marked as draft/completed/submitted
✅ **Progress Tracking**: Application completion percentage is updated
✅ **HR Feedback**: HR can add feedback/comments to forms
✅ **Safe Defaults**: All missing fields default to empty strings or false

## Frontend Implementation

### 1. Employee Form (DirectDepositForm.jsx)

#### Initial Load Flow

```
Component Mount
  ↓
initializeForm()
  - Decode user token
  - Get application ID
  - Calculate form progress
  ↓
applicationId Set
  ↓
loadDirectDepositData()
  - Fetch saved form data from backend
  - Reconstruct accounts array
  - Set formData state
  - Detect if form has data
```

#### Data Structure in Frontend

```javascript
const [formData, setFormData] = useState({
  companyName: "Care Smart LLC / 39 18167860",
  employeeName: "",
  employeeNumber: "",
  accounts: [
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
    // ... accounts 2 and 3
  ],
  employeeSignature: "",
  employeeDate: "",
  employerName: "",
  employerSignature: "",
  employerDate: "",
});
```

#### Save Function

```javascript
const saveDirectDepositForm = async () => {
  // Validates applicationId & employeeId
  // Sends formData with all accounts array data
  // Receives success response
  // Reloads data to confirm save
  // Navigates to task management
};
```

#### Input Change Handlers

```javascript
// For account-specific fields
const handleInputChange = (index, field, value) => {
  const newAccounts = [...formData.accounts];
  newAccounts[index][field] = value;
  setFormData({ ...formData, accounts: newAccounts });
};

// For top-level fields
const handleTopLevelChange = (field, value) => {
  setFormData({ ...formData, [field]: value });
};
```

### 2. HR Review Form (DirectDepositFormHR.jsx)

#### HR Load Flow

```
Component Mount
  ↓
initializeForm()
  - Get application for employee
  - Calculate progress
  ↓
applicationId Set
  ↓
loadDirectDepositData()
  - Fetch form data
  - Map flat structure to accounts array
  - Display all fields as READ-ONLY
  - Show existing HR feedback if any
```

#### Special Features

- **Read-only display** of all form fields
- **PDF download** capability
- **HR notes section** for adding feedback
- **Progress tracking** display

## Data Flow Diagram

```
SAVE FLOW:
Employee fills form → handleInputChange() → setFormData()
  ↓
User clicks "Save & Next"
  ↓
saveDirectDepositForm()
  - Sends formData (with accounts array)
  - Backend receives formData
  - Maps accounts[0] → accounts_1_* fields
  - Maps accounts[1] → accounts_2_* fields
  - Maps accounts[2] → accounts_3_* fields
  - Saves to database
  ↓
Response: Success
  ↓
loadDirectDepositData() [reload]
  ↓
Navigate to next form

---

LOAD FLOW:
User opens form again
  ↓
applicationId retrieved
  ↓
loadDirectDepositData()
  - GET /get-direct-deposit/:applicationId
  - Backend returns form with:
    - accounts_1_* fields
    - accounts_2_* fields
    - accounts_3_* fields
  - Frontend maps:
    - accounts_1_* → accounts[0]
    - accounts_2_* → accounts[1]
    - accounts_3_* → accounts[2]
  - Sets formData state
  ↓
All fields display with saved values
```

## Troubleshooting

### Issue: Routing Number / Account Number Not Showing After Save & Return

**Solution**: The backend returns data with flat field names (accounts_1_routingNumber). The frontend must properly reconstruct these to the accounts array format.

**Check in loadDirectDepositData()**:

```javascript
// CORRECT - Maps flat fields to array
accounts: [
  {
    routingNumber: depositData.accounts_1_routingNumber || "",
    accountNumber: depositData.accounts_1_accountNumber || "",
    // ... other fields
  },
  // ... accounts 2 and 3
];

// WRONG - Tries to use accounts array directly without fallback
accounts: depositData.accounts; // May not exist from flat structure
```

### Issue: Form Shows "Not filled yet" After Saving

**Check the hasData logic**:

```javascript
const hasData =
  reconstructedFormData.employeeName?.trim() ||
  reconstructedFormData.employeeNumber?.trim() ||
  reconstructedFormData.accounts.some(
    (acc) =>
      acc.action?.trim() ||
      acc.routingNumber?.trim() ||
      acc.accountNumber?.trim() ||
      acc.bankName?.trim()
  );
```

Ensure at least ONE of these fields has data.

## Testing Checklist

- [ ] Fill form with employee name and account 1 details
- [ ] Click "Save & Next"
- [ ] Verify success toast appears
- [ ] Navigate back to Direct Deposit form
- [ ] Verify all data is displayed (including routing & account numbers)
- [ ] Verify form completion status shows ✅
- [ ] Fill additional accounts (2 & 3)
- [ ] Save and return to verify all accounts display
- [ ] Check HR view can see all data
- [ ] Verify HR can add feedback notes
- [ ] Verify PDF download works

## Common Implementation Mistakes to Avoid

❌ **Not mapping flat fields to accounts array when loading**
✅ **Always use the mapping logic in loadDirectDepositData()**

❌ **Assuming accounts array exists in the response**
✅ **Always use fallback with || operators**

❌ **Not checking if form has data properly**
✅ **Check multiple fields across all accounts**

❌ **Not handling boolean fields (depositRemainder)**
✅ **Explicitly cast to boolean or use || false**

❌ **Forgetting to reload data after save**
✅ **Call loadDirectDepositData() after successful save**
