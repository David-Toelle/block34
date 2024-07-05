const express = require("express");
const app = express();

const uuid = require("uuid");
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://postgres:123@localhost:5432/the_acme_reservation_planner"
);

const createTables = async () => {
  // Drop tables if they exist
  await client.query("DROP TABLE IF EXISTS reservations");
  await client.query("DROP TABLE IF EXISTS restaurants");
  await client.query("DROP TABLE IF EXISTS customers");
  const createTableSQuery = `
    CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS restaurants (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reservations (
        id UUID PRIMARY KEY,
        customer_id UUID REFERENCES customers(id) NOT NULL,
        restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
        date DATE NOT NULL,
        party_count INTEGER NOT NULL
    );
    `;
  await client.query(createTableSQuery);
};

const createCustomer = async (name) => {
  const SQL = `
    INSERT INTO customers(id, name) VALUES($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};

const createRestaurant = async (name) => {
  const SQL = `
    INSERT INTO restaurants(id, name) VALUES($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};

const createReservation = async ({ restaurant_id, customer_id, date, party_count }) => {
  const SQL = `
    INSERT INTO reservations(id, restaurant_id, customer_id, date, party_count) VALUES($1, $2, $3, $4, $5) RETURNING *
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    restaurant_id,
    customer_id,
    date,
    party_count,
  ]);
  return response.rows[0];
};

const fetchCustomers = async () => {
  const SQL = `SELECT * FROM customers`;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchRestaurants = async () => {
  const SQL = `SELECT * FROM restaurants`;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchReservations = async () => {
  const SQL = `SELECT * FROM reservations`;
  const response = await client.query(SQL);
  return response.rows;
};

const destroyReservation = async ({ id, customer_id }) => {
  console.log(id, customer_id);
  const SQL = `
    DELETE FROM reservations 
    WHERE id = $1 AND customer_id = $2 
    `;
  await client.query(SQL, [id, customer_id]);
};

const destroyCustomer = async ({ id }) => {
  console.log("DESTROY: ",id);
  const SQL = `
    DELETE FROM customers
    WHERE id = $1 
    `;
  await client.query(SQL, [id]);
};

module.exports = {
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
};
