import Link from "next/link";
import React from "react";

export default function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-white dark:bg-gray-900">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="text-9xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
        
        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
          Page Not Found
        </h1>

        <p className="mb-8 text-gray-600 dark:text-gray-400">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="space-x-4">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
      
      <p className="absolute text-sm text-center text-gray-500 bottom-6 dark:text-gray-400">
        &copy; {new Date().getFullYear()} - EAT-N-GO Restaurant
      </p>
    </div>
  );
}