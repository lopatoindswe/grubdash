const path = require("path");

// 1. In the src/dishes/dishes.controller.js file, add handlers and middleware functions to create, read, update, and list dishes.
// Note that dishes cannot be deleted.

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// 1. In the src/dishes/dishes.controller.js file, add handlers and middleware functions to create, read, update, and list dishes.
// Note that dishes cannot be deleted.
// TODO: Implement the /dishes handlers needed to make the tests pass

// get all dishes GET http://localhost:5000/dishes
function list(req, res) {
  res.json({ data: dishes });
}

// read
function dishExists(req, res, next) {
  const { dishId } = req.params;
  console.log("dishId", dishId);
  const foundDish = dishes.find((dish) => dish.id === dishId);
  console.log("foundDish", foundDish);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function dishIdIsSameInBobyRequest(req, res, next) {
  const { dishId } = req.params; // route id
  const { id } = req.body.data;

  if (!id || id === dishId) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Order: ${id}, Route: ${dishId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

// check if prcie is bigger than 0
// You can also add additional validation to make sure that the properties have reasonable values.
function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  console.log("price is: ", price);
  if (price > 0 && typeof price === "number") {
    return next();
  }
  next({
    status: 400,
    message: `Value of price is ${price} and it is < 0`,
  });
}

// create

// example
// {
//   id: "d351db2b49b69679504652ea1cf38241",
//   name: "Dolcelatte and chickpea spaghetti",
//   description:
//     "Spaghetti topped with a blend of dolcelatte and fresh chickpeas",
//   price: 19,
//   image_url:
//     "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?h=530&w=350",
// },

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

//let lastDishId = dishes.reduce((maxId, dish) => Math.max(maxId, dish.id), 0);

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(), // Increment last id then assign as the current ID
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// update
function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  // Update the dish
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    dishIdIsSameInBobyRequest,
    priceIsValid,
    update,
  ],
};
