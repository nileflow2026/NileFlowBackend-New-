// services/staffService.js
/* const mockStaff = [
    { $id: '1', name: 'Alice Makuach', email: 'alice@example.com', role: 'Manager' },
    { $id: '2', name: 'John Deng', email: 'john@example.com', role: 'Sales Rep' },
    { $id: '3', name: 'Mary Nyadeng', email: 'mary@example.com', role: 'Support' },
  ];
  
  export const getStaff = async () => {
    // Later, replace this with Appwrite database listDocuments call
    return mockStaff;
  };
  
  export const deleteStaff = async (id) => {
    // Later, replace with Appwrite's deleteDocument call
    return mockStaff.filter((s) => s.$id !== id);
  };
  
  export const updateStaff = async (id, updatedData) => {
    // Later, replace with Appwrite's updateDocument call
    return mockStaff.map((s) => (s.$id === id ? { ...s, ...updatedData } : s));
  }; */

// services/staffService.js

import axiosClient from "../../api";

export const getStaff = async () => {
  try {
    const response = await axiosClient("/api/admin/staff/getStaff");
    return response.data;
  } catch (error) {
    console.error("[Appwrite] getStaff error:", error);
    return [];
  }
};

export const deleteStaff = async (id) => {
  try {
    const response = await axiosClient.get("/api/staff/deleteStaff", id);
    return response.data;
  } catch (error) {
    console.error("[Appwrite] deleteStaff error:", error);
    return [];
  }
};

export const updateStaff = async (id, updatedData) => {
  try {
    const response = await axiosClient.get(
      "/api/staff/updateStaff",
      id,
      updatedData
    );
    return response.data;
  } catch (error) {
    console.error("[Appwrite] updateStaff error:", error);
    return [];
  }
};

export const createStaff = async (data) => {
  try {
    const response = await axiosClient.post("/api/staff/createStaff", data);
    return response.data;
  } catch (error) {
    console.error("[Appwrite] createStaff error:", error);
    return null;
  }
};
