import { useState } from "react";
import { Navigate, useNavigate , Link } from "react-router-dom";
import "../auth.form.scss";
import { useAuth } from '../hooks/useAuth'

const Login = () => {

  const navigate = useNavigate();

  const { user, loading , error , handleLogin} = useAuth()

  const [email , setEmail] = useState("")
  const [password , setPassword] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isLoggedIn = await handleLogin({email , password})

    if (isLoggedIn) {
      navigate('/', { replace: true })
    }
  }

  if(loading){
    return (<main><h1>Loading......</h1></main>)
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main>
      <div className="form-container">
        <div>Login</div>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
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
          <button className="button primary-button"> Login </button>
        </form>
        <p>Don't have an account ? <Link to="/register">Register</Link></p>
      </div>
    </main>
  );
};

export default Login;
