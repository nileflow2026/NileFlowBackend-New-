import { useState } from "react";
import axiosClient from "../../api";

const RewardsForm = ({ onRewardAdded }) => {
  const [name, setName] = useState("");
  const [lore, setLore] = useState("");
  const [image, setImage] = useState("");
  const [requiredMiles, setRequiredMiles] = useState("");
  const [rewardKey, setRewardKey] = useState("");
  const [category, setCategory] = useState("Storytelling Journey"); // default
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (!name || !lore || !requiredMiles || !rewardKey || !category) {
      setStatus("Please fill all required fields.");
      setLoading(false);
      return;
    }

    try {
      await axiosClient.post("/api/rewards", {
        name,
        lore,
        image,
        requiredMiles: parseInt(requiredMiles),
        rewardKey,
        category,
      });

      setStatus("Reward successfully added!");
      onRewardAdded?.();

      // Reset form
      setName("");
      setLore("");
      setImage("");
      setRequiredMiles("");
      setRewardKey("");
      setCategory("Storytelling Journey");
    } catch (error) {
      console.error("Failed to add reward:", error.response?.data?.error);
      setStatus(
        `Error: ${error.response?.data?.error || "Failed to add reward."}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold mb-4">Add New Reward</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-300">
            Reward Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300">
            Lore / Description
          </label>
          <textarea
            value={lore}
            onChange={(e) => setLore(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300">
            Image URL
          </label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://via.placeholder.com/300x400"
            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300">
              Required Miles
            </label>
            <input
              type="number"
              value={requiredMiles}
              onChange={(e) => setRequiredMiles(e.target.value)}
              min="1"
              className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300">
              Reward Key
            </label>
            <input
              type="text"
              value={rewardKey}
              onChange={(e) => setRewardKey(e.target.value)}
              placeholder="unique_key_for_backend"
              className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            required
          >
            <option value="Storytelling Journey">Storytelling Journey</option>
            <option value="Festive Rewards">Festive Rewards</option>
            <option value="Premium Shop">Premium Shop</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 transition"
          disabled={loading}
        >
          {loading ? "Processing..." : "Add Reward"}
        </button>
      </form>

      {status && <p className="mt-4 text-center text-sm">{status}</p>}
    </div>
  );
};

export default RewardsForm;
