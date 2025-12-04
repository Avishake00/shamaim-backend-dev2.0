const { Category } = require("../model/Category");
const { User } = require("../model/User");

exports.fetchUserById = async (req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const user = await User.findById(id);
    res
      .status(200)
      .json({
        id: user.id,
        addresses: user.addresses,
        email: user.email,
        role: user.role,
      });
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updatePassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const updatepassword = await User.updateOne(
      { email: email },
      { $set: { password: password } }
    );

    res.status(200).send({ message: "password sucessfully updated" });
  } catch (err) {
    res.send(err);
  }
};

exports.getAllUser = async (req,res) => {
  try {
    const getUser = await User.find({});
    return res.send( getUser);
  } catch (err) {
    res.send( err);
  }
};
