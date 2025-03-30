import { lambdaHandler } from "./hello-world/app.mjs";
const mockEvent = (routeKey, pathParameters = {}, body = null) => ({
  routeKey,
  pathParameters,
  body: body ? JSON.stringify(body) : null,
});

  
const runTest = async () => {
  console.log("\n➡️ Adding User...");
  console.log(
    await lambdaHandler(
      mockEvent("POST/users", {}, { id: "1", firstname: "John", lastname: "Doe", email: "john@example.com" })
    )
  );
};


runTest()