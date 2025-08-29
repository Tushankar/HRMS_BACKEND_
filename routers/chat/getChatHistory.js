const express = require("express");
const Message = require("../../database/Models/Message");
const mongoose = require("mongoose");
const router = express.Router();


// Get unread message counts for a user
router.get("/unread/:userId", async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        // Aggregate unread messages grouped by sender
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiver: userId,
                    status: { $in: ["sent", "delivered"] } // Count messages that are not read
                }
            },
            {
                $group: {
                    _id: "$sender", // Group by sender
                    count: { $sum: 1 } // Count unread messages per sender
                }
            },
            {
                $lookup: {
                    from: "users", // Assuming your User collection is named "users"
                    localField: "_id",
                    foreignField: "_id",
                    as: "senderInfo"
                }
            },
            {
                $unwind: "$senderInfo"
            },
            {
                $project: {
                    senderId: "$_id",
                    senderName: "$senderInfo.name", // Adjust based on your User schema
                    unreadCount: "$count"
                }
            }
        ]);

        res.json(unreadCounts);
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Get chat history between two users
router.get("/:senderId/:receiverId", async (req, res) => {
    try {
        const senderId = new mongoose.Types.ObjectId(req.params.senderId);
        const receiverId = new mongoose.Types.ObjectId(req.params.receiverId);

        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Mark all messages as read for a specific conversation
router.post("/mark-read/:userId/:senderId", async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId); // The user viewing the chat
        const senderId = new mongoose.Types.ObjectId(req.params.senderId); // The other user in the chat

        // Update all messages from senderId to userId that are not yet read
        const result = await Message.updateMany(
            {
                sender: senderId,
                receiver: userId,
                status: { $in: ["sent", "delivered"] }
            },
            { $set: { status: "read" } }
        );

        // Fetch updated messages to broadcast
        const updatedMessages = await Message.find({
            sender: senderId,
            receiver: userId,
            status: "read"
        });

        // Broadcast updated messages via WebSocket (assuming WebSocket is available globally)
        global.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ event: "messages-read", messages: updatedMessages }));
            }
        });

        res.json({ modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all messages
router.get("/all-message", async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ createdAt: 1 })
            .lean(); // lean() improves performance by returning plain JavaScript objects

        res.json(messages);
    } catch (error) {
        console.error("Error fetching all messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;