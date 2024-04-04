"use client"
import { useState } from "react";
import { useForm } from "react-hook-form";
import { db, storage } from "../../../firebase";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {Toaster, toast} from "react-hot-toast";
import Header from "../../../components/header";
import Footer from "../../../components/footer";

export default function AddProduct() {
  const { register, handleSubmit, watch } = useForm();
  const [image, setImage] = useState(null);
  const listingType = watch("listingType");

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const onSubmit = async (data) => {
    if (!image) return;

    const imageRef = ref(storage, `images/${image.name}`);
    await uploadBytes(imageRef, image);
    const imageUrl = await getDownloadURL(imageRef);

    const productData = {
      ...data,
      imageUrl,
      status: "available",
    };

    await addDoc(collection(db, "products"), productData);
    toast.success("product added succesfully")
  };

  return (
    <>
    <Toaster />
    <Header />
    <div className="container mx-auto p-4">
      
      <h1 className="text-2xl font-bold mb-4">Add a Product</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register("name")} placeholder="Product Name" className="block text-black w-full mb-2" />
        <textarea {...register("description")} placeholder="Product Description" className="block text-black w-full mb-2" />
        <input type="file" onChange={handleImageChange} className="block w-full mb-2" />
        <select {...register("listingType")} className="block w-full text-black mb-2">
          <option value="sell">Sell</option>
          <option value="rent">Rent</option>
          <option value="both">Both</option>
        </select>
        {listingType === "sell" || listingType === "both" ? (
          <input {...register("sellPrice")} placeholder="Selling Price" className="block text-black w-full mb-2" />
        ) : null}
        {listingType === "rent" || listingType === "both" ? (
          <input {...register("rentPrice")} placeholder="Rent Price per Month" className="block text-black w-full mb-2" />
        ) : null}
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Add Product
        </button>
      </form>
    </div>
    <Footer />
    </>
  );
}
