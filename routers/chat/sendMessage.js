const express = require("express");
const Message = require("../../database/Models/Message");
const mongoose = require("mongoose");
const router = express.Router();

// HTTP fallback for sending messages (when WebSocket is unavailable)
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    // Validate input
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({
        error: "Missing required fields: senderId, receiverId, and content are required"
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(senderId) || 
        !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        error: "Invalid senderId or receiverId format"
      });
    }

    // Create and save the message
    const newMessage = new Message({
      sender: new mongoose.Types.ObjectId(senderId),
      receiver: new mongoose.Types.ObjectId(receiverId),
      content: content.trim(),
      status: "sent"
    });

    await newMessage.save();

    // Try to broadcast via WebSocket if available
    if (global.wss) {
      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            event: "message",
            ...newMessage.toObject()
          }));
        }
      });
    }

    // Return the created message
    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error("Error sending message via HTTP:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message
    });
  }
});

module.exports = router;
