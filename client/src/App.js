import React, { useState, useEffect } from 'react';
import NewUserForm from './Components/NewUserForm';
import EditUserForm from './Components/EditUserForm';

const App = () => {

  const initialFormState = {
    id: '',
    name: '',
    email: ''
  }

  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(initialFormState)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchUsers();
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:8080/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const result = await response.json();
      setUsers(result);
      setError(null);
    } catch (error) {
      setError(error.message);
      // console.error(error);
    }
  };
  const handleInputChange = event => {
    const { id, value } = event.target
    setCurrentUser({ ...currentUser, [id]: value })
  }


  const submitNewUser = async (event) => {
    event.preventDefault();
    try {
      let response = await fetch('http://localhost:8080/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentUser)
      });
      if (!response.ok) {
        throw new Error('Failed to add new user');
      }
      const newUser = await response.json();
      setUsers(prevUsers => [...prevUsers, newUser]);
      fetchUsers(); // Assuming this function fetches all users again
      setCurrentUser(initialFormState);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteUser = async (item) => {
    try {
      await fetch(`http://localhost:8080/users/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Assuming that the server successfully deleted the user, you can update the UI by removing the deleted user from the state.
      setUsers(prevUsers => prevUsers.filter(user => user.id !== item.id));

      // Fetching users again to update the user list after deletion.
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const editUser = item => {
    // console.log(item)
    setEditing(true)
    setCurrentUser({ id: item.id, name: item.name, email: item.email })
  }

  const submitUserEdit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`http://localhost:8080/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentUser),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Update the user in the state
      setUsers(prevUsers => prevUsers.map(user => user.id === currentUser.id ? currentUser : user));

      // Fetch users again to update the list
      fetchUsers();

      // Reset the current user and editing state
      setCurrentUser(initialFormState);
      setEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container">
      <h1>Full Stack Assignment</h1>
      <h5>Basic CRUD Opreations</h5>
      {error && <p className='error-message'>Error : {error}</p>}

      <div className="flex-row">
        {editing ?
          <div className="flex-large">
            <EditUserForm
              submitUserEdit={submitUserEdit}
              handleInputChange={handleInputChange}
              currentUser={currentUser}
            />
          </div>
          :
          <div className="flex-large">
            <NewUserForm
              submitNewUser={submitNewUser}
              handleInputChange={handleInputChange}
              currentUser={currentUser}
            />
          </div>
        }

        <div className="flex-large">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(item =>
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>
                    <button onClick={() => editUser(item)} className="muted-button" >Edit</button>
                    <button onClick={() => deleteUser(item)} style={{ marginLeft: 5 }} className="muted-button" >Delete</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
