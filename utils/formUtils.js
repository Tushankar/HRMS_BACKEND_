/**
 * Utility functions for form status and editability
 */

/**
 * Check if a form is editable based on its status
 * @param {string} formStatus - The current status of the form
 * @param {string} applicationStatus - The overall application status
 * @returns {boolean} - Whether the form can be edited
 */
const isFormEditable = (formStatus, applicationStatus = null) => {
  // If application is approved, no forms can be edited
  if (applicationStatus === "approved") {
    return false;
  }
  
  // Forms with approved or rejected status cannot be edited
  if (formStatus === "approved" || formStatus === "rejected") {
    return false;
  }
  
  // Forms with draft, completed, or submitted status can be edited (unless application is approved)
  return ["draft", "completed", "submitted", "under_review"].includes(formStatus);
};

/**
 * Get form status display text
 * @param {string} status - The form status
 * @returns {string} - Display text for the status
 */
const getFormStatusDisplay = (status) => {
  const statusMap = {
    'draft': 'Draft',
    'completed': 'Completed',
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'staff_signed': 'Staff Signed'
  };
  
  return statusMap[status] || status;
};

/**
 * Get status color class for UI
 * @param {string} status - The form status
 * @returns {string} - CSS class names for styling
 */
const getFormStatusColor = (status) => {
  const colorMap = {
    'draft': 'bg-gray-100 text-gray-700',
    'completed': 'bg-blue-100 text-blue-700',
    'submitted': 'bg-yellow-100 text-yellow-700',
    'under_review': 'bg-orange-100 text-orange-700',
    'approved': 'bg-green-100 text-green-700',
    'rejected': 'bg-red-100 text-red-700',
    'staff_signed': 'bg-purple-100 text-purple-700'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

module.exports = {
  isFormEditable,
  getFormStatusDisplay,
  getFormStatusColor
};
