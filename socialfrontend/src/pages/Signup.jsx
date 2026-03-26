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

  return (

  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black p-6">

    <form
      onSubmit={handleSignup}
      className="w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl"
    >

      {/* TITLE */}
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Create Account 🚀
      </h2>

      {/* USERNAME */}
      <input
        placeholder="Username"
        className="w-full bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        value={username}
        onChange={(e)=>setUsername(e.target.value)}
      />

      {/* EMAIL */}
      <input
        placeholder="Email"
        className="w-full bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 p-3 mb-4 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      {/* PASSWORD */}
      <input
        type="password"
        placeholder="Password"
        className="w-full bg-zinc-800 text-white placeholder-gray-400 border border-zinc-700 p-3 mb-6 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      {/* BUTTON */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-xl font-semibold shadow-lg active:scale-95"
      >
        Signup
      </button>

      {/* LOGIN LINK */}
      <p className="text-sm mt-6 text-center text-gray-400">
        Already have an account?
        <Link
          to="/login"
          className="text-blue-400 ml-1 hover:text-blue-300 font-medium"
        >
          Login
        </Link>
      </p>

    </form>

  </div>

);

}

export default Signup;