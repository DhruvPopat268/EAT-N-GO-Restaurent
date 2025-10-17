// pages/pending.js
import React from "react";
import Link from "next/link";

const PendingPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-indigo-200">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Application Pending</h1>
        <p className="text-gray-600 mb-6">
          Your application is currently under review. Please wait for admin approval.
        </p>
        <p className="text-gray-500 mb-8">
          Once approved, you will gain access to the admin panel.
        </p>
        <Link href="/">
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-full shadow hover:bg-indigo-700 transition">
            Go to Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default PendingPage;
