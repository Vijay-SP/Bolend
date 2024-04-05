"use client"

import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase'; // Ensure you're importing your initialized firebase db instance
import Header from '../../components/header';
import Footer from '../../components/footer';
import { Toaster, toast } from 'react-hot-toast';
import Script from 'next/script';

export default function MyProducts() {
    const [products, setProducts] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [barterRequests, setBarterRequests] = useState([]);
    const [myBarterRequests, setMyBarterRequests] = useState([]);
    const [currency, setCurrency] = useState('INR');
    const auth = getAuth();
    const user = auth.currentUser;
    const [currentBarterRequest, setCurrentBarterRequest] = useState(null);


    useEffect(() => {
        if (user) {
            const productsRef = collection(db, "products");
            getDocs(productsRef).then(querySnapshot => {
                let userProducts = []; // Use a local variable to store user's products
                let allBarterRequests = []; // Use a local variable to store barter requests related to user's products
                let myRequests = []; // Use a local variable to store the user's barter requests on other people's products

                querySnapshot.forEach((doc) => {
                    const productData = { id: doc.id, ...doc.data() };
                    if (productData.userId === user.uid) {
                        userProducts.push(productData); // Add to the local variable
                        if (productData.barterRequests) {
                            const requests = productData.barterRequests.map(request => ({
                                ...request,
                                productId: productData.id
                            }));
                            allBarterRequests.push(...requests); // Add requests related to this user's product
                        }
                    } else if (productData.barterRequests) {
                        const myRequestsForThisProduct = productData.barterRequests
                            .filter(request => request.requestingUserId === user.uid)
                            .map(request => ({
                                ...request,
                                productId: productData.id
                            }));
                        myRequests.push(...myRequestsForThisProduct);
                    }
                });

                setProducts(userProducts); // Update the state once with all user's products
                setBarterRequests(allBarterRequests); // Set barterRequests with requests related to user's products
                setMyBarterRequests(myRequests); // Set myBarterRequests with the user's requests on other people's products
            }).catch(error => {
                console.error("Error fetching products: ", error);
            });
        }
    }, [user]);



    const toggleProductStatus = async (productId, currentStatus) => {
        const newStatus = currentStatus === "available" ? "unavailable" : "available";
        const productRef = doc(db, "products", productId);

        await updateDoc(productRef, {
            status: newStatus,
        }).then(() => {
            setProducts(products.map(product =>
                product.id === productId ? { ...product, status: newStatus } : product
            ));
        }).catch(error => {
            console.error("Error updating product status: ", error);
        });
    };

    const acceptBarterRequest = async (productId, requestId) => {
        const productRef = doc(db, "products", productId);
        try {
            // Fetch the current product
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                // Get the current barter requests and update the status of the matched one
                const updatedRequests = productSnap.data().barterRequests.map((request) => {
                    if (request.id === requestId) {
                        return { ...request, barterStatus: true };
                    }
                    return request;
                });

                // Update the document with the new barter requests
                await updateDoc(productRef, {
                    barterRequests: updatedRequests,
                });
                toast.success("Barter request accepted.");
            }
        } catch (error) {
            console.error("Error accepting barter request: ", error);
            toast.error("Error accepting barter request. Please try again.");
        }
    };

    const rejectBarterRequest = async (productId, requestId) => {
        const productRef = doc(db, "products", productId);
        try {
            // Fetch the current product
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                // Get the request to be removed
                const requestToRemove = productSnap.data().barterRequests.find(request => request.id === requestId);

                // Update the document to remove the specific barter request and set the status to available
                await updateDoc(productRef, {
                    status: 'available',
                    barterRequests: arrayRemove(requestToRemove),
                });
                toast.success("Barter request rejected.");
            }
        } catch (error) {
            console.error("Error rejecting barter request: ", error);
            toast.error("Error rejecting barter request. Please try again.");
        }
    };
    const withdrawBarterRequest = async (productId, requestId) => {
        const productRef = doc(db, "products", productId);
        try {
            const productSnap = await getDocs(productRef);
            if (productSnap.exists()) {
                const productData = productSnap.data();
                const updatedRequests = productData.barterRequests.filter(request => request.id !== requestId);

                await updateDoc(productRef, {
                    barterRequests: updatedRequests,
                });
                toast.success("Barter request withdrawn");
            }
        } catch (error) {
            console.error("Error withdrawing barter request: ", error);
            toast.error("Error withdrawing barter request. Please try again.");
        }
    };

    const continueToExchange = async (barterRequest) => {
        if (barterRequest.barterStatus) {
            const priceDifference = parseInt(barterRequest.barterExchangeProductPrice) - parseInt(barterRequest.selectedProductPrice);
            if (priceDifference > 0) {
                setCurrentBarterRequest(barterRequest); // Store the current barterRequest in state
                setTotalAmount(priceDifference); // Set the total amount to the price difference
                
                    

                
            } else {
                const batch = writeBatch(db);
                const productRef = doc(db, "products", barterRequest.barterExchangeProductId);
                const selectedProductRef = doc(db, "products", barterRequest.productId);

                // Mark the barter as complete and update the user ID to the requester's
                batch.update(productRef, {
                    status: 'unavailable',
                    userId: barterRequest.barterOwnerId, // Assuming the user id is the barter requester's id
                });

                batch.update(selectedProductRef, {
                    status: 'unavailable',
                    userId: user.uid,
                    barterRequests: [], // Clearing out all barter requests for this product
                });

                try {
                    await batch.commit();
                    toast.success("Exchange successful. ");
                } catch (error) {
                    console.error("Error during exchange: ", error);
                    toast.error("Error during exchange. Please try again.");
                }
            }
        }
    };
    
    useEffect(() => {
        if (totalAmount > 0 && currentBarterRequest) {
            processPayment(currentBarterRequest);
        }
    }, [totalAmount, currentBarterRequest]);

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

    const verifyPayment = async (data, barterRequest) => {
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
                    const batch = writeBatch(db);
                    const productRef = doc(db, "products", barterRequest.barterExchangeProductId);
                    const selectedProductRef = doc(db, "products", barterRequest.productId);

                    // Mark the barter as complete and update the user ID to the requester's
                    batch.update(productRef, {
                        status: 'unavailable',
                        userId: barterRequest.barterOwnerId, // Assuming the user id is the barter requester's id
                    });

                    batch.update(selectedProductRef, {
                        status: 'unavailable',
                        userId: user.uid,
                        barterRequests: [], // Clearing out all barter requests for this product
                    });

                    try {
                        await batch.commit();
                        toast.success("Exchange successful. ");
                    } catch (error) {
                        console.error("Error during exchange: ", error);
                        toast.error("Error during exchange. Please try again.");
                    }

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
        finally {
            setCurrentBarterRequest(null); // Reset the currentBarterRequest state
        }
    };


    const processPayment = async (barterRequest) => { // Accept barterRequest as a parameter
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
    
                    await verifyPayment(data, barterRequest); // Pass barterRequest to verifyPayment
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
            <Header />
            <Toaster />
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">My Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(product => (
                        <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
                            <div className="p-4">
                                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                                <p className="text-gray-700 text-base mb-4">{product.description}</p>
                                <button onClick={() => toggleProductStatus(product.id, product.status)}
                                    className={`w-full text-white font-bold py-2 px-4 rounded ${product.status === "available" ? "bg-red-500 hover:bg-red-700" : "bg-green-500 hover:bg-green-700"}`}>
                                    {product.status === "available" ? "Close for Selling" : "Open for Selling"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold mt-8 mb-4">Incoming Barter Requests</h2>
                <div>
                    {barterRequests.map((request, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                            <p><strong>Requested Product:</strong> {request.barterExchangeProductName}</p>
                            <p><strong>Requested By:</strong> {request.requestingUserEmail}</p>
                            <p><strong>Product Offered for Barter:</strong> {request.selectedProductName}</p>
                            <p><strong>Product Offered price:</strong> {request.selectedProductPrice}</p>
                            <p><strong>Product Offered image:</strong> <img src={request.selectedProductImage} alt={request.selectedProductName} className="w-50 h-48 object-cover" /></p>
                            <div className="flex justify-end space-x-2">
                                <button onClick={() => acceptBarterRequest(request.productId, request.id)}
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                    Accept
                                </button>
                                <button onClick={() => rejectBarterRequest(request.productId, request.id)}
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                    Reject
                                </button>






                            </div>
                        </div>

                    ))}
                </div>

                <h2 className="text-2xl font-bold mt-8 mb-4">My Barter Requests</h2>
                <div>
                    {myBarterRequests.length === 0 ? (
                        <p>No barter requests created by you.</p>
                    ) : (
                        myBarterRequests.map((request, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">

                                <p><strong>Product Offered for Barter:</strong> {request.selectedProductName}</p>
                                <p><strong>Offered to:</strong> {request.barterExchangeProductName}</p>
                                <p><strong>Offered Product Price:</strong> {request.barterExchangeProductPrice}</p>
                                <p><strong>My Product Price:</strong> {request.selectedProductPrice}</p>
                                <p><strong>Offered Product Image:</strong> <img src={request.barterExchangeProductImage} alt={request.selectedProductName} className="w-50 h-48 object-cover" /></p>


                                <div className="flex justify-end space-x-2 items-center mt-4">
                                    <button onClick={() => withdrawBarterRequest(request.productId, request.id)}
                                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
                                        Withdraw
                                    </button>
                                    {request.barterStatus && (
                                        <button onClick={() => continueToExchange(request)}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                            Continue to Exchange
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
