const express = require("express");
const app = express();
app.use(express.json());

const {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  createReservation,
  fetchCustomers,
  fetchRestaurants,
  fetchReservations,
  destroyReservation,
  destroyCustomer,
} = require("./db");


app.get("/api/customers", async(req, res, next) => {
    try {
        res.send(await fetchCustomers());
    } catch (ex) {
        next(ex);
    }
})

app.get("/api/restaurants", async (req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/reservations", async (req, res, next) => {
  try {
    res.send(await fetchReservations());
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/customers/:customer_id/reservations/:id", async (req, res, next) => {
  try {
    await destroyReservation({
      customer_id: req.params.customer_id,
      id: req.params.id,
    });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/customers/:id/reservations/", async (req, res, next) => {
  try {
    res.send(
      await createReservation({
        customer_id: req.params.id,
        restaurant_id: req.body.restaurant_id,
        date: req.body.date,
        party_count: req.body.party_count
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message || err });
});

const init = async () => {
  console.log("connecting to database");
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("created tables");

  const checkCustomersQuery = "SELECT COUNT(*) FROM customers";
  const CustomersResult = await client.query(checkCustomersQuery);
  const CustomersCount = parseInt(CustomersResult.rows[0].count, 10);

  const checkRestaurantsQuery = "SELECT COUNT(*) FROM restaurants";
  const RestaurantsResult = await client.query(checkRestaurantsQuery);
  const RestaurantsCount = parseInt(RestaurantsResult.rows[0].count, 10);

  if (CustomersCount === 0 && RestaurantsCount === 0) {
    // Insert  data if table is empty
    const [moe, lucy, larry, ethyl] = await Promise.all([
      createCustomer("moe" ),
      createCustomer("lucy" ),
      createCustomer("larry" ),
      createCustomer("ethyl" ),
    ]);
    const [paris, london, nyc] = await Promise.all([
      createRestaurant("Chick-Fil-A"),
      createRestaurant("Culvers"),
      createRestaurant("Potbelly"),
    ]);
    const [reservation, reservation2] = await Promise.all([
      createReservation({
        customer_id: moe.id,
        restaurant_id: nyc.id,
        date: "02/14/2024",
        party_count: 5,
      }),
      createReservation({
        customer_id: moe.id,
        restaurant_id: nyc.id,
        date: "02/28/2024",
        party_count: 10,
      }),
    ]);
    console.log(await fetchReservations());
    await destroyReservation({
      id: reservation.id,
      customer_id: reservation.customer_id,
    });
    console.log(await fetchReservations());
  } else {
    console.log("already seeded");
  }
  
  console.log(await fetchCustomers());
  console.log(await fetchRestaurants());

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

init();
