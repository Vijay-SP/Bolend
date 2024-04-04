"use client"

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import Header from '@/components/header';
import Footer from '@/components/footer';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchCartItems = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const cartProductIds = userDoc.data().cart || [];

        // Fetch product details for each product ID in the cart
        const cartProducts = [];
        for (const productId of cartProductIds) {
          const productDocRef = doc(db, 'products', productId);
          const productDoc = await getDoc(productDocRef);
          if (productDoc.exists()) {
            const productData = { id: productDoc.id, ...productDoc.data() };
            cartProducts.push(productData);
          }
        }

        setCartItems(cartProducts);
        calculateTotal(cartProducts);
      }
    };

    fetchCartItems();
  }, []);

  const calculateTotal = (cartProducts) => {
    let total = 0;
    for (const product of cartProducts) {
      // Convert price to a number before adding to total
      const price = parseFloat(product.price);
      total += price;
    }
    setTotalAmount(total);
  };
  

  const removeFromCart = async (productId) => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        cart: arrayRemove(productId)
      });
      setCartItems(cartItems.filter(item => item.id !== productId));
      calculateTotal(cartItems.filter(item => item.id !== productId));
    }
  };

  const handleCheckout = () => {
    // Implement checkout logic here
    alert('Checkout functionality not implemented');
  };

  return (
    <div className="flex flex-col min-h-screen">
        <Header />
      <h1>Your Cart</h1>
      {cartItems.map((item) => (
        <div key={item.id} className="bg-white shadow rounded p-4 mb-4">
          <h2 className="text-lg font-bold text-black">{item.name}</h2>
          <p className='text-black'>{item.description}</p>
          <p className='text-green-600'>Price: ${item.price}</p>
          <button
            onClick={() => removeFromCart(item.id)}
            className="px-4 py-2 bg-red-500 rounded text-white hover:bg-red-600"
          >
            Remove from Cart
          </button>
        </div>
      ))}
      <div className="mt-4">
        <h3>Total Amount: ${totalAmount}</h3>
        <button
          onClick={handleCheckout}
          className="px-4 py-2 bg-green-500 rounded text-white hover:bg-green-600"
        >
          Checkout
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
