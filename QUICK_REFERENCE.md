# 🎯 Direct Deposit Form - QUICK REFERENCE CARD

## The Problem (FIXED ✅)

Routing Number & Account Number weren't displaying after "Save & Next"

## The Solution (IMPLEMENTED ✅)

Proper data transformation between nested arrays (frontend) ↔ flat fields (database)

---

## Key Mappings Reference

### Frontend to Database (ON SAVE)

```
accounts[0].routingNumber    → accounts_1_routingNumber
accounts[0].accountNumber    → accounts_1_accountNumber
accounts[0].bankName         → accounts_1_bankName
accounts[0].accountHolderName → accounts_1_accountHolderName
accounts[0].accountType      → accounts_1_accountType
accounts[0].action           → accounts_1_action
accounts[0].depositPercent   → accounts_1_depositPercent
accounts[0].depositAmount    → accounts_1_depositAmount
accounts[0].depositRemainder → accounts_1_depositRemainder
accounts[0].lastFourDigits   → accounts_1_lastFourDigits

accounts[1].*                → accounts_2_*
accounts[2].*                → accounts_3_*
```

### Database to Frontend (ON LOAD)

```
accounts_1_routingNumber     → accounts[0].routingNumber
accounts_1_accountNumber     → accounts[0].accountNumber
accounts_1_bankName          → accounts[0].bankName
accounts_1_accountHolderName → accounts[0].accountHolderName
accounts_1_accountType       → accounts[0].accountType
accounts_1_action            → accounts[0].action
accounts_1_depositPercent    → accounts[0].depositPercent
accounts_1_depositAmount     → accounts[0].depositAmount
accounts_1_depositRemainder  → accounts[0].depositRemainder
accounts_1_lastFourDigits    → accounts[0].lastFourDigits

accounts_2_*                 → accounts[1].*
accounts_3_*                 → accounts[2].*
```

---

## API Endpoints

### Save Form

```
POST /api/onboarding/save-direct-deposit-form
Body: {
  applicationId: "...",
  employeeId: "...",
  formData: { accounts: [...], ... },
  status: "completed"
}
Response: { success: true, directDepositForm, completionPercentage }
```

### Fetch Form

```
GET /api/onboarding/get-direct-deposit/:applicationId
Response: { directDeposit: { accounts: [...], ... } }
```

---

## Frontend Code Patterns

### Load Data with Proper Mapping

```javascript
const loadDirectDepositData = async () => {
  const response = await axios.get(
    `${baseURL}/onboarding/get-direct-deposit/${applicationId}`,
    { withCredentials: true }
  );

  const depositData = response.data.directDeposit;

  // CRITICAL: Map flat fields to nested array
  const reconstructedFormData = {
    accounts:
      depositData.accounts && depositData.accounts.length === 3
        ? depositData.accounts
        : [
            {
              routingNumber: depositData.accounts_1_routingNumber || "",
              accountNumber: depositData.accounts_1_accountNumber || "",
              bankName: depositData.accounts_1_bankName || "",
              // ... other fields
            },
            {
              routingNumber: depositData.accounts_2_routingNumber || "",
              accountNumber: depositData.accounts_2_accountNumber || "",
              // ... account 2
            },
            {
              routingNumber: depositData.accounts_3_routingNumber || "",
              accountNumber: depositData.accounts_3_accountNumber || "",
              // ... account 3
            },
          ],
  };

  setFormData(reconstructedFormData);
};
```

### Save Data with Accounts Array

```javascript
const saveDirectDepositForm = async () => {
  await axios.post(
    `${baseURL}/onboarding/save-direct-deposit-form`,
    {
      applicationId,
      employeeId,
      formData: formData, // ← Contains nested accounts array
      status: "completed",
    },
    { withCredentials: true }
  );
};
```

### Handle Account Input Changes

```javascript
const handleInputChange = (index, field, value) => {
  const newAccounts = [...formData.accounts];
  newAccounts[index][field] = value;
  setFormData({ ...formData, accounts: newAccounts });
};

// Usage: handleInputChange(0, 'routingNumber', '123456789')
```

---

## Database Schema (Flat Structure)

Each account uses 11 fields:

- `accounts_X_action` (add|update|replace)
- `accounts_X_accountType` (checking|savings)
- `accounts_X_accountHolderName`
- `accounts_X_routingNumber` ← KEY
- `accounts_X_accountNumber` ← KEY
- `accounts_X_bankName`
- `accounts_X_depositType`
- `accounts_X_depositPercent`
- `accounts_X_depositAmount`
- `accounts_X_depositRemainder` (boolean)
- `accounts_X_lastFourDigits`

Where X = 1, 2, or 3 for each account

---

## Testing Checklist

**Quick Test (30 seconds)**

- [ ] Fill routing number: 123456789
- [ ] Fill account number: 9876543210
- [ ] Click Save & Next
- [ ] Return to form
- [ ] Routing number visible? ✅
- [ ] Account number visible? ✅

**Full Test (5 minutes)**

- [ ] Fill all 3 accounts with different data
- [ ] Save & Next
- [ ] Return and verify all accounts
- [ ] Check HR can see all data
- [ ] Test adding feedback notes

---

## Troubleshooting OneMinute Fix

**Problem**: Numbers not showing after reload

**Solution**: Ensure `loadDirectDepositData()` has this code:

```javascript
routingNumber: depositData.accounts_1_routingNumber || "",
accountNumber: depositData.accounts_1_accountNumber || "",
```

If missing, add it immediately.

---

## Files to Know

| File                      | Change                  | Impact             |
| ------------------------- | ----------------------- | ------------------ |
| `tax-forms.js`            | POST & GET endpoints    | Backend save/load  |
| `DirectDeposit.js`        | Schema fields           | Database storage   |
| `DirectDepositForm.jsx`   | loadDirectDepositData() | Employee form load |
| `DirectDepositFormHR.jsx` | loadDirectDepositData() | HR form load       |

---

## What's Different from W4Form?

| Aspect           | W4Form         | DirectDepositForm     |
| ---------------- | -------------- | --------------------- |
| Account Handling | Single account | Multiple accounts (3) |
| Data Structure   | Simple fields  | Array of accounts     |
| Mapping          | Auto handled   | Manual mapping needed |
| Complexity       | Low            | Medium                |

**The key difference**: DirectDepositForm needs to map between nested arrays and flat database fields.

---

## Quick Debugging Commands

```javascript
// Check form state in browser console
console.log(formData);
// Should show accounts[0].routingNumber with value

// Check API response
// Network tab → get-direct-deposit → Response
// Should show directDeposit.accounts[0].routingNumber

// Verify save payload
// Network tab → save-direct-deposit-form → Request → Payload
// Should show formData.accounts[0].routingNumber
```

---

## Remember These Rules

✅ **Always map flat fields to array on load**
✅ **Always send nested array to backend on save**
✅ **Always use || "" for string defaults**
✅ **Always use || false for boolean defaults**
✅ **Always reload data after successful save**
✅ **Always check account data exists before saving**

❌ **Don't forget to map accounts*1* to accounts[0]**
❌ **Don't forget to map accounts*2* to accounts[1]**
❌ **Don't forget to map accounts*3* to accounts[2]**
❌ **Don't use undefined values anywhere**
❌ **Don't save without proper error handling**

---

## Implementation Status

✅ Backend save endpoint - COMPLETE
✅ Backend fetch endpoint - COMPLETE
✅ Database schema - COMPLETE
✅ Frontend form save - COMPLETE
✅ Frontend form load - COMPLETE
✅ HR form display - COMPLETE
✅ Data mapping - COMPLETE
✅ Error handling - COMPLETE
✅ Documentation - COMPLETE
✅ Test script - COMPLETE

**Overall Status: 100% COMPLETE** 🎉

---

**Last Updated**: November 12, 2025
**Version**: 1.0 (Stable)
**All Systems Go** ✅
