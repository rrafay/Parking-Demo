const table = document.getElementById("registration-table");
const tableBody = document.getElementById("registration-body");
const loadingMessage = document.getElementById("loading-message");
const errorMessage = document.getElementById("error-message");
const emptyMessage = document.getElementById("empty-message");

const registrationCount = document.getElementById(
  "registration-count"
);

const vehicleCount = document.getElementById("vehicle-count");
const apiStatus = document.getElementById("api-status");
const refreshButton = document.getElementById("refresh-button");
const searchInput = document.getElementById("search");

let allRegistrations = [];

async function loadRegistrations() {
  loadingMessage.classList.remove("hidden");
  errorMessage.classList.add("hidden");
  emptyMessage.classList.add("hidden");
  table.classList.add("hidden");

  apiStatus.textContent = "Loading";

  try {
    const response = await fetch("/api/parking-registrations");

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message);
    }

    allRegistrations = responseData.data;

    updateStatistics(allRegistrations);
    displayRegistrations(allRegistrations);

    apiStatus.textContent = "Operational";
    apiStatus.className = "status-operational";
  } catch (error) {
    console.error("Unable to load registrations:", error);

    apiStatus.textContent = "Unavailable";
    apiStatus.className = "status-error";

    errorMessage.textContent = error.message;
    errorMessage.classList.remove("hidden");
  } finally {
    loadingMessage.classList.add("hidden");
  }
}

function updateStatistics(registrations) {
  registrationCount.textContent = registrations.length;

  const numberOfVehicles = registrations.reduce(
    (total, registration) => {
      return total + registration.vehicles.length;
    },
    0
  );

  vehicleCount.textContent = numberOfVehicles;
}

function displayRegistrations(registrations) {
  tableBody.innerHTML = "";

  if (registrations.length === 0) {
    table.classList.add("hidden");
    emptyMessage.classList.remove("hidden");
    return;
  }

  emptyMessage.classList.add("hidden");
  table.classList.remove("hidden");

  for (const registration of registrations) {
    const row = document.createElement("tr");

    const personCell = document.createElement("td");
    const personName = document.createElement("strong");
    const personRole = document.createElement("small");

    personName.textContent = registration.person.name;
    personRole.textContent = registration.person.role;

    personCell.append(personName, personRole);

    const institutionalIdCell = document.createElement("td");
    const idCode = document.createElement("code");

    idCode.textContent = registration.person.institutionalId;
    institutionalIdCell.append(idCode);

    const contactCell = document.createElement("td");
    const email = document.createElement("strong");
    const phone = document.createElement("small");

    email.textContent = registration.person.email;
    phone.textContent = registration.phone;

    contactCell.append(email, phone);

    const vehiclesCell = document.createElement("td");

    for (const vehicle of registration.vehicles) {
      const vehicleElement = document.createElement("div");
      vehicleElement.className = "vehicle-record";

      const plate = document.createElement("strong");
      const description = document.createElement("small");

      plate.textContent = `${vehicle.state} · ${vehicle.plate}`;

      description.textContent =
        `${vehicle.year} ${vehicle.color} ` +
        `${vehicle.make} ${vehicle.model}`;

      vehicleElement.append(plate, description);
      vehiclesCell.append(vehicleElement);
    }

    const updatedCell = document.createElement("td");
    const updated = document.createElement("strong");
    const status = document.createElement("small");

    updated.textContent = formatDate(registration.updatedAt);
    status.textContent = "● Confirmed";
    status.className = "status-operational";

    updatedCell.append(updated, status);

    row.append(
      personCell,
      institutionalIdCell,
      contactCell,
      vehiclesCell,
      updatedCell
    );

    tableBody.append(row);
  }
}

function formatDate(databaseDate) {
  if (!databaseDate) {
    return "Unknown";
  }

  const date = new Date(`${databaseDate}Z`);

  return date.toLocaleString();
}

function filterRegistrations() {
  const searchTerm = searchInput.value
    .trim()
    .toLowerCase();

  const filteredRegistrations = allRegistrations.filter(
    registration => {
      const searchableValues = [
        registration.person.name,
        registration.person.email,
        registration.person.institutionalId,
        registration.phone,
        ...registration.vehicles.map(vehicle => vehicle.plate)
      ];

      return searchableValues.some(value =>
        String(value).toLowerCase().includes(searchTerm)
      );
    }
  );

  displayRegistrations(filteredRegistrations);
}

refreshButton.addEventListener("click", loadRegistrations);
searchInput.addEventListener("input", filterRegistrations);

loadRegistrations();