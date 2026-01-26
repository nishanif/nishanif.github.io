const hoursPerWeekInput = document.getElementById("hoursPerWeek");
const hoursPerDayInput = document.getElementById("hoursPerDay");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const currentBalanceInput = document.getElementById("currentBalance");
const plannedLeaveInput = document.getElementById("plannedLeave");
const unpaidWeeksInput = document.getElementById("unpaidWeeks");
const unpaidDaysInput = document.getElementById("unpaidDays");
const result = document.getElementById("leaveResult");
const calculateButton = document.getElementById("calculateLeave");

const ACCRUAL_RATE = 4 / 52; // 7.6923% of ordinary hours

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
    const accruedHours = hoursPerWeek * ACCRUAL_RATE * paidWeeks;

    const projectedBalanceHours = currentBalance + accruedHours - plannedLeave;
    const projectedBalanceDays = projectedBalanceHours / hoursPerDay;

    result.textContent = `Accrued leave: ${formatHours(accruedHours)}\nProjected balance: ${formatHours(projectedBalanceHours)}\nProjected balance: ${formatDays(projectedBalanceDays)}`;
}

calculateButton.addEventListener("click", calculateProjection);

[startDateInput, endDateInput, hoursPerWeekInput, hoursPerDayInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            calculateProjection();
        }
    });
});
