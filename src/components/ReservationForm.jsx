import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useForm, Controller } from "react-hook-form";
import { supabase } from "../supabase";
import { FaCalendarAlt } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSearchParams } from 'react-router-dom';

const petBreeds = [
  "Affenpinscher",
  "Afghan Hound",
  "Aidi",
  "Airedale Terrier",
  "Akbash Dog",
  "Akita",
  "Alano Español",
  "Alaskan Klee Kai",
  "Alaskan Malamute",
  "Alpine Dachsbracke",
  "Alpine Spaniel",
  "American Bulldog",
  "American Cocker Spaniel",
  "American Eskimo Dog",
  "American Foxhound",
  "American Hairless Terrier",
  "American Pit Bull Terrier",
  "American Staffordshire Terrier",
  "American Water Spaniel",
  "Anglo-Français de Petite Vénerie",
  "Appenzeller Sennenhund",
  "Ariege Pointer",
  "Ariegeois",
  "Armant",
  "Armenian Gampr dog",
  "Artois Hound",
  "Australian Cattle Dog",
  "Australian Kelpie",
  "Australian Shepherd",
  "Australian Silky Terrier",
  "Australian Stumpy Tail Cattle Dog",
  "Australian Terrier",
  "Azawakh",
  "Bakharwal Dog",
  "Barbet",
  "Basenji",
  "Basque Shepherd Dog",
  "Basset Artésien Normand",
  "Basset Bleu de Gascogne",
  "Basset Fauve de Bretagne",
  "Basset Hound",
  "Bavarian Mountain Hound",
  "Beagle",
  "Beagle-Harrier",
  "Bearded Collie",
  "Beauceron",
  "Bedlington Terrier",
  "Belgian Shepherd Dog (Groenendael)",
  "Belgian Shepherd Dog (Laekenois)",
  "Belgian Shepherd Dog (Malinois)",
  "Bergamasco Shepherd",
  "Berger Blanc Suisse",
  "Berger Picard",
  "Berner Laufhund",
  "Bernese Mountain Dog",
  "Billy",
  "Black and Tan Coonhound",
  "Black and Tan Virginia Foxhound",
  "Black Norwegian Elkhound",
  "Black Russian Terrier",
  "Bloodhound",
  "Blue Lacy",
  "Blue Paul Terrier",
  "Boerboel",
  "Bohemian Shepherd",
  "Bolognese",
  "Border Collie",
  "Border Terrier",
  "Borzoi",
  "Boston Terrier",
  "Bouvier des Ardennes",
  "Bouvier des Flandres",
  "Boxer",
  "Boykin Spaniel",
  "Bracco Italiano",
  "Braque d'Auvergne",
  "Braque du Bourbonnais",
  "Braque du Puy",
  "Braque Francais",
  "Braque Saint-Germain",
  "Brazilian Terrier",
  "Briard",
  "Briquet Griffon Vendéen",
  "Brittany",
  "Broholmer",
  "Bruno Jura Hound",
  "Bucovina Shepherd Dog",
  "Bull and Terrier",
  "Bull Terrier (Miniature)",
  "Bull Terrier",
  "Bulldog",
  "Bullenbeisser",
  "Bullmastiff",
  "Bully Kutta",
  "Burgos Pointer",
  "Cairn Terrier",
  "Canaan Dog",
  "Canadian Eskimo Dog",
  "Cane Corso",
  "Cardigan Welsh Corgi",
  "Carolina Dog",
  "Carpathian Shepherd Dog",
  "Catahoula Cur",
  "Catalan Sheepdog",
  "Caucasian Shepherd Dog",
  "Cavalier King Charles Spaniel",
  "Central Asian Shepherd Dog",
  "Cesky Fousek",
  "Cesky Terrier",
  "Chesapeake Bay Retriever",
  "Chien Français Blanc et Noir",
  "Chien Français Blanc et Orange",
  "Chien Français Tricolore",
  "Chien-gris",
  "Chihuahua",
  "Chilean Fox Terrier",
  "Chinese Chongqing Dog",
  "Chinese Crested Dog",
  "Chinese Imperial Dog",
  "Chinook",
  "Chippiparai",
  "Chow Chow",
  "Cierny Sery",
  "Cimarrón Uruguayo",
  "Cirneco dell'Etna",
  "Clumber Spaniel",
  "Combai",
  "Cordoba Fighting Dog",
  "Coton de Tulear",
  "Cretan Hound",
  "Croatian Sheepdog",
  "Cumberland Sheepdog",
  "Curly Coated Retriever",
  "Cursinu",
  "Cão da Serra de Aires",
  "Cão de Castro Laboreiro",
  "Cão Fila de São Miguel",
  "Dachshund",
  "Dalmatian",
  "Dandie Dinmont Terrier",
  "Danish Swedish Farmdog",
  "Deutsche Bracke",
  "Doberman Pinscher",
  "Dogo Argentino",
  "Dogo Cubano",
  "Dogue de Bordeaux",
  "Drentse Patrijshond",
  "Drever",
  "Dunker",
  "Dutch Shepherd Dog",
  "Dutch Smoushond",
  "East Siberian Laika",
  "East-European Shepherd",
  "Elo",
  "English Cocker Spaniel",
  "English Foxhound",
  "English Mastiff",
  "English Setter",
  "English Shepherd",
  "English Springer Spaniel",
  "English Toy Terrier (Black &amp; Tan)",
  "English Water Spaniel",
  "English White Terrier",
  "Entlebucher Mountain Dog",
  "Estonian Hound",
  "Estrela Mountain Dog",
  "Eurasier",
  "Field Spaniel",
  "Fila Brasileiro",
  "Finnish Hound",
  "Finnish Lapphund",
  "Finnish Spitz",
  "Flat-Coated Retriever",
  "Formosan Mountain Dog",
  "Fox Terrier (Smooth)",
  "French Bulldog",
  "French Spaniel",
  "Galgo Español",
  "Gascon Saintongeois",
  "German Longhaired Pointer",
  "German Pinscher",
  "German Shepherd",
  "German Shorthaired Pointer",
  "German Spaniel",
  "German Spitz",
  "German Wirehaired Pointer",
  "Giant Schnauzer",
  "Glen of Imaal Terrier",
  "Golden Retriever",
  "Gordon Setter",
  "Gran Mastín de Borínquen",
  "Grand Anglo-Français Blanc et Noir",
  "Grand Anglo-Français Blanc et Orange",
  "Grand Anglo-Français Tricolore",
  "Grand Basset Griffon Vendéen",
  "Grand Bleu de Gascogne",
  "Grand Griffon Vendéen",
  "Great Dane",
  "Great Pyrenees",
  "Greater Swiss Mountain Dog",
  "Greek Harehound",
  "Greenland Dog",
  "Greyhound",
  "Griffon Bleu de Gascogne",
  "Griffon Bruxellois",
  "Griffon Fauve de Bretagne",
  "Griffon Nivernais",
  "Hamiltonstövare",
  "Hanover Hound",
  "Hare Indian Dog",
  "Harrier",
  "Havanese",
  "Hawaiian Poi Dog",
  "Himalayan Sheepdog",
  "Hokkaido",
  "Hovawart",
  "Huntaway",
  "Hygenhund",
  "Ibizan Hound",
  "Icelandic Sheepdog",
  "Indian pariah dog",
  "Indian Spitz",
  "Irish Red and White Setter",
  "Irish Setter",
  "Irish Terrier",
  "Irish Water Spaniel",
  "Irish Wolfhound",
  "Istrian Coarse-haired Hound",
  "Istrian Shorthaired Hound",
  "Italian Greyhound",
  "Jack Russell Terrier",
  "Jonangi",
  "Jagdterrier",
  "Jämthund",
  "Kai Ken",
  "Kaikadi",
  "Kanni",
  "Karelian Bear Dog",
  "Karst Shepherd",
  "Keeshond",
  "Kerry Beagle",
  "Kerry Blue Terrier",
  "King Charles Spaniel",
  "King Shepherd",
  "Kintamani",
  "Kishu",
  "Komondor",
  "Kooikerhondje",
  "Koolie",
  "Korean Jindo Dog",
  "Kromfohrländer",
  "Kumaon Mastiff",
  "Kurī",
  "Kuvasz",
  "Kyi-Leo",
  "Labrador Husky",
  "Labrador Retriever",
  "Lagotto Romagnolo",
  "Lakeland Terrier",
  "Lancashire Heeler",
  "Landseer",
  "Lapponian Herder",
  "Large Münsterländer",
  "Leonberger",
  "Lhasa Apso",
  "Lithuanian Hound",
  "Longhaired Whippet",
  "Löwchen",
  "Mahratta Greyhound",
  "Maltese",
  "Manchester Terrier",
  "Maremma Sheepdog",
  "McNab",
  "Mexican Hairless Dog",
  "Miniature American Shepherd",
  "Miniature Australian Shepherd",
  "Miniature Fox Terrier",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Miniature Shar Pei",
  "Molossus",
  "Montenegrin Mountain Hound",
  "Moscow Watchdog",
  "Moscow Water Dog",
  "Mountain Cur",
  "Mucuchies",
  "Mudhol Hound",
  "Mudi",
  "Neapolitan Mastiff",
  "New Zealand Heading Dog",
  "Newfoundland",
  "Norfolk Spaniel",
  "Norfolk Terrier",
  "Norrbottenspets",
  "North Country Beagle",
  "Northern Inuit Dog",
  "Norwegian Buhund",
  "Norwegian Elkhound",
  "Norwegian Lundehund",
  "Norwich Terrier",
  "Old Croatian Sighthound",
  "Old Danish Pointer",
  "Old English Sheepdog",
  "Old English Terrier",
  "Old German Shepherd Dog",
  "Olde English Bulldogge",
  "Otterhound",
  "Pachon Navarro",
  "Paisley Terrier",
  "Pandikona",
  "Papillon",
  "Parson Russell Terrier",
  "Patterdale Terrier",
  "Pekingese",
  "Pembroke Welsh Corgi",
  "Perro de Presa Canario",
  "Perro de Presa Mallorquin",
  "Peruvian Hairless Dog",
  "Petit Basset Griffon Vendéen",
  "Petit Bleu de Gascogne",
  "Phalène",
  "Pharaoh Hound",
  "Phu Quoc ridgeback dog",
  "Picardy Spaniel",
  "Plott Hound",
  "Podenco Canario",
  "Pointer (dog breed)",
  "Polish Greyhound",
  "Polish Hound",
  "Polish Hunting Dog",
  "Polish Lowland Sheepdog",
  "Polish Tatra Sheepdog",
  "Pomeranian",
  "Pont-Audemer Spaniel",
  "Poodle",
  "Porcelaine",
  "Portuguese Podengo",
  "Portuguese Pointer",
  "Portuguese Water Dog",
  "Posavac Hound",
  "Pražský Krysařík",
  "Pudelpointer",
  "Pug",
  "Puli",
  "Pumi",
  "Pungsan Dog",
  "Pyrenean Mastiff",
  "Pyrenean Shepherd",
  "Rafeiro do Alentejo",
  "Rajapalayam",
  "Rampur Greyhound",
  "Rastreador Brasileiro",
  "Rat Terrier",
  "Ratonero Bodeguero Andaluz",
  "Redbone Coonhound",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Rough Collie",
  "Russell Terrier",
  "Russian Spaniel",
  "Russian tracker",
  "Russo-European Laika",
  "Sabueso Español",
  "Saint-Usuge Spaniel",
  "Sakhalin Husky",
  "Saluki",
  "Samoyed",
  "Sapsali",
  "Schapendoes",
  "Schillerstövare",
  "Schipperke",
  "Schweizer Laufhund",
  "Schweizerischer Niederlaufhund",
  "Scotch Collie",
  "Scottish Deerhound",
  "Scottish Terrier",
  "Sealyham Terrier",
  "Segugio Italiano",
  "Seppala Siberian Sleddog",
  "Serbian Hound",
  "Serbian Tricolour Hound",
  "Shar Pei",
  "Shetland Sheepdog",
  "Shiba Inu",
  "Shih Tzu",
  "Shikoku",
  "Shiloh Shepherd Dog",
  "Siberian Husky",
  "Silken Windhound",
  "Sinhala Hound",
  "Skye Terrier",
  "Sloughi",
  "Slovak Cuvac",
  "Slovakian Rough-haired Pointer",
  "Small Greek Domestic Dog",
  "Small Münsterländer",
  "Smooth Collie",
  "South Russian Ovcharka",
  "Southern Hound",
  "Spanish Mastiff",
  "Spanish Water Dog",
  "Spinone Italiano",
  "Sporting Lucas Terrier",
  "St. Bernard",
  "St. John's water dog",
  "Stabyhoun",
  "Staffordshire Bull Terrier",
  "Standard Schnauzer",
  "Stephens Cur",
  "Styrian Coarse-haired Hound",
  "Sussex Spaniel",
  "Swedish Lapphund",
  "Swedish Vallhund",
  "Tahltan Bear Dog",
  "Taigan",
  "Talbot",
  "Tamaskan Dog",
  "Teddy Roosevelt Terrier",
  "Telomian",
  "Tenterfield Terrier",
  "Thai Bangkaew Dog",
  "Thai Ridgeback",
  "Tibetan Mastiff",
  "Tibetan Spaniel",
  "Tibetan Terrier",
  "Tornjak",
  "Tosa",
  "Toy Bulldog",
  "Toy Fox Terrier",
  "Toy Manchester Terrier",
  "Toy Trawler Spaniel",
  "Transylvanian Hound",
  "Treeing Cur",
  "Treeing Walker Coonhound",
  "Trigg Hound",
  "Tweed Water Spaniel",
  "Tyrolean Hound",
  "Vizsla",
  "Volpino Italiano",
  "Weimaraner",
  "Welsh Sheepdog",
  "Welsh Springer Spaniel",
  "Welsh Terrier",
  "West Highland White Terrier",
  "West Siberian Laika",
  "Westphalian Dachsbracke",
  "Wetterhoun",
  "Whippet",
  "White Shepherd",
  "Wire Fox Terrier",
  "Wirehaired Pointing Griffon",
  "Wirehaired Vizsla",
  "Yorkshire Terrier",
  "Šarplaninac",
  "Abyssinian",
  "Aegean",
  "American Bobtail",
  "American Curl",
  "American Shorthair",
  "American Wirehair",
  "Arabian Mau",
  "Asian",
  "Asian Semi-longhair",
  "Australian Mist",
  "Balinese",
  "Bambino",
  "Bengal",
  "Birman",
  "Bombay",
  "Brazilian Shorthair",
  "British Longhair",
  "British Semi-longhair",
  "British Shorthair",
  "Burmese",
  "Burmilla",
  "California Spangled",
  "Chantilly-Tiffany",
  "Chartreux",
  "Chausie",
  "Cheetoh",
  "Colorpoint Shorthair",
  "Cornish Rex",
  "Cymric",
  "Cyprus",
  "Devon Rex",
  "Donskoy",
  "Dragon Li",
  "Dwarf cat",
  "Egyptian Mau",
  "European Shorthair",
  "Exotic Shorthair",
  "Foldex",
  "German Rex",
  "Havana Brown",
  "Highlander",
  "Himalayan",
  "Japanese Bobtail",
  "Javanese",
  "Khao Manee",
  "Korat",
  "Korean Bobtail",
  "Korn Ja",
  "Kurilian Bobtail",
  "LaPerm",
  "Lykoi",
  "Maine Coon",
  "Manx",
  "Mekong Bobtail",
  "Minskin",
  "Munchkin",
  "Napoleon",
  "Nebelung",
  "Norwegian Forest cat",
  "Ocicat",
  "Ojos Azules",
  "Oregon Rex",
  "Oriental Bicolor",
  "Oriental Longhair",
  "Oriental Shorthair",
  "PerFold",
  "Persian",
  "Peterbald",
  "Pixie-bob",
  "Raas",
  "Ragamuffin",
  "Ragdoll",
  "Russian Blue",
  "Russian White, Black and Tabby",
  "Sam Sawet",
  "Savannah",
  "Scottish Fold",
  "Selkirk Rex",
  "Serengeti",
  "Serrade Petit",
  "Siamese",
  "Siberian",
  "Singapura",
  "Snowshoe",
  "Sokoke",
  "Somali",
  "Sphynx",
  "Suphalak",
  "Thai",
  "Thai Lilac",
  "Tonkinese",
  "Toyger",
  "Turkish Angora",
  "Turkish Van",
  "Ukrainian Levkoy"
];

const ReservationForm = () => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const [availableKennels, setAvailableKennels] = useState([]);
  const [selectedKennels, setSelectedKennels] = useState([]);
  const [pets, setPets] = useState([]);
  const [currentPet, setCurrentPet] = useState({
    name: "",
    breed: "",
    pickup: false,
    groom: false,
    drop: false,
  });
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [currentKennel, setCurrentKennel] = useState(null);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const [showBreedOptions, setShowBreedOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const startDateParam = searchParams.get('start_date');
    if (startDateParam) {
      setValue('startDate', new Date(startDateParam));
    }
  }, [searchParams, setValue]);

  const fetchCustomerDetails = async (phone) => {
    const { data, error } = await supabase
      .from("customers")
      .select("customer_name, customer_address")
      .eq("customer_phone", phone)
      .single();

    if (error) {
      console.error("Error fetching customer details:", error.message);
      return null;
    }

    return data;
  };

  const handleCustomerPhoneChange = async (e) => {
    const phone = e.target.value;
    setValue("customerPhone", phone);

    if (phone.trim() !== "") {
      const customerData = await fetchCustomerDetails(phone);
      if (customerData) {
        setValue("customerName", customerData.customer_name);
        setValue("customerAddress", customerData.customer_address);
      } else {
        if (!watch("customerName").trim() && !watch("customerAddress").trim()) {
          setValue("customerName", "");
          setValue("customerAddress", "");
        }
      }
    } else {
      setValue("customerName", "");
      setValue("customerAddress", "");
    }
  };

  const fetchAvailableKennels = async () => {
    // Fetch all kennels that are not under maintenance
    const { data: kennels, error: kennelError } = await supabase
      .from("kennels")
      .select("*")
      .neq("set_name", "Maintenance")
      .order("created_at", { ascending: true });
  
    if (kennelError) {
      console.error("Error fetching kennels:", kennelError.message);
      return;
    }
  
    // Fetch all current reservations to check occupied kennels and their checkout dates
    const { data: reservations, error: reservationError } = await supabase
      .from("reservations")
      .select("kennel_ids, start_date, end_date");
  
    if (reservationError) {
      console.error("Error fetching reservations:", reservationError.message);
      return;
    }
  
    const availableKennels = kennels.map((kennel) => {
      // Check if the kennel is reserved
      const conflictingReservations = reservations.filter((reservation) => {
        return reservation.kennel_ids.includes(kennel.id);
      });
  
      if (conflictingReservations.length > 0) {
        // If reserved, attach the checkout date to the kennel info
        return {
          ...kennel,
          occupied: true,
          checkoutDate: new Date(conflictingReservations[0].end_date),
        };
      } else {
        // If not reserved, it's available
        return {
          ...kennel,
          occupied: false,
        };
      }
    });
  
    setAvailableKennels(availableKennels);
  };
  

  const createReservation = async (data) => {
    if (validateForm(data)) {
      setLoading(true);
      let customerData;
  
      const { data: existingCustomers, error: fetchCustomerError } =
        await supabase
          .from("customers")
          .select("*")
          .eq("customer_phone", data.customerPhone);
  
      if (fetchCustomerError) {
        console.error("Error fetching customer:", fetchCustomerError.message);
        toast.error("Failed to fetch customer details.", { position: "bottom-center" });
        setLoading(false);
        return;
      }
  
      if (existingCustomers.length > 0) {
        customerData = existingCustomers[0];
      } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert([
            {
              customer_name: data.customerName,
              customer_phone: data.customerPhone,
              customer_address: data.customerAddress,
            },
          ])
          .select();
  
        if (newCustomerError) {
          console.error("Error creating customer:", newCustomerError.message);
          toast.error("Failed to create customer.", { position: "bottom-center" });
          setLoading(false);
          return;
        }
  
        customerData = newCustomer[0];
      }
  
      const reservationStatus =
        data.endDate < new Date() ? "checked_out" : "reserved";
  
      for (const pet of pets) {
        const advanceAmount = data.advanceAmount ? parseFloat(data.advanceAmount) : 0; // Default to 0 if empty
  
        const { error: reservationError } = await supabase
          .from("reservations")
          .insert({
            customer_id: customerData.id,
            pet_name: pet.name,
            pet_breed: pet.breed,
            start_date: toUTCDate(data.startDate),
            end_date: toUTCDate(data.endDate),
            status: reservationStatus,
            kennel_ids: [pet.kennel.id],
            pickup: pet.pickup,
            groom: pet.groom,
            drop: pet.drop,
            advance_amount: advanceAmount, // Ensure numeric value is passed
          });
  
        if (reservationError) {
          console.error("Error creating reservation:", reservationError.message);
          toast.error("Failed to create reservation.", { position: "bottom-center" });
          setLoading(false);
          return;
        } else {
          const { data: kennelData, error: fetchKennelError } = await supabase
            .from("kennels")
            .select("status")
            .eq("id", pet.kennel.id)
            .single();
  
          if (fetchKennelError) {
            console.error("Error fetching kennel status:", fetchKennelError.message);
            toast.error("Failed to update kennel status.", { position: "bottom-center" });
            setLoading(false);
            return;
          }
  
          const currentStatus = kennelData.status;
          const newStatus =
            reservationStatus === "checked_out" ? "available" : reservationStatus;
  
          if (
            (currentStatus === "available" && newStatus === "reserved") ||
            (currentStatus === "reserved" && newStatus === "occupied") ||
            (currentStatus === "available" && newStatus === "occupied")
          ) {
            await supabase
              .from("kennels")
              .update({ status: newStatus })
              .eq("id", pet.kennel.id);
          }
        }
      }
  
      toast.success("Reservation created successfully!", { position: "bottom-center" });
      clearForm();
      setLoading(false);
    }
  };
  

  const toUTCDate = (date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return utcDate.toISOString();
  };

  const validateForm = (data) => {
    const newErrors = {};
    let isValid = true;

    if (!data.customerName) {
      newErrors.customerName = "Please enter the customer name";
      isValid = false;
    }

    if (!data.customerPhone) {
      newErrors.customerPhone = "Please enter the customer phone number";
      isValid = false;
    }

    if (!data.customerAddress) {
      newErrors.customerAddress = "Please enter the customer address";
      isValid = false;
    }

    if (!data.startDate) {
      newErrors.startDate = "Please select Check In date";
      isValid = false;
    }

    if (!data.endDate) {
      newErrors.endDate = "Please select Check Out date";
      isValid = false;
    }

    if (selectedKennels.length === 0) {
      newErrors.selectedKennels = "Please select at least one kennel";
      isValid = false;
    }

    setValue("errors", newErrors);
    return isValid;
  };

  const handleKennelSelection = (kennel) => {
    const existingPet = pets.find((pet) => pet.kennel.id === kennel.id);
    if (existingPet) {
      setCurrentPet(existingPet);
    } else {
      setCurrentPet({
        name: "",
        breed: "",
        pickup: false,
        groom: false,
        drop: false,
      });
    }
    setCurrentKennel(kennel);
    setIsPetDialogOpen(true);
  };

  const handlePetDialogSave = () => {
    if (currentPet.name && currentPet.breed) {
      const updatedPets = pets.filter(
        (pet) => pet.kennel.id !== currentKennel.id
      );
      setPets([...updatedPets, { ...currentPet, kennel: currentKennel }]);
      setSelectedKennels([...selectedKennels, currentKennel]);
      setIsPetDialogOpen(false);
    }
  };

  const handleBreedInputChange = (e) => {
    const breed = e.target.value;
    setCurrentPet({ ...currentPet, breed });

    if (breed.trim() !== "") {
      const filtered = petBreeds.filter((b) =>
        b.toLowerCase().includes(breed.toLowerCase())
      );
      setFilteredBreeds(filtered);
      setShowBreedOptions(true);
    } else {
      setFilteredBreeds([]);
      setShowBreedOptions(false);
    }
  };

  const handleBreedSelect = (breed) => {
    setCurrentPet({ ...currentPet, breed });
    setShowBreedOptions(false);
  };

  const clearForm = () => {
    reset();
    setSelectedKennels([]);
    setPets([]);
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchAvailableKennels();
    }
  }, [startDate, endDate]);

  return (
    <div className="max-w-screen-xl mx-auto p-6 bg-white">
      <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar={false} />
      <h2 className="text-2xl font-bold mb-6 text-center">
        Create Reservation
      </h2>
      <form onSubmit={handleSubmit(createReservation)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ">
          <div>
            <div className="mb-4">
              <label
                htmlFor="customerName"
                className="block text-sm font-medium text-gray-700"
              >
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customerName ? "border-red-500" : "border-gray-300"
                }`}
                {...register("customerName", {
                  required: "Please enter the customer name",
                })}
              />
              {errors.customerName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="customerPhone"
                className="block text-sm font-medium text-gray-700"
              >
                Customer Phone
              </label>
              <input
                type="text"
                id="customerPhone"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customerPhone ? "border-red-500" : "border-gray-300"
                }`}
                {...register("customerPhone", {
                  required: "Please enter the customer phone number",
                })}
                onChange={handleCustomerPhoneChange}
              />
              {errors.customerPhone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customerPhone.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="customerAddress"
                className="block text-sm font-medium text-gray-700"
              >
                Customer Address
              </label>
              <input
                type="text"
                id="customerAddress"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customerAddress ? "border-red-500" : "border-gray-300"
                }`}
                {...register("customerAddress", {
                  required: "Please enter the customer address",
                })}
              />
              {errors.customerAddress && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customerAddress.message}
                </p>
              )}
            </div>

          
          </div>

          <div>
            <div className="mb-4">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Check In
              </label>
              <div className="relative">
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      id="startDate"
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      className={`w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.startDate ? "border-red-500" : "border-gray-300"
                      }`}
                      dateFormat="yyyy/MM/dd"
                      placeholderText="Select a start date"
                    />
                  )}
                />
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                Check Out
              </label>
              <div className="relative">
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      id="endDate"
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      className={`w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.endDate ? "border-red-500" : "border-gray-300"
                      }`}
                      dateFormat="yyyy/MM/dd"
                      placeholderText="Select an end date"
                      minDate={startDate} // Restrict to startDate or later
                    />
                  )}
                />
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>
            <div className="mb-4 ">
              <label
                htmlFor="advanceAmount"
                className="block text-sm font-medium text-gray-700 "
              >
                Advance Amount
              </label>
              <input
                type="number"
                id="advanceAmount"
                className="w-[50%] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("advanceAmount")}
              />
            </div>
          </div>
          
        </div>

        {startDate && endDate && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Select Kennels</h3>
            {availableKennels.length === 0 && (
              <p className="text-gray-500">No kennels available</p>
            )}
     {availableKennels.length > 0 &&
  availableKennels
    .reduce((acc, kennel) => {
      const setIndex = acc.findIndex(
        (item) => item.name === kennel.set_name
      );
      if (setIndex === -1) {
        acc.push({ name: kennel.set_name, kennels: [kennel] });
      } else {
        acc[setIndex].kennels.push(kennel);
      }
      return acc;
    }, [])
    .map((set) => (
      <div key={set.name} className="mb-6">
        <h4 className="text-lg font-semibold mb-2">{set.name}</h4>
        <div className="grid grid-cols-8 gap-6 ">
          {set.kennels
            .sort((a, b) => a.kennel_number - b.kennel_number)
            .map((kennel) => (
              <div
                key={kennel.id}
                className={`p-4 text-center rounded-md cursor-pointer transition-all aspect-square ${
                  selectedKennels.includes(kennel)
                    ? "bg-blue-500 text-white"
                    : kennel.occupied
                    ? "bg-red-500 text-white" // Indicate the kennel is occupied
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                onClick={() => handleKennelSelection(kennel)}
              >
                <div>
                  Kennel {kennel.kennel_number}
                </div>
                {kennel.occupied && (
                  <div className="text-sm text-white mt-2">
                    {kennel.checkoutDate.toDateString()}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    ))}

            {errors.selectedKennels && (
              <p className="text-red-500 text-sm mt-1">
                {errors.selectedKennels.message}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center space-x-4 mt-8">
          <button
            type="button"
            className="px-6 py-3 rounded-md bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={clearForm}
          >
            Clear Form
          </button>

          <button
            type="submit"
            className={`px-6 py-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
           
            }`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Create Reservation"}
          </button>
        </div>
      </form>

      {isPetDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 w-2/6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">Enter Pet Details</h3>
            <div className="mb-4">
              <label
                htmlFor="petName"
                className="block text-sm font-medium text-gray-700"
              >
                Pet Name
              </label>
              <input
                type="text"
                id="petName"
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={currentPet.name}
                onChange={(e) =>
                  setCurrentPet({ ...currentPet, name: e.target.value })
                }
              />
            </div>
            <div className="mb-4 relative">
              <label
                htmlFor="petBreed"
                className="block text-sm font-medium text-gray-700"
              >
                Pet Breed
              </label>
              <input
                type="text"
                id="petBreed"
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={currentPet.breed}
                onChange={handleBreedInputChange}
                onFocus={() => setShowBreedOptions(true)}
                onBlur={() => setTimeout(() => setShowBreedOptions(false), 200)}
              />
              {showBreedOptions && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md border-gray-300 shadow-lg">
                  {filteredBreeds.map((breed, index) => (
                    <li
                      key={index}
                      className="px-3 py-2 cursor-pointer text-sm hover:bg-gray-100"
                      onMouseDown={() => handleBreedSelect(breed)}
                    >
                      {breed}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-4">
              <legend className="text-lg font-medium text-gray-900 mb-2">
                Services
              </legend>
              <div className="space-y-2">
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="mr-4">Pickup</Switch.Label>
                    <Switch
                      checked={currentPet.pickup}
                      onChange={(value) =>
                        setCurrentPet({ ...currentPet, pickup: value })
                      }
                      className={`${
                        currentPet.pickup ? "bg-blue-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span
                        className={`${
                          currentPet.pickup ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="mr-4">Groom</Switch.Label>
                    <Switch
                      checked={currentPet.groom}
                      onChange={(value) =>
                        setCurrentPet({ ...currentPet, groom: value })
                      }
                      className={`${
                        currentPet.groom ? "bg-blue-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span
                        className={`${
                          currentPet.groom ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="mr-4">Drop</Switch.Label>
                    <Switch
                      checked={currentPet.drop}
                      onChange={(value) =>
                        setCurrentPet({ ...currentPet, drop: value })
                      }
                      className={`${
                        currentPet.drop ? "bg-blue-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span
                        className={`${
                          currentPet.drop ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={() => setIsPetDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handlePetDialogSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
