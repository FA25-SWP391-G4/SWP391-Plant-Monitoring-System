
router.post("/pump", (req, res) => {
  const { cmd } = req.body; // "ON" or "OFF"
  sendPumpCommand(cmd);
  res.json({ status: "ok" });
});
