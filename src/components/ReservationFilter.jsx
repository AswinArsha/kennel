import React from "react";
import PropTypes from "prop-types"; // Import PropTypes for prop validation
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ReservationFilter = ({
  searchQuery,
  filterStartDate,
  filterEndDate,
  onSearchChange,
  onDateFilter,
}) => (
  <div className="flex justify-between mb-4">
    <input
      type="text"
      className="p-2 border rounded-md"
      placeholder="Search by customer name"
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
    />

    <div className="flex gap-4">
      <DatePicker
        selected={filterStartDate}
        onChange={(date) => {
          onSearchChange(date);
          onDateFilter(); // Trigger date filtering
        }}
        className="p-2 border rounded-md"
        dateFormat="yyyy/MM/dd"
        placeholderText="Start date"
      />
      <DatePicker
        selected={filterEndDate}
        onChange={(date) => {
          onSearchChange(date);
          onDateFilter(); // Trigger date filtering
        }}
        className="p-2 border rounded-md"
        dateFormat="yyyy/MM/dd"
        placeholderText="End date"
      />
      <button
        className="bg-blue-500 text-white p-2 rounded-md"
        onClick={onDateFilter}
      >
        Filter
      </button>
    </div>
  </div>
);

ReservationFilter.propTypes = {
  searchQuery: PropTypes.string,
  filterStartDate: PropTypes.instanceOf(Date),
  filterEndDate: PropTypes.instanceOf(Date),
  onSearchChange: PropTypes.func.isRequired,
  onDateFilter: PropTypes.func.isRequired,
};

export default ReservationFilter;
