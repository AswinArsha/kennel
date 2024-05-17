import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi"; // Import icons from react-icons

const Sidebar = () => {
  const location = useLocation(); // Get current route location
  const [isOpen, setIsOpen] = useState(true); // State to manage sidebar open/close

  // Function to toggle sidebar open/close
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`${
        isOpen ? "w-60" : "w-20"
      } bg-gray-800 text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out`}
    >
      {/* Sidebar header */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Menu</h2>
        </div>
        {/* Menu toggle button */}
        <button
          className="text-white focus:outline-none lg:hidden"
          onClick={toggleSidebar}
        >
          {isOpen ? <HiMenu size={24} /> : <HiX size={24} />}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2 p-4">
          <li>
            <Link
              to="/"
              className={`block p-2 rounded-md ${
                location.pathname === "/" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center">
                <span className="mr-2">
                  <HiMenu size={20} />
                </span>
                Kennel Grid
              </span>
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
              <span className="flex items-center">
                <span className="mr-2">
                  <HiMenu size={20} />
                </span>
                Make Reservation
              </span>
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
              <span className="flex items-center">
                <span className="mr-2">
                  <HiMenu size={20} />
                </span>
                Reservation List
              </span>
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
              <span className="flex items-center">
                <span className="mr-2">
                  <HiMenu size={20} />
                </span>
                Feeding Schedule
              </span>
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
              <span className="flex items-center">
                <span className="mr-2">
                  <HiMenu size={20} />
                </span>
                Feeding Log History
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/customers"
              className={`block p-2 rounded-md ${
                location.pathname === "/customers"
                  ? "bg-gray-700"
                  : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center">
                <span className="mr-2">
                  <HiMenu size={20} />
                </span>
                Customers
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className={`block p-2 rounded-md ${
                location.pathname === "/dashboard"
                  ? "bg-gray-700"
                  : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center">
                <span className="mr-2">
                  <HiMenu size={20} />
                </span>
                Dashboard
              </span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Optional footer section */}
      <div className="p-4 mt-auto">
        <span>© {new Date().getFullYear()} Kennel Boarding</span>
      </div>
    </div>
  );
};

export default Sidebar;
