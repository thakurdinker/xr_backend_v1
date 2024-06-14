const express = require("express");

const router = express.Router({ mergeParams: true });

const userController = require("../controller/userController");
const passport = require("passport");
const catchAsync = require("../utils/seedDB/catchAsync");

router.route("/getUsers").get(userController.listUsers);

router
  .route("/getUsers/:id")
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

router.route("/register").post(userController.register);

router.route("/currentuser").get(userController.currentUser);

router
  .route("/login")
  .post(
    passport.authenticate("local", { failureRedirect: "/failedLogin" }),
    function (req, res) {
      res.send("Logged In");
    }
  );

router.route("/failedLogin").get(
  catchAsync(async (req, res) => {
    res.send("Failed Logging In");
  })
);

router.get("/logout", userController.logout);

module.exports = router;
