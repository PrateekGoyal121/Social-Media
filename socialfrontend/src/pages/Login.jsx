import { useState,useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import { useNavigate,Link } from "react-router-dom";

function Login(){

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const {login} = useContext(AuthContext);

  const navigate = useNavigate();

  const handleLogin = async (e) => {

    e.preventDefault();

    try{

      const data = await loginUser({
        email,
        password
      });

      // save using context
      login(data.user, data.token);

      navigate("/");

    }catch(err){

      alert("Invalid credentials");

    }

  };

  return(

    <div className="h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow w-96"
      >

        <h2 className="text-2xl font-bold mb-6 text-center">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mb-4 rounded"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-4 rounded"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Login
        </button>

        <p className="text-sm mt-4 text-center">
          Don't have an account?
          <Link to="/signup" className="text-blue-600 ml-1">
            Signup
          </Link>
        </p>

      </form>

    </div>

  );

}

export default Login;