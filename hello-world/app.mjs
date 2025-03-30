import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  PutItemCommand,
  ScanCommand,
  DeleteItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
// DynamoDB Configuration
const REGION = "us-east-1";
const TABLE_NAME = "crud";

const dbClient = new DynamoDBClient({ region: REGION });

//delete based off id
const deleteItem = async (id) => {
  if (!id) {
    return { success: false, message: "ID is required for deletion" };
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: { S: id }, // DynamoDB expects the key in this format
    },
  };

  try {
    await dbClient.send(new DeleteItemCommand(params));
    return {
      success: true,
      message: `User with ID ${id} deleted successfully`,
    };
  } catch (err) {
    return { success: false, message: "Failed to delete user", error: err };
  }
};

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
    TableName: TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "firstname", AttributeType: "S" }, // GSI Index
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "FirstNameIndex",
        KeySchema: [{ AttributeName: "firstname", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
  };

  try {
    await dbClient.send(new CreateTableCommand(params));
    return { success: true, message: "Table created successfully" };
  } catch (err) {
    return {
      success: false,
      message: "Table creation failed",
      error: err.message,
    };
  }
};

// Function to add data
const addData = async (data) => {
  const requestJSON = JSON.parse(data);
  if (
    !requestJSON?.id ||
    !requestJSON?.firstname ||
    !requestJSON?.lastname ||
    !requestJSON?.email
  ) {
    return {
      success: false,
      message: "Missing required fields (id, firstname, lastname, email)",
    };
  }

  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: { S: requestJSON.id },
      firstname: { S: requestJSON.firstname },
      lastname: { S: requestJSON.lastname },
      email: { S: requestJSON.email },
    },
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    return { success: true, message: "Data added successfully" };
  } catch (err) {
    return { success: false, message: "Failed to add data", error: err };
  }
};

const getDataByName = async (firstname) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "FirstNameIndex", // Make sure the GSI exists in DynamoDB
    KeyConditionExpression: "#firstname = :nameValue",
    ExpressionAttributeNames: {
      "#firstname": "firstname",
    },
    ExpressionAttributeValues: {
      ":nameValue": { S: firstname },
    },
  };

  try {
    const data = await dbClient.send(new QueryCommand(params));
    return { success: true, data: data.Items };
  } catch (err) {
    return {
      success: false,
      message: "Failed to get data",
      error: err.message,
    };
  }
};

//fetch all user
const fetchallUser = async () => {
  const params = {
    TableName: TABLE_NAME,
  };

  try {
    const data = await dbClient.send(new ScanCommand(params));
    return { success: true, data: data.Items };
  } catch (err) {
    return { success: false, message: "Failed to fetch data", error: err };
  }
};

export const lambdaHandler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = { "Content-Type": "application/json" };
  try {
    const { routeKey, pathParameters, body: requestBody } = event;
    if (routeKey === "GET/users") {
      body = await fetchallUser();
    } else if (routeKey === "GET/users/{name}") {
      body = await getDataByName(pathParameters.name);
    } else if (routeKey === "POST/users") {
      body = await addData(requestBody);
    } else if (routeKey === "DELETE/users/{id}") {
      body = await deleteItem(pathParameters.id);
    } else if (routeKey === "POST/tables/create") {
      // 🚀 NEW ROUTE FOR TABLE CREATION
      body = await createTable();
    } else {
      throw new Error(`Unsupported route: "${routeKey}"`);
    }
  } catch (error) {
    statusCode = 400;
    body = error.message;
  }
  return {
    statusCode,
    body: JSON.stringify(body),
    headers,
  };
};
