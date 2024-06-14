const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Permission = require("../../models/permissions");

const DB_URL = process.env.DB_URL;

const permissions = [
  {
    permission_name: "create_content",
    description: "Permission to create new content",
  },
  {
    permission_name: "edit_content",
    description: "Permission to edit existing content",
  },
  {
    permission_name: "delete_content",
    description: "Permission to delete existing content",
  },
  {
    permission_name: "publish_content",
    description: "Permission to publish content",
  },
  {
    permission_name: "manage_users",
    description: "Permission to manage users",
  },
  {
    permission_name: "manage_roles",
    description: "Permission to manage roles and permissions",
  },
  {
    permission_name: "manage_settings",
    description: "Permission to manage CMS settings",
  },
  {
    permission_name: "read_content",
    description: "Permission to only Read",
  },
];

const seedPermission = async () => {
  console.log("Deleting Previous entries");
  await Permission.deleteMany({});
  for (let i = 0; i < permissions.length; i++) {
    const newPermissions = new Permission(permissions[i]);
    await newPermissions.save();
  }
  console.log("Permissions seeding Completed");
};

const connectToDB = async () => {
  mongoose.connect(DB_URL);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error: "));
  db.once("open", () => {
    console.log("Database connected");
  });
};

connectToDB().then(() =>
  seedPermission().then(() => mongoose.connection.close())
);
