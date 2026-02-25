const sourceTextInput = document.getElementById("sourceText");
const formatModeSelect = document.getElementById("formatMode");
const lineLengthInput = document.getElementById("lineLengthInput");
const textCasePatternSelect = document.getElementById("textCasePattern");
const spaceReplacePatternSelect = document.getElementById("spaceReplacePattern");
const customSpaceWrap = document.getElementById("customSpaceWrap");
const customSpaceValueInput = document.getElementById("customSpaceValue");
const specialTextInput = document.getElementById("specialTextInput");
const specialTextPositionSelect = document.getElementById("specialTextPosition");
const specialNWrap = document.getElementById("specialNWrap");
const specialNValueInput = document.getElementById("specialNValue");
const trimLinesInput = document.getElementById("trimLines");
const skipEmptyInput = document.getElementById("skipEmpty");
const sourceFileInput = document.getElementById("sourceFileInput");
const importFileButton = document.getElementById("importFile");
const formatButton = document.getElementById("formatText");
const copyButton = document.getElementById("copyOutput");
const downloadOutputFileButton = document.getElementById("downloadOutputFile");
const downloadCsvButton = document.getElementById("downloadCsv");
const resetButton = document.getElementById("resetFormatter");
const outputText = document.getElementById("formattedOutput");
const statusBox = document.getElementById("formatStatus");
const lengthSummary = document.getElementById("lengthSummary");

const MAX_OUTPUT_LENGTH = 256;
let importedSourceFileName = "";

function setStatus(message) {
    statusBox.textContent = message;
}

function setLengthSummary(message) {
    lengthSummary.textContent = message;
}

function getDefaultOutputFileName() {
    if (!importedSourceFileName) {
        return "formatted-output.txt";
    }

    const extensionIndex = importedSourceFileName.lastIndexOf(".");
    if (extensionIndex <= 0) {
        return `${importedSourceFileName}-formatted.txt`;
    }

    const baseName = importedSourceFileName.slice(0, extensionIndex);
    return `${baseName}-formatted.txt`;
}

function decodeEscapes(value) {
    return value
        .replace(/\\\\/g, "\\")
        .replace(/\\r\\n/g, "\r\n")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t");
}

function toSentenceCase(value) {
    return value
        .toLowerCase()
        .replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) => match.toUpperCase());
}

function toTitleCase(value) {
    return value.toLowerCase().replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function toggleCase(value) {
    return Array.from(value)
        .map((char) => {
            if (char >= "a" && char <= "z") {
                return char.toUpperCase();
            }

            if (char >= "A" && char <= "Z") {
                return char.toLowerCase();
            }

            return char;
        })
        .join("");
}

function applyCasePattern(value, pattern) {
    switch (pattern) {
        case "upper":
            return value.toUpperCase();
        case "lower":
            return value.toLowerCase();
        case "sentence":
            return toSentenceCase(value);
        case "title":
            return toTitleCase(value);
        case "toggle":
            return toggleCase(value);
        default:
            return value;
    }
}

function getSpaceReplacement() {
    switch (spaceReplacePatternSelect.value) {
        case "blank":
            return "";
        case "underscore":
            return "_";
        case "hyphen":
            return "-";
        case "dot":
            return ".";
        case "comma":
            return ",";
        case "slash":
            return "/";
        case "backslash":
            return "\\";
        case "pipe":
            return "|";
        case "colon":
            return ":";
        case "semicolon":
            return ";";
        case "at":
            return "@";
        case "hash":
            return "#";
        case "custom":
            return decodeEscapes(customSpaceValueInput.value);
        default:
            return null;
    }
}

function applySpaceReplacement(value, replacement) {
    if (replacement === null) {
        return value;
    }

    return value.replace(/ /g, replacement);
}

function transformValue(value, casePattern, spaceReplacement) {
    const caseUpdated = applyCasePattern(value, casePattern);
    return applySpaceReplacement(caseUpdated, spaceReplacement);
}

function applySpecialText(value, specialText, position, nValue) {
    if (!specialText || position === "none") {
        return value;
    }

    switch (position) {
        case "line_start":
            return `${specialText}${value}`;
        case "line_end":
            return `${value}${specialText}`;
        case "after_n": {
            const index = Math.min(Math.max(nValue, 0), value.length);
            return `${value.slice(0, index)}${specialText}${value.slice(index)}`;
        }
        case "before_n": {
            const index = Math.min(Math.max(nValue - 1, 0), value.length);
            return `${value.slice(0, index)}${specialText}${value.slice(index)}`;
        }
        default:
            return value;
    }
}

function truncateIfNeeded(value) {
    if (value.length <= MAX_OUTPUT_LENGTH) {
        return {
            value,
            lengthTruncated: false,
        };
    }

    return {
        value: value.slice(0, MAX_OUTPUT_LENGTH),
        lengthTruncated: true,
    };
}

function applyPerLineLimit(value, limit) {
    if (!Number.isFinite(limit) || limit < 1 || value.length <= limit) {
        return {
            value,
            perLineLimited: false,
        };
    }

    return {
        value: value.slice(0, limit),
        perLineLimited: true,
    };
}

function parsePerLineLimit() {
    const rawValue = lineLengthInput.value.trim();
    if (!rawValue) {
        return {
            valid: true,
            value: null,
        };
    }

    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return {
            valid: false,
            value: null,
        };
    }

    return {
        valid: true,
        value: parsed,
    };
}

function updateLengthSummary(outputValue) {
    if (!outputValue) {
        setLengthSummary("");
        return;
    }

    const lines = outputValue.split(/\r?\n/);
    const lengths = lines.map((line) => line.length);
    if (lengths.length <= 1) {
        setLengthSummary(`Character length: ${lengths[0] || 0}`);
        return;
    }

    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);
    setLengthSummary(`Character length - Min: ${minLength}, Max: ${maxLength}`);
}

function buildStatus(baseMessage, perLineLimitedCount, lengthTruncatedCount, perLineLimitValue) {
    const warnings = [];
    if (perLineLimitedCount > 0 && Number.isFinite(perLineLimitValue)) {
        warnings.push(`${perLineLimitedCount} line(s) were limited to ${perLineLimitValue} characters`);
    }

    if (lengthTruncatedCount > 0) {
        warnings.push(`${lengthTruncatedCount} line(s) exceeded 256 characters and were truncated`);
    }

    if (!warnings.length) {
        return baseMessage;
    }

    return `${baseMessage} Warning: ${warnings.join("; ")}.`;
}

function processOneValue(value, perLineLimit) {
    const perLine = applyPerLineLimit(value, perLineLimit);
    const maxLimit = truncateIfNeeded(perLine.value);
    return {
        value: maxLimit.value,
        perLineLimited: perLine.perLineLimited,
        lengthTruncated: maxLimit.lengthTruncated,
    };
}

function applyLimitsByLine(value, perLineLimit) {
    const lines = value.split(/\r?\n/);
    let perLineLimitedCount = 0;
    let lengthTruncatedCount = 0;
    const limitedLines = lines.map((line) => {
        const output = processOneValue(line, perLineLimit);
        if (output.perLineLimited) {
            perLineLimitedCount += 1;
        }

        if (output.lengthTruncated) {
            lengthTruncatedCount += 1;
        }

        return output.value;
    });

    return {
        value: limitedLines.join("\n"),
        perLineLimitedCount,
        lengthTruncatedCount,
    };
}

function needsNValue() {
    const position = specialTextPositionSelect.value;
    return position === "after_n" || position === "before_n";
}

function updateConditionalInputs() {
    customSpaceWrap.hidden = spaceReplacePatternSelect.value !== "custom";
    specialNWrap.hidden = !needsNValue();
}

function getValidatedNValue(specialText) {
    if (!specialText || !needsNValue()) {
        return 0;
    }

    const rawValue = specialNValueInput.value.trim();
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return null;
    }

    return parsed;
}

function formatText() {
    const sourceText = sourceTextInput.value;
    const mode = formatModeSelect.value;
    const textCasePattern = textCasePatternSelect.value;
    const trimLines = trimLinesInput.checked;
    const skipEmpty = skipEmptyInput.checked;
    const spacePattern = spaceReplacePatternSelect.value;
    const spaceReplacement = getSpaceReplacement();
    const specialText = decodeEscapes(specialTextInput.value);
    const specialPosition = specialTextPositionSelect.value;
    const nValue = getValidatedNValue(specialText);
    const perLineLimit = parsePerLineLimit();

    if (!sourceText) {
        outputText.value = "";
        setStatus("Paste some source text to format.");
        setLengthSummary("");
        return;
    }

    if (spacePattern === "custom" && customSpaceValueInput.value === "") {
        outputText.value = "";
        setStatus("Please enter a custom space replacement character.");
        setLengthSummary("");
        return;
    }

    if (nValue === null) {
        outputText.value = "";
        setStatus("Please enter a valid N value (1 or higher).");
        setLengthSummary("");
        return;
    }

    if (!perLineLimit.valid) {
        outputText.value = "";
        setStatus("Please enter a valid character length (1 or higher).");
        setLengthSummary("");
        return;
    }

    if (mode === "full") {
        const workingText = trimLines ? sourceText.trim() : sourceText;

        if (skipEmpty && !workingText.trim()) {
            outputText.value = "";
            setStatus("Source text is empty after applying the selected options.");
            setLengthSummary("");
            return;
        }

        const transformedText = transformValue(workingText, textCasePattern, spaceReplacement);
        const withSpecialText = applySpecialText(transformedText, specialText, specialPosition, nValue);
        const output = applyLimitsByLine(withSpecialText, perLineLimit.value);

        outputText.value = output.value;
        setStatus(
            buildStatus(
                "Formatted full text.",
                output.perLineLimitedCount,
                output.lengthTruncatedCount,
                perLineLimit.value
            )
        );
        updateLengthSummary(output.value);
        return;
    }

    const lines = sourceText.split(/\r?\n/);
    const preparedLines = lines
        .map((line) => (trimLines ? line.trim() : line))
        .filter((line) => !skipEmpty || line.trim() !== "");

    if (!preparedLines.length) {
        outputText.value = "";
        setStatus("No lines left after applying the selected options.");
        setLengthSummary("");
        return;
    }

    let perLineLimitedCount = 0;
    let lengthTruncatedCount = 0;
    const outputLines = preparedLines.map((line) => {
        const transformed = transformValue(line, textCasePattern, spaceReplacement);
        const withSpecialText = applySpecialText(transformed, specialText, specialPosition, nValue);
        const output = processOneValue(withSpecialText, perLineLimit.value);
        if (output.perLineLimited) {
            perLineLimitedCount += 1;
        }

        if (output.lengthTruncated) {
            lengthTruncatedCount += 1;
        }

        return output.value;
    });

    outputText.value = outputLines.join("\n");
    setStatus(
        buildStatus(
            `Formatted ${preparedLines.length} line(s).`,
            perLineLimitedCount,
            lengthTruncatedCount,
            perLineLimit.value
        )
    );
    updateLengthSummary(outputText.value);
}

async function copyOutput() {
    if (!outputText.value) {
        setStatus("Nothing to copy yet.");
        return;
    }

    try {
        await navigator.clipboard.writeText(outputText.value);
        setStatus("Output copied to clipboard.");
    } catch (error) {
        outputText.focus();
        outputText.select();
        const copied = document.execCommand("copy");
        setStatus(copied ? "Output copied to clipboard." : "Copy failed. Select and copy manually.");
    }
}

function openSourceFilePicker() {
    sourceFileInput.click();
}

async function importSourceFile() {
    const [file] = sourceFileInput.files || [];
    if (!file) {
        return;
    }

    try {
        const fileText = await file.text();
        sourceTextInput.value = fileText;
        importedSourceFileName = file.name;
        setStatus(`Imported ${file.name}. Set your options and click "Format text".`);
        setLengthSummary("");
        sourceTextInput.focus();
    } catch (error) {
        setStatus("File import failed. Please try another file.");
    } finally {
        sourceFileInput.value = "";
    }
}

function downloadOutputFile() {
    if (!outputText.value) {
        setStatus("Nothing to download yet.");
        return;
    }

    const blob = new Blob([outputText.value], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getDefaultOutputFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus(`Text file downloaded as ${link.download}.`);
}

function escapeCsvCell(value) {
    return `"${value.replace(/"/g, "\"\"")}"`;
}

function downloadCsv() {
    if (!outputText.value) {
        setStatus("Nothing to download yet.");
        return;
    }

    const lines = outputText.value.split(/\r?\n/);
    const rows = ["\"refcode\""];
    lines.forEach((line) => {
        rows.push(escapeCsvCell(line));
    });

    const csvContent = rows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "refcodes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus("CSV downloaded.");
}

function resetForm() {
    sourceTextInput.value = "";
    sourceFileInput.value = "";
    importedSourceFileName = "";
    formatModeSelect.value = "line";
    lineLengthInput.value = "";
    textCasePatternSelect.value = "none";
    spaceReplacePatternSelect.value = "none";
    customSpaceValueInput.value = "";
    specialTextInput.value = "";
    specialTextPositionSelect.value = "none";
    specialNValueInput.value = "";
    trimLinesInput.checked = true;
    skipEmptyInput.checked = true;
    outputText.value = "";
    setStatus("");
    setLengthSummary("");
    updateConditionalInputs();
    sourceTextInput.focus();
}

importFileButton.addEventListener("click", openSourceFilePicker);
sourceFileInput.addEventListener("change", importSourceFile);
formatButton.addEventListener("click", formatText);
copyButton.addEventListener("click", copyOutput);
downloadOutputFileButton.addEventListener("click", downloadOutputFile);
downloadCsvButton.addEventListener("click", downloadCsv);
resetButton.addEventListener("click", resetForm);

sourceTextInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        formatText();
    }
});

spaceReplacePatternSelect.addEventListener("change", updateConditionalInputs);
specialTextPositionSelect.addEventListener("change", updateConditionalInputs);

updateConditionalInputs();
