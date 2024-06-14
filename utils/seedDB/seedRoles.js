const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Role = require("../../models/roles");

const DB_URL = process.env.DB_URL;

mongoose.connect(DB_URL);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
  console.log("Database connected");
});

const seedRoles = async () => {
  console.log("Deleting Previous Roles");
  await Role.deleteMany({});

  //   Create admin role

  console.log("Creating Admin Role");

  const adminRole = new Role({
    role_name: "admin",
    permissions: [
      "665b1f5e8ac27fb4bbb630c4",
      "665b1f5e8ac27fb4bbb630c6",
      "665b1f5e8ac27fb4bbb630c8",
      "665b1f5e8ac27fb4bbb630ca",
      "665b1f5e8ac27fb4bbb630cc",
      "665b1f5e8ac27fb4bbb630ce",
      "665b1f5e8ac27fb4bbb630d0",
    ],
  });

  await adminRole.save();

  //   Create Editor Role

  console.log("Creating Editor Role");
  const editorRole = new Role({
    role_name: "editor",
    permissions: [
      "665b1f5e8ac27fb4bbb630c4",
      "665b1f5e8ac27fb4bbb630c6",
      "665b1f5e8ac27fb4bbb630c8",
      "665b1f5e8ac27fb4bbb630ca",
    ],
  });

  await editorRole.save();
};

seedRoles().then(() => mongoose.connection.close());
