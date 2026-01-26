const dateInput = document.getElementById("dateInput");
const result = document.getElementById("result");
const generateBtn = document.getElementById("generateBtn");

function formatResult(dateValue, fiscalYear, quarter) {
    return `Selected Date: ${dateValue}\nFiscal Year: ${fiscalYear}\nQuarter: ${quarter}`;
}

function generateFiscalYear() {
    if (!dateInput.value) {
        result.textContent = "Please select a valid date.";
        return;
    }

    const selectedDate = new Date(`${dateInput.value}T00:00:00`);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    const fiscalYear = month >= 7 ? year + 1 : year;

    let quarter = "";
    if (month >= 7 && month <= 9) {
        quarter = "Q1";
    } else if (month >= 10 && month <= 12) {
        quarter = "Q2";
    } else if (month >= 1 && month <= 3) {
        quarter = "Q3";
    } else {
        quarter = "Q4";
    }

    result.textContent = formatResult(dateInput.value, fiscalYear, quarter);
}

generateBtn.addEventListener("click", generateFiscalYear);

dateInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        generateFiscalYear();
    }
});
