const express = require("express");
const db = require("./database");


const app = express();
const PORT = process.env.PORT || 3000;



app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Parking Integrations API is running!");
})

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "Parking Integration API",
        status: "operational"
    });
});

app.get("/api/version", (req, res) => {
    res.status(200).json({
        "version": "1.0.0",
        "environment": "development"
    });
});


//Database
app.get("/api/people", (req,res) => {
    try{
        const people = db.prepare(`
            SELECT 
            institutional_id,
            name,
            email,
            role
            FROM people
            ORDER BY name
            `).all();
        
        res.status(200).json({
            success : true,
            count : people.length,
            data : people
        });
    }
        catch(error){
            console.error("Unable to retrieve people", error);

            res.status(500).json({
                success : false,
                message : "Unable to retrieve"
            });
        }
    });


    app.post("/api/parking-registrations", (req, res) => {
  try {
    const {
      email,
      phone,
      plate,
      state,
      make,
      model,
      year,
      color
    } = req.body;

    // Step 1: Validate required fields
    if (
      !email ||
      !phone ||
      !plate ||
      !state ||
      !make ||
      !model ||
      !year ||
      !color
    ) {
      return res.status(400).json({
        success: false,
        message: "All registration fields are required"
      });
    }

    // Step 2: Normalize incoming data
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPlate = plate.trim().toUpperCase();
    const normalizedState = state.trim().toUpperCase();

    // Step 3: Find the institutional person
    const person = db.prepare(`
      SELECT
        id,
        institutional_id,
        name,
        email,
        role
      FROM people
      WHERE LOWER(email) = ?
    `).get(normalizedEmail);

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "No institutional person was found for this email"
      });
    }

    // Step 4: Define all related database work
    const processRegistration = db.transaction(() => {
      db.prepare(`
        INSERT INTO parking_registrations (
          person_id,
          phone,
          updated_at
        )
        VALUES (?, ?, CURRENT_TIMESTAMP)

        ON CONFLICT(person_id)
        DO UPDATE SET
          phone = excluded.phone,
          updated_at = CURRENT_TIMESTAMP
      `).run(person.id, phone.trim());

      const registration = db.prepare(`
        SELECT
          id,
          person_id,
          phone,
          updated_at
        FROM parking_registrations
        WHERE person_id = ?
      `).get(person.id);

      const vehicleResult = db.prepare(`
        INSERT INTO vehicles (
          registration_id,
          plate,
          state,
          make,
          model,
          year,
          color
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        registration.id,
        normalizedPlate,
        normalizedState,
        make.trim(),
        model.trim(),
        Number(year),
        color.trim()
      );

      return {
        registration,
        vehicleId: vehicleResult.lastInsertRowid
      };
    });

    // Step 5: Execute the transaction
    const result = processRegistration();

    // Step 6: Return a successful API response
    return res.status(201).json({
      success: true,
      message: "Parking registration processed successfully",
      data: {
        person: {
          institutionalId: person.institutional_id,
          name: person.name,
          email: person.email,
          role: person.role
        },
        registration: {
          id: result.registration.id,
          phone: result.registration.phone,
          updatedAt: result.registration.updated_at
        },
        vehicle: {
          id: result.vehicleId,
          plate: normalizedPlate,
          state: normalizedState,
          make,
          model,
          year: Number(year),
          color
        }
      }
    });
  } catch (error) {
    console.error("Registration processing failed:", error);

    if (
      error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      error.message.includes("UNIQUE constraint failed")
    ) {
      return res.status(409).json({
        success: false,
        message: "This license plate is already registered in that state"
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected database error occurred"
    });
  }
});

app.get("/api/parking-registrations", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        pr.id AS registration_id,
        pr.phone,
        pr.updated_at,

        p.id AS person_id,
        p.institutional_id,
        p.name,
        p.email,
        p.role,

        v.id AS vehicle_id,
        v.plate,
        v.state,
        v.make,
        v.model,
        v.year,
        v.color,
        v.created_at

      FROM parking_registrations AS pr

      INNER JOIN people AS p
        ON pr.person_id = p.id

      LEFT JOIN vehicles AS v
        ON v.registration_id = pr.id

      ORDER BY
        p.name ASC,
        v.created_at DESC
    `).all();

    const registrations = [];

    for (const row of rows) {
      let registration = registrations.find(
        item => item.id === row.registration_id
      );

      if (!registration) {
        registration = {
          id: row.registration_id,
          phone: row.phone,
          updatedAt: row.updated_at,

          person: {
            id: row.person_id,
            institutionalId: row.institutional_id,
            name: row.name,
            email: row.email,
            role: row.role
          },

          vehicles: []
        };

        registrations.push(registration);
      }

      if (row.vehicle_id) {
        registration.vehicles.push({
          id: row.vehicle_id,
          plate: row.plate,
          state: row.state,
          make: row.make,
          model: row.model,
          year: row.year,
          color: row.color,
          createdAt: row.created_at
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error("Unable to retrieve registrations:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve parking registrations"
    });
  }
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
});