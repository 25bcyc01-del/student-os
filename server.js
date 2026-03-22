const express = require("express");
const bodyParser = require("body-parser");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const app = express();
const PORT = process.env.PORT || 3000;

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

// ================= HOME =================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// ================= EXPENSE =================
app.post("/addExpense", async (req, res) => {
  await db.read();

  db.data.expenses.push({
    title: req.body.title,
    amount: Number(req.body.amount),
    date: new Date().toLocaleDateString()
  });

  await db.write();
  res.redirect("/expenses");
});

app.get("/expenses", async (req, res) => {
  await db.read();

  const expenses = db.data.expenses || [];
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  res.send(`
    <html>
    <head>
      <style>
        body { font-family: Arial; background: #f5f5f5; padding: 20px; }
        .box { background: white; padding: 20px; margin: 15px auto; width: 60%; border-radius: 10px; }
      </style>
    </head>
    <body>

      <h2>💰 Expense Tracker</h2>

      <div class="box">
        <h3>Total Spending: ₹${total}</h3>
      </div>

      <div class="box">
        <h3>📊 All Expenses</h3>
        ${
          expenses.map(e => `<p>₹${e.amount} - ${e.title} (${e.date})</p>`).join("") || "<p>No expenses</p>"
        }
      </div>

      <center><a href="/">⬅ Back</a></center>

    </body>
    </html>
  `);
});

// ================= STUDIES =================
app.post("/addStudy", async (req, res) => {
  await db.read();

  db.data.studies.push({
    task: req.body.task,
    hours: req.body.hours,
    date: new Date().toLocaleDateString(),
    completed: false
  });

  await db.write();
  res.redirect("/studies");
});

app.post("/completeStudy", async (req, res) => {
  await db.read();

  const index = req.body.index;
  if (db.data.studies[index]) {
    db.data.studies[index].completed = true;
  }

  await db.write();
  res.redirect("/studies");
});

app.get("/studies", async (req, res) => {
  await db.read();

  const studies = db.data.studies || [];

  const pending = studies.filter(s => !s.completed);
  const completed = studies.filter(s => s.completed);

  res.send(`
    <html>
    <head>
      <style>
        body { font-family: Arial; background: #f5f5f5; padding: 20px; }
        .box { background: white; padding: 20px; margin: 15px auto; width: 60%; border-radius: 10px; }
        .completed { text-decoration: line-through; color: gray; }
      </style>
    </head>
    <body>

      <h2>📘 Productivity Tracker</h2>

      <div class="box">
        <h3>🟡 Pending</h3>
        ${
          pending.map((s, i) => `
            <form method="POST" action="/completeStudy">
              <input type="hidden" name="index" value="${i}">
              <button>✔</button>
              ${s.task} - ${s.hours} hrs (${s.date})
            </form>
          `).join("") || "<p>No pending</p>"
        }
      </div>

      <div class="box">
        <h3>🟢 Completed</h3>
        ${
          completed.map(s => `
            <p class="completed">✔ ${s.task} - ${s.hours} hrs (${s.date})</p>
          `).join("") || "<p>No completed</p>"
        }
      </div>

      <center><a href="/">⬅ Back</a></center>

    </body>
    </html>
  `);
});

// ================= TASKS =================
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

app.post("/completeTask", async (req, res) => {
  await db.read();

  const index = req.body.index;
  if (db.data.tasks[index]) {
    db.data.tasks[index].completed = true;
  }

  await db.write();
  res.redirect("/tasks");
});

app.get("/tasks", async (req, res) => {
  await db.read();

  const tasks = db.data.tasks || [];

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  res.send(`
    <html>
    <head>
      <style>
        body { font-family: Arial; background: #f5f5f5; padding: 20px; }
        .box { background: white; padding: 20px; margin: 15px auto; width: 60%; border-radius: 10px; }
        .completed { text-decoration: line-through; color: gray; }
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
          `).join("") || "<p>No pending</p>"
        }
      </div>

      <div class="box">
        <h3>🟢 Completed Tasks</h3>
        ${
          completed.map(t => `
            <p class="completed">✔ ${t.text}</p>
          `).join("") || "<p>No completed</p>"
        }
      </div>

      <center><a href="/">⬅ Back</a></center>

    </body>
    </html>
  `);
});

// ================= TIMER =================
app.get("/timer", (req, res) => {
  res.send(`
    <html>
    <head>
      <style>
        body { text-align: center; font-family: Arial; padding: 40px; }
      </style>
    </head>
    <body>

      <h2>⏳ Study Timer</h2>

      <select id="mode">
        <option value="25">25 min (Pomodoro)</option>
        <option value="50">50 min</option>
        <option value="custom">Custom</option>
      </select>

      <input id="customTime" type="number" placeholder="Enter minutes" />

      <h1 id="time">00:00</h1>

      <button onclick="startTimer()">Start</button>

      <script>
        let interval;

        function startTimer() {
          clearInterval(interval);

          let mode = document.getElementById("mode").value;
          let minutes = mode === "custom"
            ? document.getElementById("customTime").value
            : mode;

          let time = minutes * 60;

          interval = setInterval(() => {
            let m = Math.floor(time / 60);
            let s = time % 60;

            document.getElementById("time").innerText =
              m + ":" + (s < 10 ? "0" + s : s);

            time--;

            if (time < 0) {
              clearInterval(interval);
              alert("Time's up!");
            }
          }, 1000);
        }
      </script>

      <br><br><a href="/">⬅ Back</a>

    </body>
    </html>
  `);
});

// ================= START =================
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});