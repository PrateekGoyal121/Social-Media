import React from "react";

const Loader = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="w-9 h-9 border-2 border-[#262626] border-t-white rounded-full animate-spin" />
    </div>
  );
};

export default Loader;