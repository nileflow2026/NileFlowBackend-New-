// src/components/AddCareerForm.jsx
import React, { useState } from "react";
import axiosClient from "../../api";
import { Config, ID, storage } from "../../appwrite";

const AddCareerForm = ({ onCareerAdded }) => {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    growthPath: "",
    description: "",
    location: "",
    department: "",
  });
  const [responsibilities, setResponsibilities] = useState([""]); // New state for responsibilities array
  const [requirements, setRequirements] = useState([""]); // New state for responsibilities array
  const [imageFile, setImageFile] = useState(null); // State to hold the selected file
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResponsibilityChange = (index, e) => {
    const newResponsibilities = [...responsibilities];
    newResponsibilities[index] = e.target.value;
    setResponsibilities(newResponsibilities);
  };

  const handleAddResponsibility = () => {
    setResponsibilities([...responsibilities, ""]); // Add a new empty input field
  };

  const handleRemoveResponsibility = (index) => {
    const newResponsibilities = responsibilities.filter((_, i) => i !== index);
    setResponsibilities(newResponsibilities);
  };

  const handleRequirementsChange = (index, e) => {
    const newRequirements = [...requirements];
    newRequirements[index] = e.target.value;
    setRequirements(newRequirements);
  };

  const handleAddRequirements = () => {
    setRequirements([...requirements, ""]); // Add a new empty input field
  };

  const handleRemoveRequirements = (index) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]); // Get the first file from the input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    let imageUrl = "";

    try {
      if (imageFile) {
        // Step 1: Upload the file to Appwrite Storage
        const fileResponse = await storage.createFile(
          Config.StorageId, // Your Appwrite Storage Bucket ID
          ID.unique(),
          imageFile
        );

        // Step 2: Construct the public image URL
        // Appwrite provides a direct preview URL
        imageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${Config.StorageId}/files/${fileResponse.$id}/view?project=${Config.projectId}`;
      }

      // Filter out any empty responsibility strings
      const cleanedResponsibilities = responsibilities.filter(
        (resp) => resp.trim() !== ""
      );

      const cleanedRequirements = requirements.filter(
        (resp) => resp.trim() !== ""
      );
      // Replace with your actual backend URL
      const response = await axiosClient.post("/api/admin/careers/add", {
        ...formData,
        image: imageUrl, // Pass the Appwrite image URL to the backend
        responsibilities: cleanedResponsibilities, // Pass the array to the backend
        requirements: cleanedRequirements, // Pass the array to the backend
      });
      console.log("Career added successfully:", response.data);
      setSuccess(true);
      setFormData({
        title: "",
        type: "",
        growthPath: "",
        description: "",
        location: "",
        department: "",
      });
      setImageFile(null);
      setResponsibilities([""]); // Reset responsibilities to a single empty field
      // Call the parent function to refresh the list or perform an action
      if (onCareerAdded) {
        onCareerAdded();
      }
    } catch (err) {
      console.error("Failed to add career:", err);
      setError("Failed to add career. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">
        Add New Career
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Growth Path
          </label>
          <input
            type="text"
            name="growthPath"
            value={formData.growthPath}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Department
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Image URL
          </label>
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </form>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Other form fields remain the same */}
        {/* New Responsibilities section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Responsibilities
          </label>
          {responsibilities.map((resp, index) => (
            <div key={index} className="flex items-center mt-2">
              <input
                type="text"
                value={resp}
                onChange={(e) => handleResponsibilityChange(index, e)}
                placeholder={`Responsibility ${index + 1}`}
                className="block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {responsibilities.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveResponsibility(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddResponsibility}
            className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Responsibility
          </button>
        </div>

        {/* New Requirements section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Requirements
          </label>
          {requirements.map((resp, index) => (
            <div key={index} className="flex items-center mt-2">
              <input
                type="text"
                value={resp}
                onChange={(e) => handleRequirementsChange(index, e)}
                placeholder={`Responsibility ${index + 1}`}
                className="block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRequirements(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddRequirements}
            className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Requirments
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Image Upload
          </label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Career"}
        </button>
        {success && (
          <p className="text-green-500 mt-2">Career added successfully!</p>
        )}
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default AddCareerForm;
