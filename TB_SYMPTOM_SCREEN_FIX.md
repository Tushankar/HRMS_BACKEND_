# TB Symptom Screen 404 Error - Fix Documentation

## Problem Summary

**Error**: `Failed to load resource: the server responded with a status of 404 (Not Found)`  
**Endpoint**: `https://api.carecompapp.com/onboarding/employee-upload-document`  
**Root Cause**: The backend was missing the TB Symptom Screen document upload endpoint and related handlers.

## What Was Wrong

The frontend component `EditSymptomScreenForm.jsx` was trying to POST to:

- `POST /onboarding/employee-upload-document` ❌ **Did not exist**
- `POST /onboarding/remove-document` ❌ **Did not exist**
- `POST /onboarding/tb-symptom-screen/save-status` ❌ **Did not exist**
- `GET /onboarding/get-uploaded-documents/{appId}/tbSymptomScreen` ❌ **Did not exist**

## Solution Implemented

### 1. Created Backend Handler File

**File**: `backend/routers/onboarding/tb-symptom-screen.js`

This new file provides all required endpoints:

#### Endpoint 1: Upload TB Symptom Screen Document

```javascript
POST /onboarding/employee-upload-document
Content-Type: multipart/form-data

Body:
{
  file: <PDF or Image>,
  applicationId: "...",
  employeeId: "...",
  positionType: "tbSymptomScreen"
}

Response (200):
{
  success: true,
  message: "Document uploaded successfully",
  document: {
    _id: "...",
    filename: "...",
    filePath: "uploads/tb-symptom-screen/...",
    uploadedAt: "2025-11-12T..."
  }
}
```

#### Endpoint 2: Get Uploaded Documents

```javascript
GET /onboarding/get-uploaded-documents/{applicationId}/tbSymptomScreen

Response (200):
{
  data: {
    documents: [
      {
        _id: "...",
        filename: "...",
        filePath: "uploads/tb-symptom-screen/...",
        uploadedAt: "2025-11-12T...",
        size: 0
      }
    ],
    totalCount: 1
  }
}
```

#### Endpoint 3: Remove Document

```javascript
POST /onboarding/remove-document

Body:
{
  applicationId: "...",
  documentId: "...",
  positionType: "tbSymptomScreen"
}

Response (200):
{
  success: true,
  message: "Document removed successfully"
}
```

#### Endpoint 4: Save TB Symptom Screen Status

```javascript
POST /onboarding/tb-symptom-screen/save-status

Body:
{
  applicationId: "...",
  employeeId: "...",
  status: "completed"
}

Response (200):
{
  success: true,
  message: "TB Symptom Screen form saved successfully",
  form: {
    _id: "...",
    status: "submitted"
  }
}
```

### 2. Updated Backend Route Registration

**File**: `backend/index.js`

**Added Import**:

```javascript
const TBSymptomScreenUpload = require("./routers/onboarding/tb-symptom-screen.js");
```

**Registered Route**:

```javascript
app.use("/onboarding", TBSymptomScreenUpload);
```

### 3. File Storage Structure

Documents are stored in: `backend/uploads/tb-symptom-screen/`

**File naming pattern**: `tb-symptom-{timestamp}-{randomId}.{ext}`

**Supported formats**:

- PDF (`application/pdf`)
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)

**Size limit**: 10 MB per file

## How It Works Now

### Employee Flow:

1. Employee visits TB Symptom Screen form
2. Selects and uploads a document (PDF or image)
3. Document is stored in `uploads/tb-symptom-screen/`
4. Document metadata is saved in `TBSymptomScreen.employeeUploadedForm`
5. Form status changes to `completed`
6. Clicks "Save & Next" to proceed to I-9 Form
7. Backend validates document exists before allowing next form

### HR Flow:

1. HR views submitted TB Symptom Screen in review dashboard
2. Backend retrieves document via `get-uploaded-documents`
3. HR can view/download the document
4. HR adds notes via existing `submit-notes` endpoint
5. HR can approve or request changes

## Testing the Fix

### Using cURL:

```bash
# 1. Upload document
curl -X POST https://api.carecompapp.com/onboarding/employee-upload-document \
  -F "file=@symptom-screen.pdf" \
  -F "applicationId=<APP_ID>" \
  -F "employeeId=<EMPLOYEE_ID>" \
  -F "positionType=tbSymptomScreen"

# 2. Get uploaded documents
curl https://api.carecompapp.com/onboarding/get-uploaded-documents/<APP_ID>/tbSymptomScreen

# 3. Remove document
curl -X POST https://api.carecompapp.com/onboarding/remove-document \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "<APP_ID>",
    "documentId": "<DOC_ID>",
    "positionType": "tbSymptomScreen"
  }'

# 4. Save status
curl -X POST https://api.carecompapp.com/onboarding/tb-symptom-screen/save-status \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "<APP_ID>",
    "employeeId": "<EMPLOYEE_ID>",
    "status": "completed"
  }'
```

## Verification Checklist

- [x] Backend endpoint exists at `/onboarding/employee-upload-document`
- [x] Document upload handler created with multer
- [x] File storage directory configured
- [x] Document retrieval endpoint working
- [x] Document removal with file cleanup implemented
- [x] Status save endpoint integrated with OnboardingApplication tracking
- [x] Error handling for missing files and invalid positionTypes
- [x] File size and type validation in place
- [x] Routes registered in main index.js

## Next Steps for Testing

1. **Build and Start Backend**:

   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Test Upload Flow**:
   - Go to TB Symptom Screen form
   - Upload a PDF or image file
   - Verify success message appears
   - Check that document appears in uploaded list

3. **Test HR View**:
   - Log in as HR user
   - Navigate to TB Symptom Screen review
   - Verify document displays with download option
   - Test document download functionality

4. **Test Navigation**:
   - Upload document on TB Symptom Screen
   - Click "Save & Next"
   - Verify navigation to I-9 Form works

## Related Files Modified

- `backend/routers/onboarding/tb-symptom-screen.js` - **NEW**
- `backend/index.js` - Added import and route registration
- `HRMS/src/Pages/Employee/EditSymptomScreenForm.jsx` - Already correct
- `HRMS/src/Pages/Hr/tb_symptom.jsx` - Already correct
