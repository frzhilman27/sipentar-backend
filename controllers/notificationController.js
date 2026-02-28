const db = require("../config/db");

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
            [id, userId]
        );
        res.json({ message: "Notifikasi ditandai dibaca" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Mark all notifications as read for the logged-in user
exports.markAllAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
            [userId]
        );
        res.json({ message: "Semua notifikasi ditandai dibaca" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
