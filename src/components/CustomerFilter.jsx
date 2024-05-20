import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaSearch, FaCalendarAlt, FaFilter } from "react-icons/fa"; // Example using FontAwesome icons

const CustomerFilter = ({ onSearch, onDateFilter, onStatusFilter }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleStartDateChange = (date) => {
    setFilterStartDate(date);
    onDateFilter(date, filterEndDate, filterStatus);
  };

  const handleEndDateChange = (date) => {
    setFilterEndDate(date);
    onDateFilter(filterStartDate, date, filterStatus);
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    setFilterStatus(status);
    onStatusFilter(filterStartDate, filterEndDate, status);
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="relative">
        <input
          type="text"
          className="p-2 pl-8 pr-4 border rounded-md w-64"
          placeholder="Search by customer name"
          value={searchQuery}
          onChange={handleSearch}
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
            minDate={filterStartDate}
          />
          <FaCalendarAlt className="absolute top-3 left-3 text-gray-400" />
        </div>

        <div className="relative">
          <select
            className="p-2 pl-8 pr-4 border rounded-md appearance-none"
            value={filterStatus}
            onChange={handleStatusChange}
          >
            <option value="">All Statuses</option>
            <option value="checkout">Check Out</option>
            <option value="canceled">Canceled</option>
          </select>
          <FaFilter className="absolute top-3 left-3 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default CustomerFilter;
