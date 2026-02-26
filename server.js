const express = require("express");
const bodyParser = require("body-parser");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const app = express();

// Setup Database
const adapter = new JSONFile("db.json");
const db = new Low(adapter, { expenses: [], studies: [] });

async function initDB() {
  await db.read();
  db.data ||= { expenses: [], studies: [] };
  await db.write();
}

initDB();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home Page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Add Expense
app.post("/addExpense", async (req, res) => {
  await db.read();

  db.data.expenses.push({
    title: req.body.title,
    amount: req.body.amount,
  });

  await db.write();
  res.redirect("/");
});

// Add Study
app.post("/addStudy", async (req, res) => {
  await db.read();

  db.data.studies.push({
    task: req.body.task,
    hours: req.body.hours,
  });

  await db.write();
  res.redirect("/");
});

// View Records
app.get("/view", async (req, res) => {
  await db.read();

  const expenses = db.data.expenses;
  const studies = db.data.studies;

  res.send(`
    <h2>Expenses</h2>
    ${expenses.map(e => `<p>${e.title} - ₹${e.amount}</p>`).join("")}

    <h2>Study Tasks</h2>
    ${studies.map(s => `<p>${s.task} - ${s.hours} hrs</p>`).join("")}

    <br><a href="/">Back</a>
  `);
});
// Add Planner Task
app.post("/addTask", async (req, res) => {
  db.data.tasks ||= [];

  db.data.tasks.push({
    text: req.body.task,
    date: new Date().toLocaleDateString()
  });

  await db.write();
  res.redirect("/");
});

// View Tasks
app.get("/tasks", async (req, res) => {
  await db.read();

  const tasks = db.data.tasks || [];

  res.send(`
    <h2>📅 Daily Planner</h2>
    ${tasks.map(t => `<p>✔ ${t.text} (${t.date})</p>`).join("")}
    <br><a href="/">Back</a>
  `);
});
app.listen(3000, () => {
  console.log("Server running on port 3000");
});