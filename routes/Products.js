const express = require('express');
const { createProduct, fetchAllProducts, fetchProductById, updateProduct,getProductonCategory,fetdummyproducts} = require('../controller/Product');
const { Product } = require('../model/Product');

const router = express.Router();
//  /products is already added in base path
router.post('/', createProduct)
      .get('/', fetchAllProducts)
      .get('/:id', fetchProductById)
      .patch('/:id', updateProduct)
      .get('/getcategory/:id',getProductonCategory)
      // .get('/',fetdummyproducts)

      

exports.router = router;
