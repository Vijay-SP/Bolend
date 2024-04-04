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
  const { register, handleSubmit } = useForm();
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
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Add a Product</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input {...register("name")} placeholder="Product Name" className="block text-black w-full mb-2" />
          <textarea {...register("description")} placeholder="Product Description" className="block text-black w-full mb-2" />
          <input type="file" onChange={handleImageChange} className="block w-full mb-2" />
          <input {...register("price")} type="number" placeholder="Price" className="block text-black w-full mb-2" />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            Add Product
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
