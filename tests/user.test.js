const superTest = require("supertest");
const app = require("../src/app");

test("Should singup a new user", async () => {
  await superTest(app)
    .post("/users/signup")
    .send({
      name: "nassim",
      email: "dsqdqsdqds@gdffd.com",
      password: "passtoto",
    })
    .expect(201);
});
