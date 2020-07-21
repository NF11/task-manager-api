const superTest = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const userOneID = new mongoose.Types.ObjectId();

const userOne = {
  _id: userOneID,
  name: "test",
  email: "test@test.com",
  password: "testtest",
  tokens: [
    {
      token: jwt.sign({ _id: userOneID }, process.env.JWT_KEY),
    },
  ],
};

beforeEach(async () => {
  await User.deleteMany();
  await new User(userOne).save();
});

test("Should singup a new user", async () => {
  const response = await superTest(app)
    .post("/users/signup")
    .send({
      name: "nassim",
      email: "nassim@nassim.com",
      password: "passtoto",
    })
    .expect(201);
  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assert about the response
  expect(response.body).toMatchObject({
    user: {
      name: "nassim",
      email: "nassim@nassim.com",
    },
    token: user.tokens[0].token,
  });
  //  TODO Assert about password is encrypted
});

test("Should login existing user", async () => {
  const response = await superTest(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);
  const user = await User.findById(response.body.user._id);
  await expect(user).not.toBeNull();
  await expect(user.tokens[1].token).toMatch(userOne.tokens[0].token);
});
test("Should not login no existing user", async () => {
  await superTest(app)
    .post("/users/login")
    .send({
      email: "userOne.email",
      password: "userOne.password",
    })
    .expect(400);
});

test("Should get profile for user", async () => {
  await superTest(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});
test("Should get profile for user whit bad token", async () => {
  await superTest(app)
    .get("/users/me")
    .set("Authorization", `Bearer 231sd561fs1cfsd1f56s1f5s156sfd1sf15d6`)
    .send()
    .expect(401);
});
test("Should not get profile for unauthenticated user", async () => {
  await superTest(app).get("/users/me").send().expect(401);
});

test("Should delete account for authenticated user", async () => {
  const response = await superTest(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  //  Assert user is removed
  const user = await User.findById(userOneID);
  expect(user).toBeNull();
});
test("Should not delete account for unauthenticated user", async () => {
  await superTest(app)
    .delete("/users/me")
    .set("Authorization", `Bearer 231sd561fs1cfsd1f56s1f5s156sfd1sf15d6`)
    .send()
    .expect(401);
});
