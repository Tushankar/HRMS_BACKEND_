const express = require("express");
const I9Form = require("../../database/Models/I9Form");
const OnboardingApplication = require("../../database/Models/OnboardingApplication");

const router = express.Router();

// Helper function to map frontend citizenship status to schema enum values
function mapCitizenshipStatus(status) {
  const mapping = {
    citizen: "us_citizen",
    national: "non_citizen_national",
    alien: "lawful_permanent_resident",
    authorized: "authorized_alien",
  };
  return mapping[status] || status;
}

// Helper function to map schema enum values back to frontend format
function mapCitizenshipStatusToFrontend(status) {
  const mapping = {
    us_citizen: "citizen",
    non_citizen_national: "national",
    lawful_permanent_resident: "alien",
    authorized_alien: "authorized",
  };
  return mapping[status] || status;
}

// Save or update I-9 form
router.post("/save-i9-form", async (req, res) => {
  try {
    const {
      applicationId,
      employeeId,
      formData,
      status = "draft",
      hrFeedback,
    } = req.body;

    console.log("I9 Form Save Request:");
    console.log("- ApplicationID:", applicationId);
    console.log("- EmployeeID:", employeeId);
    console.log("- Status:", status);
    console.log("- FormData:", formData ? "Present" : "undefined");
    console.log("- HRFeedback:", hrFeedback ? "Present" : "undefined");

    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    // Check if application exists
    const application = await OnboardingApplication.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Onboarding application not found" });
    }

    // Find existing form or create new one
    let i9Form = await I9Form.findOne({ applicationId });

    // If only HR feedback is being updated (no formData)
    if (!formData && hrFeedback) {
      if (!i9Form) {
        i9Form = new I9Form({ applicationId, employeeId, status });
      }
      i9Form.hrFeedback = hrFeedback;
      i9Form.status = status;
      await i9Form.save();
      return res.status(200).json({
        success: true,
        i9Form,
        message: "HR feedback saved successfully",
      });
    }

    if (i9Form) {
      // Update existing form - handle both nested and flat structures
      if (formData && (formData.section1 || formData.section2)) {
        // Nested structure from EditI9Form - apply citizenship status mapping
        if (formData.section1) {
          const mappedSection1 = { ...formData.section1 };
          if (mappedSection1.citizenshipStatus) {
            mappedSection1.citizenshipStatus = mapCitizenshipStatus(
              mappedSection1.citizenshipStatus
            );
          }
          i9Form.section1 = { ...i9Form.section1, ...mappedSection1 };
        }
        if (formData.section2) {
          i9Form.section2 = { ...i9Form.section2, ...formData.section2 };
        }
      } else {
        // Flat structure - map to nested structure with citizenship status mapping
        i9Form.section1 = {
          lastName: formData.lastName || i9Form.section1?.lastName,
          firstName: formData.firstName || i9Form.section1?.firstName,
          middleInitial:
            formData.middleInitial || i9Form.section1?.middleInitial,
          otherLastNames:
            formData.otherLastNames || i9Form.section1?.otherLastNames,
          address: formData.address || i9Form.section1?.address,
          aptNumber: formData.aptNumber || i9Form.section1?.aptNumber,
          cityOrTown: formData.city || i9Form.section1?.cityOrTown,
          state: formData.state || i9Form.section1?.state,
          zipCode: formData.zipCode || i9Form.section1?.zipCode,
          dateOfBirth: formData.dateOfBirth || i9Form.section1?.dateOfBirth,
          socialSecurityNumber:
            formData.socialSecurityNumber ||
            i9Form.section1?.socialSecurityNumber,
          employeeEmail: formData.email || i9Form.section1?.employeeEmail,
          employeePhone: formData.telephone || i9Form.section1?.employeePhone,
          citizenshipStatus:
            mapCitizenshipStatus(formData.citizenshipStatus) ||
            i9Form.section1?.citizenshipStatus,
          uscisNumber:
            formData.aNumber ||
            formData.uscisANumber ||
            i9Form.section1?.uscisNumber,
          formI94Number: formData.i94Number || i9Form.section1?.formI94Number,
          foreignPassportNumber:
            formData.passportNumber || i9Form.section1?.foreignPassportNumber,
          countryOfIssuance:
            formData.countryOfIssuance || i9Form.section1?.countryOfIssuance,
          expirationDate:
            formData.workAuthExpDate || i9Form.section1?.expirationDate,
          employeeSignature:
            formData.employeeSignature || i9Form.section1?.employeeSignature,
          employeeSignatureDate:
            formData.employeeSignatureDate ||
            i9Form.section1?.employeeSignatureDate,
          preparerTranslator: {
            preparerUsed:
              formData.preparerUsed !== undefined
                ? formData.preparerUsed
                : i9Form.section1?.preparerTranslator?.preparerUsed,
            preparerLastName:
              formData.preparerLastName ||
              i9Form.section1?.preparerTranslator?.preparerLastName,
            preparerFirstName:
              formData.preparerFirstName ||
              i9Form.section1?.preparerTranslator?.preparerFirstName,
            preparerAddress:
              formData.preparerAddress ||
              i9Form.section1?.preparerTranslator?.preparerAddress,
            preparerSignature:
              formData.preparerSignature ||
              i9Form.section1?.preparerTranslator?.preparerSignature,
            preparerDate:
              formData.preparerDate ||
              i9Form.section1?.preparerTranslator?.preparerDate,
          },
        };

        // Handle Supplement A: Preparer and/or Translator Certification
        i9Form.supplementA = {
          employeeName: {
            lastName:
              formData.suppALastName ||
              i9Form.supplementA?.employeeName?.lastName,
            firstName:
              formData.suppAFirstName ||
              i9Form.supplementA?.employeeName?.firstName,
            middleInitial:
              formData.suppAMiddleInitial ||
              i9Form.supplementA?.employeeName?.middleInitial,
          },
          preparers: [
            // Preparer 1
            {
              signature:
                formData.prep1Signature ||
                i9Form.supplementA?.preparers?.[0]?.signature,
              date:
                formData.prep1Date || i9Form.supplementA?.preparers?.[0]?.date,
              lastName:
                formData.prep1LastName ||
                i9Form.supplementA?.preparers?.[0]?.lastName,
              firstName:
                formData.prep1FirstName ||
                i9Form.supplementA?.preparers?.[0]?.firstName,
              middleInitial:
                formData.prep1MiddleInitial ||
                i9Form.supplementA?.preparers?.[0]?.middleInitial,
              address:
                formData.prep1Address ||
                i9Form.supplementA?.preparers?.[0]?.address,
              city:
                formData.prep1City || i9Form.supplementA?.preparers?.[0]?.city,
              state:
                formData.prep1State ||
                i9Form.supplementA?.preparers?.[0]?.state,
              zipCode:
                formData.prep1ZipCode ||
                i9Form.supplementA?.preparers?.[0]?.zipCode,
            },
            // Preparer 2
            {
              signature:
                formData.prep2Signature ||
                i9Form.supplementA?.preparers?.[1]?.signature,
              date:
                formData.prep2Date || i9Form.supplementA?.preparers?.[1]?.date,
              lastName:
                formData.prep2LastName ||
                i9Form.supplementA?.preparers?.[1]?.lastName,
              firstName:
                formData.prep2FirstName ||
                i9Form.supplementA?.preparers?.[1]?.firstName,
              middleInitial:
                formData.prep2MiddleInitial ||
                i9Form.supplementA?.preparers?.[1]?.middleInitial,
              address:
                formData.prep2Address ||
                i9Form.supplementA?.preparers?.[1]?.address,
              city:
                formData.prep2City || i9Form.supplementA?.preparers?.[1]?.city,
              state:
                formData.prep2State ||
                i9Form.supplementA?.preparers?.[1]?.state,
              zipCode:
                formData.prep2ZipCode ||
                i9Form.supplementA?.preparers?.[1]?.zipCode,
            },
            // Preparer 3
            {
              signature:
                formData.prep3Signature ||
                i9Form.supplementA?.preparers?.[2]?.signature,
              date:
                formData.prep3Date || i9Form.supplementA?.preparers?.[2]?.date,
              lastName:
                formData.prep3LastName ||
                i9Form.supplementA?.preparers?.[2]?.lastName,
              firstName:
                formData.prep3FirstName ||
                i9Form.supplementA?.preparers?.[2]?.firstName,
              middleInitial:
                formData.prep3MiddleInitial ||
                i9Form.supplementA?.preparers?.[2]?.middleInitial,
              address:
                formData.prep3Address ||
                i9Form.supplementA?.preparers?.[2]?.address,
              city:
                formData.prep3City || i9Form.supplementA?.preparers?.[2]?.city,
              state:
                formData.prep3State ||
                i9Form.supplementA?.preparers?.[2]?.state,
              zipCode:
                formData.prep3ZipCode ||
                i9Form.supplementA?.preparers?.[2]?.zipCode,
            },
            // Preparer 4
            {
              signature:
                formData.prep4Signature ||
                i9Form.supplementA?.preparers?.[3]?.signature,
              date:
                formData.prep4Date || i9Form.supplementA?.preparers?.[3]?.date,
              lastName:
                formData.prep4LastName ||
                i9Form.supplementA?.preparers?.[3]?.lastName,
              firstName:
                formData.prep4FirstName ||
                i9Form.supplementA?.preparers?.[3]?.firstName,
              middleInitial:
                formData.prep4MiddleInitial ||
                i9Form.supplementA?.preparers?.[3]?.middleInitial,
              address:
                formData.prep4Address ||
                i9Form.supplementA?.preparers?.[3]?.address,
              city:
                formData.prep4City || i9Form.supplementA?.preparers?.[3]?.city,
              state:
                formData.prep4State ||
                i9Form.supplementA?.preparers?.[3]?.state,
              zipCode:
                formData.prep4ZipCode ||
                i9Form.supplementA?.preparers?.[3]?.zipCode,
            },
          ].filter(
            (preparer) =>
              preparer.signature || preparer.lastName || preparer.firstName
          ), // Only include preparers with data
        };

        // Handle Supplement B: Reverification and Rehire
        i9Form.supplementB = {
          employeeName: {
            lastName:
              formData.suppBLastName ||
              i9Form.supplementB?.employeeName?.lastName,
            firstName:
              formData.suppBFirstName ||
              i9Form.supplementB?.employeeName?.firstName,
            middleInitial:
              formData.suppBMiddleInitial ||
              i9Form.supplementB?.employeeName?.middleInitial,
          },
          reverifications: [
            // Reverification 1
            {
              dateOfRehire:
                formData.rev1Date ||
                i9Form.supplementB?.reverifications?.[0]?.dateOfRehire,
              newName: {
                lastName:
                  formData.rev1LastName ||
                  i9Form.supplementB?.reverifications?.[0]?.newName?.lastName,
                firstName:
                  formData.rev1FirstName ||
                  i9Form.supplementB?.reverifications?.[0]?.newName?.firstName,
                middleInitial:
                  formData.rev1MiddleInitial ||
                  i9Form.supplementB?.reverifications?.[0]?.newName
                    ?.middleInitial,
              },
              documentTitle:
                formData.rev1DocTitle ||
                i9Form.supplementB?.reverifications?.[0]?.documentTitle,
              documentNumber:
                formData.rev1DocNumber ||
                i9Form.supplementB?.reverifications?.[0]?.documentNumber,
              expirationDate:
                formData.rev1ExpDate ||
                i9Form.supplementB?.reverifications?.[0]?.expirationDate,
              employerName:
                formData.rev1EmployerName ||
                i9Form.supplementB?.reverifications?.[0]?.employerName,
              employerSignature:
                formData.rev1EmployerSignature ||
                i9Form.supplementB?.reverifications?.[0]?.employerSignature,
              employerDate:
                formData.rev1EmployerDate ||
                i9Form.supplementB?.reverifications?.[0]?.employerDate,
              additionalInfo:
                formData.rev1AdditionalInfo ||
                i9Form.supplementB?.reverifications?.[0]?.additionalInfo,
              altProcedureUsed:
                formData.rev1AltProcedureUsed ||
                i9Form.supplementB?.reverifications?.[0]?.altProcedureUsed ||
                false,
            },
            // Reverification 2
            {
              dateOfRehire:
                formData.rev2Date ||
                i9Form.supplementB?.reverifications?.[1]?.dateOfRehire,
              newName: {
                lastName:
                  formData.rev2LastName ||
                  i9Form.supplementB?.reverifications?.[1]?.newName?.lastName,
                firstName:
                  formData.rev2FirstName ||
                  i9Form.supplementB?.reverifications?.[1]?.newName?.firstName,
                middleInitial:
                  formData.rev2MiddleInitial ||
                  i9Form.supplementB?.reverifications?.[1]?.newName
                    ?.middleInitial,
              },
              documentTitle:
                formData.rev2DocTitle ||
                i9Form.supplementB?.reverifications?.[1]?.documentTitle,
              documentNumber:
                formData.rev2DocNumber ||
                i9Form.supplementB?.reverifications?.[1]?.documentNumber,
              expirationDate:
                formData.rev2ExpDate ||
                i9Form.supplementB?.reverifications?.[1]?.expirationDate,
              employerName:
                formData.rev2EmployerName ||
                i9Form.supplementB?.reverifications?.[1]?.employerName,
              employerSignature:
                formData.rev2EmployerSignature ||
                i9Form.supplementB?.reverifications?.[1]?.employerSignature,
              employerDate:
                formData.rev2EmployerDate ||
                i9Form.supplementB?.reverifications?.[1]?.employerDate,
              additionalInfo:
                formData.rev2AdditionalInfo ||
                i9Form.supplementB?.reverifications?.[1]?.additionalInfo,
              altProcedureUsed:
                formData.rev2AltProcedureUsed ||
                i9Form.supplementB?.reverifications?.[1]?.altProcedureUsed ||
                false,
            },
            // Reverification 3
            {
              dateOfRehire:
                formData.rev3Date ||
                i9Form.supplementB?.reverifications?.[2]?.dateOfRehire,
              newName: {
                lastName:
                  formData.rev3LastName ||
                  i9Form.supplementB?.reverifications?.[2]?.newName?.lastName,
                firstName:
                  formData.rev3FirstName ||
                  i9Form.supplementB?.reverifications?.[2]?.newName?.firstName,
                middleInitial:
                  formData.rev3MiddleInitial ||
                  i9Form.supplementB?.reverifications?.[2]?.newName
                    ?.middleInitial,
              },
              documentTitle:
                formData.rev3DocTitle ||
                i9Form.supplementB?.reverifications?.[2]?.documentTitle,
              documentNumber:
                formData.rev3DocNumber ||
                i9Form.supplementB?.reverifications?.[2]?.documentNumber,
              expirationDate:
                formData.rev3ExpDate ||
                i9Form.supplementB?.reverifications?.[2]?.expirationDate,
              employerName:
                formData.rev3EmployerName ||
                i9Form.supplementB?.reverifications?.[2]?.employerName,
              employerSignature:
                formData.rev3EmployerSignature ||
                i9Form.supplementB?.reverifications?.[2]?.employerSignature,
              employerDate:
                formData.rev3EmployerDate ||
                i9Form.supplementB?.reverifications?.[2]?.employerDate,
              additionalInfo:
                formData.rev3AdditionalInfo ||
                i9Form.supplementB?.reverifications?.[2]?.additionalInfo,
              altProcedureUsed:
                formData.rev3AltProcedureUsed ||
                i9Form.supplementB?.reverifications?.[2]?.altProcedureUsed ||
                false,
            },
          ].filter(
            (rev) =>
              rev.dateOfRehire || rev.documentTitle || rev.employerSignature
          ), // Only include reverifications with data
        };

        i9Form.section2 = {
          employmentStartDate:
            formData.firstDayEmployment || i9Form.section2?.employmentStartDate,
          documentTitle1:
            formData.listADocTitle1 || i9Form.section2?.documentTitle1,
          issuingAuthority1:
            formData.listAIssuingAuth1 || i9Form.section2?.issuingAuthority1,
          documentNumber1:
            formData.listADocNumber1 || i9Form.section2?.documentNumber1,
          expirationDate1:
            formData.listAExpDate1 || i9Form.section2?.expirationDate1,
          documentTitle2:
            formData.documentTitle2 || i9Form.section2?.documentTitle2,
          issuingAuthority2:
            formData.issuingAuthority2 || i9Form.section2?.issuingAuthority2,
          documentNumber2:
            formData.documentNumber2 || i9Form.section2?.documentNumber2,
          expirationDate2:
            formData.expirationDate2 || i9Form.section2?.expirationDate2,
          documentTitle3:
            formData.listADocTitle3 || i9Form.section2?.documentTitle3,
          issuingAuthority3:
            formData.listAIssuingAuth3 || i9Form.section2?.issuingAuthority3,
          documentNumber3:
            formData.listADocNumber3 || i9Form.section2?.documentNumber3,
          expirationDate3:
            formData.listAExpDate3 || i9Form.section2?.expirationDate3,
          additionalInfo:
            formData.additionalInfo || i9Form.section2?.additionalInfo,
          employerSignature:
            formData.employerSignature || i9Form.section2?.employerSignature,
          employerSignatureDate:
            formData.employerSignatureDate ||
            i9Form.section2?.employerSignatureDate,
          employerName: formData.employerName || i9Form.section2?.employerName,
          employerTitle:
            formData.employerTitle || i9Form.section2?.employerTitle,
          employerBusinessName:
            formData.employerBusinessName ||
            i9Form.section2?.employerBusinessName,
          employerBusinessAddress:
            formData.employerBusinessAddress ||
            i9Form.section2?.employerBusinessAddress,
        };
      }

      // Handle work authorization data
      if (formData.workAuthorization) {
        if (formData.workAuthorization.isNonCitizen !== undefined) {
          i9Form.set(
            "workAuthorization.isNonCitizen",
            formData.workAuthorization.isNonCitizen
          );
        }
        if (formData.workAuthorization.hasWorkAuthorization !== undefined) {
          i9Form.set(
            "workAuthorization.hasWorkAuthorization",
            formData.workAuthorization.hasWorkAuthorization
          );
        }
      }

      i9Form.status = status;
    } else {
      // Create new form
      const newFormData = {
        applicationId,
        employeeId,
        status,
      };

      // Handle both nested and flat structures
      if (formData.section1 || formData.section2) {
        // Nested structure - apply citizenship status mapping
        if (formData.section1) {
          const mappedSection1 = { ...formData.section1 };
          if (mappedSection1.citizenshipStatus) {
            mappedSection1.citizenshipStatus = mapCitizenshipStatus(
              mappedSection1.citizenshipStatus
            );
          }
          newFormData.section1 = mappedSection1;
        } else {
          newFormData.section1 = {};
        }
        newFormData.section2 = formData.section2 || {};
      } else {
        // Flat structure - map to nested with citizenship status mapping
        newFormData.section1 = {
          lastName: formData.lastName,
          firstName: formData.firstName,
          middleInitial: formData.middleInitial,
          otherLastNames: formData.otherLastNames,
          address: formData.address,
          aptNumber: formData.aptNumber,
          cityOrTown: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          dateOfBirth: formData.dateOfBirth,
          socialSecurityNumber: formData.socialSecurityNumber,
          employeeEmail: formData.email,
          employeePhone: formData.telephone,
          citizenshipStatus: mapCitizenshipStatus(formData.citizenshipStatus),
          uscisNumber: formData.aNumber || formData.uscisANumber,
          formI94Number: formData.i94Number,
          foreignPassportNumber: formData.passportNumber,
          countryOfIssuance: formData.countryOfIssuance,
          expirationDate: formData.workAuthExpDate,
          employeeSignature: formData.employeeSignature,
          employeeSignatureDate: formData.employeeSignatureDate,
          preparerTranslator: {
            preparerUsed: formData.preparerUsed || false,
            preparerLastName: formData.preparerLastName,
            preparerFirstName: formData.preparerFirstName,
            preparerAddress: formData.preparerAddress,
            preparerSignature: formData.preparerSignature,
            preparerDate: formData.preparerDate,
          },
        };

        // Handle Supplement A: Preparer and/or Translator Certification
        newFormData.supplementA = {
          employeeName: {
            lastName: formData.suppALastName,
            firstName: formData.suppAFirstName,
            middleInitial: formData.suppAMiddleInitial,
          },
          preparers: [
            // Preparer 1
            {
              signature: formData.prep1Signature,
              date: formData.prep1Date,
              lastName: formData.prep1LastName,
              firstName: formData.prep1FirstName,
              middleInitial: formData.prep1MiddleInitial,
              address: formData.prep1Address,
              city: formData.prep1City,
              state: formData.prep1State,
              zipCode: formData.prep1ZipCode,
            },
            // Preparer 2
            {
              signature: formData.prep2Signature,
              date: formData.prep2Date,
              lastName: formData.prep2LastName,
              firstName: formData.prep2FirstName,
              middleInitial: formData.prep2MiddleInitial,
              address: formData.prep2Address,
              city: formData.prep2City,
              state: formData.prep2State,
              zipCode: formData.prep2ZipCode,
            },
            // Preparer 3
            {
              signature: formData.prep3Signature,
              date: formData.prep3Date,
              lastName: formData.prep3LastName,
              firstName: formData.prep3FirstName,
              middleInitial: formData.prep3MiddleInitial,
              address: formData.prep3Address,
              city: formData.prep3City,
              state: formData.prep3State,
              zipCode: formData.prep3ZipCode,
            },
            // Preparer 4
            {
              signature: formData.prep4Signature,
              date: formData.prep4Date,
              lastName: formData.prep4LastName,
              firstName: formData.prep4FirstName,
              middleInitial: formData.prep4MiddleInitial,
              address: formData.prep4Address,
              city: formData.prep4City,
              state: formData.prep4State,
              zipCode: formData.prep4ZipCode,
            },
          ].filter(
            (preparer) =>
              preparer.signature || preparer.lastName || preparer.firstName
          ), // Only include preparers with data
        };

        // Handle Supplement B: Reverification and Rehire
        newFormData.supplementB = {
          employeeName: {
            lastName: formData.suppBLastName,
            firstName: formData.suppBFirstName,
            middleInitial: formData.suppBMiddleInitial,
          },
          reverifications: [
            // Reverification 1
            {
              dateOfRehire: formData.rev1Date,
              newName: {
                lastName: formData.rev1LastName,
                firstName: formData.rev1FirstName,
                middleInitial: formData.rev1MiddleInitial,
              },
              documentTitle: formData.rev1DocTitle,
              documentNumber: formData.rev1DocNumber,
              expirationDate: formData.rev1ExpDate,
              employerName: formData.rev1EmployerName,
              employerSignature: formData.rev1EmployerSignature,
              employerDate: formData.rev1EmployerDate,
              additionalInfo: formData.rev1AdditionalInfo,
              altProcedureUsed: formData.rev1AltProcedureUsed || false,
            },
            // Reverification 2
            {
              dateOfRehire: formData.rev2Date,
              newName: {
                lastName: formData.rev2LastName,
                firstName: formData.rev2FirstName,
                middleInitial: formData.rev2MiddleInitial,
              },
              documentTitle: formData.rev2DocTitle,
              documentNumber: formData.rev2DocNumber,
              expirationDate: formData.rev2ExpDate,
              employerName: formData.rev2EmployerName,
              employerSignature: formData.rev2EmployerSignature,
              employerDate: formData.rev2EmployerDate,
              additionalInfo: formData.rev2AdditionalInfo,
              altProcedureUsed: formData.rev2AltProcedureUsed || false,
            },
            // Reverification 3
            {
              dateOfRehire: formData.rev3Date,
              newName: {
                lastName: formData.rev3LastName,
                firstName: formData.rev3FirstName,
                middleInitial: formData.rev3MiddleInitial,
              },
              documentTitle: formData.rev3DocTitle,
              documentNumber: formData.rev3DocNumber,
              expirationDate: formData.rev3ExpDate,
              employerName: formData.rev3EmployerName,
              employerSignature: formData.rev3EmployerSignature,
              employerDate: formData.rev3EmployerDate,
              additionalInfo: formData.rev3AdditionalInfo,
              altProcedureUsed: formData.rev3AltProcedureUsed || false,
            },
          ].filter(
            (rev) =>
              rev.dateOfRehire || rev.documentTitle || rev.employerSignature
          ), // Only include reverifications with data
        };

        newFormData.section2 = {
          employmentStartDate: formData.firstDayEmployment,
          documentTitle1: formData.listADocTitle1,
          issuingAuthority1: formData.listAIssuingAuth1,
          documentNumber1: formData.listADocNumber1,
          expirationDate1: formData.listAExpDate1,
          documentTitle2: formData.documentTitle2,
          issuingAuthority2: formData.issuingAuthority2,
          documentNumber2: formData.documentNumber2,
          expirationDate2: formData.expirationDate2,
          documentTitle3: formData.listADocTitle3,
          issuingAuthority3: formData.listAIssuingAuth3,
          documentNumber3: formData.listADocNumber3,
          expirationDate3: formData.listAExpDate3,
          additionalInfo: formData.additionalInfo,
          employerSignature: formData.employerSignature,
          employerSignatureDate: formData.employerSignatureDate,
          employerName: formData.employerName,
          employerTitle: formData.employerTitle,
          employerBusinessName: formData.employerBusinessName,
          employerBusinessAddress: formData.employerBusinessAddress,
        };
      }

      i9Form = new I9Form(newFormData);

      // Initialize workAuthorization if provided
      if (formData.workAuthorization) {
        if (formData.workAuthorization.isNonCitizen !== undefined) {
          i9Form.set(
            "workAuthorization.isNonCitizen",
            formData.workAuthorization.isNonCitizen
          );
        }
        if (formData.workAuthorization.hasWorkAuthorization !== undefined) {
          i9Form.set(
            "workAuthorization.hasWorkAuthorization",
            formData.workAuthorization.hasWorkAuthorization
          );
        }
      }
    }

    await i9Form.save();

    // Update application progress
    if (status === "completed") {
      // Ensure completedForms array exists
      if (!application.completedForms) {
        application.completedForms = [];
      }

      // Check if I-9 Form is already marked as completed
      if (!application.completedForms.includes("I-9 Form")) {
        application.completedForms.push("I-9 Form");
      }

      application.completionPercentage =
        application.calculateCompletionPercentage();
      await application.save();
    }

    const message =
      status === "draft" ? "I-9 form saved as draft" : "I-9 form completed";

    res.status(200).json({
      message,
      i9Form: i9Form,
      completionPercentage: application.completionPercentage,
    });
  } catch (error) {
    console.error("Error saving I-9 form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get I-9 form by application ID
router.get("/get-i9-form/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const i9Form = await I9Form.findOne({ applicationId });

    if (!i9Form) {
      return res.status(404).json({ message: "I-9 form not found" });
    }

    // Apply reverse mapping for frontend compatibility
    const frontendI9Form = i9Form.toObject();
    if (frontendI9Form.section1?.citizenshipStatus) {
      frontendI9Form.section1.citizenshipStatus =
        mapCitizenshipStatusToFrontend(
          frontendI9Form.section1.citizenshipStatus
        );
    }

    res.status(200).json({
      message: "I-9 form retrieved successfully",
      i9Form: frontendI9Form,
    });
  } catch (error) {
    console.error("Error getting I-9 form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get I-9 form by form ID (for direct editing)
router.get("/get-i9-form-by-id/:formId", async (req, res) => {
  try {
    const { formId } = req.params;

    const i9Form = await I9Form.findById(formId);

    if (!i9Form) {
      return res.status(404).json({ message: "I-9 form not found" });
    }

    // Apply reverse mapping for frontend compatibility
    const frontendI9Form = i9Form.toObject();
    if (frontendI9Form.section1?.citizenshipStatus) {
      frontendI9Form.section1.citizenshipStatus =
        mapCitizenshipStatusToFrontend(
          frontendI9Form.section1.citizenshipStatus
        );
    }

    res.status(200).json({
      message: "I-9 form retrieved successfully",
      i9Form: frontendI9Form,
    });
  } catch (error) {
    console.error("Error getting I-9 form:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Upload work authorization document
router.post("/employee-upload-work-authorization", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const { applicationId, employeeId } = req.body;
    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    const file = req.files.file;
    const fileName = `work-auth-${applicationId}-${Date.now()}.pdf`;
    const uploadPath = `./uploads/i9/${fileName}`;

    // Ensure directory exists
    const fs = require("fs");
    const uploadDir = "./uploads/i9";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to uploads directory
    await file.mv(uploadPath);

    // Find or create I9 form
    let i9Form = await I9Form.findOne({ applicationId });
    if (!i9Form) {
      i9Form = new I9Form({
        applicationId,
        employeeId,
        status: "draft",
      });
    }

    // Update work authorization document
    i9Form.workAuthorization = {
      isNonCitizen: true,
      hasWorkAuthorization: true,
      workAuthorizationDocument: {
        filename: file.name,
        filePath: `uploads/i9/${fileName}`,
        uploadedAt: new Date(),
      },
    };

    await i9Form.save();

    res.status(200).json({
      success: true,
      message: "Work authorization document uploaded successfully",
      i9Form,
    });
  } catch (error) {
    console.error("Error uploading work authorization:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Remove work authorization document
router.post("/remove-work-authorization", async (req, res) => {
  try {
    const { applicationId, employeeId } = req.body;
    if (!applicationId || !employeeId) {
      return res
        .status(400)
        .json({ message: "Application ID and Employee ID are required" });
    }

    const i9Form = await I9Form.findOne({ applicationId });
    if (!i9Form) {
      return res.status(404).json({ message: "I9 form not found" });
    }

    // Delete file if exists
    if (i9Form.workAuthorization?.workAuthorizationDocument?.filePath) {
      const fs = require("fs");
      const filePath =
        i9Form.workAuthorization.workAuthorizationDocument.filePath;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clear work authorization data
    i9Form.workAuthorization = {
      isNonCitizen: false,
      hasWorkAuthorization: false,
      workAuthorizationDocument: null,
    };

    await i9Form.save();

    res.status(200).json({
      success: true,
      message: "Work authorization document removed successfully",
      i9Form,
    });
  } catch (error) {
    console.error("Error removing work authorization:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get work authorization document (for download)
router.get("/get-work-authorization/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const i9Form = await I9Form.findOne({ applicationId });
    if (
      !i9Form ||
      !i9Form.workAuthorization?.workAuthorizationDocument?.filePath
    ) {
      return res
        .status(404)
        .json({ message: "Work authorization document not found" });
    }

    const fs = require("fs");
    const filePath =
      i9Form.workAuthorization.workAuthorizationDocument.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Error downloading work authorization:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
