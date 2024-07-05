import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
  FaTimes,
  FaEdit,
  FaCheck,
  FaDownload,
  FaSpinner,
} from "react-icons/fa";
import Modal from "react-modal";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
    borderRadius: "12px",
    maxWidth: "900px",
    width: "50%",
    maxHeight: "90vh",
    height: "80%",
    overflow: "auto",
    transition: "all 0.3s ease-in-out",
  },
};

const CalendarDetailDialog = ({ customer, isOpen, onClose }) => {
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
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      if (customer) {
        const { data, error } = await supabase
          .from("reservations")
          .select(
            `
            *,
            pet_information (
              id,
              dietary_requirements,
              special_care_instructions,
              medical_notes
            ),
            customers:customer_id (
              customer_name,
              customer_phone,
              customer_address
            )
          `
          )
          .eq("id", customer.id) // Filter by reservation ID
          .single();

        if (error) {
          console.error(
            "Error fetching reservation details:",
            error.message
          );
        } else if (data) {
          const {
            pet_name,
            pet_breed,
            start_date,
            end_date,
            pickup,
            groom,
            drop,
            pet_information,
            customers,
            kennel_ids,
          } = data;

          // Fetch kennel numbers based on kennel_ids
          const { data: kennelsData, error: kennelsError } = await supabase
            .from("kennels")
            .select("kennel_number")
            .in("id", kennel_ids);

          if (kennelsError) {
            console.error("Error fetching kennel numbers:", kennelsError.message);
          } else {
            setCustomerDetail({
              customer_name: customers.customer_name,
              customer_phone: customers.customer_phone,
              customer_address: customers.customer_address,
              pets: [
                {
                  pet_name,
                  pet_breed,
                  start_date,
                  end_date,
                  pickup,
                  groom,
                  drop,
                  ...pet_information[0],
                },
              ],
              kennel_numbers: kennelsData.map((kennel) => kennel.kennel_number),
            });
          }
        } else {
          console.error("No reservations found for this customer.");
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

  const downloadPDF = async () => {
    setIsDownloadingPDF(true);
    const doc = new jsPDF();
    const tableData = filteredFeedings.map((feeding) => [
      new Date(feeding.feeding_date).toLocaleDateString(),
      feeding.morning_fed ? "Yes" : "No",
      feeding.noon_fed ? "Yes" : "No",
    ]);

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Feeding Information", 20, 20);

    doc.autoTable({
      startY: 40,
      head: [["Date", "Morning", "Noon"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [100, 100, 255],
        textColor: [255, 255, 255],
        fontSize: 14,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 12,
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [240, 240, 255],
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        font: "helvetica",
        fontStyle: "normal",
        overflow: "linebreak",
      },
      margin: { top: 40, right: 20, bottom: 20, left: 20 },
    });

    doc.save("feeding_information.pdf");
    setIsDownloadingPDF(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Customer Details"
      ariaHideApp={false}
    >
      <div className="bg-white p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">{kennelNumber}</h2>
          <button
            className="text-gray-600 hover:text-gray-900 focus:outline-none transition-colors duration-300"
            onClick={onClose}
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        <Tabs>
          <TabList className="flex border-b border-gray-300">
            <Tab
              className="px-4 py-2 rounded-t-lg text-gray-600 cursor-pointer hover:text-gray-800 transition-colors duration-300"
              selectedClassName="bg-blue-500 text-white"
            >
              Pet Information
            </Tab>
            <Tab
              className="px-4 py-2 rounded-t-lg text-gray-600 cursor-pointer hover:text-gray-800 transition-colors duration-300"
              selectedClassName="bg-blue-500 text-white"
            >
              Customer Information
            </Tab>
            <Tab
              className="px-4 py-2 rounded-t-lg text-gray-600 cursor-pointer hover:text-gray-800 transition-colors duration-300"
              selectedClassName="bg-blue-500 text-white"
            >
              Feeding Information
            </Tab>
          </TabList>
          <TabPanel className={"mt-6"}>
            <div className="flex flex-wrap gap-6">
              {customerDetail.pets && customerDetail.pets.length > 0 ? (
                customerDetail.pets.map((pet) => (
                  <div key={pet.pet_name} className="">
                    <div className="flex gap-4">
                      <div className="p-4 border rounded-md bg-gray-100 text-gray-800 w-72">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Pet Details
                        </h3>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pet Name:</span>
                          <span>{pet.pet_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pet Breed:</span>
                          <span>{pet.pet_breed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check In:</span>
                          <span>{pet.start_date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check Out:</span>
                          <span>{pet.end_date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kennel Number:</span>
                          <span>{customerDetail.kennel_numbers.join(", ")}</span>
                        </div>
                      </div>

                      <div className="p-4 border rounded-md bg-gray-100 text-gray-800 w-72">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Service Details
                        </h3>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pickup:</span>
                          {pet.pickup ? (
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
                          {pet.groom ? (
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
                          {pet.drop ? (
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

                    <div className="p-4 mt-4 border rounded-md bg-gray-100 text-gray-800 w-8/12">
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
                ))
              ) : (
                <p className="text-gray-600">No pet information available.</p>
              )}
            </div>
          </TabPanel>

          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Name
                  </label>
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-700 shadow-sm">
                    {customerDetail.customer_name}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Phone
                  </label>
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-700 shadow-sm">
                    {customerDetail.customer_phone}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Address
                  </label>
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-700 shadow-sm">
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
                  className="border rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300"
                  value={filterDate || ""}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                <button
                  className="ml-4 bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300 flex items-center"
                  onClick={downloadPDF}
                  disabled={isDownloadingPDF}
                >
                  {isDownloadingPDF ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaDownload className="mr-2" />
                  )}
                  Download PDF
                </button>
              </div>
              <div className="rounded-lg border border-gray-200 shadow-md">
                <div className="max-h-72 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
                    <thead className="bg-gray-100 top-0 sticky text-gray-700">
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
                        ? filteredFeedings
                            .filter(
                              (feeding) =>
                                new Date(feeding.feeding_date)
                                  .toISOString()
                                  .slice(0, 10) === filterDate
                            )
                            .map((feeding, index) => (
                              <tr
                                key={index}
                                className={`${
                                  index % 2 === 0
                                    ? "bg-gray-100"
                                    : "bg-white hover:bg-gray-100 transition-colors duration-300"
                                } hover:bg-gray-200`}
                              >
                                <td className="whitespace-nowrap px-3 py-2">
                                  {new Date(
                                    feeding.feeding_date
                                  ).toLocaleDateString()}
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
                                index % 2 === 0
                                  ? "bg-gray-100"
                                  : "bg-white hover:bg-gray-100 transition-colors duration-300"
                              } hover:bg-gray-200`}
                            >
                              <td className="whitespace-nowrap px-3 py-2">
                                {new Date(
                                  feeding.feeding_date
                                ).toLocaleDateString()}
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
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </Modal>
  );
};

export default CalendarDetailDialog;
