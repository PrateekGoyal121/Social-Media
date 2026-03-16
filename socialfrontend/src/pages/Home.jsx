import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllPosts } from "../services/postService";
import PostCard from "../components/PostCard";

function Home() {

  const [posts,setPosts] = useState([]);
  const [search,setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(()=>{
    loadFeed();
  },[]);

  const loadFeed = async () => {

    try{
      const data = await getAllPosts();
      setPosts(data.posts);
    }catch(err){
      console.log(err);
    }

  };

  const handleSearch = async (e) => {

    if(e.key === "Enter"){

      if(!search.trim()) return;

      // redirect to profile page
      navigate(`/profile/${search}`);

    }

  };

  return(

    <div className="max-w-xl mx-auto space-y-6">

      {/* SEARCH BAR */}

      <div className="sticky top-0 bg-gray-100 pt-4 pb-2 z-20">

        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full bg-white border rounded-lg px-4 py-2 outline-none"
        />

      </div>


      {/* POSTS */}

      {posts.map((post)=>(
        <PostCard key={post._id} post={post}/>
      ))}

    </div>

  );

}

export default Home;