const form = document.getElementById("registration-form");
const result = document.getElementById("result");
const submitButton = document.getElementById("submit-button");

form.addEventListener("submit", async event => {
  event.preventDefault();

  result.className = "result hidden";
  result.textContent = "";

  submitButton.disabled = true;
  submitButton.textContent = "Processing...";

  const registration = {
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    plate: document.getElementById("plate").value,
    state: document.getElementById("state").value,
    make: document.getElementById("make").value,
    model: document.getElementById("model").value,
    year: Number(document.getElementById("year").value),
    color: document.getElementById("color").value
  };

  console.log("Sending registration:", registration);

  try {
    const response = await fetch(
      "/api/parking-registrations",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(registration)
      }
    );

    const responseData = await response.json();

    console.log("API response:", responseData);

    if (!response.ok) {
      throw new Error(responseData.message);
    }

    result.className = "result success";

    result.innerHTML = `
      <strong>Registration successful</strong>

      <p>${responseData.message}</p>

      <dl>
        <div>
          <dt>Person</dt>
          <dd>${responseData.data.person.name}</dd>
        </div>

        <div>
          <dt>Institutional ID</dt>
          <dd>${responseData.data.person.institutionalId}</dd>
        </div>

        <div>
          <dt>Vehicle</dt>
          <dd>
            ${responseData.data.vehicle.state}
            ${responseData.data.vehicle.plate}
          </dd>
        </div>
      </dl>
    `;
  } catch (error) {
    console.error("Registration failed:", error);

    result.className = "result error";

    result.innerHTML = `
      <strong>Registration failed</strong>
      <p>${error.message}</p>
    `;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Process registration";
  }
});