const sourceTextInput = document.getElementById("sourceText");
const formatModeSelect = document.getElementById("formatMode");
const maxLengthInput = document.getElementById("maxLengthInput");
const textCasePatternSelect = document.getElementById("textCasePattern");
const spaceReplacePatternSelect = document.getElementById("spaceReplacePattern");
const timestampPatternSelect = document.getElementById("timestampPattern");
const trimLinesInput = document.getElementById("trimLines");
const skipEmptyInput = document.getElementById("skipEmpty");
const templateInput = document.getElementById("templateInput");
const formatButton = document.getElementById("formatText");
const copyButton = document.getElementById("copyOutput");
const resetButton = document.getElementById("resetFormatter");
const outputText = document.getElementById("formattedOutput");
const statusBox = document.getElementById("formatStatus");

const MONTH_SHORT_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function applyTemplate(template, tokens) {
    return template.replace(/\{([a-z0-9_]+)\}/gi, (fullMatch, key) => {
        const normalizedKey = key.toLowerCase();
        return Object.prototype.hasOwnProperty.call(tokens, normalizedKey)
            ? tokens[normalizedKey]
            : fullMatch;
    });
}

function buildTokens(line, fullText, index, lineOriginal, fullTextOriginal, timestamp) {
    return {
        line,
        line_original: lineOriginal,
        line_trimmed: line.trim(),
        index: String(index + 1),
        index0: String(index),
        upper: line.toUpperCase(),
        lower: line.toLowerCase(),
        text: fullText,
        text_original: fullTextOriginal,
        timestamp,
    };
}

function setStatus(message) {
    statusBox.textContent = message;
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

function padTwoDigits(value) {
    return String(value).padStart(2, "0");
}

function buildTimestamp() {
    const pattern = timestampPatternSelect.value;
    if (pattern === "none") {
        return "";
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = padTwoDigits(now.getMonth() + 1);
    const monthShort = MONTH_SHORT_NAMES[now.getMonth()];

    switch (pattern) {
        case "yyyy":
            return year;
        case "yyyy-mm":
            return `${year}-${month}`;
        case "yyyy-mmm":
            return `${year}-${monthShort}`;
        default:
            return "";
    }
}

function transformValue(value, casePattern, spaceReplacement) {
    const caseUpdated = applyCasePattern(value, casePattern);
    return applySpaceReplacement(caseUpdated, spaceReplacement);
}

function appendTimestampIfNeeded(value, timestamp, hasTimestampToken) {
    if (!timestamp || hasTimestampToken) {
        return value;
    }

    if (!value.trim()) {
        return timestamp;
    }

    return `${value} ${timestamp}`;
}

function limitTextLength(value, maxLength) {
    if (!Number.isFinite(maxLength) || maxLength <= 0) {
        return value;
    }

    return value.slice(0, maxLength);
}

function formatText() {
    const sourceText = sourceTextInput.value;
    const template = templateInput.value;
    const maxLengthRaw = maxLengthInput.value.trim();
    const mode = formatModeSelect.value;
    const textCasePattern = textCasePatternSelect.value;
    const trimLines = trimLinesInput.checked;
    const skipEmpty = skipEmptyInput.checked;
    const spaceReplacement = getSpaceReplacement();
    const timestamp = buildTimestamp();
    const hasTimestampToken = /\{timestamp\}/i.test(template);
    const maxLength = Number.parseInt(maxLengthRaw, 10);

    if (!sourceText) {
        outputText.value = "";
        setStatus("Paste some source text to format.");
        return;
    }

    if (!template) {
        outputText.value = "";
        setStatus("Add a format template before converting.");
        return;
    }

    if (!maxLengthRaw) {
        outputText.value = "";
        setStatus("Please enter maximum character length.");
        return;
    }

    if (!Number.isFinite(maxLength) || maxLength < 1) {
        outputText.value = "";
        setStatus("Maximum character length must be 1 or more.");
        return;
    }

    if (mode === "full") {
        const workingText = trimLines ? sourceText.trim() : sourceText;

        if (skipEmpty && !workingText.trim()) {
            outputText.value = "";
            setStatus("Source text is empty after applying the selected options.");
            return;
        }

        const transformedText = transformValue(workingText, textCasePattern, spaceReplacement);
        const formatted = applyTemplate(
            template,
            buildTokens(transformedText, transformedText, 0, workingText, sourceText, timestamp)
        );

        outputText.value = limitTextLength(
            appendTimestampIfNeeded(formatted, timestamp, hasTimestampToken),
            maxLength
        );
        setStatus("Formatted full text.");
        return;
    }

    const lines = sourceText.split(/\r?\n/);
    const preparedLines = lines
        .map((line) => (trimLines ? line.trim() : line))
        .filter((line) => !skipEmpty || line.trim() !== "");

    if (!preparedLines.length) {
        outputText.value = "";
        setStatus("No lines left after applying the selected options.");
        return;
    }

    const transformedLines = preparedLines.map((line) => transformValue(line, textCasePattern, spaceReplacement));
    const transformedFullText = transformedLines.join("\n");

    outputText.value = transformedLines
        .map((line, index) => {
            const formatted = applyTemplate(
                template,
                buildTokens(line, transformedFullText, index, preparedLines[index], sourceText, timestamp)
            );
            return limitTextLength(appendTimestampIfNeeded(formatted, timestamp, hasTimestampToken), maxLength);
        })
        .join("\n");

    setStatus(`Formatted ${preparedLines.length} line(s).`);
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

function resetForm() {
    sourceTextInput.value = "";
    formatModeSelect.value = "line";
    maxLengthInput.value = "";
    textCasePatternSelect.value = "custom";
    spaceReplacePatternSelect.value = "none";
    timestampPatternSelect.value = "none";
    trimLinesInput.checked = true;
    skipEmptyInput.checked = true;
    templateInput.value = "- {line}";
    outputText.value = "";
    setStatus("");
    sourceTextInput.focus();
}

formatButton.addEventListener("click", formatText);
copyButton.addEventListener("click", copyOutput);
resetButton.addEventListener("click", resetForm);

[templateInput, sourceTextInput, maxLengthInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            formatText();
        }
    });
});
