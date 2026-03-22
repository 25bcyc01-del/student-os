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

// Add Planner Task (UPDATED)
app.post("/addTask", async (req, res) => {
  await db.read();

  db.data.tasks.push({
    text: req.body.task,
    date: new Date().toLocaleDateString(),
    completed: false
  });

  await db.write();
  res.redirect("/tasks");
});

// Mark Task as Completed
app.post("/completeTask", async (req, res) => {
  await db.read();

  const index = req.body.index;

  if (db.data.tasks[index]) {
    db.data.tasks[index].completed = true;
  }

  await db.write();
  res.redirect("/tasks");
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

// NEW IMPROVED TASK VIEW
app.get("/tasks", async (req, res) => {
  await db.read();

  const tasks = db.data.tasks || [];

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  res.send(`
    <html>
    <head>
      <title>Daily Planner</title>
      <style>
        body {
          font-family: Arial;
          background: #f5f5f5;
          padding: 20px;
        }
        h2 {
          text-align: center;
        }
        .box {
          background: white;
          padding: 20px;
          margin: 15px auto;
          width: 60%;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .completed {
          text-decoration: line-through;
          color: gray;
        }
        button {
          margin-right: 10px;
        }
      </style>
    </head>

    <body>

      <h2>📅 Daily Planner - ${new Date().toLocaleDateString()}</h2>

      <div class="box">
        <h3>🟡 Pending Tasks</h3>
        ${
          pending.map((t, i) => `
            <form method="POST" action="/completeTask">
              <input type="hidden" name="index" value="${i}">
              <button>✔</button>
              ${t.text}
            </form>
          `).join("") || "<p>No pending tasks</p>"
        }
      </div>

      <div class="box">
        <h3>🟢 Completed Tasks</h3>
        ${
          completed.map(t => `
            <p class="completed">✔ ${t.text}</p>
          `).join("") || "<p>No completed tasks</p>"
        }
      </div>

      <center><a href="/">⬅ Back</a></center>

    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});