const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// 3. In the src/orders/orders.controller.js file, add handlers and middleware functions to create, read, update, delete, and list orders.

// get all dishes GET http://localhost:5000/dishes
function list(req, res) {
  res.json({ data: orders });
}

// read
function orderExists(req, res, next) {
  const { orderId } = req.params;
  console.log("order", orderId);
  const foundOrder = orders.find((order) => order.id === orderId);
  console.log("foundOrder", foundOrder);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}
function read(req, res) {
  res.json({ data: res.locals.order });
}

// create
// {
//     "data": {
//       "deliverTo": "308 Negra Arroyo Lane, Albuquerque, NM",
//       "mobileNumber": "(505) 143-3369",
//       "status": "delivered",
//       "dishes": [
//         {
//           "id": "d351db2b49b69679504652ea1cf38241",
//           "name": "Dolcelatte and chickpea spaghetti",
//           "description": "Spaghetti topped with a blend of dolcelatte and fresh chickpeas",
//           "image_url": "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?h=530&w=350",
//           "price": 19,
//           "quantity": 2
//         }
//       ]
//     }
//   }

function validationForDelivery(req, res, next) {
  const { data = {} } = req.body;
  console.log("validationForDelivery - order is ", data);
  if (data.deliverTo && data.deliverTo !== "") {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a deliverTo`,
  });
}

// function validationForDelivery(req, res, next) {
//     const { data } = req.body;
//     if (data.deliverTo && deliverTo !== "") {
//         return next();
//     }
//     next({ status: 400, message: `Order must include a deliverTo` });
// }

function validationFoMobileNumber(req, res, next) {
  const { data = {} } = req.body;
  console.log("validationForDelivery - order is ", data);

  if (data.mobileNumber && data.mobileNumber !== "") {
    return next();
  }
  next({ status: 400, message: `Order must include a mobileNumber` });
}

function dishesAreValid(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  //console.log("dishes: ", dishes);

  if (!dishes) {
    return next({
      status: 400,
      message: `Order must include a dish`,
    });
  }
  if (!Array.isArray(dishes) || dishes.length <= 0) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }

  next();
}

// && dishes.quantity && dishes.quantity !== 0 && typeof dishes.quantity === 'number'

function dishIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  console.log("dishes: ", dishes);

  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      typeof dish.quantity != "number"
    )
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
  });
  next();
}

function create(req, res) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(), // Increment last id then assign as the current ID
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// update
// check for status
function statusIsValid(req, res, next) {
  const {
    data: { status },
  } = req.body;
  //const validStatus = ["delivered"];
  if (
    status !== "pending" &&
    status !== "preparing" &&
    status !== "out-for-delivery"
  ) {
    return next({
      status: 400,
      message: `status is invalid`,
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  } else if (!status || status === "") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  next();
}

function orderIdIsSameInBobyRequest(req, res, next) {
  const { orderId } = req.params; // route id
  console.log("orderIdIsSameInBobyRequest orderId", orderId);
  const { id } = req.body.data;
  console.log("orderIdIsSameInBobyRequest id", id);

  if (!id || id === orderId) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // Update the dish
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

// Add delete-paste handler
function statusIsPending(req, res, next) {
  const { orderId } = req.params;
  const orderToDelete = orders.find((order) => order.id === orderId);
  //const validStatus = ["delivered"];
  if (orderToDelete.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending. Returns a 400 status code`,
    });
  }
  next();
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    validationForDelivery,
    validationFoMobileNumber,
    dishesAreValid,
    dishIsValid,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    validationForDelivery,
    validationFoMobileNumber,
    orderIdIsSameInBobyRequest,
    dishesAreValid,
    dishIsValid,
    statusIsValid,
    update,
  ],
  delete: [orderExists, statusIsPending, destroy],
};
