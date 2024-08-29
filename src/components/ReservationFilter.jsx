import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaSearch, FaCalendarAlt, FaFilter } from "react-icons/fa";

const ReservationFilter = ({
  searchQuery,
  filterStartDate,
  filterEndDate,
  filterStatus,
  onSearchChange,
  onDateFilter,
  onStatusFilterChange,
  setFilterStartDate,
  setFilterEndDate,
  setFilterStatus,
  filterReservations,
  reservations,
}) => {
  const handleStartDateChange = (date) => {
    setFilterStartDate(date);
    onDateFilter(date, filterEndDate);
  };

  const handleEndDateChange = (date) => {
    setFilterEndDate(date);
    onDateFilter(filterStartDate, date);
  };

  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value);
    onStatusFilterChange(e.target.value);
  };

  const handleClearFilters = () => {
    setFilterStartDate(null);
    setFilterEndDate(null);
    setFilterStatus("");
    onSearchChange("");

    // Immediately apply the clearing of filters
    filterReservations(reservations, "", "", null, null);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
      <div className="relative w-full md:w-1/3">
        <input
          type="text"
          className="p-3 pl-10 pr-4 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by customer name, pet name, breed, or phone number"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
      </div>

      <div className="flex flex-col md:flex-row items-center ml-4 space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
        <div className="relative w-full md:w-auto">
          <DatePicker
            selected={filterStartDate}
            onChange={handleStartDateChange}
            className="p-3 pl-10 pr-4 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            placeholderText="Check In"
          />
          <FaCalendarAlt className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative w-full md:w-auto">
          <DatePicker
            selected={filterEndDate}
            onChange={handleEndDateChange}
            className="p-3 pl-10 pr-4 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            placeholderText="Check Out"
            minDate={filterStartDate}
          />
          <FaCalendarAlt className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={handleStatusChange}
            className="p-3 pl-10 pr-4 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="reserved">Reserved</option>
            <option value="checkin">Check In</option>
          </select>
          <FaFilter className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
        </div>

        <button
          className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
          onClick={handleClearFilters}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ReservationFilter;
