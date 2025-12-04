const { Product } = require('../model/Product');

exports.createProduct = async (req, res) => {
  // this product we have to get from API body
  const product = new Product(req.body);
  product.discountPrice = Math.round(product.price * (1 - product.discountPercentage / 100))
  try {
    const doc = await product.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchAllProducts = async (req, res) => {
  const { SleeveLength, subcategory, gender,category, color,pages,limit=18,genre} = req.query;

  let conditions = {};
 
  if (SleeveLength) {
    conditions.SleeveLength = { $in: SleeveLength.split(',') };
  }
  if (subcategory) {``
    conditions.subcategory = { $in: subcategory.split(',') };
  }
  if (gender) {
    conditions.gender = { $in: gender.split(',') };
  }
  if (color) {
    conditions.color = { $in: color.split(',') };
  }
  if(category){
    conditions.category={$in:category.split(',')};
  }

  if(genre){
    conditions.genre={$in:genre.split(',')};
  }
  

  try {
    // Perform count and find operations in parallel
    const [totalDocs, docs] = await Promise.all([
      Product.countDocuments(conditions),
      Product.find(conditions)
       .skip((parseInt(pages)-1)*limit)
       .limit(Number(limit))
       .exec()
    ]);

    // Set response headers for pagination
    res.set('X-Total-Count', totalDocs);
    let totalleft=0;
    totalleft=totalDocs-(parseInt(pages))*limit;
    res.set('X-Total-Pages', Math.ceil(totalDocs / limit));
    res.set('X-Current-Page', pages);

    // Send response
    res.status(200).json({docs:docs,totalDocs:totalDocs,totalleft:totalleft});
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching products.', details: err });
  }
};


exports.fetchProductById = async (req, res) => {
  const id = req.params.id;

  try {
    const product = await Product.findById(id);
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    product.discountPrice = Math.round(product.price * (1 - product.discountPercentage / 100))
    const updatedProduct = await product.save()
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(400).json(err);
  }
};



exports.getProductonCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const productsize = req.query.productsize;

    const product = await Product.findById(id);
    const sizes = product.sizes[0];

    console.log(sizes[productsize])
    // Check if the requested size is available
    if (sizes[productsize] > 0) {
      // Reduce the quantity of the requested size by 1
      sizes[productsize] -= 1;

      // Update the product document in the database with the modified sizes
      await Product.findByIdAndUpdate(id, { sizes: sizes }, { new: true });

      // Send the updated product information in the response
      res.status(200).json(product);
    } else {
      // If the requested size is not available, send an error response
      res.status(404).json({ error: "Requested size is not available for the product" });
    }
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).json({ error: "Error fetching product" });
  }
};


let offset = 0;

exports.fetdummyproducts = async (req, res) => {
  try {
    let limit = 15; 
    const offsetInt = parseInt(offset);
    const totalProductsCount = await Product.countDocuments();
    const data = await Product.find().skip(offsetInt).limit(limit);

    offset += limit; 
    if (offset >= totalProductsCount) {
        offset = 0; 
    }
    res.send(data);
} catch (err) {
    console.error("An error occurred while fetching dummy products:", err);
    res.status(500).send("Internal Server Error");
}

}




