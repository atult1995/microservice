const { response, json } = require("express");
const { ProductService } = require("../service");
//const { PublishCustomerEvent, PublishShoppingEvent } = require("../utils");
const { PublishMessage, SubscribeMessage } = require("../utils");
const auth = require("./middleware");
const { CUSTOMER_BINDING_KEY, SHOPPING_BINDING_KEY } = require("../config");

module.exports = async (app, channel) => {
  const productService = new ProductService();
  SubscribeMessage(channel, productService);
  app.post("/create", auth, async (req, res) => {
    const {
      name,
      description,
      banner,
      unit,
      available,
      type,
      price,
      supplier,
    } = req.body;
    const { response, code } = await productService.createProduct({
      name,
      description,
      banner,
      unit,
      available,
      type,
      price,
      supplier,
    });
    res.status(code).send({ response });
  });

  app.get("/fetch", async (req, res) => {
    const { response, code } = await productService.fetchProduct();
    res.status(code).send({ response });
  });
  app.get("/fetch/:id", async (req, res) => {
    const { response, code } = await productService.fetchProductById({
      _id: req.params.id,
    });
    res.status(code).send({ response });
  });

  app.post("/add/cart/:id", auth, async (req, res) => {
    try {
      const { response: product, code } = await productService.fetchProductById(
        {
          _id: req.params.id,
        }
      );
      const {
        banner,
        price,
        name,
        unit,
        description,
        available,
        type,
        supplier,
      } = product;
      const data = {
        banner,
        price,
        name,
        unit,
        description,
        available,
        type,
        supplier,
        productId: product._id,
        customerId: req._id,
      };
      PublishMessage(
        channel,
        CUSTOMER_BINDING_KEY,
        JSON.stringify({ data, event: "ADD_TO_CART" })
      );
      PublishMessage(
        channel,
        SHOPPING_BINDING_KEY,
        JSON.stringify({ data, event: "ADD_TO_CART" })
      );

      res.status(200).send({ product, code, message: "Published" });
    } catch (e) {
      res
        .status(400)
        .send({ response: "", message: "Product was not found", code: 400 });
    }
  });

  app.post("/add/wishlist/:id", auth, async (req, res) => {
    try {
      const { response: product, code } = await productService.fetchProductById(
        {
          _id: req.params.id,
        }
      );
      const {
        banner,
        price,
        name,
        unit,
        description,
        available,
        type,
        supplier,
      } = product;
      const data = {
        banner,
        price,
        name,
        unit,
        description,
        available,
        type,
        supplier,
        productId: product._id,
        customerId: req._id,
      };
      PublishMessage(
        channel,
        CUSTOMER_BINDING_KEY,
        JSON.stringify({ data, event: "ADD_TO_WISHLIST" })
      );

      res.status(200).send({ product, code, message: "Published" });
    } catch (e) {
      res
        .status(400)
        .send({ response: "", message: "Product was not found", code: 400 });
    }
  });

  app.delete("/cart/:id", auth, async (req, res) => {
    try {
      const data = { productId: req.params.id, customerId: req._id };
      PublishMessage(
        channel,
        CUSTOMER_BINDING_KEY,
        JSON.stringify({ data, event: "REMOVE_FROM_CART" })
      );

      res
        .status(200)
        .send({ response: "", code: 200, message: "Published and removed" });
    } catch (e) {
      res.status(400).send({ response: "", message: e.message, code: 400 });
    }
  });

  app.delete("/cart", auth, async (req, res) => {
    try {
      const data = { customerId: req._id };
      PublishMessage(
        channel,
        CUSTOMER_BINDING_KEY,
        JSON.stringify({ data, event: "CLEAR_CART" })
      );

      res
        .status(200)
        .send({ response: "", code: 200, message: "Published and removed" });
    } catch (e) {
      res.status(400).send({ response: "", message: e.message, code: 400 });
    }
  });
};
