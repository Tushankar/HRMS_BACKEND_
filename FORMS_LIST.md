# Complete Onboarding Forms List

Based on the documents in the "Fwd_ Onboarding Application" folder, the following forms are implemented in the backend:

## 1. Personal Information Form
- **File**: `PersonalInformation.js`
- **Description**: Comprehensive personal information including basic details, contact info, emergency contacts, and government ID
- **Required**: Yes
- **Status**: ✅ Implemented

## 2. Employment Application (Exhibit 1a)
- **File**: `EmploymentApplication.js`
- **Description**: Main employment application with personal info, work history, education, references
- **Required**: Yes
- **Status**: ✅ Implemented

## 2. I-9 Employment Eligibility Verification (Exhibit 11)
- **File**: `I9Form.js`  
- **Description**: Federal form to verify employment eligibility
- **Required**: Yes (Legal requirement)
- **Status**: ✅ Implemented

## 3. W-4 Employee's Withholding Certificate (Exhibit 12a)
- **File**: `W4Form.js`
- **Description**: Tax withholding form for payroll
- **Required**: Yes (Tax requirement)
- **Status**: ✅ Implemented

## 4. W-9 Request for Taxpayer ID (Exhibit 12b)
- **File**: `W9Form.js`
- **Description**: Taxpayer identification and certification
- **Required**: For contractors/certain positions
- **Status**: ✅ Implemented

## 5. Emergency Contact Information (Exhibit 13)
- **File**: `EmergencyContact.js`
- **Description**: Emergency contact details and medical information
- **Required**: Yes
- **Status**: ✅ Implemented

## 6. Direct Deposit Authorization (Exhibit 14)
- **File**: `DirectDeposit.js`
- **Description**: Banking information for direct deposit setup
- **Required**: Yes (unless employee opts for physical checks)
- **Status**: ✅ Implemented

## 7. Staff Statement of Misconduct (Exhibit 2)
- **File**: `MisconductStatement.js`
- **Description**: Disclosure of any criminal history or misconduct
- **Required**: Yes (Healthcare/sensitive positions)
- **Status**: ✅ Implemented

## 8. Code of Ethics (Exhibit 3)
- **File**: `CodeOfEthics.js`
- **Description**: Acknowledgment of company ethical standards
- **Required**: Yes
- **Status**: ✅ Implemented

## 9. Service Delivery Policies (Exhibit 4)
- **File**: `ServiceDeliveryPolicy.js`
- **Description**: Acknowledgment of service delivery standards and policies
- **Required**: Yes
- **Status**: ✅ Implemented

## 10. Non-Compete Agreement (Exhibit 5)
- **File**: `NonCompeteAgreement.js`
- **Description**: Non-compete and confidentiality agreement
- **Required**: For certain positions
- **Status**: ✅ Implemented

## 11. Orientation Checklist (Exhibit 6b)
- **File**: `OrientationChecklist.js`
- **Description**: Comprehensive checklist for employee orientation process
- **Required**: Yes
- **Status**: ✅ Implemented

## 12. Background Check Form (Exhibit 7)
- **File**: `BackgroundCheck.js`
- **Description**: Authorization and information for background verification
- **Required**: Yes
- **Status**: ✅ Implemented

## 13. TB Symptom Screen (Exhibit 9)
- **File**: `TBSymptomScreen.js`
- **Description**: Tuberculosis screening questionnaire
- **Required**: Yes (Healthcare positions)
- **Status**: ✅ Implemented

---

## Job Description Forms (Information Only)
These are reference documents, not forms to be filled:

### 14. PCA Job Description (Exhibit 1a)
- **Description**: Personal Care Assistant job description
- **Type**: Reference document
- **Status**: ℹ️ Reference only

### 15. CNA Job Description (Exhibit 1b)  
- **Description**: Certified Nursing Assistant job description
- **Type**: Reference document
- **Status**: ℹ️ Reference only

### 16. LPN Job Description (Exhibit 1c)
- **Description**: Licensed Practical Nurse job description
- **Type**: Reference document  
- **Status**: ℹ️ Reference only

### 17. RN Job Description (Exhibit 1d)
- **Description**: Registered Nurse job description
- **Type**: Reference document
- **Status**: ℹ️ Reference only

---

## Training Materials (Information Only)

### 18. Orientation Training Presentation (Exhibit 6a)
- **Description**: PowerPoint presentation for orientation
- **Type**: Training material
- **Status**: ℹ️ Reference only

---

## Form Categories

### ✅ **Essential Forms** (Must be completed before employment)
1. Personal Information
2. Employment Application
3. I-9 Form
4. W-4 Form
5. Emergency Contact
6. Staff Statement of Misconduct
7. Code of Ethics
8. Background Check Form
9. TB Symptom Screen

### ⭐ **Position-Specific Forms** (Required for certain roles)
1. W-9 Form (contractors)
2. Non-Compete Agreement (management/sensitive positions)

### 📋 **Operational Forms** (Completed during/after onboarding)
1. Direct Deposit Form
2. Service Delivery Policies
3. Orientation Checklist

---

## Implementation Status Summary

- **✅ Forms Implemented**: 14 fillable forms
- **📋 Total Forms**: 14 interactive forms + 4 reference documents = 18 total forms
- **🔄 API Endpoints**: 28+ endpoints (GET/POST for each form + management endpoints)
- **📊 Progress Tracking**: Automatic completion percentage calculation
- **💾 Draft Saving**: All forms support draft functionality
- **👥 HR Review**: Complete review and approval workflow

---

## Frontend Integration Points

The frontend should implement:

1. **Form Navigation**: Step-by-step wizard or form list view
2. **Draft Saving**: Auto-save functionality as user types
3. **Progress Indicator**: Visual progress bar showing completion percentage
4. **Validation**: Client-side validation before form submission
5. **Signature Capture**: Digital signature capabilities for forms requiring signatures
6. **File Upload**: For any supporting documents
7. **HR Dashboard**: For reviewing and managing applications
8. **Status Tracking**: Real-time status updates for applicants

---

## Database Collections Created

The following MongoDB collections will be created:
1. `onboardingapplications` - Main application tracking
2. `personalinformations` - Personal information forms
3. `employmentapplications` - Employment applications
4. `i9forms` - I-9 forms
5. `w4forms` - W-4 forms  
6. `w9forms` - W-9 forms
7. `emergencycontacts` - Emergency contact forms
8. `directdeposits` - Direct deposit forms
9. `misconductstatements` - Misconduct statements
10. `codeofethics` - Code of ethics forms
11. `servicedeliverypolices` - Service delivery policies
12. `noncompeteagreements` - Non-compete agreements
13. `backgroundchecks` - Background check forms
14. `tbsymptomscreens` - TB symptom screens
15. `orientationchecklists` - Orientation checklists

Each collection has proper indexing on `applicationId` and `employeeId` for efficient queries.
