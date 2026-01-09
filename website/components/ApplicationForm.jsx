/* eslint-disable no-unused-vars */
import { useState } from "react";
import axiosClient from "../api";
import { Config, ID, storage } from "../appwrite";

export default function ApplicationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    motivation: "",
    cv: null,
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formPayload = new FormData();
    formPayload.append("name", formData.name);
    formPayload.append("email", formData.email);
    formPayload.append("phone", formData.phone);
    formPayload.append("role", formData.role);
    formPayload.append("motivation", formData.motivation);

    if (formData.cv) {
      formPayload.append("cv", formData.cv);
    }

    console.log(formData.cv);

    try {
      let cvFileId = null;

      // ✅ Upload CV if provided
      if (formData.cv) {
        const uploadedFile = await storage.createFile(
          Config.APPLICANT_CVS_BUCKET_ID, // replace with your bucket ID
          ID.unique(),
          formData.cv
        );
        cvFileId = uploadedFile.$id;
      }
      await axiosClient.post("/api/apply/submit", formPayload);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Apply to Join Nile Flow 🚀
      </h2>

      {submitted ? (
        <div className="text-center text-green-600 font-semibold">
          ✅ Thank you for applying! We’ll review your application soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-gray-700 font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-400"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 font-medium">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-400"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-700 font-medium">
              Role Applying For
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-400"
            >
              <option value="">Select a role</option>
              <option value="Marketing Associate">Marketing Associate</option>
              <option value="Vendor Relations Coordinator">
                Vendor Relations Coordinator
              </option>
              <option value="Customer Care Representative">
                Customer Care Representative
              </option>
            </select>
          </div>

          {/* Motivation */}
          <div>
            <label className="block text-gray-700 font-medium">
              Why do you want to join Nile Flow?
            </label>
            <textarea
              name="motivation"
              value={formData.motivation}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-400"
            ></textarea>
          </div>

          {/* CV Upload */}
          <div>
            <label className="block text-gray-700 font-medium">
              Upload CV (optional)
            </label>
            <input
              type="file"
              name="cv"
              accept=".pdf,.doc,.docx"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-400"
            />
          </div>

          {error && <div className="text-red-500 text-center">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      )}
    </div>
  );
}
