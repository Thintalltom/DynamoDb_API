import { lambdaHandler } from "./hello-world/app.mjs";

// Utility function to mock an API Gateway event
const mockEvent = (routeKey, pathParameters = {}, body = null) => ({
  routeKey,
  pathParameters,
  body: body ? JSON.stringify(body) : null,
});

const runTest = async () => {
  // Test: Get Users
  console.log("\n➡️ Get Users...");
  const getResponse = await lambdaHandler(mockEvent("GET /users"));
  console.log(getResponse);

  // ✅ Replace with an actual ID from your DB to test DELETE
  const userIdToDelete = "1743757008911"; // <-- Change this to a real ID

  console.log("\n🗑️ Deleting User with ID:", userIdToDelete);

  const deleteEvent = mockEvent("DELETE /users/{id}", { id: userIdToDelete });

  const deleteResponse = await lambdaHandler(deleteEvent);
  console.log("Delete Response:", deleteResponse);

  // Try to fetch users again to confirm deletion
  console.log("\n🔁 Re-fetching users...");
  const refreshedUsers = await lambdaHandler(mockEvent("GET /users"));
  console.log(refreshedUsers);
};

runTest();
