import { useState } from "react";
import { signupUser } from "../services/authService";
import { useNavigate,Link } from "react-router-dom";

function Signup(){

  const [username,setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {

    e.preventDefault();

    try{

      await signupUser({
        username,
        email,
        password
      });

      alert("Signup successful");

      navigate("/login");

    }catch(err){
      console.log(err.response?.data || err.message);
      alert("Signup failed");

    }

  };

  return(

    <div className="h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-lg shadow w-96"
      >

        <h2 className="text-2xl font-bold mb-6 text-center">
          Signup
        </h2>

        <input
          placeholder="Username"
          className="w-full border p-2 mb-4 rounded"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
        />

        <input
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
          Signup
        </button>

        <p className="text-sm mt-4 text-center">
          Already have an account?
          <Link to="/login" className="text-blue-600 ml-1">
            Login
          </Link>
        </p>

      </form>

    </div>

  );

}

export default Signup;