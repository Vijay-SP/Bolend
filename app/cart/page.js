"use client"

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { Toaster, toast } from 'react-hot-toast';
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
  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };
  const makePayment = async () => {
    const res = await initializeRazorpay();

    if (!res) {
      alert("Razorpay SDK Failed to load");
      return;
    }

    // Make API call to the serverless API
    const data = await fetch("/api/razorpay", { method: "POST", body: {totalAmount} }).then((t) =>
      t.json()
    );
    console.log(data);
    var options = {
      key: "rzp_test_XKZB77Xkb3P9gK", // Enter the Key ID generated from the Dashboard
      name: "Manu Arora Pvt Ltd",
      currency: "INR",
      amount: data.amount,
      order_id: data.order_id,
      description: "Thankyou for your test donation",
      image: "https://manuarora.in/logo.png",
      handler: function (response) {
        // Validate payment at server - using webhooks is a better idea.
        alert(response.razorpay_payment_id);
        alert(response.razorpay_order_id);
        alert(response.razorpay_signature);
      },
      prefill: {
        name: "Manu Arora",
        email: "manuarorawork@gmail.com",
        contact: "9999999999",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };
 
  return (
    <div className="flex flex-col min-h-screen">
        <Toaster />
      <Header />
      <main className="flex-grow container mx-auto p-4">
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
          <h3>Total Amount: Rs.{totalAmount}</h3>
          <button
            onClick={makePayment}
            className="px-4 py-2 bg-green-500 rounded text-white hover:bg-green-600"
          >
            Checkout
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;

