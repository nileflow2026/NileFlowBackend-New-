/* eslint-disable no-unused-vars */

import { useState, useCallback } from "react";

import { useDropzone } from "react-dropzone";
import { Storage, ID } from "appwrite";
import axiosClient from "../../api";
import { client, Config } from "../../appwrite";
import { useEffect } from "react";

const storage = new Storage(client);

export default function ProductForm({ onProductAdded }) {
  const [form, setForm] = useState({
    productName: "",
    type: "",
    description: "",
    price: "",
    brand: "",
    details: "",
    currency: "KES",
    category: "",
    subcategoryId: "", // 👈 Add this new state field
    image: "",
    images: [],
    specifications: [""],
    stock: "",
  });
  const [categories, setCategories] = useState([]); // State to hold categories
  const [subcategories, setSubcategories] = useState([]); // 👈 New state for subcategories
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosClient.get(
          "/api/customerprofile/categories"
        ); // Replace with your categories endpoint
        setCategories(response.data);
        console.log("Fetched categories:", response.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (form.category) {
      const fetchSubcategories = async () => {
        try {
          const response = await axiosClient.get(
            `/api/products/categories/${form.category}/subcategories` // Use your correct endpoint
          );
          // Assuming your backend returns an object like { subcategories: [...] }
          setSubcategories(response.data.subcategories);
        } catch (error) {
          console.error("Failed to fetch subcategories:", error);
          setSubcategories([]); // Clear subcategories on error or if none exist
        }
      };
      fetchSubcategories();
    } else {
      setSubcategories([]); // Clear subcategories if no category is selected
    }
  }, [form.category]); // 👈 This effect runs whenever the 'category' state changes

  const onDropPrimaryImage = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploading(true);
        const file = acceptedFiles[0];

        // Convert webp to png if needed
        let uploadFile = file;
        if (file.type === "image/webp") {
          try {
            uploadFile = await convertImageToJPGorPNG(file, "image/png");
          } catch (err) {
            console.error("Image conversion failed", err);
            alert("Failed to convert webp image.");
            setUploading(false);
            return;
          }
        }

        try {
          const uploadedFile = await storage.createFile(
            Config.StorageId,
            ID.unique(),
            uploadFile
          );
          const imageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${Config.StorageId}/files/${uploadedFile.$id}/view?project=${Config.projectId}`; // Update with your actual endpoint and project ID
          setForm({ ...form, image: imageUrl });
        } catch (err) {
          alert("Failed to upload primary image.");
          console.error(err);
        } finally {
          setUploading(false);
        }
      }
    },
    [form]
  );

  const onDropAdditionalImages = useCallback(
    async (acceptedFiles) => {
      setUploading(true);
      const uploadedUrls = [...form.images];

      for (const file of acceptedFiles) {
        let convertedFile = file;
        if (file.type === "image/webp") {
          try {
            convertedFile = await convertImageToJPGorPNG(file, "image/png");
          } catch (err) {
            console.error("Image conversion failed", err);
            alert(`Failed to convert file: ${file.name}`);
            continue; // skip this file
          }
        }
        try {
          const uploadedFile = await storage.createFile(
            Config.StorageId,
            ID.unique(),
            convertedFile
          );
          const imageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${Config.StorageId}/files/${uploadedFile.$id}/view?project=${Config.projectId}`; // Update with your actual endpoint and project ID
          uploadedUrls.push(imageUrl);
        } catch (err) {
          alert(`Failed to upload file: ${file.name}`);
          console.error(err);
        }
      }

      setForm({ ...form, images: uploadedUrls });
      setUploading(false);
    },
    [form]
  );

  const {
    getRootProps: getPrimaryRootProps,
    getInputProps: getPrimaryInputProps,
  } = useDropzone({
    onDrop: onDropPrimaryImage,
    multiple: false,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".gif"],
    },
  });

  const {
    getRootProps: getAdditionalRootProps,
    getInputProps: getAdditionalInputProps,
  } = useDropzone({
    onDrop: onDropAdditionalImages,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".gif"],
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    console.log(`Setting form.${name} to:`, value);
  };

  const handleArrayChange = (e, index, field) => {
    const newArray = [...form[field]];
    newArray[index] = e.target.value;
    setForm({ ...form, [field]: newArray });
  };

  const addField = (field) => {
    setForm({ ...form, [field]: [...form[field], ""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (uploading) {
        alert("Please wait for images to finish uploading.");
        return;
      }

      // ✅ Remove 'id' and '$id' from the form data before sending to the backend.
      const { id, $id, ...productData } = form;

      await axiosClient.post("api/admin/addproducts/addproducts", productData);
      alert("Product added!");
      if (onProductAdded) {
        onProductAdded();
      }
      setForm({
        productName: "",
        type: "",
        description: "",
        price: "",
        brand: "",
        details: "",
        currency: "KES",
        category: "",
        image: "",
        images: [],
        specifications: [""],
        stock: "",
      });
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  const convertImageToJPGorPNG = (file, format = "image/png") => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Conversion failed"));
              // Create a new File object with the same name but new extension
              const newFile = new File(
                [blob],
                file.name.replace(
                  /\.\w+$/,
                  format === "image/png" ? ".png" : ".jpg"
                ),
                { type: format }
              );
              resolve(newFile);
            },
            format,
            0.9 // quality (0-1) for JPEG
          );
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-4"
    >
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
        Add New Product
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="productName"
          value={form.productName}
          onChange={handleChange}
          placeholder="Product Name"
          className="input"
          required
        />
        <input
          type="text"
          name="type"
          value={form.type}
          onChange={handleChange}
          placeholder="Type"
          className="input"
          required
        />
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          className="input"
          required
        />
        <input
          type="text"
          name="currency"
          value={form.currency}
          onChange={handleChange}
          placeholder="Currency"
          className="input"
          required
        />
        {/*  <input type="text" name="category" value={form.category} onChange={handleChange} placeholder="Category" className="input" required /> */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          {/* 👇 Add this new Subcategory Select field */}
          {subcategories.length > 0 && (
            <div>
              <label
                htmlFor="subcategoryId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Subcategory
              </label>
              <select
                id="subcategoryId"
                name="subcategoryId"
                value={form.subcategoryId}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>
                  Select a subcategory
                </option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.$id} value={subcategory.$id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <input
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          placeholder="Stock Quantity"
          className="input"
        />
        <input
          type="text"
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Brand"
          className="input"
        />
      </div>

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        className="input w-full"
      />
      <textarea
        name="details"
        value={form.details}
        onChange={handleChange}
        placeholder="Details"
        className="input w-full"
      />

      {/* Primary Image Dropzone */}
      <div>
        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
          Primary Product Image
        </label>
        <div {...getPrimaryRootProps()} className="dropzone-container">
          <input {...getPrimaryInputProps()} />
          <p className="text-gray-500">
            Drag 'n' drop a primary image here, or click to select one
          </p>
        </div>
        {uploading && (
          <p className="text-blue-500">Uploading primary image...</p>
        )}
        {form.image && (
          <div className="mt-2">
            <p className="text-gray-500">Primary Image Preview:</p>
            <img
              src={form.image}
              alt="Primary"
              className="w-32 h-32 object-cover rounded"
            />
          </div>
        )}
      </div>

      {/* Additional Images Dropzone */}
      <div>
        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
          Additional Product Images
        </label>
        <div {...getAdditionalRootProps()} className="dropzone-container">
          <input {...getAdditionalInputProps()} />
          <p className="text-gray-500">
            Drag 'n' drop more images here, or click to select files
          </p>
        </div>
        {uploading && (
          <p className="text-blue-500">Uploading additional images...</p>
        )}
        {form.images.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {form.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Additional ${index}`}
                className="w-24 h-24 object-cover rounded"
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
          Specifications
        </label>
        {form.specifications.map((spec, idx) => (
          <input
            key={idx}
            type="text"
            value={spec}
            onChange={(e) => handleArrayChange(e, idx, "specifications")}
            placeholder={`Specification ${idx + 1}`}
            className="input mb-2 w-full"
          />
        ))}
        <button
          type="button"
          onClick={() => addField("specifications")}
          className="btn-secondary"
        >
          + Add Specification
        </button>
      </div>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow-md"
      >
        Add Product
      </button>
    </form>
  );
}
