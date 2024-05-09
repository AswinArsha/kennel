import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS for the date picker

// Utility function to format date to 'yyyy-mm-dd'
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FeedingLogHistory = () => {
  const [feedingHistory, setFeedingHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [filterKennelNumber, setFilterKennelNumber] = useState(''); // Filter by kennel number
  const [filterFeedingTime, setFilterFeedingTime] = useState('');

  // Fetch feeding history from Supabase
  const fetchFeedingHistory = async () => {
    const { data, error } = await supabase
      .from('feeding_schedule')
      .select('*, kennels(kennel_number)'); // Include kennel number with feeding data

    if (error) {
      console.error('Error fetching feeding history:', error.message);
    } else {
      setFeedingHistory(data); // Store fetched data
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

    if (filterKennelNumber) {
      filteredData = filteredData.filter(
        (entry) => entry.kennels.kennel_number.toString() === filterKennelNumber
      );
    }

    if (filterFeedingTime) {
      filteredData = filteredData.filter(
        (entry) => entry.feeding_time === filterFeedingTime
      );
    }

    return filteredData;
  };

  const clearFilters = () => {
    // Clear all filters
    setFilterDate(null);
    setFilterKennelNumber('');
    setFilterFeedingTime('');
  };

  useEffect(() => {
    fetchFeedingHistory(); // Fetch feeding history on component mount
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Feeding Log History</h2>

      {/* Sticky filters for date, kennel number, and feeding time */}
      <div className="sticky top-0 bg-white z-20 pb-2"> {/* Increase z-index for this section */}
        <div className="flex gap-4 mb-4">
          <DatePicker
            selected={filterDate}
            onChange={(date) => setFilterDate(date)}
            className="p-2 border rounded-md"
            dateFormat="yyyy/MM/dd"
            placeholderText="Filter by date"
            popperPlacement="bottom-start" // Set the position of the calendar popup
          />

          <input
            type="text"
            className="p-2 border rounded-md"
            placeholder="Filter by kennel number"
            value={filterKennelNumber}
            onChange={(e) => setFilterKennelNumber(e.target.value)}
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
          
          {/* Clear filters button */}
          <button
            className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Scrollable table with feeding history */}
      <div className="overflow-y-auto max-h-[500px]"> {/* Independent scrolling with set height */}
        <table className="border-collapse w-full text-center">
          <thead className="sticky top-0 bg-gray-200 z-10"> {/* Sticky table header */}
            <tr>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Kennel Number</th> {/* Kennel number */}
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Feeding Date</th> {/* Feeding date */}
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Feeding Time</th> {/* Feeding time */}
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Fed</th> {/* Fed status */}
            </tr>
          </thead>
          <tbody>
            {applyFilters().map((entry) => (
              <tr key={entry.id} className="bg-white hover:bg-gray-100">
                <td className="p-3 text-gray-800 border">{entry.kennels.kennel_number}</td> {/* Kennel number */}
                <td className="p-3 text-gray-800 border">{formatDate(new Date(entry.feeding_date))}</td> {/* Feeding date */}
                <td className="p-3 text-gray-800 border">{entry.feeding_time}</td> {/* Feeding time */}
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
