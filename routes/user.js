const express = require("express");

const router = express.Router({ mergeParams: true });

const userController = require("../controller/userController");
const passport = require("passport");
const catchAsync = require("../utils/seedDB/catchAsync");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

router.route("/getUsers").get(isLoggedIn, isAdmin, userController.listUsers);

router
  .route("/getUsers/:id")
  .get(isLoggedIn, isAdmin, userController.getUserById)
  .put(isLoggedIn, isAdmin, userController.updateUser)
  .delete(isLoggedIn, isAdmin, userController.deleteUser);

router.route("/register").post(userController.register);

router.route("/currentuser").get(userController.currentUser);

router
  .route("/login")
  .post(
    passport.authenticate("local", { failureRedirect: "/failedLogin" }),
    function (req, res) {
      res.status(200).json({ success: true, message: "DONE" });
    }
  );

router.route("/failedLogin").get(
  catchAsync(async (req, res) => {
    res.status(200).json({ success: false, message: "DONE" });
  })
);

router.get("/logout", userController.logout);

module.exports = router;
