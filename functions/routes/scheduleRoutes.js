const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware"); 
const scheduleController = require("../controllers/scheduleController"); 
const { sendAdminNotification } = require("../utils/notificationService"); 

module.exports = ({ db, admin, storage }) => {

router.get("/", verifyToken, scheduleController.getAllSchedules);
router.get("/user/:userId", verifyToken, scheduleController.getUserSchedules);
router.get("/id/:scheduleId", verifyToken, scheduleController.getScheduleById);
router.post("/request-settlement", verifyToken, scheduleController.requestSettlement);
router.post("/approve-settlement", verifyToken, scheduleController.approveSettlement);



    return router;
  };
  
