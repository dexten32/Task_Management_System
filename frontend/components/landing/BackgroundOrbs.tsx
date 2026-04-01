import React from "react";

const BackgroundOrbs = () => {
  return (
    <>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-400/10 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "3s" }}
      ></div>
    </>
  );
};

export default BackgroundOrbs;
