import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

const CustomerDetailDialog = ({ customer, isOpen, onClose }) => {
  const [customerDetail, setCustomerDetail] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    kennel_numbers: [],
    pets: [],
  });
  const [filterDate, setFilterDate] = useState(null);
  const [filteredFeedings, setFilteredFeedings] = useState([]);

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      if (customer) {
        const { data: reservation, error } = await supabase
          .from("reservations")
          .select("*")
          .eq("kennel_ids", `{${customer.id}}`) // Filter by kennel ID
          .single();

        if (error) {
          console.error("Error fetching reservation details:", error.message);
        } else {
          const { data: pets, error: petError } = await supabase
            .from("pet_information")
            .select("*, kennel_id (id, kennel_number)")
            .eq("kennel_id", customer.id); // Filter by kennel ID

          if (petError) {
            console.error("Error fetching pets:", petError.message);
          } else {
            const kennelNumbers = pets.map((pet) => pet.kennel_id.kennel_number);
            setCustomerDetail({
              customer_name: reservation.customer_name,
              customer_phone: reservation.customer_phone,
              customer_email: reservation.customer_email,
              customer_address: reservation.customer_address,
              pets,
              kennel_numbers: kennelNumbers,
            });
          }
        }
      }
    };

    fetchCustomerDetail();
  }, [customer]);

  useEffect(() => {
    const fetchFeedingSchedule = async () => {
      if (filterDate && customer) {
        const { data, error } = await supabase
          .from("feeding_schedule")
          .select("*")
          .eq("feeding_date", filterDate)
          .eq("kennel_id", customer.id);

        if (error) {
          console.error("Error fetching feeding schedule:", error.message);
        } else {
          const groupedData = data.reduce((acc, entry) => {
            const key = `${entry.kennel_id}-${entry.feeding_date}`;
            if (!acc[key]) {
              acc[key] = {
                kennel_id: entry.kennel_id,
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

          setFilteredFeedings(Object.values(groupedData));
        }
      } else {
        setFilteredFeedings([]);
      }
    };

    fetchFeedingSchedule();
  }, [filterDate, customer]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-auto bg-gray-800 bg-opacity-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">All Details</h2>
            <button
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              onClick={onClose}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-2">Customer Information</h3>
              <div className="mb-4">
                <label className="block font-semibold">Name</label>
                <div className="p-2 border rounded-md">
                  {customerDetail.customer_name}
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-semibold">Phone</label>
                <div className="p-2 border rounded-md">
                  {customerDetail.customer_phone}
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-semibold">Email</label>
                <div className="p-2 border rounded-md">
                  {customerDetail.customer_email}
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-semibold">Address</label>
                <div className="p-2 border rounded-md">
                  {customerDetail.customer_address}
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-semibold">Kennel Numbers</label>
                <div className="p-2 border rounded-md">
                  {customerDetail.kennel_numbers.join(", ")}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">Pet Information</h3>
              {customerDetail.pets.map((pet) => (
                <div key={pet.id} className="mb-4 p-4 border rounded-md">
                  <div>
                    <label className="block font-semibold">Pet Name</label>
                    <div>{pet.pet_name}</div>
                  </div>
                  <div>
                    <label className="block font-semibold">
                      Dietary Requirements
                    </label>
                    <div>{pet.dietary_requirements || "N/A"}</div>
                  </div>
                  <div>
                    <label className="block font-semibold">
                      Special Care Instructions
                    </label>
                    <div>{pet.special_care_instructions || "N/A"}</div>
                  </div>
                  <div>
                    <label className="block font-semibold">Medical Notes</label>
                    <div>{pet.medical_notes || "N/A"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold mb-2">Feeding Information</h3>
            <div className="flex items-center mb-4">
              <label className="mr-4 font-semibold">Filter by Date:</label>
              <input
                type="date"
                className="border rounded-md p-2"
                value={filterDate || ""}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left border">Kennel Number</th>
                  <th className="p-3 text-left border">Feeding Date</th>
                  <th className="p-3 text-left border">Fed (Morning)</th>
                  <th className="p-3 text-left border">Fed (Noon)</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedings.map((feeding, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="p-3 border">{feeding.kennel_id}</td>
                    <td className="p-3 border">
                      {new Date(feeding.feeding_date).toLocaleDateString()}
                    </td>
                    <td className="p-3 border">
                      {feeding.morning_fed ? (
                        <span className="bg-green-500 text-white p-1 rounded">Yes</span>
                      ) : (
                        <span className="bg-red-500 text-white p-1 rounded">No</span>
                      )}
                    </td>
                    <td className="p-3 border">
                      {feeding.noon_fed ? (
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
      </div>
    </div>
  );
};

export default CustomerDetailDialog;