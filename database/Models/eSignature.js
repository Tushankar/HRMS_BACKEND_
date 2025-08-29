const { default: mongoose } = require("mongoose");
const Mongoose = require("mongoose");

const EsignatureSchema = new Mongoose.Schema(
    {
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        signature: {
            filename: { type: String, required: true },
            filePath: { type: String, required: true },
            fileType: {
                type: String,
                enum: ["image", "pdf"],
                required: true,
            },
        },

    },
    {
        timestamps: true,
    }
);

module.exports = Mongoose.model("eSignature", EsignatureSchema);