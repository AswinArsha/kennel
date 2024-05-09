import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation(); // Get current route location

  return (
    <div className="w-60 bg-gray-800 text-white flex flex-col h-screen sticky top-0">
      {" "}
      {/* Fixed sidebar */}
      <div className="p-4">
        <h2 className="text-xl font-bold">Menu</h2> {/* Sidebar title */}
      </div>
      {/* Navigation links */}
      <nav className="flex-1">
        <ul className="space-y-2 p-4">
          {" "}
          {/* Add space between links */}
          <li>
            <Link
              to="/"
              className={`block p-2 rounded-md ${
                location.pathname === "/" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              Kennel Grid
            </Link>
          </li>
          <li>
            <Link
              to="/make-reservation"
              className={`block p-2 rounded-md ${
                location.pathname === "/make-reservation"
                  ? "bg-gray-700"
                  : "hover:bg-gray-700"
              }`}
            >
              Make Reservation
            </Link>
          </li>
          <li>
            <Link
              to="/reservation-list"
              className={`block p-2 rounded-md ${
                location.pathname === "/reservation-list"
                  ? "bg-gray-700"
                  : "hover:bg-gray-700"
              }`}
            >
              Reservation List
            </Link>
          </li>
          <li>
            <Link
              to="/feeding-schedule"
              className={`block p-2 rounded-md ${
                location.pathname === "/feeding-schedule"
                  ? "bg-gray-700"
                  : "hover:bg-gray-700"
              }`}
            >
              Feeding Schedule
            </Link>
          </li>
          <li>
            <Link
              to="/feeding-log-history"
              className={`block p-2 rounded-md ${
                location.pathname === "/feeding-log-history"
                  ? "bg-gray-700"
                  : "hover:bg-gray-700"
              }`}
            >
              Feeding Log History
            </Link>
          </li>
          {/* Add the new Customers button */}
          <li>
            <Link
              to="/customers"
              className={`block p-2 rounded-md ${
                location.pathname === "/customers"
                  ? "bg-gray-700"
                  : "hover:bg-gray-700"
              }`}
            >
              Customers
            </Link>
          </li>
        </ul>
      </nav>
      {/* Optional footer section */}
      <div className="p-4">
        <span>© {new Date().getFullYear()} Kennel Boarding</span>
      </div>
    </div>
  );
};

export default Sidebar;
