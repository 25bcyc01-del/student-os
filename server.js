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

// ================= EXPENSE =================

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

// View Expenses
app.get("/expenses", async (req, res) => {
  await db.read();

  const expenses = db.data.expenses || [];
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  res.send(`
    <h2>💰 Expense Tracker</h2>
    <h3>Total Spending: ₹${total}</h3>

    ${
      expenses.map(e => `<p>₹${e.amount} - ${e.title}</p>`).join("") || "<p>No expenses</p>"
    }

    <br><a href="/">⬅ Back</a>
  `);
});

// ================= STUDIES =================

// Add Study
app.post("/addStudy", async (req, res) => {
  await db.read();

  db.data.studies.push({
    task: req.body.task,
    hours: req.body.hours,
    completed: false
  });

  await db.write();
  res.redirect("/studies");
});

// Complete Study
app.post("/completeStudy", async (req, res) => {
  await db.read();

  const index = req.body.index;

  if (db.data.studies[index]) {
    db.data.studies[index].completed = true;
  }

  await db.write();
  res.redirect("/studies");
});

// View Studies
app.get("/studies", async (req, res) => {
  await db.read();

  const studies = db.data.studies || [];

  const pending = studies.filter(s => !s.completed);
  const completed = studies.filter(s => s.completed);

  res.send(`
    <h2>📘 Productivity Tracker</h2>

    <h3>🟡 Pending</h3>
    ${
      pending.map((s, i) => `
        <form method="POST" action="/completeStudy">
          <input type="hidden" name="index" value="${i}">
          <button>✔</button>
          ${s.task} - ${s.hours} hrs
        </form>
      `).join("") || "<p>No pending</p>"
    }

    <h3>🟢 Completed</h3>
    ${
      completed.map(s => `
        <p style="text-decoration:line-through;">✔ ${s.task} - ${s.hours} hrs</p>
      `).join("") || "<p>No completed</p>"
    }

    <br><a href="/">⬅ Back</a>
  `);
});

// ================= TASKS =================

// Add Task
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

// Complete Task
app.post("/completeTask", async (req, res) => {
  await db.read();

  const index = req.body.index;

  if (db.data.tasks[index]) {
    db.data.tasks[index].completed = true;
  }

  await db.write();
  res.redirect("/tasks");
});

// View Tasks
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

// ================= START SERVER =================

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});