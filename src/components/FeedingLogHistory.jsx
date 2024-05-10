import  { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FeedingLogHistory = () => {
  const [feedingHistory, setFeedingHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [filterKennelNumber, setFilterKennelNumber] = useState('');

  const fetchFeedingHistory = async () => {
    const { data, error } = await supabase
      .from('feeding_schedule')
      .select('*, kennels(kennel_number)')
      .order('kennel_id', { ascending: true }); // Order by kennel_id

    if (error) {
      console.error('Error fetching feeding history:', error.message);
    } else {
      const groupedData = data.reduce((acc, entry) => {
        const key = `${entry.kennels.kennel_number}-${entry.feeding_date}`;
        if (!acc[key]) {
          acc[key] = {
            kennel_number: entry.kennels.kennel_number,
            feeding_date: entry.feeding_date,
            morning_fed: false,
            noon_fed: false,
          };
        }
        if (entry.feeding_time === 'morning') {
          acc[key].morning_fed = entry.fed;
        } else if (entry.feeding_time === 'noon') {
          acc[key].noon_fed = entry.fed;
        }
        return acc;
      }, {});

      setFeedingHistory(Object.values(groupedData));
    }
  };

  const applyFilters = () => {
    let filteredData = feedingHistory;

    if (filterDate) {
      filteredData = filteredData.filter(
        (entry) => formatDate(new Date(entry.feeding_date)) === formatDate(filterDate)
      );
    }

    if (filterKennelNumber) {
      filteredData = filteredData.filter(
        (entry) => entry.kennel_number.toString() === filterKennelNumber
      );
    }

    return filteredData;
  };

  const clearFilters = () => {
    setFilterDate(null);
    setFilterKennelNumber('');
  };

  useEffect(() => {
    fetchFeedingHistory();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Feeding Log History</h2>

      <div className="sticky top-0 bg-white z-20 pb-2">
        <div className="flex gap-4 mb-4">
          <DatePicker
            selected={filterDate}
            onChange={(date) => setFilterDate(date)}
            className="p-2 border rounded-md"
            dateFormat="yyyy/MM/dd"
            placeholderText="Filter by date"
            popperPlacement="bottom-start"
          />

          <input
            type="text"
            className="p-2 border rounded-md"
            placeholder="Filter by kennel number"
            value={filterKennelNumber}
            onChange={(e) => setFilterKennelNumber(e.target.value)}
          />

          <button
            className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[500px]">
        <table className="border-collapse w-full text-center">
          <thead className="sticky top-0 bg-gray-200 z-10">
            <tr>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Kennel Number</th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Feeding Date</th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Fed (Morning)</th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Fed (Noon)</th>
            </tr>
          </thead>
          <tbody>
            {applyFilters().map((entry, index) => (
              <tr key={index} className="bg-white hover:bg-gray-100">
                <td className="p-3 text-gray-800 border">{entry.kennel_number}</td>
                <td className="p-3 text-gray-800 border">{formatDate(new Date(entry.feeding_date))}</td>
                <td className="p-3 text-gray-800 border">
                  {entry.morning_fed ? (
                    <span className="bg-green-500 text-white p-1 rounded">Yes</span>
                  ) : (
                    <span className="bg-red-500 text-white p-1 rounded">No</span>
                  )}
                </td>
                <td className="p-3 text-gray-800 border">
                  {entry.noon_fed ? (
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