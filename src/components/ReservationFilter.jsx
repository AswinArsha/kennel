import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaSearch, FaCalendarAlt } from "react-icons/fa"; // Example using FontAwesome icons

const ReservationFilter = ({
  searchQuery,
  filterStartDate,
  filterEndDate,
  onSearchChange,
  onDateFilter,
  setFilterStartDate,
  setFilterEndDate,
}) => {
  const handleStartDateChange = (date) => {
    setFilterStartDate(date);
    onDateFilter(date, filterEndDate); // Trigger filtering with new start date
  };

  const handleEndDateChange = (date) => {
    setFilterEndDate(date);
    onDateFilter(filterStartDate, date); // Trigger filtering with new end date
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="relative">
        <input
          type="text"
          className="p-2 pl-8 pr-4 border rounded-md w-64"
          placeholder="Search by customer name"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <FaSearch className="absolute top-3 left-3 text-gray-400" />
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative">
          <DatePicker
            selected={filterStartDate}
            onChange={handleStartDateChange}
            className="p-2 pl-8 pr-4 border rounded-md"
            dateFormat="yyyy/MM/dd"
            placeholderText="Check In"
          />
          <FaCalendarAlt className="absolute top-3 left-3 text-gray-400" />
        </div>

        <div className="relative">
          <DatePicker
            selected={filterEndDate}
            onChange={handleEndDateChange}
            className="p-2 pl-8 pr-4 border rounded-md"
            dateFormat="yyyy/MM/dd"
            placeholderText="Check Out"
            minDate={filterStartDate} // Set minDate dynamically based on filterStartDate
          />
          <FaCalendarAlt className="absolute top-3 left-3 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default ReservationFilter;
