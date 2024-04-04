"use client"

import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where, arrayUnion, doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { auth } from "../firebase";

import Header from "../components/header";
import Footer from "../components/footer";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  const addToCart = async (userId, productId) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      cart: arrayUnion(productId),
    });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollection = collection(db, "products");
      const q = query(productsCollection, where("status", "==", "available"));
      const productsSnapshot = await getDocs(q);
      const productsList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsList);
    };

    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white shadow rounded p-4">
              <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded" />
              <h3 className="text-lg text-purple-400 font-bold mt-2">{product.name}</h3>
              <p className="text-gray-600">{product.description}</p>
              {product.listingType === 'rent' && (
                <button className="mt-2 px-4 py-2 bg-green-500 rounded text-white hover:bg-green-600">
                  Rent for ${product.rentPrice} per month
                </button>
              )}
              {product.listingType === 'sell' && (
                <button className="mt-2 px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600">
                  Purchase for ${product.sellPrice}
                </button>
              )}
              {product.listingType === 'both' && (
                <>
                  <button className="mt-2 px-4 py-2 bg-green-500 rounded text-white hover:bg-green-600">
                    Rent for ${product.rentPrice} per month
                  </button>
                  <button className="mt-2 px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600">
                    Purchase for ${product.sellPrice}
                  </button>
                </>
              )}
              <button
                onClick={() => addToCart(userId, product.id)}
                className="mt-2 px-4 py-2 bg-yellow-500 rounded text-white hover:bg-yellow-600"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
