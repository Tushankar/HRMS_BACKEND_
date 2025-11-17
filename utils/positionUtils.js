// Utility functions for position-specific form handling

const getFormKeysForPosition = (positionType) => {
  const baseFormKeys = [
    "personalInformation",
    "professionalExperience", 
    "workExperience",
    "education",
    "references",
    "legalDisclosures",
    "positionType",
    "employmentApplication",
    "orientationPresentation",
    "w4Form",
    "w9Form", 
    "i9Form",
    "emergencyContact",
    "directDeposit",
    "misconductStatement",
    "codeOfEthics",
    "serviceDeliveryPolicy",
    "nonCompeteAgreement",
    "backgroundCheck",
    "tbSymptomScreen",
    "orientationChecklist",
  ];

  // Add position-specific forms
  switch (positionType) {
    case 'PCA':
      return [...baseFormKeys, "jobDescriptionPCA", "pcaTrainingQuestions", "professionalCertificatePCA"];
    case 'CNA':
      return [...baseFormKeys, "jobDescriptionCNA", "professionalCertificateCNA"];
    case 'LPN':
      return [...baseFormKeys, "jobDescriptionLPN", "professionalCertificateLPN"];
    case 'RN':
      return [...baseFormKeys, "jobDescriptionRN", "professionalCertificateRN"];
    default:
      return baseFormKeys;
  }
};

const getRelevantJobDescriptionForms = (positionType) => {
  switch (positionType) {
    case 'PCA':
      return ['jobDescriptionPCA'];
    case 'CNA':
      return ['jobDescriptionCNA'];
    case 'LPN':
      return ['jobDescriptionLPN'];
    case 'RN':
      return ['jobDescriptionRN'];
    default:
      return [];
  }
};

const checkProfessionalCertificateCompletion = (application, positionType) => {
  if (!application.professionalCertificates || !positionType) {
    return false;
  }
  
  const documents = application.professionalCertificates[positionType] || [];
  return documents.length > 0;
};

module.exports = {
  getFormKeysForPosition,
  getRelevantJobDescriptionForms,
  checkProfessionalCertificateCompletion
};