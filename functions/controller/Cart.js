const { Cart } = require('../model/Cart');



exports.fetchCartByUser = async (req, res) => {
  const id = req.params.id; 
  
  try {
    const cartItems = await Cart.find({ user: id }).populate('product');
    res.status(200).json(cartItems);
  } catch (err) {
    res.status(400).json(err);
  }
};


exports.addToCart = async (req, res) => {

  const id=req.params.id;

  const cart=new Cart({...req.body,user:id})

  try {
    const doc = await cart.save();
    res.status(201).json(doc);
  } catch (err) {
    // Handle errors
    console.error("Error adding item to cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.deleteFromCart = async (req, res) => {
  const  id  = req.params.id;
  try {
    const doc = await Cart.findByIdAndDelete(id);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateCart = async (req, res) => {
  const  id  = req.params.id;
  try {
    const cart = await Cart.findByIdAndUpdate(id, req.body, {
      new: true,
    }).populate('product');
    res.status(200).json(cart);
  } catch (err) {
    res.status(400).json(err);
  }
};
