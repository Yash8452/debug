require('dotenv').config()

const Pool = require('pg').Pool
const pool = new Pool({
  user: `${process.env.DB_USER}`,
  host: `${process.env.DB_HOST}`,
  // database: `${process.env.DB_DATABASE}`,
  database: `postgres`,
  password: `${process.env.DB_PASSWORD}`,
  port: `${process.env.DB_PORT}`,
})


async function createDatabaseAndTable() {
  const dbName = process.env.DB_DATABASE;
  const tableName = 'users';
  const schemaName = 'public'; // Change this to the desired schema name

  const client = await pool.connect();

  try {
    // Check if database exists
    const dbExists = await databaseExists(client, dbName);

    if (!dbExists) {
      try {
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log('Database created successfully');
      } catch (dbError) {
        console.log(`Database '${dbName}' already exists or error creating database: ${dbError}`);
      }
    } else {
      console.log(`Database '${dbName}' already exists`);
    }

    // Create table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log(`Table '${tableName}' created successfully in schema '${schemaName}'`);
    } catch (tableError) {
      console.log(`Table '${tableName}' already exists in schema '${schemaName}' or error creating table: ${tableError}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
  }
}

async function databaseExists(client, dbName) {
  try {
    // Query to check if the database exists
    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking database existence:', error);
    throw error;
  }
}

createDatabaseAndTable();


// Our first endpoint will be a GET request. 
// /user
// SELECT all users and order by id.
const getUsers = (request, response) => {
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}


// For  /users/:id request, :id using a WHERE clause to display the result.
// In the SQL query, we’re looking for id=$1. In this instance, $1 is a numbered placeholder,
// which PostgreSQL uses natively instead of the ? placeholder you may be familiar with from other flavors of SQL.
//works fine getting users based on id "/users/1"
const getUserById = (request, response) => {
  const id = parseInt(request.params.id)
  // troubleshoot this line of code further, not functioning correctly
  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {

    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

//   The API will take a GET and POST request to the /users endpoint. In the POST request, we’ll be adding a new user. 
//   In this function, we’re extracting the name and email properties from the request body, and INSERTING the values.
//works fine
const createUser = (request, response) => {
  const { name, email } = request.body;

  pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', [name, email], (error, result) => {
    if (error) {
      throw error;
    }

    const userId = result.rows[0].id;
    const responseBody = {
      id: userId,
      message: `User added with ID: ${userId}`
    };

    response.status(201).json(responseBody);
  });
};


//works fine
//   The /users/:id endpoint will update the user 
const updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User modified with ID: ${id}`)
    }
  )
}

//works fine
// DELETE clause on /users/:id to delete a specific user by id. 
const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`User deleted with ID: ${id}`)
    // console.log(response)
  })
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
}
