import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { FaTimes, FaCheck, FaDownload, FaSpinner, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Modal from "react-modal";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    maxWidth: "1200px",
    width: "80%",
    height: "96%",
    overflow: "auto",
    transition: "all 0.3s ease-in-out",
  },
};

const moveDialogStyles = {
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
    maxWidth: "600px",
    width: "50%",
    overflow: "auto",
    transition: "all 0.3s ease-in-out",
  },
};

const Button2 = ({ content, onClick, active, disabled }) => {
  return (
    <button
      className={`flex flex-col cursor-pointer items-center justify-center w-10 h-10 shadow-[0_4px_10px_rgba(0,0,0,0.1)] text-sm font-medium transition-colors rounded-lg
      ${active ? "bg-blue-600 text-white" : "text-blue-600"}
      ${
        !disabled
          ? "bg-white hover:bg-blue-600 hover:text-white"
          : "text-blue-300 bg-gray-100 cursor-not-allowed"
      }
      `}
      onClick={onClick}
      disabled={disabled}
      style={{ 
        backgroundColor: active ? "rgba(59, 130, 246, 1)" : "white", 
        color: active ? "white" : "rgba(59, 130, 246, 1)" 
      }}
    >
      {content}
    </button>
  );
};

const PaginationNav1 = ({ gotoPage, canPreviousPage, canNextPage, pageCount, pageIndex }) => {
  const renderPageLinks = () => {
    if (pageCount === 0) return null;
    const visiblePageButtonCount = 3;
    let numberOfButtons = pageCount < visiblePageButtonCount ? pageCount : visiblePageButtonCount;
    const pageIndices = [pageIndex];
    numberOfButtons--;
    [...Array(numberOfButtons)].forEach((_item, itemIndex) => {
      const pageNumberBefore = pageIndices[0] - 1;
      const pageNumberAfter = pageIndices[pageIndices.length - 1] + 1;
      if (pageNumberBefore >= 0 && (itemIndex < numberOfButtons / 2 || pageNumberAfter > pageCount - 1)) {
        pageIndices.unshift(pageNumberBefore);
      } else {
        pageIndices.push(pageNumberAfter);
      }
    });
    return pageIndices.map((pageIndexToMap) => (
      <li key={pageIndexToMap}>
        <Button2 content={pageIndexToMap + 1} onClick={() => gotoPage(pageIndexToMap)} active={pageIndex === pageIndexToMap} />
      </li>
    ));
  };

  return (
    <ul className="flex gap-2 justify-center mt-4">
      <li>
        <Button2
          content={
            <div className="flex">
              <FaChevronLeft size="0.6rem" />
              <FaChevronLeft size="0.6rem" className="-translate-x-1/2" />
            </div>
          }
          onClick={() => gotoPage(0)}
          disabled={!canPreviousPage}
        />
      </li>
      {renderPageLinks()}
      <li>
        <Button2
          content={
            <div className="flex">
              <FaChevronRight size="0.6rem" />
              <FaChevronRight size="0.6rem" className="-translate-x-1/2" />
            </div>
          }
          onClick={() => gotoPage(pageCount - 1)}
          disabled={!canNextPage}
        />
      </li>
    </ul>
  );
};

const CustomerDetailDialog = ({
  customer,
  isOpen,
  onClose,
  currentPage,
  setCurrentPage,
  totalPages,
}) => {
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
  const [overlappingReservations, setOverlappingReservations] = useState([]);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [availableKennels, setAvailableKennels] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    if (customer) {
      setKennelNumber(`Kennel ${customer.kennel_number} Details`);
    }
  }, [customer]);

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      if (customer) {
        const { data: reservations, error: reservationError } = await supabase
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
          .contains("kennel_ids", [customer.id])
          .order("start_date", { ascending: true });

        if (reservationError) {
          console.error(
            "Error fetching reservation details:",
            reservationError.message
          );
        } else {
          // Sort the reservations by status: 'checkin' first, then 'reserved'
          const sortedReservations = reservations.sort((a, b) => {
            if (a.status === 'checkin' && b.status === 'reserved') return -1;
            if (a.status === 'reserved' && b.status === 'checkin') return 1;
            return 0;
          });

          const pets = sortedReservations.map((reservation) => {
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
            } = reservation;

            return {
              pet_name,
              pet_breed,
              start_date,
              end_date,
              pickup,
              groom,
              drop,
              ...pet_information[0],
              customer_name: customers.customer_name,
              customer_phone: customers.customer_phone,
              customer_address: customers.customer_address,
            };
          });

          setCustomerDetail({
            customer_name: pets[currentPage]?.customer_name || "",
            customer_phone: pets[currentPage]?.customer_phone || "",
            customer_address: pets[currentPage]?.customer_address || "",
            pets: [pets[currentPage]],
            kennel_numbers: [customer.kennel_number],
          });

          setOverlappingReservations(sortedReservations);
        }
      }
    };

    fetchCustomerDetail();
  }, [customer, currentPage]);

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

  const handleMoveReservation = async (reservationId, newKennelId) => {
    try {
      // Get the current status of the new kennel
      const { data: newKennel, error: newKennelError } = await supabase
        .from("kennels")
        .select("status")
        .eq("id", newKennelId)
        .single();

      if (newKennelError) throw newKennelError;

      // Get the current status of the original kennel
      const { data: originalKennel, error: originalKennelError } = await supabase
        .from("kennels")
        .select("status")
        .eq("id", customer.id)
        .single();

      if (originalKennelError) throw originalKennelError;

      // Determine the new status for the selected kennel
      let newStatus = newKennel.status;
      if (newKennel.status === 'available' || (newKennel.status === 'reserved' && originalKennel.status === 'occupied')) {
        newStatus = originalKennel.status;
      }

      // Update the reservation with the new kennel ID
      const { error: updateReservationError } = await supabase
        .from("reservations")
        .update({ kennel_ids: [newKennelId] })
        .eq("id", reservationId);

      if (updateReservationError) throw updateReservationError;

      // Update the status of the new kennel
      const { error: updateNewKennelError } = await supabase
        .from("kennels")
        .update({ status: newStatus })
        .eq("id", newKennelId);

      if (updateNewKennelError) throw updateNewKennelError;

      // Check if the original kennel is now empty
      const { data: remainingReservations, error: remainingReservationsError } = await supabase
        .from("reservations")
        .select("id")
        .contains("kennel_ids", [customer.id]);

      if (remainingReservationsError) throw remainingReservationsError;

      if (remainingReservations.length === 0) {
        // Update the status of the original kennel to 'available'
        const { error: updateOriginalKennelError } = await supabase
          .from("kennels")
          .update({ status: 'available' })
          .eq("id", customer.id);

        if (updateOriginalKennelError) throw updateOriginalKennelError;
      } else {
        // Check the status of remaining reservations and update the kennel status accordingly
        const remainingStatuses = await supabase
          .from("reservations")
          .select("status")
          .contains("kennel_ids", [customer.id]);

        const hasCheckin = remainingStatuses.data.some((res) => res.status === "checkin");
        const hasReserved = remainingStatuses.data.some((res) => res.status === "reserved");

        let originalKennelStatus = "available";
        if (hasCheckin) {
          originalKennelStatus = "occupied";
        } else if (hasReserved) {
          originalKennelStatus = "reserved";
        }

        const { error: updateOriginalKennelStatusError } = await supabase
          .from("kennels")
          .update({ status: originalKennelStatus })
          .eq("id", customer.id);

        if (updateOriginalKennelStatusError) throw updateOriginalKennelStatusError;
      }

      fetchOverlappingReservations();
      toast.success("Reservation moved successfully!", { position: "bottom-center" });
      setIsMoveDialogOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error("Error moving reservation:", error.message);
      toast.error("Failed to move reservation. Please try again.", { position: "bottom-center" });
    }
  };

  const fetchAvailableKennels = async () => {
    const { data: kennels, error } = await supabase
      .from("kennels")
      .select("*")
      .in("status", ["available", "reserved"])
      .neq("id", customer.id) // Exclude the current kennel
      .order("kennel_number", { ascending: true });

    if (error) {
      console.error("Error fetching available kennels:", error.message);
    } else {
      setAvailableKennels(kennels);
    }
  };

  useEffect(() => {
    if (isMoveDialogOpen) {
      fetchAvailableKennels();
    }
  }, [isMoveDialogOpen]);

  const fetchOverlappingReservations = async () => {
    if (customer) {
      const { data: reservations, error: reservationError } = await supabase
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
        .contains("kennel_ids", [customer.id])
        .order("start_date", { ascending: true });

      if (reservationError) {
        console.error(
          "Error fetching reservation details:",
          reservationError.message
        );
      } else {
        setOverlappingReservations(reservations);

        // Fetch feeding information for the new kennel
        const { data: feedingData, error: feedingError } = await supabase
          .from("feeding_schedule")
          .select("*")
          .eq("kennel_id", customer.id);

        if (feedingError) {
          console.error("Error fetching feeding schedule:", feedingError.message);
        } else {
          const groupedData = feedingData.reduce((acc, entry) => {
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
    }
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 text-center -mt-5 mb-4 w-full">
            {kennelNumber}
          </h2>
          <button
            className="text-gray-600 hover:text-gray-900 focus:outline-none transition-colors duration-300 absolute right-4 top-4"
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
              Reservation Details
            </Tab>
            <Tab
              className="px-4 py-2 rounded-t-lg text-gray-600 cursor-pointer hover:text-gray-800 transition-colors duration-300"
              selectedClassName="bg-blue-500 text-white"
            >
              Feeding Information
            </Tab>
            <Tab
              className="px-4 py-2 rounded-t-lg text-gray-600 cursor-pointer hover:text-gray-800 transition-colors duration-300"
              selectedClassName="bg-blue-500 text-white"
            >
              Kennel Assignment
            </Tab>
          </TabList>
          <TabPanel className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-md bg-gray-100 text-gray-800 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Customer Details
                  </h3>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">Name:</span>
                    <span>{customerDetail.customer_name}</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">Phone:</span>
                    <span>{customerDetail.customer_phone}</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">Address:</span>
                    <span>{customerDetail.customer_address}</span>
                  </div>
                </div>
                <div className="p-4 border rounded-md bg-gray-100 text-gray-800 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Service Details
                  </h3>
                  <div className="mb-2 flex justify-between items-center">
                    <span className="font-bold text-gray-600">Pickup:</span>
                    {customerDetail.pets[0]?.pickup ? (
                      <FaCheck className="text-green-500 ml-2" />
                    ) : (
                      <FaTimes className="text-red-500 ml-2" />
                    )}
                  </div>
                  <div className="mb-2 flex justify-between items-center">
                    <span className="font-bold text-gray-600">Groom:</span>
                    {customerDetail.pets[0]?.groom ? (
                      <FaCheck className="text-green-500 ml-2" />
                    ) : (
                      <FaTimes className="text-red-500 ml-2" />
                    )}
                  </div>
                  <div className="mb-2 flex justify-between items-center">
                    <span className="font-bold text-gray-600">Drop:</span>
                    {customerDetail.pets[0]?.drop ? (
                      <FaCheck className="text-green-500 ml-2" />
                    ) : (
                      <FaTimes className="text-red-500 ml-2" />
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-md bg-gray-100 text-gray-800 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Pet Details
                  </h3>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">Pet Name:</span>
                    <span>{customerDetail.pets[0]?.pet_name}</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">Pet Breed:</span>
                    <span>{customerDetail.pets[0]?.pet_breed}</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">Check In:</span>
                    <span>{customerDetail.pets[0]?.start_date}</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">Check Out:</span>
                    <span>{customerDetail.pets[0]?.end_date}</span>
                  </div>
                </div>
                <div className="p-4 border rounded-md bg-gray-100 text-gray-800 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Additional Details
                  </h3>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">
                      Dietary Requirements:
                    </span>
                    <span>{customerDetail.pets[0]?.dietary_requirements || "N/A"}</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">
                      Special Care Instructions:
                    </span>
                    <span>{customerDetail.pets[0]?.special_care_instructions || "N/A"}</span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span className="font-bold text-gray-600">
                      Medical Notes:
                    </span>
                    <span>{customerDetail.pets[0]?.medical_notes || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
            {totalPages > 1 && (
              <PaginationNav1
                gotoPage={setCurrentPage}
                canPreviousPage={currentPage > 0}
                canNextPage={currentPage < totalPages - 1}
                pageCount={totalPages}
                pageIndex={currentPage}
              />
            )}
          </TabPanel>

          <TabPanel className="mt-6">
            <div className="mt-4">
              <div className="flex items-center mb-4">
                <label className="mr-4 font-semibold text-gray-700">
                  Filter by Date:
                </label>
                <ReactDatePicker
                  selected={filterDate}
                  onChange={(date) => setFilterDate(date)}
                  className="border rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300"
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
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right">
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
                                className={`hover:bg-gray-100 transition-colors duration-300 ${
                                  index % 2 === 0
                                    ? "bg-gray-100"
                                    : "bg-white"
                                }`}
                              >
                                <td className="whitespace-nowrap  px-3 py-2">
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
                              className={`hover:bg-gray-100 transition-colors duration-300 ${
                                index % 2 === 0 ? "bg-gray-100" : "bg-white"
                              }`}
                            >
                              <td className="whitespace-nowrap text-center px-3 py-2">
                                {new Date(
                                  feeding.feeding_date
                                ).toLocaleDateString()}
                              </td>
                              <td className="whitespace-nowrap text-center px-3 py-2">
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
                              <td className="whitespace-nowrap text-center px-3 py-2">
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

          <TabPanel className="mt-6">
            <div className="mt-4">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right">
                    <tr>
                      <th className="whitespace-nowrap text-center px-4 py-2 font-medium text-gray-900">
                        Customer Name
                      </th>
                      <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        Phone Number
                      </th>
                      <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        Pet Name
                      </th>
                      <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        Pet Breed
                      </th>
                      <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        Check-in Date
                      </th>
                      <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        Check-out Date
                      </th>
                      <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {overlappingReservations.map((reservation, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-gray-100 transition-colors duration-300 ${
                          index % 2 === 0 ? "bg-gray-100" : "bg-white"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 text-center py-2 font-medium text-gray-900">
                          {reservation.customers.customer_name}
                        </td>
                        <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                          {reservation.customers.customer_phone}
                        </td>
                        <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                          {reservation.pet_name}
                        </td>
                        <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                          {reservation.pet_breed}
                        </td>
                        <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                          {new Date(reservation.start_date).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                          {new Date(reservation.end_date).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                          <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setIsMoveDialogOpen(true);
                            }}
                          >
                            Move
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabPanel>
        </Tabs>

        {isMoveDialogOpen && (
          <Modal
            isOpen={isMoveDialogOpen}
            onRequestClose={() => setIsMoveDialogOpen(false)}
            style={moveDialogStyles}
            contentLabel="Move Reservation"
            ariaHideApp={false}
          >
            <div className="bg-white p-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Move Reservation
                </h2>
                <button
                  className="text-gray-600 hover:text-gray-900 focus:outline-none transition-colors duration-300"
                  onClick={() => setIsMoveDialogOpen(false)}
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
                  <thead className="bg-gray-100 top-0 sticky text-gray-700">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold">
                        Kennel Number
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {availableKennels.map((kennel, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-gray-100 transition-colors duration-300 ${
                          index % 2 === 0 ? "bg-gray-100" : "bg-white"
                        }`}
                      >
                        <td className="whitespace-nowrap text-center px-3 py-2">
                          {kennel.kennel_number}
                        </td>
                        <td className="whitespace-nowrap text-center px-3 py-2">
                          {kennel.status}
                        </td>
                        <td className="whitespace-nowrap text-center px-3 py-2">
                          <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
                            onClick={() =>
                              handleMoveReservation(
                                selectedReservation.id,
                                kennel.id
                              )
                            }
                          >
                            Move Here
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
};
export default CustomerDetailDialog;
