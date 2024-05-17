import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
          minDate={filterStartDate} // Set minDate dynamically based on filterStartDate
        />
      </div>
    </div>
  );
};

export default ReservationFilter;
