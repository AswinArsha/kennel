import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
    <div className="flex justify-between mb-4">
      <input
        type="text"
        className="p-2 border rounded-md"
        placeholder="Search by customer name"
        value={searchQuery}
        onChange={handleSearch}
      />

      <div className="flex gap-4">
        <DatePicker
          selected={filterStartDate}
          onChange={handleStartDateChange}
          className="p-2 border rounded-md"
          dateFormat="yyyy/MM/dd"
          placeholderText="Check In"
        />

        <DatePicker
          selected={filterEndDate}
          onChange={handleEndDateChange}
          className="p-2 border rounded-md"
          dateFormat="yyyy/MM/dd"
          placeholderText="Check Out"
          minDate={filterStartDate}
        />

        <select
          className="p-2 border rounded-md"
          value={filterStatus}
          onChange={handleStatusChange}
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="canceled">Canceled</option>
          
        </select>
      </div>
    </div>
  );
};

export default CustomerFilter;