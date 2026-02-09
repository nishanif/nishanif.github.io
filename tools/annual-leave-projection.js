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
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function daysBetweenInclusive(start, end) {
    const [startYear, startMonth, startDay] = start.split("-").map(Number);
    const [endYear, endMonth, endDay] = end.split("-").map(Number);

    const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
    const endUtc = Date.UTC(endYear, endMonth - 1, endDay);

    if (Number.isNaN(startUtc) || Number.isNaN(endUtc) || endUtc < startUtc) {
        return -1;
    }

    // Use UTC to avoid DST shifts and count both start and end dates.
    return Math.floor((endUtc - startUtc) / MS_PER_DAY) + 1;
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

    if (currentBalanceInput.value === "") {
        result.textContent = "Please enter your current annual leave balance (use 0 if none).";
        return;
    }

    if (!hoursPerWeek || !hoursPerDay) {
        result.textContent = "Please enter ordinary hours per week and hours per day.";
        return;
    }

    if (!startDateInput.value || !endDateInput.value) {
        result.textContent = "Please select a start and end date.";
        return;
    }

    const totalDays = daysBetweenInclusive(startDateInput.value, endDateInput.value);
    if (totalDays <= 0) {
        result.textContent = "End date must be on or after the start date.";
        return;
    }

    const totalWeeks = totalDays / 7;
    const daysPerWeek = hoursPerWeek / hoursPerDay;
    const unpaidWeeksTotal = unpaidWeeks + (daysPerWeek ? unpaidDays / daysPerWeek : 0);
    const paidWeeks = Math.max(0, totalWeeks - unpaidWeeksTotal);

    // Annual leave
    const annualAccruedHours = hoursPerWeek * ANNUAL_RATE * paidWeeks;
    const annualCurrentDays = currentBalance / hoursPerDay;
    const annualAccruedDays = annualAccruedHours / hoursPerDay;
    const annualPlannedDays = plannedLeave / hoursPerDay;
    const annualProjectedHours = currentBalance + annualAccruedHours - plannedLeave;
    const annualProjectedDays = annualProjectedHours / hoursPerDay;

    // Personal leave
    const personalAccruedHours = hoursPerWeek * PERSONAL_RATE * paidWeeks;
    const personalCurrentDays = currentPersonal / hoursPerDay;
    const personalAccruedDays = personalAccruedHours / hoursPerDay;
    const personalPlannedDays = plannedPersonal / hoursPerDay;
    const personalProjectedHours = currentPersonal + personalAccruedHours - plannedPersonal;
    const personalProjectedDays = personalProjectedHours / hoursPerDay;

    result.textContent =
        `Annual leave\n` +
        `- Current balance: ${formatHours(currentBalance)} (${formatDays(annualCurrentDays)})\n` +
        `- Accrued this period: ${formatHours(annualAccruedHours)} (${formatDays(annualAccruedDays)})\n` +
        `- Planned leave: ${formatHours(plannedLeave)} (${formatDays(annualPlannedDays)})\n` +
        `- Projected balance: ${formatHours(annualProjectedHours)} (${formatDays(annualProjectedDays)})\n\n` +
        `Personal leave\n` +
        `- Current balance: ${formatHours(currentPersonal)} (${formatDays(personalCurrentDays)})\n` +
        `- Accrued this period: ${formatHours(personalAccruedHours)} (${formatDays(personalAccruedDays)})\n` +
        `- Planned leave: ${formatHours(plannedPersonal)} (${formatDays(personalPlannedDays)})\n` +
        `- Projected balance: ${formatHours(personalProjectedHours)} (${formatDays(personalProjectedDays)})`;
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
