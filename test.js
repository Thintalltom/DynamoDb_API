import { lambdaHandler } from "./hello-world/app.mjs";
const mockEvent = (routeKey, pathParameters = {}, body = null) => ({
  routeKey,
  pathParameters,
  body: body ? JSON.stringify(body) : null,
});

const routeKey = "GET /users";
  
const runTest = async () => {
 
  console.log("\n➡️ get Users...");
  console.log(await lambdaHandler(mockEvent("GET /users")));
  console.log("Received routeKey:", routeKey);

};


runTest()