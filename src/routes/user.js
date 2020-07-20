const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");

const router = new express.Router();

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/users/signup", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(404).send(e);
  }
  // data
  //   .save()
  //   .then(() => {
  //     res.status("201").send(data);
  //   })
  //   .catch((err) => res.send(err));
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "invalide updates !" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    // ne marche pas avec les middleware like schema.pre
    // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidation: true,
    // });
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);

  // User.find({})
  //   .then((user) => {
  //     if (!user) {
  //       return res.status(404).send();
  //     }
  //     res.send(user);
  //   })
  //   .catch((err) => {
  //     res.status(500).send(err);
  //   });
});

// router.get("/users/:id", auth, async (req, res) => {
//   const _id = req.params.id;
//   try {
//     const user = await User.findById(_id);
//     !user ? res.status(404).send({ message: "no recorded" }) : res.send(user);
//   } catch (e) {
//     res.status(500).send(e);
//   }
// User.findById(req.params.id)
//   .then((user) => {
//     if (!user) {
//       return res.status(404).send();
//     }
//     res.send(user);
//   })
//   .catch((err) => {
//     res.status(500).send(err);
//   });
// });

const upload = multer({
  limits: {
    fileSize: 5000000,
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error("upload an image !"));
    }
    callback(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});
module.exports = router;
