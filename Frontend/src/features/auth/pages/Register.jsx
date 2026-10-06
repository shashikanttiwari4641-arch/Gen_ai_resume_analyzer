import { useState } from "react";
import { Navigate, useNavigate , Link } from "react-router-dom";
import { useAuth } from '../hooks/useAuth'
import "../auth.form.scss";


const Register = () => {

  
  const navigate = useNavigate();
  
    const [username , setUsername] = useState("")
    const [email , setEmail] = useState("")
    const [password , setPassword] = useState("")

     const { user, loading , error , handleRegister} = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isRegistered = await handleRegister({username,email,password})

    if (isRegistered) {
      navigate('/', { replace: true })
    }
  }

  if(loading) {
    return( <main><h1>Loading........</h1></main>)
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (

    <main>
      <div className="form-container">
        <div>Register</div>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
            onChange={(e) => { setUsername (e.target.value) }}
            type="text" id="username" name="username" placeholder="Enter username" />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
            onChange={(e) => { setEmail(e.target.value) }}
            type="email" id="email" name="email" placeholder="Enter your email" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
            onChange={(e) => { setPassword(e.target.value) }}
            type="password" id="password" name="password" placeholder="Enter your password" />
          </div>
          <button className="button primary-button"> Register </button>
        </form>
        <p>Already have an account ? <Link to="/login">Login</Link></p>
      </div>
    </main>

  );
};

export default Register;
