const express = require("express");
const bodyParser = require("body-parser");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const app = express();
const PORT = process.env.PORT || 3000;

// DATABASE
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

// HOME
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});


// ================= TASK =================
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
  <body style="font-family:Arial;text-align:center;background:#f5f5f5">

    <h2>📅 Daily Planner</h2>

    <div style="background:white;padding:20px;margin:20px auto;width:60%;border-radius:10px;">
      <h3>🟡 Pending Tasks</h3>
      ${
        pending.map((t,i)=>`
        <form method="POST" action="/completeTask">
          <input type="hidden" name="index" value="${i}">
          <button>✔</button>
          ${t.text}
        </form>
        `).join("") || "<p>No pending</p>"
      }
    </div>

    <div style="background:white;padding:20px;margin:20px auto;width:60%;border-radius:10px;">
      <h3>🟢 Completed Tasks</h3>
      ${
        completed.map(t=>`
        <p style="text-decoration:line-through;">✔ ${t.text}</p>
        `).join("") || "<p>None</p>"
      }
    </div>

    <a href="/">⬅ Back</a>

  </body>
  </html>
  `);
});


// ================= STUDY =================
app.post("/addStudy", async (req, res) => {
  await db.read();

  db.data.studies.push({
    task: req.body.task,
    hours: Number(req.body.hours),
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
  <body style="font-family:Arial;text-align:center;background:#f5f5f5">

    <h2>📘 Productivity</h2>

    <div style="background:white;padding:20px;margin:20px auto;width:60%;border-radius:10px;">
      <h3>🟡 Pending</h3>
      ${
        pending.map((s,i)=>`
        <form method="POST" action="/completeStudy">
          <input type="hidden" name="index" value="${i}">
          <button>✔</button>
          ${s.task} - ${s.hours} hrs
        </form>
        `).join("") || "<p>None</p>"
      }
    </div>

    <div style="background:white;padding:20px;margin:20px auto;width:60%;border-radius:10px;">
      <h3>🟢 Completed</h3>
      ${
        completed.map(s=>`
        <p style="text-decoration:line-through;">✔ ${s.task}</p>
        `).join("") || "<p>None</p>"
      }
    </div>

    <a href="/">⬅ Back</a>

  </body>
  </html>
  `);
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

  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  res.send(`
  <html>
  <body style="font-family:Arial;text-align:center;background:#f5f5f5">

    <h2>💰 Expense Tracker</h2>

    <div style="background:white;padding:20px;margin:20px auto;width:60%;border-radius:10px;">
      <h3>Total Spending: ₹${total}</h3>
    </div>

    <div style="background:white;padding:20px;margin:20px auto;width:60%;border-radius:10px;">
      <h3>📊 All Expenses</h3>
      ${
        expenses.map(e=>`
        <p>₹${e.amount} - ${e.title} (${e.date})</p>
        `).join("") || "<p>No expenses</p>"
      }
    </div>

    <a href="/">⬅ Back</a>

  </body>
  </html>
  `);
});


// ================= TIMER (SAFE) =================
app.get("/timer", (req, res) => {
  res.send(`
  <html>
  <body style="text-align:center;font-family:Arial;background:linear-gradient(to right,#c2b6ff,#8ec5fc)">

    <div style="background:white;padding:30px;width:320px;margin:80px auto;border-radius:15px;">
      <h2>⏱ Focus Timer</h2>

      <input type="text" id="task" placeholder="What are you studying?" style="padding:10px;width:90%;margin:8px;border-radius:8px;"><br>

      <select id="mode" style="padding:10px;width:90%;margin:8px;border-radius:8px;">
        <option value="25">25 min</option>
        <option value="50">50 min</option>
        <option value="custom">Custom</option>
      </select><br>

      <input id="custom" type="number" placeholder="Enter minutes" style="display:none;padding:10px;width:90%;margin:8px;border-radius:8px;"><br>

      <div id="timer" style="font-size:45px;margin:20px;font-weight:bold;">25:00</div>

      <button onclick="start()" style="margin:5px;padding:10px 15px;border:none;border-radius:8px;background:#6a8df0;color:white;">Start</button>
      <button onclick="pause()" style="margin:5px;padding:10px 15px;border:none;border-radius:8px;background:#6a8df0;color:white;">Pause</button>
      <button onclick="reset()" style="margin:5px;padding:10px 15px;border:none;border-radius:8px;background:#6a8df0;color:white;">Reset</button>

      <br><br>
      <a href="/">⬅ Back</a>
    </div>

    <script>
      let time = 25 * 60;
      let interval;

      const mode = document.getElementById("mode");
      const custom = document.getElementById("custom");

      mode.onchange = () => {
        custom.style.display = mode.value === "custom" ? "block" : "none";
      };

      function start() {
        clearInterval(interval);

        let minutes = mode.value === "custom"
          ? custom.value || 25
          : mode.value;

        time = minutes * 60;

        interval = setInterval(() => {
          let m = Math.floor(time / 60);
          let s = time % 60;

          document.getElementById("timer").innerText =
            m + ":" + (s < 10 ? "0" + s : s);

          time--;

          if (time < 0) {
            clearInterval(interval);
            alert("Done 🎉");
          }
        }, 1000);
      }

      function pause() {
        clearInterval(interval);
      }

      function reset() {
        clearInterval(interval);
        time = 25 * 60;
        document.getElementById("timer").innerText = "25:00";
      }
    </script>

  </body>
  </html>
  `);
});


app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});