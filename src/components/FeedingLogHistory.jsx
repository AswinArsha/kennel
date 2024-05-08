import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Utility function to convert Date to a string in the format 'yyyy-mm-dd'
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
};

const FeedingLogHistory = () => {
  const [feedingHistory, setFeedingHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [filterKennelId, setFilterKennelId] = useState('');
  const [filterFeedingTime, setFilterFeedingTime] = useState('');

  // Fetch feeding history from Supabase
  const fetchFeedingHistory = async () => {
    const { data, error } = await supabase
      .from('feeding_schedule')
      .select('*, kennels(kennel_number)'); // Include kennel details

    if (error) {
      console.error('Error fetching feeding history:', error.message);
    } else {
      setFeedingHistory(data);
    }
  };

  // Apply filters to feeding history
  const applyFilters = () => {
    let filteredData = feedingHistory;

    if (filterDate) {
      filteredData = filteredData.filter(
        (entry) => formatDate(new Date(entry.feeding_date)) === formatDate(filterDate)
      );
    }

    if (filterKennelId) {
      filteredData = filteredData.filter(
        (entry) => entry.kennel_id.toString() === filterKennelId
      );
    }

    if (filterFeedingTime) {
      filteredData = filteredData.filter(
        (entry) => entry.feeding_time === filterFeedingTime
      );
    }

    return filteredData;
  };

  useEffect(() => {
    fetchFeedingHistory(); // Fetch feeding history on component mount
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Feeding Log History</h2>

      {/* Sticky filters for date, kennel ID, and feeding time */}
      <div className="sticky top-0 bg-white z-10 pb-2"> {/* Sticky section */}
        <div className="flex gap-4 mb-4">
          <DatePicker
            selected={filterDate}
            onChange={(date) => setFilterDate(date)}
            className="p-2 border rounded-md"
            dateFormat="yyyy/MM/dd"
            placeholderText="Filter by date"
          />

          <input
            type="text"
            className="p-2 border rounded-md"
            placeholder="Filter by kennel ID"
            value={filterKennelId}
            onChange={(e) => setFilterKennelId(e.target.value)}
          />

          <select
            className="p-2 border rounded-md"
            value={filterFeedingTime}
            onChange={(e) => setFilterFeedingTime(e.target.value)}
          >
            <option value="">Filter by time</option>
            <option value="morning">Morning</option>
            <option value="noon">Noon</option>
            <option value="night">Night</option>
          </select>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="overflow-y-auto max-h-[500px]"> {/* Independent scrolling with fixed height */}
        <table className="border-collapse w-full text-center">
          <thead className="sticky top-0 bg-gray-200 z-10"> {/* Sticky header */}
            <tr>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Kennel ID</th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Feeding Date</th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Feeding Time</th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Fed</th>
            </tr>
          </thead>
          <tbody>
            {applyFilters().map((entry) => (
              <tr key={entry.id} className="bg-white hover:bg-gray-100">
                <td className="p-3 text-gray-800 border">{entry.kennel_id}</td>
                <td className="p-3 text-gray-800 border">{formatDate(new Date(entry.feeding_date))}</td>
                <td className="p-3 text-gray-800 border">{entry.feeding_time}</td>
                <td className="p-3 text-gray-800 border">
                  {entry.fed ? (
                    <span className="bg-green-500 text-white p-1 rounded">Yes</span>
                  ) : (
                    <span className="bg-red-500 text-white p-1 rounded">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedingLogHistory;
