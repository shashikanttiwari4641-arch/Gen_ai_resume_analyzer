import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import { getMe, login, logout, register } from "./services/auth.api";

export const AuthProvider = ({children}) => {

    const [user , setUser] = useState(null)
    const [loading , setLoading] = useState(true)
    const [error , setError] = useState("")

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe();

                if (data) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.log(err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getAndSetUser();
    }, []);

    const handleLogin = async ({email , password}) => {
        setLoading(true)
        setError("")
        try{
             const data = await login({email , password})
             setUser(data.user)
             return true
        } catch(e){
            setUser(null)
            setError(e.message || "Login failed")
            return false
        } finally{
            setLoading(false)
        }
    }

    const handleRegister = async ({username , email , password}) => {
        setLoading(true)
        setError("")
        try{
            const data = await register({username , email , password})
            setUser(data.user)
            return true
       } catch(e){
            setUser(null)
            setError(e.message || "Registration failed")
            return false
        } finally{
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        setError("")
        try{
            await logout()
            setUser(null)
            return true
       } catch(e){
            setError(e.message || "Logout failed")
            return false
        } finally{
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{user , loading , error , handleRegister , handleLogin , handleLogout}}>
            {children}
        </AuthContext.Provider>
    )

}
