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
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Feeding Schedule Tracker</h2>

      <div className="flex items-center gap-4 mb-4">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          className="p-2 border rounded-md"
          dateFormat="yyyy/MM/dd"
          placeholderText="Select date"
        />

        <select
          className="p-2 border rounded-md"
          value={feedingTime}
          onChange={(e) => setFeedingTime(e.target.value)}
        >
          <option value="morning">Morning</option>
          <option value="noon">Noon</option>
        </select>
      </div>

      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Occupied Kennels</h3>
          <div className="grid grid-cols-5 gap-4">
            {occupiedKennels.map((kennel) => (
              <div
                key={kennel.id}
                className={`p-4 rounded-md bg-${feedingStatus[kennel.id] ? "green-500" : "gray-200"
                  }`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feedingStatus[kennel.id] || false}
                    onChange={() => {
                      setFeedingStatus((prev) => ({
                        ...prev,
                        [kennel.id]: !prev[kennel.id],
                      }));
                    }}
                  />
                  Kennel {kennel.kennel_number}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          onClick={handleSubmit}
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
              type="button"
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
              onClick={() => setIsDialogOpen(false)}
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
