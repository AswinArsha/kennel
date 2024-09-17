import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCheck, FaTimes } from "react-icons/fa";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const FeedingSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [feedingTime, setFeedingTime] = useState("morning");
  const [occupiedKennels, setOccupiedKennels] = useState([]);
  const [fedKennels, setFedKennels] = useState([]);
  const [selectedKennels, setSelectedKennels] = useState([]);
  const [chickenStock, setChickenStock] = useState(0);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [newChickenStock, setNewChickenStock] = useState("");

  const fetchChickenStock = async () => {
    const { data, error } = await supabase
      .from("chicken_inventory")
      .select("stock")
      .single();

    if (error) {
      console.error("Error fetching chicken stock:", error.message);
    } else {
      setChickenStock(data.stock);
    }
  };

  const updateChickenStock = async (newStock) => {
    const { error } = await supabase
      .from("chicken_inventory")
      .upsert({ id: 1, stock: newStock });

    if (error) {
      console.error("Error updating chicken stock:", error.message);
    } else {
      setChickenStock(newStock);
    }
  };

  const handleInventorySubmit = (e) => {
    e.preventDefault();
    const newStock = parseFloat(newChickenStock);
    if (!isNaN(newStock) && newStock >= 0) {
      updateChickenStock(newStock);
      setIsInventoryDialogOpen(false);
      setNewChickenStock("");
    }
  };

  const fetchOccupiedKennels = async (date) => {
    const { data: occupiedKennelsData, error } = await supabase
      .from("kennels")
      .select("*")
      .eq("status", "occupied");

    if (error) {
      console.error("Error fetching kennels:", error.message);
    } else {
      setOccupiedKennels(occupiedKennelsData);
    }
  };

  const fetchFedKennels = async (date, time) => {
    const { data: fedKennelsData, error } = await supabase
      .from("feeding_schedule")
      .select("kennel_id")
      .eq("feeding_date", formatDate(date))
      .eq("feeding_time", time)
      .eq("fed", true);
  
    if (error) {
      console.error("Error fetching fed kennels:", error.message);
    } else {
      setFedKennels(fedKennelsData.map((data) => data.kennel_id));
    }
  };

  const handleSubmit = async () => {
    const feedingRecords = selectedKennels.map((kennel) => ({
      kennel_id: kennel.id,
      feeding_date: formatDate(selectedDate),
      feeding_time: feedingTime,
      fed: !fedKennels.includes(kennel.id),
      eaten: !fedKennels.includes(kennel.id), // Assuming eaten follows fed status
    }));

    const { error } = await supabase.from("feeding_schedule").upsert(feedingRecords, {
      onConflict: ['kennel_id', 'feeding_date', 'feeding_time'],
    });

    if (error) {
      console.error("Error inserting feeding status:", error.message);
    } else {
      // Update chicken stock only if the kennels are being fed
      if (!selectedKennels.some((kennel) => fedKennels.includes(kennel.id))) {
        const newStock = chickenStock - (selectedKennels.length * 0.25);
        await updateChickenStock(newStock);
      }

      // Reset state after successful submission
      setSelectedKennels([]);
      fetchFedKennels(selectedDate, feedingTime);
    }
  };

  useEffect(() => {
    fetchChickenStock();
    if (selectedDate) {
      fetchOccupiedKennels(selectedDate);
      fetchFedKennels(selectedDate, feedingTime);
    }
  }, [selectedDate, feedingTime]);

  const toggleKennelSelection = (kennel) => {
    setSelectedKennels((prevSelectedKennels) => {
      if (prevSelectedKennels.includes(kennel)) {
        return prevSelectedKennels.filter((k) => k !== kennel);
      } else {
        return [...prevSelectedKennels, kennel];
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-semibold mb-6">Feeding Schedule Tracker</h2>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy/MM/dd"
          placeholderText="Select date"
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={feedingTime}
          onChange={(e) => setFeedingTime(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="morning">Morning</option>
          <option value="noon">Noon</option>
        </select>

        <div className="flex items-center ml-auto">
          <span className="mr-2">Chicken Stock: {chickenStock.toFixed(2)} kg</span>
          <button
            onClick={() => setIsInventoryDialogOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Inventory
          </button>
        </div>
      </div>

      {selectedDate && (
        <div>
       
          <div className=" mt-2 grid grid-cols-1 gap-6">
            {occupiedKennels.reduce((acc, kennel) => {
              const setIndex = acc.findIndex(
                (item) => item.name === kennel.set_name
              );
              if (setIndex === -1) {
                acc.push({ name: kennel.set_name, kennels: [kennel] });
              } else {
                acc[setIndex].kennels.push(kennel);
              }
              return acc;
            }, []).map((set) => (
              <div key={set.name}>
                <h4 className="text-lg font-semibold mb-2">{set.name}</h4>
                <div className="grid grid-cols-8 gap-4">
                  {set.kennels.map((kennel) => (
                    <div
                      key={kennel.id}
                      className={`p-4 text-center rounded-lg cursor-pointer transition-all shadow-md ${
                        fedKennels.includes(kennel.id)
                          ? selectedKennels.includes(kennel)
                            ? "bg-blue-500 text-white"
                            : "bg-green-500 text-white"
                          : selectedKennels.includes(kennel)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      onClick={() => toggleKennelSelection(kennel)}
                    >
                      <div className="flex flex-col items-center">
                        {fedKennels.includes(kennel.id) ? (
                          <>
                            <span className="whitespace-nowrap rounded-full bg-green-100 mb-2 px-2.5 py-0.5 text-sm text-green-700">
                              Fed
                            </span>
                          </>
                        ) : selectedKennels.includes(kennel) ? (
                          <FaCheck className="text-2xl mb-2" />
                        ) : (
                          <FaTimes className="text-2xl mb-2" />
                        )}
                        <span>Kennel {kennel.kennel_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={selectedKennels.length === 0 || chickenStock < selectedKennels.length * 0.25}
          className={`px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            selectedKennels.length === 0 || chickenStock < selectedKennels.length * 0.25
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Submit
        </button>
      </div>

      {isInventoryDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Update Chicken Stock</h3>
            <form onSubmit={handleInventorySubmit}>
              <input
                type="number"
                value={newChickenStock}
                onChange={(e) => setNewChickenStock(e.target.value)}
                placeholder="Enter new stock in kg"
                className="w-full border border-gray-300 p-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsInventoryDialogOpen(false)}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedingSchedule;
