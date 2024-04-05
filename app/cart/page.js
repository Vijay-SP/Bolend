"use client"

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import Script from 'next/script';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { Toaster, toast } from 'react-hot-toast';
import Header from '../../components/header';
import Footer from '../../components/footer';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);

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

  const createOrderId = async () => {
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(totalAmount) * 100,
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data.orderId;
    } catch (error) {
      console.error('There was a problem with your fetch operation:', error);
    }
  };

  const verifyPayment = async (data) => {
    try {
      const result = await fetch('/api/verify', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (result.ok) {
        const res = await result.json();
        if (res.isOk) {
          // Update the userId in each product document
          for (const item of cartItems) {
            const productDocRef = doc(db, 'products', item.id);
            await updateDoc(productDocRef, {
              userId: auth.currentUser.uid,
              status: "unavailable"
            });
          }
  
          // Clear the cart after successful payment
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userDocRef, {
            cart: [],
          });
          setCartItems([]);
  
          toast.success("Payment successful!");
        } else {
          toast.error(res.message);
        }
      } else {
        console.error('Network response was not ok');
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('There was a problem with your fetch operation:', error);
      toast.error('Error verifying payment');
    }
  };
  

  const processPayment = async (e) => {
    e.preventDefault();
    try {
      const orderId = await createOrderId();
      const options = {
        key: 'rzp_test_XKZB77Xkb3P9gK',
        amount: parseFloat(totalAmount) * 100,
        currency: currency,
        name: 'Borrow & lend',
        description: 'Website for barter system',
        order_id: orderId,
        handler: async function (response) {
          const data = {
            orderCreationId: orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          };

          await verifyPayment(data);
        },
        prefill: {
          name: auth.currentUser.displayName,
          email: auth.currentUser.email,
        },
        theme: {
          color: '#3399cc',
        },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        alert(response.error.description);
      });
      paymentObject.open();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="flex flex-col min-h-screen">
        <Toaster />
        <Header />
        <main className="flex-grow container mx-auto p-4">
          <h1>Your Cart</h1>
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white shadow rounded p-4 mb-4">
              <h2 className="text-lg font-bold text-black">{item.name}</h2>
              <p className='text-black'>{item.description}</p>
              <p className='text-green-600'>Price: ₹{item.price}</p>
              <button
                onClick={() => removeFromCart(item.id)}
                className="px-4 py-2 bg-red-500 rounded text-white hover:bg-red-600"
              >
                Remove from Cart
              </button>
            </div>
          ))}
          <div className="mt-4">
            <h3>Total Amount: ₹{totalAmount}</h3>
            <button
              onClick={processPayment}
              className="px-4 py-2 bg-green-500 rounded text-white hover:bg-green-600"
            >
              Checkout
            </button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CartPage;
