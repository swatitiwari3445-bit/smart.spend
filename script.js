
// ======================================
// SMARTSPEND - COMPLETE DATA ANALYTICS
// ======================================


// 1. GET HTML ELEMENTS

const expenseForm = document.getElementById("expenseForm");
const budgetForm = document.getElementById("budgetForm");

const expenseList = document.getElementById("expenseList");

const totalDisplay = document.getElementById("total");
const countDisplay = document.getElementById("count");
const budgetDisplay = document.getElementById("budgetDisplay");
const remainingDisplay = document.getElementById("remaining");

const analysis = document.getElementById("analysis");

const monthFilter = document.getElementById("monthFilter");


// 2. STORE DATA

function loadExpenses() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("smartspend_expenses") || "[]"
        );

        return Array.isArray(saved) ? saved : [];

    } catch {
        return [];
    }
}

let expenses = loadExpenses();

let monthlyBudget =
    Number(localStorage.getItem("smartspend_budget")) || 0;

let expenseChart = null;
let monthlyChart = null;


// 3. SET DEFAULT DATE

const today = new Date();

const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().slice(0, 10);

document.getElementById("date").value = localDate;

monthFilter.value = localDate.slice(0, 7);


// 4. SAVE DATA

function saveData() {

    localStorage.setItem(
        "smartspend_expenses",
        JSON.stringify(expenses)
    );

    localStorage.setItem(
        "smartspend_budget",
        String(monthlyBudget)
    );

}


// 5. FORMAT MONEY

function money(amount) {

    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });

}


// 6. GET SELECTED MONTH

function selectedMonth() {

    return monthFilter.value || localDate.slice(0, 7);

}


function expensesForMonth(month) {

    return expenses.filter(function(expense) {

        return expense.date.slice(0, 7) === month;

    });

}


// 7. ADD EXPENSE

expenseForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = document.getElementById("title").value.trim();

    const amount = Number(document.getElementById("amount").value);

    const category = document.getElementById("category").value;

    const date = document.getElementById("date").value;


    if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {

        alert("Please enter valid expense details!");

        return;

    }


    const expense = {

        id: (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : String(Date.now() + Math.random()),

        title: title,

        amount: amount,

        category: category,

        date: date

    };


    expenses.push(expense);

    saveData();

    expenseForm.reset();

    document.getElementById("date").value = localDate;

    render();

    alert("Expense Added Successfully!");

});


// 8. DISPLAY EXPENSE HISTORY

function showExpenses(monthItems) {

    expenseList.innerHTML = "";

    document.getElementById("historyEmpty").hidden =
        monthItems.length > 0;


    monthItems.slice().sort(function(a, b) {

        return b.date.localeCompare(a.date);

    }).forEach(function(expense) {

        const row = document.createElement("tr");


        const values = [

            expense.title,

            money(expense.amount),

            expense.category,

            expense.date

        ];


        values.forEach(function(value) {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        });


        const actionCell = document.createElement("td");

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";

        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function() {

            deleteExpense(expense.id);

        });


        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);

        expenseList.appendChild(row);

    });

}


// 9. DELETE EXPENSE

function deleteExpense(id) {

    if (!confirm("Are you sure you want to delete this expense?")) {

        return;

    }


    expenses = expenses.filter(function(expense) {

        return expense.id !== id;

    });


    saveData();

    render();

}


// 10. SAVE MONTHLY BUDGET

budgetForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const amount = Number(
        document.getElementById("budget").value
    );


    if (!Number.isFinite(amount) || amount <= 0) {

        alert("Please enter a valid budget!");

        return;

    }


    monthlyBudget = amount;

    saveData();

    document.getElementById("budget").value = "";

    render();

    alert("Monthly Budget Saved!");

});


// 11. UPDATE SUMMARY CARDS

function updateSummary(monthItems, total) {

    totalDisplay.textContent = money(total);

    countDisplay.textContent = monthItems.length;

    budgetDisplay.textContent =
        monthlyBudget > 0 ? money(monthlyBudget) : "Not Set";


    const remaining = monthlyBudget - total;

    remainingDisplay.textContent =
        monthlyBudget > 0 ? money(remaining) : "—";


    if (monthlyBudget <= 0) {

        remainingDisplay.style.color = "#777f98";

        document.getElementById("budgetProgress").style.width = "0%";

        document.getElementById("budgetProgressText").textContent =
            "Set your budget to begin.";

        return;

    }


    const percentage = (total / monthlyBudget) * 100;

    remainingDisplay.style.color =
        remaining < 0 ? "#d84b55" : "#16845b";


    document.getElementById("budgetProgress").style.width =
        Math.min(percentage, 100) + "%";


    document.getElementById("budgetProgress").style.background =
        percentage > 100 ? "#d84b55" : "#16845b";


    document.getElementById("budgetProgressText").textContent =
        percentage.toFixed(1) + "% of budget used. " +
        (remaining < 0
            ? money(Math.abs(remaining)) + " over budget."
            : money(remaining) + " remaining.");

}


// 12. SPENDING ANALYSIS

function showAnalysis(monthItems, total) {

    if (monthItems.length === 0) {

        analysis.textContent =
            "Add expenses to see your analysis.";

        return;

    }


    let categoryData = {};


    monthItems.forEach(function(expense) {

        if (!categoryData[expense.category]) {

            categoryData[expense.category] = 0;

        }

        categoryData[expense.category] += expense.amount;

    });


    let result = "<h3>Category Wise Spending</h3>";


    for (let category in categoryData) {

        const percentage =
            (categoryData[category] / total) * 100;


        result += `

            <p>

                <b>${category}</b> :

                ${money(categoryData[category])}

                (${percentage.toFixed(1)}%)

            </p>

        `;

    }


    const highestCategory = Object.keys(categoryData).reduce(
        function(a, b) {

            return categoryData[a] > categoryData[b] ? a : b;

        }
    );


    result += `

        <hr>

        <h3>Total Spending: ${money(total)}</h3>

        <p>

            Highest Spending Category:

            <b>${highestCategory}</b>

        </p>

    `;


    if (monthlyBudget > 0) {

        if (total > monthlyBudget) {

            result += `

                <p style="color:red">

                    <b>Warning! Budget Exceeded.</b>

                </p>

            `;

        } else {

            result += `

                <p style="color:green">

                    <b>You are within your budget!</b>

                </p>

            `;

        }

    }


    analysis.innerHTML = result;

}


// 13. PIE CHART

function updatePieChart(monthItems) {

    const categoryData = {};


    monthItems.forEach(function(expense) {

        categoryData[expense.category] =
            (categoryData[expense.category] || 0) + expense.amount;

    });


    const labels = Object.keys(categoryData);

    const values = Object.values(categoryData);


    document.getElementById("pieEmpty").hidden =
        labels.length > 0;


    if (expenseChart) {

        expenseChart.destroy();

    }


    expenseChart = new Chart(

        document.getElementById("expenseChart"),

        {

            type: "pie",

            data: {

                labels: labels,

                datasets: [{

                    data: values,

                    backgroundColor: [

                        "#6674df",

                        "#ff6384",

                        "#36a2eb",

                        "#ffce56",

                        "#4bc0c0",

                        "#9966ff",

                        "#ff9f40",

                        "#8792a9"

                    ],

                    borderWidth: 3,

                    borderColor: "#ffffff"

                }]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return context.label + ": " +
                                    money(context.raw);

                            }

                        }

                    }

                }

            }

        }

    );

}


// 14. MONTHLY BAR CHART

function updateMonthlyChart() {

    let monthlyData = {};


    expenses.forEach(function(expense) {

        const month = expense.date.slice(0, 7);

        monthlyData[month] =
            (monthlyData[month] || 0) + expense.amount;

    });


    const months = Object.keys(monthlyData).sort().slice(-12);


    const labels = months.map(function(month) {

        const parts = month.split("-");

        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            1
        ).toLocaleDateString("en-IN", {

            month: "short",

            year: "2-digit"

        });

    });


    const values = months.map(function(month) {

        return monthlyData[month];

    });


    document.getElementById("barEmpty").hidden =
        months.length > 0;


    if (monthlyChart) {

        monthlyChart.destroy();

    }


    monthlyChart = new Chart(

        document.getElementById("monthlyChart"),

        {

            type: "bar",

            data: {

                labels: labels,

                datasets: [{

                    label: "Monthly Expenses",

                    data: values,

                    backgroundColor: "#6674df",

                    borderRadius: 8,

                    maxBarThickness: 50

                }]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: false

                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return money(context.raw);

                            }

                        }

                    }

                },


                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: function(value) {

                                return "₹" +
                                    Number(value).toLocaleString("en-IN");

                            }

                        }

                    }

                }

            }

        }

    );

}


// 15. EXPORT CSV

function exportCSV() {

    const rows = [

        ["Expense Name", "Amount", "Category", "Date"]

    ];


    expensesForMonth(selectedMonth()).forEach(function(expense) {

        rows.push([

            expense.title,

            expense.amount,

            expense.category,

            expense.date

        ]);

    });


    const csv = rows.map(function(row) {

        return row.map(function(value) {

            return '"' + String(value).replace(/"/g, '""') + '"';

        }).join(",");

    }).join("\\n");


    const blob = new Blob(

        ["\\uFEFF" + csv],

        { type: "text/csv;charset=utf-8;" }

    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "SmartSpend-" + selectedMonth() + ".csv";

    link.click();

    URL.revokeObjectURL(url);

}


// 16. DOWNLOAD PDF REPORT

function downloadPDF() {

    if (!window.jspdf || !window.jspdf.jsPDF) {

        alert("PDF library could not load. Please check your internet connection.");

        return;

    }


    const items = expensesForMonth(selectedMonth());

    const total = items.reduce(function(sum, expense) {

        return sum + expense.amount;

    }, 0);


    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();


    pdf.setFontSize(20);

    pdf.text("SmartSpend Expense Report", 14, 20);


    pdf.setFontSize(11);

    pdf.text("Month: " + selectedMonth(), 14, 32);

    pdf.text("Total Expenses: " + money(total), 14, 42);

    pdf.text("Transactions: " + items.length, 14, 52);

    pdf.text(

        "Monthly Budget: " +

        (monthlyBudget > 0 ? money(monthlyBudget) : "Not Set"),

        14,

        62

    );


    let y = 78;


    pdf.setFont(undefined, "bold");

    pdf.text("Date", 14, y);

    pdf.text("Expense", 43, y);

    pdf.text("Category", 112, y);

    pdf.text("Amount", 160, y);


    pdf.setFont(undefined, "normal");

    y += 10;


    items.forEach(function(expense) {

        if (y > 275) {

            pdf.addPage();

            y = 20;

        }


        pdf.text(String(expense.date), 14, y);

        pdf.text(String(expense.title).slice(0, 30), 43, y);

        pdf.text(String(expense.category), 112, y);

        pdf.text(money(expense.amount), 160, y);


        y += 9;

    });


    pdf.save("SmartSpend-" + selectedMonth() + ".pdf");

}


// 17. MONTH FILTER

monthFilter.addEventListener("change", function() {

    render();

});


// 18. MAIN RENDER FUNCTION

function render() {

    const monthItems = expensesForMonth(selectedMonth());


    const total = monthItems.reduce(function(sum, expense) {

        return sum + expense.amount;

    }, 0);


    updateSummary(monthItems, total);

    showExpenses(monthItems);

    showAnalysis(monthItems, total);

    updatePieChart(monthItems);

    updateMonthlyChart();

}


// 19. BUTTON EVENTS

document.getElementById("exportCsv").addEventListener(
    "click",
    exportCSV
);


document.getElementById("downloadPdf").addEventListener(
    "click",
    downloadPDF
);


// 20. LOAD WEBSITE

render();
