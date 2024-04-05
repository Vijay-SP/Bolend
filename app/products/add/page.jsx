"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { db, storage, auth } from "../../../firebase"; // Ensure 'auth' is exported from your firebase config
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Toaster, toast } from "react-hot-toast";
import Header from "../../../components/header";
import Footer from "../../../components/footer";

export default function AddProduct() {
  const { register, handleSubmit, reset } = useForm();
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const onSubmit = async (data) => {
    if (!image || !auth.currentUser) return;

    const imageRef = ref(storage, `images/${image.name}`);
    await uploadBytes(imageRef, image);
    const imageUrl = await getDownloadURL(imageRef);

    const productData = {
      ...data,
      imageUrl,
      status: "unavailable",
      userId: auth.currentUser.uid, // Using Firebase Auth to get the user ID
    };

    await addDoc(collection(db, "products"), productData);
    toast.success("Product added successfully");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster />
      <Header />
      <div className="container  p-4 justify-center w-1/4 items-center text-center mx-auto my-auto">
        <h1 className="text-2xl font-bold mb-4">Add a Product</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="productName" className="block mb-1">Product Name</label>
          <input {...register("name")} id="productName" placeholder="Product Name" className="block text-black w-full mb-2" />

          <label htmlFor="productDescription" className="block  mb-1">Product Description</label>
          <textarea {...register("description")} id="productDescription" placeholder="Product Description" className="block text-black w-full mb-2" />

          <label htmlFor="productImage" className="block mb-1">Product Image</label>
          <input type="file" id="productImage" onChange={handleImageChange} className="block w-full mb-2" />

          <label htmlFor="productPrice" className="block  mb-1">Price</label>
          <input {...register("price")} id="productPrice" type="number" placeholder="Price" className="block text-black w-full mb-2" />

          <label htmlFor="productCategory" className="block  mb-1">Category</label>
          <select {...register("category")} id="productCategory" className="block text-black w-full mb-2">
            <option value="">Select a Category</option>
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

          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            Add Product
          </button>
          <button type="button" onClick={() => reset()} className="ml-4 px-4 py-2 bg-gray-500 text-white rounded">
            Reset
          </button>
        </form>

      </div>
      <Footer />
    </div>
  );
}
