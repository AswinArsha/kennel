import { useState, useEffect } from "react";
import { supabase } from "../supabase"; // Import Supabase client
import DatePicker from "react-datepicker"; // Date picker component
import "react-datepicker/dist/react-datepicker.css"; // Import CSS for date picker

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
  const [feedingStatus, setFeedingStatus] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchOccupiedKennels = async (date) => {
    const { data, error } = await supabase
      .from("kennels")
      .select("*")
      .eq("status", "occupied");

    if (error) {
      console.error("Error fetching kennels:", error.message);
    } else {
      setOccupiedKennels(data);
    }
  };

  const handleSubmit = async () => {
    const feedingRecords = occupiedKennels.map((kennel) => ({
      kennel_id: kennel.id,
      feeding_date: formatDate(selectedDate),
      feeding_time: feedingTime,
      fed: feedingStatus[kennel.id],
      eaten: feedingStatus[kennel.id],
    }));

    const { error } = await supabase.from("feeding_schedule").insert(feedingRecords);

    if (error) {
      console.error("Error inserting feeding status:", error.message);
    } else {
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchOccupiedKennels(selectedDate);
    }
  }, [selectedDate]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Feeding Schedule Tracker</h2>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy/MM/dd"
          placeholderText="Select date"
          className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={feedingTime}
          onChange={(e) => setFeedingTime(e.target.value)}
          className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="morning">Morning</option>
          <option value="noon">Noon</option>
        </select>
      </div>

      {selectedDate && (
        <div>
          <h3 className="text-xl font-medium mb-4">Occupied Kennels</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <h4 className="text-lg font-semibold mt-4">{set.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  {set.kennels.map((kennel) => (
                    <div
                      key={kennel.id}
                      className={`p-4 text-center rounded-md cursor-pointer transition-all ${
                        feedingStatus[kennel.id]
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      onClick={() => {
                        setFeedingStatus((prev) => ({
                          ...prev,
                          [kennel.id]: !prev[kennel.id],
                        }));
                      }}
                    >
                      Kennel {kennel.kennel_number}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 focus:outline-none"
        >
          Submit
        </button>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold">Feeding Status Submitted</h3>
            <p className="text-sm text-gray-600 mt-2">
              The feeding status has been successfully submitted.
            </p>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 focus:outline-none"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedingSchedule;
