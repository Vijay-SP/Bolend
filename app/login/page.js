"use client"

import { useState } from 'react';
import { auth, googleProvider, db } from "../../firebase";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
  } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation"
import Header from '@/components/header';
import Footer from '@/components/footer';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Add a state for name
  const [error, setError] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create a user document when signing up with email and password
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: name,
          email: email,
          cart: []
        });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace("/").catch(console.error);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Create a user document when signing up with Google
      await setDoc(doc(db, "users", user.uid), {
        displayName: user.displayName,
        email: user.email,
        profilePicUrl: user.photoURL,
        cart: []
      }, { merge: true }); // Use merge to avoid overwriting existing user data
      router.replace("/").catch(console.error);
    } catch (error) {
      console.error("Error signing in with Google: ", error.message);
    }
  };

  return (
    <>
      <Header />
    <div className="min-h-screen flex items-center justify-center  py-auto px-4 sm:px-6 lg:px-8">
    
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-200">{isSignup ? 'Sign up for an account' : 'Sign in to your account'}</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            {isSignup && (
              <div>
                <label htmlFor="name" className="sr-only">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`${isSignup ? 'rounded-b-none' : 'rounded-none'} appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="text-red-600">{error}</p>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSignup ? 'Sign up' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={handleSignInWithGoogle}
              className="group relative w-full flex justify-center py-2 px-4 mt-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                
              </span>
              Sign in with Google
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-400">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? 'Sign in' : 'Sign up'}
          </a>
        </p>
      </div>
      
    </div>
    <Footer />
    </>
  );
};

export default LoginPage;
