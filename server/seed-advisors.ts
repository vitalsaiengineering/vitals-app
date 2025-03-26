
import { storage } from "./storage";

async function seedAdvisors() {
  try {
    // Get the client admin's organization (firm)
    const clientAdmin = await storage.getUserByUsername("clientadmin");
    if (!clientAdmin) {
      console.error("Client admin user not found");
      return;
    }

    const organizationId = clientAdmin.organizationId;
    console.log(`Adding advisors to organization ID: ${organizationId}`);

    // Create dummy advisors
    const advisors = [
      {
        username: "advisor1",
        password: "password",
        email: "advisor1@example.com",
        fullName: "Michael Johnson",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor2",
        password: "password",
        email: "advisor2@example.com",
        fullName: "Jessica Williams",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor3",
        password: "password",
        email: "advisor3@example.com",
        fullName: "David Brown",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor4",
        password: "password",
        email: "advisor4@example.com",
        fullName: "Emma Davis",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor5",
        password: "password",
        email: "advisor5@example.com",
        fullName: "Christopher Wilson",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor6",
        password: "password",
        email: "advisor6@example.com",
        fullName: "Olivia Martinez",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor7",
        password: "password",
        email: "advisor7@example.com",
        fullName: "James Anderson",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor8",
        password: "password",
        email: "advisor8@example.com",
        fullName: "Sophia Taylor",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor9",
        password: "password",
        email: "advisor9@example.com",
        fullName: "Daniel Moore",
        role: "advisor",
        organizationId
      },
      {
        username: "advisor10",
        password: "password",
        email: "advisor10@example.com",
        fullName: "Ava Jackson",
        role: "advisor",
        organizationId
      }
    ];

    // Add each advisor to the database
    for (const advisorData of advisors) {
      const existingUser = await storage.getUserByUsername(advisorData.username);
      if (existingUser) {
        console.log(`User ${advisorData.username} already exists, skipping`);
        continue;
      }
      
      const newUser = await storage.createUser(advisorData);
      console.log(`Created advisor: ${newUser.fullName} (${newUser.username})`);
    }

    console.log("Finished seeding advisors");
  } catch (error) {
    console.error("Error seeding advisors:", error);
  }
}

// Execute the seeding function
seedAdvisors();
