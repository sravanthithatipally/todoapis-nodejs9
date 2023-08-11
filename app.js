const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//api-1//

const outputFormat = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const toValidatePriority = (priority) => {
  const priorityValues = ["HIGH", "MEDIUM", "LOW"];
  return priorityValues.includes(priority);
};

const toValidateStatus = (status) => {
  const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
  return statusValues.includes(status);
};
const toValidateCategory = (category) => {
  const categoryValues = ["WORK", "HOME", "LEARNING"];
  return categoryValues.includes(category);
};

//api-1//
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  condition = true;
  let results = "";
  const {
    id,
    todo,
    category,
    priority,
    status,
    due_date,
    search_q = "",
  } = request.query;
  switch (true) {
    case hasStatus(request.query):
      if (toValidateStatus(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
        condition = false;
      }
      if (toValidateStatus(status) === true) {
        results = `
            SELECT * FROM todo WHERE status='${status}';`;
      }
      break;
    case hasPriority(request.query):
      if (toValidatePriority(priority) === false) {
        response.status(400);
        condition = false;
        response.send("Invalid Todo Priority");
      }
      if (toValidatePriority(priority) === true) {
        results = `
            SELECT * FROM todo WHERE priority='${priority}';`;
      }
      break;
    case hasPriorityAndStatus(request.query):
      if (toValidatePriority(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
        condition = false;
      }
      if (toValidateStatus(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
        condition = false;
      }
      if (
        toValidatePriority(priority) === true &&
        toValidateStatus(status) === true
      ) {
        results = `
            SELECT * FROM todo WHERE priority='${priority}'
            AND status='${status}';`;
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (toValidateStatus(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
        condition = false;
      }
      if (toValidateCategory(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
        condition = false;
      }
      if (
        toValidateStatus(status) === true &&
        toValidateCategory(category) === true
      ) {
        results = `
            SELECT * FROM todo WHERE category='${category}'
            AND status='${status}';`;
      }
      break;
    case hasCategory(request.query):
      if (toValidateCategory(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
        condition = false;
      }
      if (toValidateCategory(category) === true) {
        results = `
            SELECT * FROM todo WHERE category='${category}';`;
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (toValidateCategory(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
        condition = false;
      }
      if (toValidatePriority(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
        condition = false;
      }
      if (
        toValidateCategory(category) === true &&
        toValidatePriority(priority) === true
      ) {
        results = `
             SELECT * FROM todo WHERE category='${category}'
            AND priority='${priority}';`;
      }
      break;
    default:
      results = `
            SELECT * FROM todo WHERE
            todo LIKE '%${search_q}%';`;
  }
  if (condition === true) {
    data = await db.all(results);
    response.send(data.map((each) => outputFormat(each)));
  }
});

//API-2//

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const data = `
    SELECT * FROM todo WHERE id='${todoId}';`;
  const userData = await db.get(data);
  response.send(outputFormat(userData));
});

//api-3//
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dueDate1 = new Date(date);
  const toValidateDueDate = isValid(dueDate1);
  if (toValidateDueDate === true) {
    newDueDate = format(dueDate1, "yyyy-MM-dd");
    const data = `
    SELECT * FROM todo WHERE 
    due_date='${newDueDate}';`;
    const userData = await db.all(data);
    response.send(userData.map((each) => outputFormat(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//api-4//
app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;
  let condition = true;

  if (toValidateCategory(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
    condition = false;
  }
  if (toValidatePriority(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
    condition = false;
  }
  if (toValidateStatus(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
    condition = false;
  }
  const dueDate1 = new Date(dueDate);

  const toValidateDueDate = isValid(dueDate1);

  if (toValidateDueDate === false) {
    response.status(400);
    response.send("Invalid Due Date");
    condition = false;
  }

  if (condition === true) {
    dueDate = format(dueDate1, "yyyy-MM-dd");
    const data = `
    INSERT INTO todo 
    (id,todo,priority,status,category,due_date)
    VALUES
    ('${id}',
    '${todo}',
    '${priority}',
    '${status}',
    '${category}',
    '${dueDate}');`;
    const uploadData = await db.run(data);
    response.send("Todo Successfully Added");
  }
});

//api-5//
app.put("/todos/:todoId/", async (request, response) => {
  let condition = true;

  let updateColumn = "";
  const { todoId } = request.params;
  const data = `
    SELECT * FROM todo WHERE id='${todoId}';`;
  const todoData = await db.get(data);

  switch (true) {
    case request.body.status !== undefined:
      updateColumn = "Status";
      break;
    case request.body.todo !== undefined:
      updateColumn = "Todo";
      break;
    case request.body.priority !== undefined:
      updateColumn = "Priority";
      break;
    case request.body.category !== undefined:
      updateColumn = "Category";
      break;
    case request.body.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  let {
    todo = todoData.todo,
    priority = todoData.priority,
    status = todoData.status,
    category = todoData.category,
    dueDate = todoData.due_date,
  } = request.body;

  if (updateColumn === "Category") {
    if (toValidateCategory(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
      condition = false;
    }
  }
  if (updateColumn === "Priority") {
    if (toValidatePriority(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
      condition = false;
    }
  }
  if (updateColumn === "Status") {
    if (toValidateStatus(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
      condition = false;
    }
  }
  if (updateColumn === "Due Date") {
    const dueDate1 = new Date(dueDate);
    const toValidateDueDate = isValid(dueDate1);

    if (toValidateDueDate === false) {
      response.status(400);
      response.send("Invalid Due Date");
      condition = false;
    }
    if (toValidateDueDate === true) {
      dueDate = format(dueDate1, "yyyy-MM-dd");
    }
  }
  if (condition === true) {
    const updateQuery = `
 UPDATE todo 
 SET 
 todo='${todo}',
 priority='${priority}',
 status='${status}',
 category='${category}',
 due_date='${dueDate}'
 WHERE id='${todoId}';`;

    const updateTodo = await db.run(updateQuery);
    response.send(`${updateColumn} Updated`);
  }
});

//api-6//
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const data = `
    DELETE FROM todo 
    WHERE id='${todoId}';`;
  await db.run(data);
  response.send("Todo Deleted");
});
module.exports = app;
