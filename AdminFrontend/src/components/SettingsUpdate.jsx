
import { useEffect, useState } from 'react';
import axiosClient from '../../api';
import toast from 'react-hot-toast';

export default function SettingsUpdate({ onClose }) {
  const [settings, setSettings] = useState({
    appName: '',
    currency: '',
    currencySymbol: '',
    taxRate: '',
    businessHours: {},
    language: '',
    timezone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // For transition mount

  useEffect(() => {
    setIsVisible(true); // Trigger slide-in

    const fetchSettings = async () => {
      try {
        const response = await axiosClient.get('/api/settings/getsettings');
        setSettings(response.data);
      } catch (err) {
        console.error('Failed to fetch settings:', err.message);
      }
    };

    fetchSettings();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for transition to finish
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    // Basic validation
    if (!settings.appName || !settings.currency || !settings.currencySymbol || !settings.taxRate) {
      toast.error('All fields are required.');
      setIsSubmitting(false);
      return;
    }
  
    if (isNaN(settings.taxRate) || Number(settings.taxRate) < 0) {
      toast.error('Tax rate must be a valid number.');
      setIsSubmitting(false);
      return;
    }
  
    try {
      await axiosClient.post('/api/settings/updatesettings', settings);
      toast.success('Settings updated successfully!', {
        style: {
          background: '#0f172a',
          color: '#fff',
        },
      });
      
      handleClose();
    } catch (err) {
      console.error('Failed to update settings:', err.message);
      toast.error('Failed to update settings.');
    }
  };
  

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop with fade transition */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${isVisible ? 'opacity-50' : 'opacity-0'}`}
      />

      {/* Slide-over panel */}
      <div
        className={`
          relative ml-auto bg-white dark:bg-gray-900 w-full max-w-md h-full p-6 shadow-lg overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Update Settings</h2>
           
           <button
            onClick={handleClose}
            className="text-gray-500 hover:text-red-600 text-xl font-bold"
          >
            &times;
          </button> 
        </div>

        <form onSubmit={handleSubmit}>
          {['appName', 'currency', 'currencySymbol', 'taxRate','businessHours'].map((field) => (
            <div className="mb-4" key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {field.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type={field === 'taxRate' ? 'number' : 'text'}
                name={field}
                value={settings[field]}
                onChange={handleChange}
                className="w-full p-2 mt-1 bg-gray-200 rounded-md"
              />
            </div>
          ))}


           <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center justify-center gap-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
        </form>
      </div>
    </div>
  );
}
