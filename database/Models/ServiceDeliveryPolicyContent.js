const mongoose = require("mongoose");

// Service Delivery Policy Content Schema - For admin to manage editable policy statements
const ServiceDeliveryPolicyContentSchema = new mongoose.Schema(
  {
    // Policy statements content that can be edited by admin
    policyStatements: {
      policy1: {
        text: {
          type: String,
          default:
            'I am aware of the agency policy of NO "EXU Login, NO pay". I understand that I have to complete my hours detail for the previous Date within 6 days and payroll week by 11:00am on Monday of the Payroll week and send in the copies of the Progress Notes by email to office@pacifichealthsystems.com or by dropping them at the office.',
        },
        highlighted: { type: Boolean, default: true },
        highlightColor: { type: String, default: "#E91E8C" }, // Magenta
      },
      policy2: {
        text: {
          type: String,
          default:
            "I understand that NO CALL, NO SHOW results in immediate termination",
        },
        highlighted: { type: Boolean, default: true },
        highlightColor: { type: String, default: "#FFFF00" }, // Yellow
      },
      policy3: {
        text: {
          type: String,
          default:
            "Should there be a need to attend to non-business or family matters during my scheduled hours, I understand that I have to let the Administration or my supervisor know my intentions of my plans to be off-duty as early as possible.",
        },
        highlighted: { type: Boolean, default: true },
        highlightColor: { type: String, default: "#00FFFF" }, // Cyan
      },
      policy4: {
        text: {
          type: String,
          default:
            "I understand that it is against agency policy to borrow money from my client or tell my client about my personal challenges.",
        },
        highlighted: { type: Boolean, default: false },
        highlightColor: { type: String, default: "" },
      },
      policy5: {
        text: {
          type: String,
          default:
            "I understand that services are performed at client's home and I must seek agency approval before driving the client on Doctor's appointments, grocery shopping, purchase medication etc.",
        },
        highlighted: { type: Boolean, default: false },
        highlightColor: { type: String, default: "" },
      },
    },

    // Logo and header information
    logoUrl: {
      type: String,
      default:
        "https://www.pacifichealthsystems.net/wp-content/themes/pacifichealth/images/logo.png",
    },
    companyName: {
      type: String,
      default: "Pacific Health Systems",
    },
    policyTitle: {
      type: String,
      default: "Service Delivery Policies",
    },
    introductionText: {
      type: String,
      default:
        "At the Pacific Health Systems orientation forum, employees where told of the significances of rendering quality service to our clients. Please initial the following statements and sign below:",
    },

    // Metadata
    isActive: { type: Boolean, default: true },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    lastUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ServiceDeliveryPolicyContent",
  ServiceDeliveryPolicyContentSchema
);
