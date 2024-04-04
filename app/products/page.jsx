"use client"

import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, arrayRemove, writeBatch} from 'firebase/firestore';
import { db } from '../../firebase'; // Ensure you're importing your initialized firebase db instance
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Toaster, toast } from 'react-hot-toast';

export default function MyProducts() {
    const [products, setProducts] = useState([]);
    const [barterRequests, setBarterRequests] = useState([]);
    const [myBarterRequests, setMyBarterRequests] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        if (user) {
            const productsRef = collection(db, "products");
            const q = query(productsRef, where("userId", "==", user.uid));

            getDocs(q).then(querySnapshot => {
                const items = [];
                let allBarterRequests = [];
                querySnapshot.forEach((doc) => {
                    const productData = { id: doc.id, ...doc.data() };
                    items.push(productData);
                    if (productData.barterRequests) {
                        allBarterRequests = allBarterRequests.concat(productData.barterRequests.map(request => {
                            return { ...request, productId: productData.id };
                        }));
                    }
                });
                setProducts(items);
                setBarterRequests(allBarterRequests);
                // Filter out requests created by the current user
                setMyBarterRequests(allBarterRequests.filter(request => request.requestingUserId === user.uid));
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
        if (parseInt(barterRequest.selectedProductPrice) <= parseInt(barterRequest.barterExchangeProductPrice)) {
            const batch = writeBatch(db);
            const productRef = doc(db, "products", barterRequest.barterExchangeProductId);
            const selectedProductRef = doc(db, "products", barterRequest.productId);
            
            // Mark the barter as complete and update the user ID to the requester's
            batch.update(productRef, {
                status: 'unavailable',
                userId: user.uid, // Assuming the user id is the barter requester's id
            });

            batch.update(selectedProductRef, {
                status: 'unavailable',
                userId: barterRequest.requestingUserId,
                barterRequests: [], // Clearing out all barter requests for this product
            });

            try {
                await batch.commit();
                toast.success("Exchange successful");
            } catch (error) {
                console.error("Error during exchange: ", error);
                toast.error("Error during exchange. Please try again.");
            }
        } else {
            console.log()
            toast.error("The offered amount is lower than the requested product's price.",error);
        }}
    };


    return (
        <>
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
