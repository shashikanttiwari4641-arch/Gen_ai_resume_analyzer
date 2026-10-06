import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Protected = ({ children }) => {
  const { user, loading, handleLogout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    const didLogout = await handleLogout();

    if (didLogout) {
      navigate("/login", { replace: true });
    }
  }

  // Show loading while checking authentication
  if (loading) {
    return <h2>Loading...</h2>;
  }

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  //user is authenticated
  return (
    <>
      <button className="app-logout-button" type="button" onClick={onLogout}>
        Logout
      </button>
      {children}
    </>
  );
};

export default Protected;
