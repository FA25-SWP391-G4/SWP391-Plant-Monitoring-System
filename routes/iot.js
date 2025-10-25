const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "IoT endpoint is working!" });
});

const sensorController = require("../controllers/sensorController");
router.get("/sensors/latest", sensorController.getLastestSensorData);
module.exports = router;

// router.post("/pump", (req, res) => {
//   const { cmd } = req.body; // "ON" or "OFF"
//   sendPumpCommand(cmd);
//   res.json({ status: "ok" });
// });
 