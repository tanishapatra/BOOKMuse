import pg from "pg";

const db = new pg.Client({
  user: "postgres",          
  host: "localhost",
  database: "BOOKMuse",      
  password: "postsetup123",
  port: 5432,
});

db.connect();

export default db;
