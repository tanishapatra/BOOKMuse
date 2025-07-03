import pg from "pg";

const { Pool } = pg;

const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "BOOKMuse",
  password: "postsetup123",
  port: 5432,
});

export default db;
