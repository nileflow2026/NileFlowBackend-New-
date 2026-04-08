import { useState } from 'react';
import { createStaff } from '../services/staffService';
; // Adjust the path to your createStaff function

export default function StaffForm() {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    address: '',
    email: '',
    phonenumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await createStaff(formData);
      setSuccessMsg('Staff member created successfully.');
      setFormData({ name: '', role: '', address: '', email: '', phonenumber: '' });
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Staff Member</h2>

      {['name', 'role', 'address', 'email', 'phonenumber'].map((field) => (
        <div key={field} className="mb-4">
          <label className="block mb-1 text-gray-700 dark:text-gray-300 capitalize">{field}</label>
          <input
            type="text"
            name={field}
            value={formData[field]}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      ))}

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Create Staff'}
      </button>

      {successMsg && <p className="mt-4 text-green-500 text-sm">{successMsg}</p>}
    </form>
  );
}
