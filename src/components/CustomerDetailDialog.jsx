import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { FaTimes, FaEdit, FaCheck, FaDownload } from "react-icons/fa";
import Modal from "react-modal";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: "1000",
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: "0",
    borderRadius: "8px",
    maxWidth: "900px",
    width: "50%",
    maxHeight: "90vh",
    height: "80%",
    overflow: "auto",
  },
};

const CustomerDetailDialog = ({ customer, isOpen, onClose }) => {
  const [customerDetail, setCustomerDetail] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    kennel_numbers: [],
    pets: [],
  });
  const [filterDate, setFilterDate] = useState(null);
  const [filteredFeedings, setFilteredFeedings] = useState([]);
  const [kennelNumber, setKennelNumber] = useState("");

  useEffect(() => {
    if (customer) {
      setKennelNumber(`Kennel ${customer.kennel_number} Details`);
    }
  }, [customer]);

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
            .select(
              "*, reservation_id (pet_name, pet_breed, start_date, end_date, pickup, groom, drop)"
            )
            .eq("reservation_id", reservation.id); // Filter by reservation ID

          if (petError) {
            console.error("Error fetching pets:", petError.message);
          } else {
            const kennelNumbers = pets.map((pet) => customer.kennel_number);
            setCustomerDetail({
              customer_name: reservation.customer_name,
              customer_phone: reservation.customer_phone,
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
      if (customer) {
        const { data, error } = await supabase
          .from("feeding_schedule")
          .select("*")
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
            if (entry.feeding_time === "morning") {
              acc[key].morning_fed = entry.fed;
            } else if (entry.feeding_time === "noon") {
              acc[key].noon_fed = entry.fed;
            }
            return acc;
          }, {});
  
          setFilteredFeedings(Object.values(groupedData));
        }
      }
    };
  
    fetchFeedingSchedule();
  }, [customer]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const tableData = filteredFeedings.map((feeding) => [
      new Date(feeding.feeding_date).toLocaleDateString(),
      feeding.morning_fed ? "Yes" : "No",
      feeding.noon_fed ? "Yes" : "No",
    ]);

    doc.setFontSize(18);
    doc.text("Feeding Information", 20, 20);
    doc.setFontSize(14);
    doc.text(`Kennel ID: ${filteredFeedings[0]?.kennel_id}`, 20, 30);

    doc.autoTable({
      startY: 40,
      head: [["Date", "Morning Fed", "Noon Fed"]],
      body: tableData,
    });

    doc.save("feeding_information.pdf");
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Customer Details"
    >
      <div className="bg-white p-6 ">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{kennelNumber}</h2>
          <button
            className="text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={onClose}
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        <Tabs>
          <TabList className="flex mb-4 border-b border-gray-300">
            <Tab
              className="px-4 py-2 text-gray-600 hover:text-gray-800  "
              selectedClassName="text-blue-500 border-b-2 border-blue-500"
            >
              Pet Information
            </Tab>
            <Tab
              className="px-4 py-2 text-gray-600 hover:text-gray-800 "
              selectedClassName="text-blue-500 border-b-2 border-blue-500"
            >
              Customer Information
            </Tab>
            <Tab
              className="px-4 py-2 text-gray-600 hover:text-gray-800 "
              selectedClassName="text-blue-500 border-b-2 border-blue-500"
            >
              Feeding Information
            </Tab>
          </TabList>
          <TabPanel>
            <div className="flex flex-wrap gap-6">
              {customerDetail.pets.map((pet) => (
                <div key={pet.id} className="">
                  <div className="flex gap-4">
                    <div className="p-4 border rounded-md bg-gray-100 text-gray-800 w-72">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Pet Details
                      </h3>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pet Name:</span>
                        <span>{pet.reservation_id.pet_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pet Breed:</span>
                        <span>{pet.reservation_id.pet_breed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check In:</span>
                        <span>{pet.reservation_id.start_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check Out:</span>
                        <span>{pet.reservation_id.end_date}</span>
                      </div>
                    </div>

                    <div className="p-4 border rounded-md bg-gray-100 text-gray-800 w-72">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Service Details
                      </h3>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        {pet.reservation_id.pickup ? (
                          <span className="text-green-500">
                            <FaCheck className="text-green-500" />
                          </span>
                        ) : (
                          <span className="text-red-500">
                            <FaTimes className="text-red-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Groom:</span>
                        {pet.reservation_id.groom ? (
                          <span className="text-green-500">
                            <FaCheck className="text-green-500" />
                          </span>
                        ) : (
                          <span className="text-red-500">
                            <FaTimes className="text-red-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Drop:</span>
                        {pet.reservation_id.drop ? (
                          <span className="text-green-500">
                            <FaCheck className="text-green-500" />
                          </span>
                        ) : (
                          <span className="text-red-500">
                            <FaTimes className="text-red-500" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 mt-4 border rounded-md bg-gray-100 text-gray-800 w-72">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Additional Details
                    </h3>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Dietary Requirements:
                      </span>
                      <span>{pet.dietary_requirements || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Special Care Instructions:
                      </span>
                      <span>{pet.special_care_instructions || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medical Notes:</span>
                      <span>{pet.medical_notes || "N/A"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>

          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block font-semibold text-gray-700">
                    Name
                  </label>
                  <div className="p-2 border rounded-md bg-gray-100 text-gray-800">
                    {customerDetail.customer_name}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-semibold text-gray-700">
                    Phone
                  </label>
                  <div className="p-2 border rounded-md bg-gray-100 text-gray-800">
                    {customerDetail.customer_phone}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-semibold text-gray-700">
                    Address
                  </label>
                  <div className="p-2 border rounded-md bg-gray-100 text-gray-800">
                    {customerDetail.customer_address}
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
  <div className="mt-4">
    <div className="flex items-center mb-4">
      <label className="mr-4 font-semibold text-gray-700">
        Filter by Date:
      </label>
      <input
        type="date"
        className="border rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={filterDate || ""}
        onChange={(e) => setFilterDate(e.target.value)}
      />
      <button
        className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        onClick={downloadPDF}
      >
        <FaDownload className="inline-block mr-2" />
        Download PDF
      </button>
    </div>
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        <thead className="ltr:text-left rtl:text-right bg-gray-200 text-gray-700">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 font-semibold">
              Feeding Date
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-semibold">
              Fed (Morning)
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-semibold">
              Fed (Noon)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filterDate
            ? filteredFeedings.filter(
                (feeding) =>
                  new Date(feeding.feeding_date).toISOString().slice(0, 10) ===
                  filterDate
              ).map((feeding, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-gray-100" : "bg-white"
                  } hover:bg-gray-200 transition-colors`}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    {new Date(feeding.feeding_date).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {feeding.morning_fed ? (
                      <span className="bg-green-500 text-white p-1 rounded">
                        Yes
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white p-1 rounded">
                        No
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {feeding.noon_fed ? (
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
              ))
            : filteredFeedings.map((feeding, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-gray-100" : "bg-white"
                  } hover:bg-gray-200 transition-colors`}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    {new Date(feeding.feeding_date).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {feeding.morning_fed ? (
                      <span className="bg-green-500 text-white p-1 rounded">
                        Yes
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white p-1 rounded">
                        No
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {feeding.noon_fed ? (
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
</TabPanel>
        </Tabs>
      </div>
    </Modal>
  );
};

export default CustomerDetailDialog;
