const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const user = new User({ username, password });
        await user.save();
        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Tìm user trong DB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // So sánh mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // Lưu userId vào session
        req.session.userId = user._id;

        // Express-session sẽ tự động set cookie connect.sid
        // Nhưng nếu muốn custom cookie, có thể làm thêm:
        res.cookie("sid", req.sessionID, {
            httpOnly: true,
            secure: false, // đổi true nếu dùng HTTPS
            maxAge: 1000 * 60 * 60 // 1 giờ
        });

        res.json({ message: "Login successful!" });

    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// Logout
router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid"); // xóa cookie session
        res.clearCookie("sid"); // xóa cookie tùy chỉnh nếu có
        res.json({ message: "Logout successful!" });
    });
});

// Protected Route Example
router.get("/profile", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(req.session.userId).select("-password");
    res.json(user);
});

module.exports = router;
