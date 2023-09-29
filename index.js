const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");

const dbURL = process.env.MONGO_URL;
const port = process.env.PORT;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mongodb connect
// mongoose
//   .connect(dbURL)
//   .then(() => {
//     console.log("Mongoose atlas is connected...");
//   })
//   .catch((err) => {
//     console.log("Mongoose atlas is not connected...");
//     console.log(err);
//     process.exit(1);
//   });
// mongodb connect
const connectDB = async () => {
  try {
    await mongoose.connect(dbURL);
    console.log("DB is connected..");
  } catch (error) {
    console.log("DB is not connected..");
    console.log(error.message);
    process.exit(1);
  }
};

// create schema
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "product title is required.."],
    minlength: [3, "minimum length of the title should be 3"],
    maxlength: [100, "maximum length of the title should be 100"],
    trim: true,
    uppercase: true,
    // enum: {
    //   values: ["apple", "samsung", "walton"],
    //   message: "Value is not supported",
    // },
    validate: {
      validator: function (v) {
        return v.length === 6;
      },
      message: (props) => `${props.value} is not exactly 6 chracters..`,
    },
  },
  price: {
    type: Number,
    min: 20000,
    max: 100000,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  phone: {
    type: String,
    required: [true, "phone is required.."],
    validate: {
      validator: function (v) {
        return /\d{3}-\d{3}-\d{4}/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number..`,
    },
  },
});
// create model
const Product = mongoose.model("Products", productSchema);

// CRUD --> Create,Read,Update,Delete
// product route(create a product)
app.post("/products", async (req, res) => {
  try {
    //get data from request body
    const title = req.body.title;
    const price = req.body.price;
    const rating = req.body.rating;
    const phone = req.body.phone;
    const description = req.body.description;

    const newProduct = new Product({
      title,
      price,
      phone,
      rating,
      description,
    });
    const productData = await newProduct.save();

    // const productsDatas = await Product.insertMany([
    //   {
    //     title: "Vivo",
    //     price: 4000,
    //     description: "Very beautiful...",
    //   },
    //   {
    //     title: "Vivo2",
    //     price: 40000,
    //     description: "Very beautiful as more...",
    //   },
    // ]);

    res.status(201).send({
      succes: true,
      message: "return products data",
      data: productData,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// product route(Read all the products)
app.get("/products", async (req, res) => {
  try {
    const price = req.query.price;
    const rating = req.query.rating;
    let products;
    if (price && rating) {
      products = await Product.find({
        $and: [{ price: { $gt: price } }, { rating: { $gt: rating } }],
      });
    } else {
      products = await Product.find()
        .limit(10)
        .sort({ price: -1 })
        .select({ title: 1, price: 1, rating: 1, _id: 0, phone: 1 });
    }

    if (products) {
      res.status(200).send({
        succes: true,
        message: "return all product",
        data: products,
      });
    } else {
      res.status(404).send({
        succes: false,
        message: "produtcs not found",
      });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// product route(Read specific product)
app.get("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne(
      { _id: id },
      { title: 1, _id: 0, price: 1, phone: 1, description: 1, rating: 1 }
    );
    if (product) {
      res.status(200).send({
        succes: true,
        message: "return single product",
        data: product,
      });
    } else {
      res.status(404).send({
        succes: false,
        message: "produtc not found with this id",
      });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// product route(delete a product based on id)
app.delete("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findByIdAndDelete({ _id: id });
    if (product) {
      res.status(200).send({
        succes: true,
        message: "product is deleted",
        data: product,
      });
    } else {
      res.status(404).send({
        succes: false,
        message: "id is not match for deleting",
      });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// product route(update a product based on id)
app.put("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const title = req.body.title;
    const price = req.body.price;
    const rating = req.body.rating;
    const phone = req.body.phone;
    const description = req.body.description;
    const product = await Product.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          title,
          rating,
          price,
          description,
          phone,
        },
      },
      { new: true }
    );
    if (product) {
      res.status(200).send({
        succes: true,
        message: "product is updated",
        data: product,
      });
    } else {
      res.status(404).send({
        succes: false,
        message: "id is not match for updating",
      });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Database --> collections --> document

// POST : /products --> create a product
// GET : /products --> Return all the products
// GET : /products/:id --> return a specific product
// DELETE : /product/:id --> delete a product based on id
// PUT : /products/:id --> update a product based on id

//home route
app.get("/", (req, res) => {
  res.send("Welcome to homepage...");
});

app.listen(port, async () => {
  console.log(`server is running at http://localhost:${port}`);
  await connectDB();
});
