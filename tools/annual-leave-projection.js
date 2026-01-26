const hoursPerWeekInput = document.getElementById("hoursPerWeek");
const hoursPerDayInput = document.getElementById("hoursPerDay");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const currentBalanceInput = document.getElementById("currentBalance");
const plannedLeaveInput = document.getElementById("plannedLeave");
const currentPersonalBalanceInput = document.getElementById("currentPersonalBalance");
const plannedPersonalLeaveInput = document.getElementById("plannedPersonalLeave");
const unpaidWeeksInput = document.getElementById("unpaidWeeks");
const unpaidDaysInput = document.getElementById("unpaidDays");
const result = document.getElementById("leaveResult");
const calculateButton = document.getElementById("calculateLeave");

const ANNUAL_RATE = 4 / 52; // 7.6923% of ordinary hours
const PERSONAL_RATE = 1 / 26; // 10 days per year

function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function daysBetween(start, end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    return Math.max(0, Math.round((endDate - startDate) / msPerDay));
}

function formatHours(value) {
    return `${value.toFixed(2)} hrs`;
}

function formatDays(value) {
    return `${value.toFixed(2)} days`;
}

function calculateProjection() {
    const hoursPerWeek = toNumber(hoursPerWeekInput.value);
    const hoursPerDay = toNumber(hoursPerDayInput.value);
    const currentBalance = toNumber(currentBalanceInput.value);
    const plannedLeave = toNumber(plannedLeaveInput.value);
    const currentPersonal = toNumber(currentPersonalBalanceInput.value);
    const plannedPersonal = toNumber(plannedPersonalLeaveInput.value);
    const unpaidWeeks = toNumber(unpaidWeeksInput.value);
    const unpaidDays = toNumber(unpaidDaysInput.value);

    if (!hoursPerWeek || !hoursPerDay) {
        result.textContent = "Please enter ordinary hours per week and hours per day.";
        return;
    }

    if (!startDateInput.value || !endDateInput.value) {
        result.textContent = "Please select a start and end date.";
        return;
    }

    const totalDays = daysBetween(startDateInput.value, endDateInput.value);
    if (totalDays <= 0) {
        result.textContent = "End date must be after the start date.";
        return;
    }

    const totalWeeks = totalDays / 7;
    const daysPerWeek = hoursPerWeek / hoursPerDay;
    const unpaidWeeksTotal = unpaidWeeks + (daysPerWeek ? unpaidDays / daysPerWeek : 0);
    const paidWeeks = Math.max(0, totalWeeks - unpaidWeeksTotal);

    // Annual leave
    const annualAccruedHours = hoursPerWeek * ANNUAL_RATE * paidWeeks;
    const annualProjectedHours = currentBalance + annualAccruedHours - plannedLeave;
    const annualProjectedDays = annualProjectedHours / hoursPerDay;

    // Personal leave
    const personalAccruedHours = hoursPerWeek * PERSONAL_RATE * paidWeeks;
    const personalProjectedHours = currentPersonal + personalAccruedHours - plannedPersonal;
    const personalProjectedDays = personalProjectedHours / hoursPerDay;

    result.textContent =
        `Annual leave\n- Accrued: ${formatHours(annualAccruedHours)}\n- Projected balance: ${formatHours(annualProjectedHours)} (${formatDays(annualProjectedDays)})\n\n` +
        `Personal leave\n- Accrued: ${formatHours(personalAccruedHours)}\n- Projected balance: ${formatHours(personalProjectedHours)} (${formatDays(personalProjectedDays)})`;
}

calculateButton.addEventListener("click", calculateProjection);

[
    startDateInput,
    endDateInput,
    hoursPerWeekInput,
    hoursPerDayInput,
    currentBalanceInput,
    currentPersonalBalanceInput,
    plannedLeaveInput,
    plannedPersonalLeaveInput,
].forEach((input) => {
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            calculateProjection();
        }
    });
});
