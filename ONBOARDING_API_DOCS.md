# Onboarding Application API Documentation

## Overview
This API provides comprehensive onboarding functionality for new employees, including multiple forms, draft saving capabilities, and HR review processes.

## Base URL
All endpoints are prefixed with `/onboarding`

## Authentication
Most endpoints require valid JWT tokens in the Authorization header.

---

## Main Onboarding Application Endpoints

### 1. Get or Create Onboarding Application
**GET** `/get-application/:employeeId`

Retrieves existing onboarding application or creates a new one for the employee.

**Parameters:**
- `employeeId` (URL parameter): The ID of the employee

**Response:**
```json
{
  "message": "Onboarding application retrieved successfully",
  "data": {
    "application": {
      "employeeId": "...",
      "applicationStatus": "draft|submitted|under_review|approved|rejected",
      "completionPercentage": 0-100,
      "formsCompleted": [...],
      "submittedAt": "...",
      "reviewedAt": "...",
      "reviewComments": "..."
    },
    "forms": {
      "employmentApplication": {...},
      "i9Form": {...},
      "w4Form": {...},
      "w9Form": {...},
      "emergencyContact": {...},
      "directDeposit": {...},
      "misconductStatement": {...},
      "codeOfEthics": {...},
      "serviceDeliveryPolicy": {...},
      "nonCompeteAgreement": {...},
      "backgroundCheck": {...},
      "tbSymptomScreen": {...},
      "orientationChecklist": {...}
    }
  }
}
```

### 2. Get All Applications (HR View)
**GET** `/get-all-applications`

Retrieves all onboarding applications for HR review.

### 3. Update Application Status
**PUT** `/update-status/:applicationId`

Updates the status of an onboarding application (HR only).

**Body:**
```json
{
  "status": "submitted|under_review|approved|rejected",
  "reviewComments": "Optional comments",
  "reviewedBy": "HR user ID"
}
```

### 4. Submit Application to HR
**PUT** `/submit-application/:applicationId`

Submits the complete application to HR for review.

---

## Individual Form Endpoints

### Employment Application
- **POST** `/save-employment-application` - Save/update employment application
- **GET** `/get-employment-application/:applicationId` - Get employment application

### I-9 Form
- **POST** `/save-i9-form` - Save/update I-9 form
- **GET** `/get-i9-form/:applicationId` - Get I-9 form

### Tax Forms (W-4 & W-9)
- **POST** `/save-w4-form` - Save/update W-4 form
- **GET** `/get-w4-form/:applicationId` - Get W-4 form
- **POST** `/save-w9-form` - Save/update W-9 form
- **GET** `/get-w9-form/:applicationId` - Get W-9 form

### Personal Information Forms
- **POST** `/save-emergency-contact` - Save/update emergency contact form
- **GET** `/get-emergency-contact/:applicationId` - Get emergency contact form
- **POST** `/save-direct-deposit` - Save/update direct deposit form
- **GET** `/get-direct-deposit/:applicationId` - Get direct deposit form

### Policy Forms
- **POST** `/save-misconduct-statement` - Save/update staff statement of misconduct
- **GET** `/get-misconduct-statement/:applicationId` - Get misconduct statement
- **POST** `/save-code-of-ethics` - Save/update code of ethics
- **GET** `/get-code-of-ethics/:applicationId` - Get code of ethics
- **POST** `/save-service-delivery-policy` - Save/update service delivery policy
- **GET** `/get-service-delivery-policy/:applicationId` - Get service delivery policy
- **POST** `/save-non-compete-agreement` - Save/update non-compete agreement
- **GET** `/get-non-compete-agreement/:applicationId` - Get non-compete agreement

### Screening Forms
- **POST** `/save-background-check` - Save/update background check form
- **GET** `/get-background-check/:applicationId` - Get background check form
- **PUT** `/update-background-check-results/:applicationId` - Update background check results (HR only)
- **POST** `/save-tb-symptom-screen` - Save/update TB symptom screen
- **GET** `/get-tb-symptom-screen/:applicationId` - Get TB symptom screen
- **POST** `/save-orientation-checklist` - Save/update orientation checklist
- **GET** `/get-orientation-checklist/:applicationId` - Get orientation checklist

---

## Common Form Save Request Format

All form save endpoints accept the following body structure:

```json
{
  "applicationId": "MongoDB ObjectId",
  "employeeId": "MongoDB ObjectId",
  "formData": {
    // Form-specific data structure
  },
  "status": "draft" | "completed"
}
```

## Common Response Format

All successful form save operations return:

```json
{
  "message": "Form saved/completed successfully",
  "formName": {
    // Updated form data
  },
  "completionPercentage": 0-100
}
```

---

## Form Data Structures

### Employment Application Form Data
```json
{
  "personalInfo": {
    "fullName": "string",
    "address": {
      "street": "string",
      "city": "string", 
      "state": "string",
      "zipCode": "string"
    },
    "phoneNumber": "string",
    "email": "string",
    "dateOfBirth": "date",
    "socialSecurityNumber": "string",
    "emergencyContact": {
      "name": "string",
      "relationship": "string",
      "phoneNumber": "string"
    }
  },
  "employmentInfo": {
    "positionAppliedFor": "string",
    "preferredShift": "string",
    "availableStartDate": "date",
    "salaryExpected": "string",
    "employmentType": "string",
    "workExperience": [{
      "companyName": "string",
      "position": "string",
      "startDate": "date",
      "endDate": "date",
      "responsibilities": "string",
      "reasonForLeaving": "string"
    }]
  },
  "education": [{
    "institutionName": "string",
    "degree": "string",
    "fieldOfStudy": "string",
    "graduationYear": "number"
  }],
  "references": [{
    "name": "string",
    "relationship": "string",
    "phoneNumber": "string",
    "email": "string"
  }],
  "legalQuestions": {
    "eligibleToWork": "boolean",
    "criminalHistory": "boolean",
    "criminalHistoryDetails": "string"
  },
  "signature": "string",
  "signatureDate": "date"
}
```

### Code of Ethics Form Data
```json
{
  "employeeInfo": {
    "employeeName": "string",
    "position": "string",
    "department": "string",
    "startDate": "date"
  },
  "ethicsAcknowledgment": {
    "noPersonalUseOfClientCar": "boolean",
    "noConsumingClientFood": "boolean",
    "noPersonalPhoneCalls": "boolean",
    "noPoliticalReligiousDiscussions": "boolean",
    "noPersonalProblemDiscussion": "boolean",
    "noAcceptingMoney": "boolean",
    "noAcceptingGifts": "boolean",
    "professionalAppearance": "boolean",
    "respectfulTreatment": "boolean",
    "confidentialityMaintained": "boolean",
    "reportSafetyConcerns": "boolean",
    "followCompanyPolicies": "boolean",
    "avoidConflictOfInterest": "boolean",
    "properDocumentation": "boolean",
    "continuousImprovement": "boolean"
  },
  "agreement": {
    "readAndUnderstood": "boolean",
    "agreeToComply": "boolean",
    "understandConsequences": "boolean",
    "willingToSeekGuidance": "boolean"
  },
  "employeeSignature": "string",
  "signatureDate": "date"
}
```

---

## Status Values

### Application Status
- `draft` - Application is being filled out
- `submitted` - Application submitted to HR
- `under_review` - HR is reviewing the application
- `approved` - Application approved by HR
- `rejected` - Application rejected by HR

### Form Status
- `draft` - Form saved but not completed
- `completed` - Form completed and ready for submission

---

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

```json
{
  "message": "Error description",
  "error": "Detailed error information (in development)"
}
```

Common status codes:
- `200` - Success
- `400` - Bad request (missing required fields)
- `404` - Resource not found
- `500` - Internal server error

---

## Usage Examples

### 1. Start New Onboarding Process
```javascript
// Get or create onboarding application
const response = await fetch('/onboarding/get-application/employee_id_here');
const { application } = response.data;
```

### 2. Save Form as Draft
```javascript
// Save employment application as draft
const response = await fetch('/onboarding/save-employment-application', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: application._id,
    employeeId: employee._id,
    formData: {
      personalInfo: {
        fullName: "John Doe",
        // ... other fields
      }
    },
    status: "draft"
  })
});
```

### 3. Complete and Submit Form
```javascript
// Mark form as completed
const response = await fetch('/onboarding/save-code-of-ethics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: application._id,
    employeeId: employee._id,
    formData: {
      // ... complete form data
    },
    status: "completed"
  })
});
```

### 4. Submit Complete Application to HR
```javascript
// Submit all forms to HR
const response = await fetch(`/onboarding/submit-application/${application._id}`, {
  method: 'PUT'
});
```

---

## Notes

1. **Draft Saving**: All forms support draft saving - employees can partially fill forms and save them for later completion.

2. **Progress Tracking**: The system automatically calculates completion percentage based on completed forms.

3. **Validation**: Before submission to HR, the system validates that all required forms are completed.

4. **HR Review**: HR can review, approve, or reject applications and add comments.

5. **Form Dependencies**: Some forms may have dependencies (e.g., background check results affect final approval).

6. **Audit Trail**: All form submissions and status changes are timestamped and tracked.
