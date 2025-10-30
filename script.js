// TradeLive
// ------------------------------------------------------------------

// --------------- Global State -------------------------------------
let chart;
let strikePrices = [];
let ivDiffs = [];
let putIVs = [];
let callIVs = [];
let rowCount = 11; // default rows (5 ITM, 1 ATM, 5 OTM)

// --------------- DOM Elements ------------------------------------
const optionRowsContainer = document.getElementById("optionRows");
const calculateBtn = document.getElementById("calculateBtn");
const graphBtn = document.getElementById("graphBtn");
const addRowBtn = document.getElementById("addRowBtn");
const symbolNameInput = document.getElementById("symbolNameInput");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const disclaimerBtn = document.getElementById("disclaimerBtn");
const body = document.body;

// --------------- Theme Management --------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem("theme") ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  if (savedTheme === "dark") {
    body.classList.add("dark-theme");
    if (themeToggleBtn) themeToggleBtn.innerHTML = `<i class='bx bx-sun'></i> Light Mode`;
  } else {
    body.classList.remove("dark-theme");
    if (themeToggleBtn) themeToggleBtn.innerHTML = `<i class='bx bx-moon'></i> Dark Mode`;
  }
}

function toggleTheme() {
  body.classList.toggle("dark-theme");
  const isDark = body.classList.contains("dark-theme");

  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = isDark ? `<i class='bx bx-sun'></i> Light Mode` : `<i class='bx bx-moon'></i> Dark Mode`;
  }
  localStorage.setItem("theme", isDark ? "dark" : "light");

  if (chart) drawGraphOnly(); // re-render chart to adjust colors
}

// --------------- Disclaimer Page --------------------------------
function showDisclaimer() {
  const calculatorState = {
    inputs: getCurrentInputValues(),
    symbol: getSymbolName(),
    strikePrices: strikePrices,
    ivDiffs: ivDiffs,
    putIVs: putIVs,
    callIVs: callIVs,
    rowCount: rowCount,
    isDark: body.classList.contains("dark-theme")
  };
  localStorage.setItem('calculatorState', JSON.stringify(calculatorState));

  const isDark = calculatorState.isDark;
  
  document.body.innerHTML = `
    <div class="disclaimer-container">
      <h1>Disclaimer</h1>
      <div class="disclaimer-content">
        <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
        <p>The information provided by TradeLive Calculator ("we," "us," or "our") is for general informational purposes only. All information on this calculator is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information.</p>
        <p><strong>Financial Disclaimer:</strong> The calculator is not intended to provide financial advice. We are not financial advisors, brokers, or dealers. The calculator's results should not be construed as financial advice or recommendations to buy, sell, or hold any security or investment. You should consult with a qualified financial professional before making any financial decisions.</p>
        <p><strong>No Warranty:</strong> Your use of the calculator is solely at your own risk. The calculator is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
        <p><strong>Limitation of Liability:</strong> We will not be liable to you or any third party for any damages of any kind arising from the use of this calculator, including but not limited to direct, indirect, incidental, consequential, or punitive damages.</p>
        <p><strong>Accuracy of Calculations:</strong> While we strive to provide accurate calculations, we cannot guarantee that all calculations will be error-free. You should verify any critical calculations independently.</p>
      </div>
      <button id="backToCalculatorBtn" class="back-btn">
        <i class='bx bx-arrow-back'></i> Back to Calculator
      </button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    body {
      font-family: 'Poppins', sans-serif;
      background: ${isDark ? '#121212' : '#ebebdc'};
      color: ${isDark ? '#ffffff' : '#333333'};
      padding: 20px;
      min-height: 100vh;
    }
    .disclaimer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: rgb(212, 16, 16);
    }
    .disclaimer-content {
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .disclaimer-content p {
      margin-bottom: 15px;
    }
    .back-btn {
      display: block;
      width: 100%;
      max-width: 200px;
      margin: 20px auto 0;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      background-color: purple;
      color: white;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .back-btn:hover {
      background-color: rgb(84, 2, 84);
    }
    .back-btn i {
      margin-right: 8px;
    }
  `;
  document.head.appendChild(style);

  document.getElementById('backToCalculatorBtn').addEventListener('click', () => {
    window.location.reload();
  });
}

// --------------- Helper Functions --------------------------------
function getSymbolName() {
  return symbolNameInput ? symbolNameInput.value.trim() : "";
}

function getCurrentInputValues() {
  const data = [];
  for (let i = 0; i < rowCount; i++) {
    data.push({
      strike: document.getElementById(`strike-${i}`)?.value || "",
      putIV: document.getElementById(`putiv-${i}`)?.value || "",
      callIV: document.getElementById(`calliv-${i}`)?.value || "",
      diffText: document.getElementById(`diff-${i}`)?.innerText || "-",
      diffClass: document.getElementById(`diff-${i}`)?.className || ""
    });
  }
  return data;
}

// --------------- Row Handling ------------------------------------
function createOptionRows(savedData = null) {
  optionRowsContainer.innerHTML = "";
  const atmIndex = Math.floor(rowCount / 2);

  for (let i = 0; i < rowCount; i++) {
    const strikePlaceholder =
      i < atmIndex ? "----- ITM -----" :
      i === atmIndex ? "----- ATM -----" : "----- OTM -----";

    const row = document.createElement("div");
    row.className = "option-row";
    
    if (i === atmIndex) {
      row.classList.add("atm-row");
    }

    const strikeVal = savedData ? savedData[i]?.strike : "";
    const putVal = savedData ? savedData[i]?.putIV : "";
    const callVal = savedData ? savedData[i]?.callIV : "";
    const diffText = savedData ? savedData[i]?.diffText : "-";
    const diffClass = savedData ? savedData[i]?.diffClass : "";

    row.innerHTML = `
      <input type="number" id="strike-${i}" placeholder="${strikePlaceholder}" value="${strikeVal}" />
      <input type="number" id="putiv-${i}" placeholder="Call Value %" value="${putVal}" />
      <input type="number" id="calliv-${i}" placeholder="Put Value %" value="${callVal}" />
      <span id="diff-${i}" class="${diffClass}">${diffText}</span>
    `;
    optionRowsContainer.appendChild(row);
  }
}

function addOptionRowsPair() {
  const currentData = getCurrentInputValues();
  const atmIndex = Math.floor(rowCount / 2);

  rowCount += 2;
  // Insert two blank rows around ATM index so layout preserves ATM center
  currentData.splice(atmIndex, 0, { strike: "", putIV: "", callIV: "", diffText: "-", diffClass: "" });
  currentData.splice(atmIndex + 2, 0, { strike: "", putIV: "", callIV: "", diffText: "-", diffClass: "" });

  createOptionRows(currentData);
}

// --------------- Calculation (with totals + color classes) ------------------------
function calculateIV() {
  strikePrices = [];
  ivDiffs = [];
  putIVs = [];
  callIVs = [];
  let validData = false;

  // Divide strikes around the ATM
  const atmIndex = Math.floor(rowCount / 2);
  let upperSum = 0; // Above ATM
  let lowerSum = 0; // Below ATM

  for (let i = 0; i < rowCount; i++) {
    const strikeInput = document.getElementById(`strike-${i}`);
    const putInput = document.getElementById(`putiv-${i}`);
    const callInput = document.getElementById(`calliv-${i}`);
    const diffCell = document.getElementById(`diff-${i}`);

    const strike = parseFloat(strikeInput?.value);
    const putIV = parseFloat(putInput?.value);
    const callIV = parseFloat(callInput?.value);

    // reset all styling
    diffCell.className = "final-value";

    if (!isNaN(strike) && !isNaN(callIV) && !isNaN(putIV)) {
      const diff = +((callIV + putIV) / 100).toFixed(2);

      strikePrices.push(strike);
      ivDiffs.push(diff);
      putIVs.push(putIV);
      callIVs.push(callIV);

      diffCell.innerText = diff.toFixed(2);

      // Apply color logic
      if (i < atmIndex) {
        diffCell.classList.add("above-atm"); 
        upperSum += diff;
      } else if (i === atmIndex) {
        diffCell.classList.add("atm"); 
      } else if (i > atmIndex) {
        diffCell.classList.add("below-atm"); 
        lowerSum += diff;
      }

      validData = true;
    } else {
      diffCell.innerText = "-";
      diffCell.className = "";
      putIVs.push(null);
      callIVs.push(null);
    }
  }

  if (graphBtn) graphBtn.disabled = !validData;

  // ✅ Show totals
  showTotals(upperSum, lowerSum);
}


// --------------- Stylish Totals Display (with icons) ------------------------
function showTotals(upperSum, lowerSum) {
  let totalsDiv = document.getElementById("totals");
  if (!totalsDiv) {
    totalsDiv = document.createElement("div");
    totalsDiv.id = "totals";
    addRowBtn.parentElement.insertBefore(totalsDiv, addRowBtn.nextSibling);
  }

  const result = (upperSum - lowerSum).toFixed(2);
  const formatVal = (val) => (val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2));

  totalsDiv.innerHTML = `
    <i class="fa-solid fa-arrow-trend-up"></i> 
    Above ATM = <span class="positive">${formatVal(upperSum)}</span> |
    <i class="fa-solid fa-arrow-trend-down"></i> 
    Below ATM = <span class="negative">${formatVal(lowerSum)}</span> |
    <i class="fa-solid fa-scale-balanced"></i> 
    Result = <span class="${result >= 0 ? "positive" : "negative"}">
      ${formatVal(parseFloat(result))}
    </span>
  `;
}

function showTotals(totalPositive, totalNegative) {
  let totalsDiv = document.getElementById("totals");
  if (!totalsDiv) {
    totalsDiv = document.createElement("div");
    totalsDiv.id = "totals";
    totalsDiv.style.marginTop = "10px";
    totalsDiv.style.fontWeight = "bold";
    totalsDiv.style.fontSize = "20px";
    totalsDiv.style.textAlign = "center";
    // Insert totals after Add Row button
    addRowBtn.parentElement.insertBefore(totalsDiv, addRowBtn.nextSibling);
  }

  // Calculate total difference: subtract smaller value from larger value
  const totalDifference = Math.abs(totalPositive - Math.abs(totalNegative)).toFixed(2);

  totalsDiv.innerHTML = `
    Total (Call)  <span style="color:var(--positive-color)">${totalPositive.toFixed(2)}</span> | 
    Total (Put)  <span style="color:var(--negative-color)">${totalNegative.toFixed(2)}</span> | 
    Total Difference  <span style="color:${
      totalPositive >= Math.abs(totalNegative) ? 'var(--positive-color)' : 'var(--negative-color)'
    }">${totalDifference}</span>
  `;
}

// --------------- Chart Rendering with Center Background Watermark ------------------------
function drawGraphOnly() {
  const canvas = document.getElementById("ivChart");
  const ctx = canvas.getContext("2d");
  if (chart) chart.destroy();

  const symbolName = getSymbolName();
  const now = new Date();
  const dateStr = now.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
  });

  const isDark = body.classList.contains("dark-theme");
  const textColor = isDark ? "#ffffffff" : "#222";
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const watermarkColor = isDark ? "rgba(255, 255, 255, 0.31)" : "rgba(0,0,0,0.08)"; // faint

  const hasData = strikePrices.length && ivDiffs.length;

  // If no data — show only watermark centered
  if (!hasData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.font = "bold 70px Poppins, Arial";
    ctx.fillStyle = watermarkColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TradeLive", canvas.width / 2, canvas.height / 2);
    ctx.restore();
    return;
  }

  // Determine ATM index and bar colors
  const atmIndex = Math.floor(strikePrices.length / 2);
  const barColors = strikePrices.map((_, i) => {
    if (i < atmIndex) return "#10b981"; // Green - below ATM
    if (i > atmIndex) return "#ef4444"; // Red - above ATM
    return "#ffb300"; // Purple - ATM
  });

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: strikePrices,
      datasets: [
        {
          label: "Value Difference",
          data: ivDiffs,
          backgroundColor: barColors,
          borderRadius: 8
        },
        {
          label: "Trend Line",
          data: ivDiffs,
          type: "line",
          borderWidth: 2,
          pointBackgroundColor: barColors,
          fill: false,
          tension: 0.3,
          segment: {
            borderColor: (ctx) => {
              const index = ctx.p0DataIndex;
              return barColors[index];
            }
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          align: "start",
          text: [dateStr],
          font: { size: 14, weight: "normal" },
          color: textColor,
          padding: { top: 10, bottom: 20 }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const writer = value >= 0 ? "WebKaushal" : "WebKaushal";
              return `Strike: ${context.label} | Diff: ${value} | ${writer}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Strike Price", color: textColor },
          ticks: { autoSkip: false, maxRotation: 90, minRotation: 45, color: textColor },
          grid: { color: gridColor, drawBorder: false }
        },
        y: {
          title: { display: true, text: "Value Difference (WebKaushal)", color: textColor },
          beginAtZero: false,
          ticks: { color: textColor },
          grid: { color: gridColor, drawBorder: false }
        }
      }
    },
    plugins: [
      // 🌊 Background watermark plugin (centered)
      {
        id: "centerWatermark",
        beforeDraw(chartInstance) {
          const { ctx, chartArea } = chartInstance;
          if (!chartArea) return;

          const { left, top, width, height } = chartArea;

          ctx.save();
          ctx.globalAlpha = 0.08; // transparency
          ctx.font = "bold 80px Poppins, Arial";
          ctx.fillStyle = watermarkColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("WebKaushal", left + width / 2, top + height / 2);
          ctx.restore();
        }
      },
      // 🏷️ Symbol name title
      {
        id: "symbolTitle",
        beforeDraw(chartInstance) {
          if (!symbolName) return;
          const { ctx: c, width } = chartInstance;
          c.save();
          c.font = "bold 20px Poppins, Arial";
          c.fillStyle = textColor;
          c.textAlign = "center";
          c.textBaseline = "top";
          c.fillText(symbolName, width / 2, 6);
          c.restore();
        }
      }
    ]
  });

  // Scroll chart into view
  const chartArea = document.getElementById("chartArea");
  if (chartArea) chartArea.scrollIntoView({ behavior: "smooth" });
}

// ================= Download PDF =================
async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const element = document.getElementById("chartArea");

  // Capture chart area
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  // Create PDF in landscape
  const pdf = new jsPDF("l", "mm", "a4"); // "l" for landscape
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 10, 10, pdfWidth - 20, pdfHeight);
  pdf.save("TradeLive.pdf");
}

// ------------------ Show Graph (calculate -> draw -> save history) ------------------
function showGraph() {
  calculateIV();
  drawGraphOnly();
  saveToHistory();
}

// --------------- History Management --------------------------------
function saveToHistory() {
  const data = {
    date: new Date().toISOString(),
    symbolName: getSymbolName(),
    strikePrices: [...strikePrices],
    ivDiffs: [...ivDiffs],
    putIVs: [...putIVs],
    callIVs: [...callIVs]
  };

  // capture chart snapshot and save to localStorage
  const chartArea = document.getElementById("chartArea");
  if (!chartArea) return;

  html2canvas(chartArea, { scale: 2 }).then(canvas => {
    data.img = canvas.toDataURL("image/png");
    const history = JSON.parse(localStorage.getItem("ivHistory") || "[]");
    history.unshift(data);
    if (history.length > 100) history.pop();
    localStorage.setItem("ivHistory", JSON.stringify(history));
  });
}

function showHistory() {
  const historyDiv = document.getElementById("historyList");
  const itemsDiv = document.getElementById("historyItems");
  if (!historyDiv || !itemsDiv) return;

  itemsDiv.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("ivHistory") || "[]");

  if (history.length === 0) {
    itemsDiv.innerHTML = "<p>No history found.</p>";
  } else {
    history.forEach((entry, index) => {
      const date = new Date(entry.date).toLocaleString();
      const symbolName = entry.symbolName || "";
      const div = document.createElement("div");
      div.className = "history-item";
      div.title = "Click to load this result";

      div.innerHTML = `
        <img src="${entry.img}" alt="Chart snapshot"/>
        <div>
          <div><strong>Date:</strong> ${date}</div>
          ${symbolName ? `<div><strong>Symbol:</strong> ${symbolName}</div>` : ""}
          <div><small>Strike Prices: ${entry.strikePrices.join(", ")}</small></div>
        </div>
        <button class="btn small-delete" data-index="${index}">
          <i class='bx bx-trash'></i>
        </button>
      `;

      // click handlers for load and delete
      const imgEl = div.querySelector("img");
      const infoDiv = div.querySelector("div");
      const delBtn = div.querySelector(".small-delete");

      imgEl && (imgEl.onclick = () => loadHistoryEntry(index));
      infoDiv && (infoDiv.onclick = () => loadHistoryEntry(index));
      delBtn && (delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteHistoryEntry(index);
      }));

      itemsDiv.appendChild(div);
    });

    const deleteAllBtn = document.createElement("button");
    deleteAllBtn.className = "btn delete-btn";
    deleteAllBtn.innerHTML = `<i class='bx bx-trash'></i> Delete All History`;
    deleteAllBtn.addEventListener("click", clearHistory);
    itemsDiv.appendChild(deleteAllBtn);
  }

  historyDiv.style.display = "block";
  historyDiv.scrollIntoView({ behavior: "smooth" });
}

function deleteHistoryEntry(index) {
  const history = JSON.parse(localStorage.getItem("ivHistory") || "[]");
  history.splice(index, 1);
  localStorage.setItem("ivHistory", JSON.stringify(history));
  showHistory();
}

function clearHistory() {
  if (confirm("Are you sure you want to delete all history?")) {
    localStorage.removeItem("ivHistory");
    showHistory();
  }
}

function loadHistoryEntry(index) {
  const history = JSON.parse(localStorage.getItem("ivHistory") || "[]");
  const entry = history[index];
  if (!entry) return;

  if (entry.strikePrices.length !== rowCount) {
    rowCount = entry.strikePrices.length;
    const savedData = entry.strikePrices.map((s, i) => ({
      strike: s ?? "",
      putIV: entry.putIVs ? entry.putIVs[i] ?? "" : "",
      callIV: entry.callIVs ? entry.callIVs[i] ?? "" : "",
      diffText: (entry.ivDiffs[i] !== undefined) ? entry.ivDiffs[i].toFixed(2) : "-",
      diffClass: (entry.ivDiffs[i] >= 0) ? "positive" : "negative"
    }));
    createOptionRows(savedData);
  } else {
    for (let i = 0; i < rowCount; i++) {
      document.getElementById(`strike-${i}`).value = entry.strikePrices[i] ?? "";
      document.getElementById(`putiv-${i}`).value = entry.putIVs ? entry.putIVs[i] ?? "" : "";
      document.getElementById(`calliv-${i}`).value = entry.callIVs ? entry.callIVs[i] ?? "" : "";
      const diffCell = document.getElementById(`diff-${i}`);
      if (diffCell) {
        diffCell.innerText = (entry.ivDiffs[i] !== undefined) ? entry.ivDiffs[i].toFixed(2) : "-";
        diffCell.className = (entry.ivDiffs[i] >= 0) ? "positive" : "negative";
      }
    }
  }

  if (symbolNameInput) symbolNameInput.value = entry.symbolName || "";

  strikePrices = [...entry.strikePrices];
  ivDiffs = [...entry.ivDiffs];
  putIVs = entry.putIVs ? [...entry.putIVs] : [];
  callIVs = entry.callIVs ? [...entry.callIVs] : [];

  drawGraphOnly();
}

// --------------- Misc ---------------------------------------------
function refreshPage() {
  window.location.reload();
}

// --------------- State Restoration -------------------------------
function restoreCalculatorState() {
  const savedState = localStorage.getItem('calculatorState');
  if (savedState) {
    const state = JSON.parse(savedState);

    rowCount = state.rowCount || rowCount;
    strikePrices = state.strikePrices || [];
    ivDiffs = state.ivDiffs || [];
    putIVs = state.putIVs || [];
    callIVs = state.callIVs || [];

    if (symbolNameInput) symbolNameInput.value = state.symbol || "";

    createOptionRows(state.inputs || null);
    localStorage.removeItem('calculatorState');

    if (strikePrices.length > 0) {
      drawGraphOnly();
    }
  }
}

// --------------- About Page --------------------------------
function showAbout() {
  const calculatorState = {
    inputs: getCurrentInputValues(),
    symbol: getSymbolName(),
    strikePrices: strikePrices,
    ivDiffs: ivDiffs,
    putIVs: putIVs,
    callIVs: callIVs,
    rowCount: rowCount,
    isDark: body.classList.contains("dark-theme")
  };
  localStorage.setItem('calculatorState', JSON.stringify(calculatorState));

  const isDark = calculatorState.isDark;
  
  document.body.innerHTML = `
  <div class="disclaimer-container">
    <h1>About</h1>
    <div class="disclaimer-content">
    <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
    <p>The <strong>TradeLive</strong> is an educational tool designed to simplify the complex world of option trading for learners, students, and market enthusiasts. It provides a practical way to analyze option chain data, visualize differences between call and put values, and understand potential market trends.</p>
    <p>Unlike advanced trading platforms, TradeLive is beginner-friendly. Users can enter strike prices along with call and put implied values, and the calculator instantly computes the differences. Positive differences are highlighted in <span style="color:rgba(4, 155, 135, 1);">green</span>, while negative differences appear in <span style="color:rgb(212, 16, 16);">red</span>, offering a clear snapshot of market sentiment.</p>
    <p>Interactive charts allow users to visualize trends and compare results, helping learners build confidence in interpreting option chain data. Additional features include history storage, PDF downloads, and theme customization, making the tool flexible and engaging for regular use.</p>
    <p><strong>Educational Purpose:</strong> The calculator is intended solely for informational and educational purposes. It does not provide financial advice, recommendations, or strategies. Trading and investing involve risk, and decisions should be made after consulting qualified financial professionals.</p>
    <p>At its core, TradeLive serves as a learning companion. Whether you are a beginner exploring the basics or an intermediate learner refining analytical skills, this tool supports your trading education journey safely and effectively.</p>
    </div>
    <button id="backToCalculatorBtn" class="back-btn">
    <i class='bx bx-arrow-back'></i> Back to Calculator
    </button>
  </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    body {
      font-family: 'Poppins', sans-serif;
      background: ${isDark ? '#121212' : '#ebebdc'};
      color: ${isDark ? '#ffffff' : '#333333'};
      padding: 20px;
      min-height: 100vh;
    }
    .disclaimer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: purple;
    }
    .disclaimer-content {
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .disclaimer-content p {
      margin-bottom: 15px;
    }
    .back-btn {
      display: block;
      width: 100%;
      max-width: 200px;
      margin: 20px auto 0;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      background-color: purple;
      color: white;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .back-btn:hover {
      background-color: rgb(84, 2, 84);
    }
    .back-btn i {
      margin-right: 8px;
    }
  `;
  document.head.appendChild(style);

  document.getElementById('backToCalculatorBtn').addEventListener('click', () => {
    window.location.reload();
  });
}

// --------------- How To Use Page --------------------------------
function showRules() {
  const calculatorState = {
    inputs: getCurrentInputValues(),
    symbol: getSymbolName(),
    strikePrices: strikePrices,
    ivDiffs: ivDiffs,
    putIVs: putIVs,
    callIVs: callIVs,
    rowCount: rowCount,
    isDark: body.classList.contains("dark-theme")
  };
  localStorage.setItem('calculatorState', JSON.stringify(calculatorState));

  const isDark = calculatorState.isDark;
  
  document.body.innerHTML = `
  <div class="disclaimer-container">
   <h1>How to Use?</h1>
   <div class="disclaimer-content">
    <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
    <p>Follow these steps to use the TradeLive efficiently:</p>
    
    <p><strong>Step 1:</strong> First, search for <strong>tradelive.com</strong> on Google.</p>
    
    <p><strong>Step 2:</strong> Enter your <strong>Symbol Name</strong> in the input field.</p>
    
    <p><strong>Step 3:</strong> Go to the official <strong>option chain</strong> of your symbol. For example, Nifty 50’s option chain is on NSE, and Meta’s option chain is on NASDAQ.</p>
    
    <p><strong>Step 4:</strong> Use the <strong>Change OI</strong> from the option chain. If Change OI is unavailable, use the <strong>OI</strong> value instead.</p>
    
    <p><strong>Step 5:</strong> Enter the <strong>Call Change OI</strong> in the <strong>Call Value</strong> field and the <strong>Put Change OI</strong> in the <strong>Put Value</strong> field.</p>
    
    <p><strong>Step 6:</strong> Click the <strong>Calculate</strong> button. After calculation, differences will appear next to your values. You will also see <strong>Total Green (Positive)</strong>, <strong>Total Red (Negative)</strong>, and <strong>Total Difference</strong> values displayed.</p>
    
    <p><strong>Step 7:</strong> Click the <strong>Show Graph</strong> button. You will see a <strong>histogram</strong> along with a <strong>line chart</strong>. Click on the histogram bars to view tags like <strong>Call Writer</strong> or <strong>Put Writer</strong> for instrument insights.</p>
    
    <p><strong>Step 8:</strong> <strong>Interpret the results:</strong></p>
    <p>&nbsp;&nbsp;- If <strong>Total Green (Positive) &gt; Total Red (Negative)</strong>, the instrument is likely to <strong>move up</strong>.</p>
    <p>&nbsp;&nbsp;- If <strong>Total Green (Positive) &lt; Total Red (Negative)</strong>, the instrument is likely to <strong>move down</strong>.</p>
    <p>&nbsp;&nbsp;- If the values are nearly equal, the instrument is likely to move <strong>sideways</strong>.</p>

   </div>
   <button id="backToCalculatorBtn" class="back-btn">
    <i class='bx bx-arrow-back'></i> Back to Calculator
   </button>
  </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    body {
      font-family: 'Poppins', sans-serif;
      background: ${isDark ? '#121212' : '#ebebdc'};
      color: ${isDark ? '#ffffff' : '#333333'};
      padding: 20px;
      min-height: 100vh;
    }
    .disclaimer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: purple;
    }
    .disclaimer-content {
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .disclaimer-content p {
      margin-bottom: 15px;
    }
    .back-btn {
      display: block;
      width: 100%;
      max-width: 200px;
      margin: 20px auto 0;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      background-color: purple;
      color: white;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .back-btn:hover {
      background-color: rgb(84, 2, 84);
    }
    .back-btn i {
      margin-right: 8px;
    }
  `;
  document.head.appendChild(style);

  document.getElementById('backToCalculatorBtn').addEventListener('click', () => {
    window.location.reload();
  });
}

// --------------- Privacy Policy Page --------------------------------
function showPrivacy() {
  const calculatorState = {
    inputs: getCurrentInputValues(),
    symbol: getSymbolName(),
    strikePrices: strikePrices,
    ivDiffs: ivDiffs,
    putIVs: putIVs,
    callIVs: callIVs,
    rowCount: rowCount,
    isDark: body.classList.contains("dark-theme")
  };
  localStorage.setItem('calculatorState', JSON.stringify(calculatorState));

  const isDark = calculatorState.isDark;
  
  document.body.innerHTML = `
  <div class="disclaimer-container">
    <h1>Privacy Policy</h1>
    <div class="disclaimer-content">
    <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
    <p>Your privacy is important to us at <strong>TradeLive</strong>. This Privacy Policy explains how we collect, use, and protect your personal information when you use our calculator and related services.</p>
    
    <p><strong>Information Collection:</strong> We do not require personal information to use the calculator. However, data you enter into the calculator, such as strike prices, call and put values, and your symbol names, may be stored locally in your browser's <strong>localStorage</strong> to provide features like history tracking and chart rendering.</p>
    
    <p><strong>Use of Information:</strong> The information stored locally is used solely to improve your user experience, including displaying past calculations, generating charts, and allowing you to download PDFs. We do not share this information with third parties or use it for marketing purposes.</p>
    
    <p><strong>Cookies and Local Storage:</strong> TradeLive may use browser local storage and cookies to save theme preferences, calculator history, and other session settings. This ensures that your data and settings persist between visits.</p>
    
    <p><strong>Third-Party Services:</strong> If third-party services (like Chart.js or html2canvas) are used to render charts or generate PDFs, no personal identifiable information is shared with these services. All calculations and input data remain on your device.</p>
    
    <p><strong>Security:</strong> While we implement reasonable measures to protect your data stored in the browser, we cannot guarantee complete security. You are responsible for the security of your device and browser.</p>
    
    <p><strong>Legal Notice:</strong> Any misuse of the TradeLive to commit fraud, manipulate markets, or conduct illegal activities is strictly prohibited. Such actions are considered a criminal offense and may result in legal consequences under applicable law.</p>
    
    <p><strong>Changes to Privacy Policy:</strong> We may update this Privacy Policy from time to time. Any changes will be reflected here, and the last updated date will be revised accordingly.</p>
    
    <p>By using the TradeLive, you consent to the practices described in this Privacy Policy. If you do not agree with any part of this policy, please do not use the calculator.</p>
    </div>
    <button id="backToCalculatorBtn" class="back-btn">
    <i class='bx bx-arrow-back'></i> Back to Calculator
    </button>
  </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    body {
      font-family: 'Poppins', sans-serif;
      background: ${isDark ? '#121212' : '#ebebdc'};
      color: ${isDark ? '#ffffff' : '#333333'};
      padding: 20px;
      min-height: 100vh;
    }
    .disclaimer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: purple;
    }
    .disclaimer-content {
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .disclaimer-content p {
      margin-bottom: 15px;
    }
    .back-btn {
      display: block;
      width: 100%;
      max-width: 200px;
      margin: 20px auto 0;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      background-color: purple;
      color: white;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .back-btn:hover {
      background-color: rgb(84, 2, 84);
    }
    .back-btn i {
      margin-right: 8px;
    }
  `;
  document.head.appendChild(style);

  document.getElementById('backToCalculatorBtn').addEventListener('click', () => {
    window.location.reload();
  });
}

// --------------- Event Listeners ---------------------------------
if (calculateBtn) calculateBtn.addEventListener("click", calculateIV);
if (addRowBtn) addRowBtn.addEventListener("click", addOptionRowsPair);
if (graphBtn) graphBtn.addEventListener("click", showGraph);
if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
if (disclaimerBtn) disclaimerBtn.addEventListener("click", showDisclaimer);

// --------------- Initialize App ----------------------------------
initTheme();
createOptionRows();
restoreCalculatorState();

// disable right-click context menu
document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
}, false);

// ================= Share Menu Proper =================

// Get elements
const shareBtn = document.getElementById("wk-banner-close");
const shareMenu = document.getElementById("shareMenu");

// Ensure elements exist
if (shareBtn && shareMenu) {

  // Toggle menu on button click
  shareBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent document click from closing immediately
    shareMenu.classList.toggle("active");
  });

  // Stop clicks inside the menu from closing it
  shareMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Close menu when clicking outside
  document.addEventListener("click", () => {
    shareMenu.classList.remove("active");
  });

  // Dynamic share links
  const pageUrl = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(document.title);

  document.getElementById("shareWhatsapp")?.setAttribute(
    "href",
    `https://api.whatsapp.com/send?text=${pageTitle}%20${pageUrl}`
  );
  document.getElementById("shareTelegram")?.setAttribute(
    "href",
    `https://t.me/share/url?url=${pageUrl}&text=${pageTitle}`
  );
  document.getElementById("shareFacebook")?.setAttribute(
    "href",
    `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`
  );
  document.getElementById("shareX")?.setAttribute(
    "href",
    `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`
  );
  document.getElementById("shareLinkedIn")?.setAttribute(
    "href",
    `https://www.linkedin.com/shareArticle?mini=true&url=${pageUrl}&title=${pageTitle}`
  );
}