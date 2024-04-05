"use client"

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, arrayUnion, doc, updateDoc, getDoc } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import Header from "../components/header";
import Footer from "../components/footer";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  const [userProducts, setUserProducts] = useState([]);
  const [selectedProductsForBarter, setSelectedProductsForBarter] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchUserProducts = async () => {
    if (!userId) {
      console.log("User not logged in");
      return;
    }

    const q = query(collection(db, "products"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUserProducts(items);
  };

  useEffect(() => {
    fetchUserProducts();
  }, [userId]);

  const addToCart = async (productId) => {
    if (!userId) return toast.error("You must be logged in to add products to cart");

    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      cart: arrayUnion(productId),
    });
    toast.success("Product added to cart");
  };

  const confirmBarterRequest = async (productId) => {
    const selectedProductId = selectedProductsForBarter[productId];
    if (!selectedProductId) return;
  
    const selectedProduct = userProducts.find(product => product.id === selectedProductId);
    if (!selectedProduct) return;
  
    const confirmationMessage = `Are you sure you want to create a request to barter with "${selectedProduct.name}"?`;
  
    if (window.confirm(confirmationMessage)) {
      try {
        const productDocRef = doc(db, 'products', productId);
        const productDocSnapshot = await getDoc(productDocRef);
  
        if (productDocSnapshot.exists()) {
          const productData = productDocSnapshot.data();
  
          const updatedRequests = [
            ...(productData.barterRequests || []),
            {
              requestingUserId: userId,
              requestingUserEmail: auth.currentUser.email,
              selectedProductName: selectedProduct.name,
              selectedProductPrice: selectedProduct.price,
              selectedProductImage: selectedProduct.imageUrl,
              barterExchangeProductId: selectedProductId,
              barterExchangeProductName: productData.name,
              barterExchangeProductPrice: productData.price,
              barterExchangeProductImage: productData.imageUrl,
              barterStatus: false,
              barterOwnerId: productData.userId,
            }
          ];
  
          await updateDoc(productDocRef, {
            status: 'unavailable',
            barterRequests: updatedRequests,
          });
  
          toast.success("Barter request created successfully");
        } else {
          toast.error("Product not found");
        }
      } catch (error) {
        console.error("Error confirming barter request: ", error);
        toast.error("Error confirming barter request. Please try again.");
      }
    }
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

  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) && (selectedCategory === '' || product.category === selectedCategory);
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster />
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <div className="mb-4 flex flex-row justify-center ">
          <input
            type="text"
            placeholder="Search by name, description, or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-80 px-8 mx-4 py-2 text-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className=" block w-50 px-8 py-2 text-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Categories</option>
            <option value="ACs">ACs</option>
            <option value="Beds & Wardrobes">Beds & Wardrobes</option>
            <option value="Cameras & Lenses">Cameras & Lenses</option>
            <option value="Computer Accessories">Computer Accessories</option>
            <option value="Computers & Laptops">Computers & Laptops</option>
            <option value="Fridges">Fridges</option>
            <option value="Games & Entertainment">Games & Entertainment</option>
            <option value="Hard Disks, Printers & Monitors">Hard Disks, Printers & Monitors</option>
            <option value="Home Decor & Garden">Home Decor & Garden</option>
            <option value="Kids Furniture">Kids Furniture</option>
            <option value="Kitchen & Other Appliances">Kitchen & Other Appliances</option>
            <option value="Laptop & Computer">Laptop & Computer</option>
            <option value="Mobile Accessories">Mobile Accessories</option>
            <option value="Mobile Phone">Mobile Phone</option>
            <option value="Other Household Items">Other Household Items</option>
            <option value="Sofa & Dining">Sofa & Dining</option>
            <option value="Tablets">Tablets</option>
            <option value="TVs, Video - Audio">TVs, Video - Audio</option>
            <option value="Washing Machines">Washing Machines</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white shadow rounded-lg overflow-hidden">
              <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-lg text-purple-500 font-bold">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg text-green-600 font-semibold">₹ {product.price}</span>
                  <button onClick={() => addToCart(product.id)}
                    className="px-4 py-2 bg-yellow-500 rounded text-white hover:bg-yellow-600 transition-colors">
                    Add to Cart
                  </button>
                </div>
                <div className="mt-2">
                  <label htmlFor={`barterProduct-${product.id}`} className="block text-sm font-medium text-gray-700">Choose a product for barter:</label>
                  <select
                    id={`barterProduct-${product.id}`}
                    value={selectedProductsForBarter[product.id] || ''}
                    onChange={e => setSelectedProductsForBarter({
                      ...selectedProductsForBarter,
                      [product.id]: e.target.value,
                    })}
                    className="mt-1 block w-full text-black pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select your product</option>
                    {userProducts.map((userProduct) => (
                      <option key={userProduct.id} value={userProduct.id}>{userProduct.name}</option>
                    ))}
                  </select>
                  <button onClick={() => confirmBarterRequest(product.id)} className="mt-2 px-4 py-2 bg-green-500 rounded text-white hover:bg-green-600 transition-colors">
                    Make Barter Request
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
