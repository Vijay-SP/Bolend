"use client";
// components/Header.js
import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Header() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false); // Close the dropdown on logout
    } catch (error) {
      console.error("Error signing out: ", error.message);
    }
  };

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <p className="text-lg font-bold">Lend & Borrow</p>
        </Link>
        <nav className="flex items-center">
          {user ? (
            <>
              <Link href="/products/add">
                <p className="ml-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600">Add Products</p>
              </Link>
              <Link href="/cart">
                <p className="ml-4 mr-6 px-4 py-2 bg-green-500 rounded hover:bg-green-600">My Cart</p>
              </Link>
              <Link href="/products">
                <p className="ml-4 mr-6 px-4 py-2 bg-green-500 rounded hover:bg-green-600">My Products</p>
              </Link>
              <Link href="/my-purchases">
                <p className="ml-4 mr-6 px-4 py-2 bg-green-500 rounded hover:bg-green-600">My Purchases</p>
              </Link>
              <div className="flex items-center relative">
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full mr-2" />
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="focus:outline-none"
                >
                  {user.displayName}
                </button>
                {showDropdown && (
                  <div className="flex flex-col relative right-0 mt-6 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                    <Link href="/profile">
                      <p className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</p>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            
            </>
          ) : (
            <Link href="/login">
              <p className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600">Login</p>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
