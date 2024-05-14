import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const FeedingLogHistory = () => {
  const [feedingHistory, setFeedingHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [filterKennelNumber, setFilterKennelNumber] = useState("");

  const fetchFeedingHistory = async () => {
    const { data, error } = await supabase
      .from("feeding_schedule")
      .select("*, kennels(kennel_number)")
      .order("kennel_id", { ascending: true }); // Order by kennel_id

    if (error) {
      console.error("Error fetching feeding history:", error.message);
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
        if (entry.feeding_time === "morning") {
          acc[key].morning_fed = entry.fed;
        } else if (entry.feeding_time === "noon") {
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
        (entry) =>
          formatDate(new Date(entry.feeding_date)) === formatDate(filterDate)
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
    setFilterKennelNumber("");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const filteredData = applyFilters();
  
    // Set font style and size
    doc.setFont("helvetica");
    doc.setFontSize(12);
  
    // Add document title
    doc.text("Feeding Log History", 14, 15);
  
    // Define table headers
    const headers = [ "Feeding Date", "Fed (Morning)", "Fed (Noon)"];
  
    // Map data for the table
    const data = filteredData.map((entry) => [
     
      formatDate(new Date(entry.feeding_date)),
      entry.morning_fed ? "Yes" : "No",
      entry.noon_fed ? "Yes" : "No",
    ]);
  
    // Add table to the document
    doc.autoTable({
      startY: 20, // Start table from 20 units down
      head: [headers],
      body: data,
      theme: "grid", // Apply grid theme for table
      styles: {
        font: "helvetica",
        fontStyle: "normal",
        fontSize: 10,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headerStyles: {
        fillColor: [0, 0, 0], // Black header background color
        textColor: [255, 255, 255], // White header text color
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: [0, 0, 0], // Black body text color
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Alternate row background color
      },
    });
  
    // Save the PDF file
    doc.save("feeding_log_history.pdf");
  };
  

  useEffect(() => {
    fetchFeedingHistory();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Feeding Log History</h2>

      <div className="sticky top-0 bg-white z-20 pb-2">
        <div className="flex gap-4 mb-4">
          <div className="relative">
            <DatePicker
              selected={filterDate}
              onChange={(date) => setFilterDate(date)}
              className="w-full p-2 border rounded-md"
              dateFormat="yyyy/MM/dd"
              placeholderText="Filter by date"
              popperPlacement="bottom-start"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="Kennel Number"
              value={filterKennelNumber}
              onChange={(e) => setFilterKennelNumber(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <button
            className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

          <button
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            onClick={downloadPDF}
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[500px] shadow-md">
        <table className="border-collapse w-full text-center">
          <thead className="sticky top-0 bg-gray-200 z-10">
            <tr>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
                Kennel Number
              </th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
                Feeding Date
              </th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
                Fed (Morning)
              </th>
              <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
                Fed (Noon)
              </th>
            </tr>
          </thead>

          <tbody>
            {applyFilters().map((entry, index) => (
              <tr key={index} className="bg-white hover:bg-gray-100">
                <td className="p-3 text-gray-800 border">
                  {entry.kennel_number}
                </td>
                <td className="p-3 text-gray-800 border">
                  {formatDate(new Date(entry.feeding_date))}
                </td>
                <td className="p-3 text-gray-800 border">
                  {entry.morning_fed ? (
                    <span className="bg-green-500 text-white p-1 rounded">
                      Yes
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white p-1 rounded">
                      No
                    </span>
                  )}
                </td>
                <td className="p-3 text-gray-800 border">
                  {entry.noon_fed ? (
                    <span className="bg-green-500 text-white p-1 rounded">
                      Yes
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white p-1 rounded">
                      No
                    </span>
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
