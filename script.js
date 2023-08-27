function generateFiscalYear() {
    const dateInput = document.getElementById("dateInput");
    const result = document.getElementById("result");

    if (!dateInput.value) {
        result.textContent = "Please select a valid date.";
        return;
    }

    const selectedDate = new Date(dateInput.value);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1; // Months are 0-indexed
    console.log(month);
    let fiscalYear = year;
    let quarter = "";

    if (month >= 7) {
        fiscalYear = year + 1;
    }

    if (month >= 7 && month <= 9) {
        quarter = "Q1";
    } else if (month >= 10 && month <= 12) {
        quarter = "Q2";
    } else if (month >= 1 && month <= 3) {
        quarter = "Q3";
    } else if (month >= 4 && month <= 6) {
        quarter = "Q4";
    }
    console.log(quarter);
    result.textContent = `Selected Date: ${dateInput.value}\nFiscal Year: ${fiscalYear}\nQuarter: ${quarter}`;
}

// Inside script.js
document.addEventListener("DOMContentLoaded", function () {
    const dateInputContainer = document.querySelector(".date-input-container");
    const dateInput = document.getElementById("dateInput");

    dateInputContainer.addEventListener("click", function () {
        dateInput.focus();
    });
});
