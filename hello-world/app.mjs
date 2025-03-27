import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

// DynamoDB Configuration
const REGION = "us-east-1";
const TABLE_NAME = "crud";

const dbClient = new DynamoDBClient({ region: REGION });

// Function to check if the table exists
const checkTableExists = async () => {
  try {
    await dbClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    return true; // Table exists
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      return false; // Table does not exist
    }
    throw err; // Other errors
  }
};

// Function to create the table
const createTable = async () => {
  const tableExists = await checkTableExists();

  if (tableExists) {
    return { success: true, message: "Table already exists" };
  }

  const params = {
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
    TableName: TABLE_NAME,
  };

  try {
    await dbClient.send(new CreateTableCommand(params));
    return { success: true, message: "Table created successfully" };
  } catch (err) {
    return { success: false, message: "Table creation failed", error: err };
  }
};

// Function to add data
const addData = async (data) => {
  if (!data?.id || !data?.name || !data?.email) {
    return { success: false, message: "Missing required fields (id, name, email)" };
  }

  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: { S: data.id },
      name: { S: data.name },
      email: { S: data.email }
    },
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    return { success: true, message: "Data added successfully" };
  } catch (err) {
    return { success: false, message: "Failed to add data", error: err };
  }
};

// Lambda Handler Function
export const lambdaHandler = async (event, context) => {
  try {
    const body = event.body ? JSON.parse(event.body) : null;

    if (!body?.action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Missing action type" }),
      };
    }

    if (body.action === "createTable") {
      const response = await createTable();
      return { statusCode: 200, body: JSON.stringify(response) };
    }

    if (body.action === "addData") {
      const addDataResponse = await addData(body);
      return {
        statusCode: addDataResponse.success ? 200 : 500,
        body: JSON.stringify(addDataResponse),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Invalid action type" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error }),
    };
  }
};
