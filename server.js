const express = require("express");
const bodyParser = require("body-parser");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const app = express();

// Render dynamic port
const PORT = process.env.PORT || 3000;

// Setup Database
const adapter = new JSONFile("db.json");
const db = new Low(adapter, { expenses: [], studies: [], tasks: [] });

async function initDB() {
  await db.read();
  db.data ||= { expenses: [], studies: [], tasks: [] };
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

// Add Planner Task
app.post("/addTask", async (req, res) => {
  await db.read();
  db.data.tasks.push({
    text: req.body.task,
    date: new Date().toLocaleDateString()
  });
  await db.write();
  res.redirect("/");
});

// View Expense Records
app.get("/expenses", async (req, res) => {
  await db.read();
  const expenses = db.data.expenses || [];

  res.send(`
    <h2>💰 Expense Records</h2>
    ${expenses.map(e => `<p>₹${e.amount} - ${e.title}</p>`).join("")}
    <br><a href="/">Back</a>
  `);
});

// View Productivity Records
app.get("/studies", async (req, res) => {
  await db.read();
  const studies = db.data.studies || [];

  res.send(`
    <h2>📘 Productivity Records</h2>
    ${studies.map(s => `<p>${s.task} - ${s.hours} hrs</p>`).join("")}
    <br><a href="/">Back</a>
  `);
});

// View Planner Tasks
app.get("/tasks", async (req, res) => {
  await db.read();
  const tasks = db.data.tasks || [];

  res.send(`
    <h2>📅 Daily Planner</h2>
    ${tasks.map(t => `<p>✔ ${t.text} (${t.date})</p>`).join("")}
    <br><a href="/">Back</a>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});