const sourceTextInput = document.getElementById("sourceText");
const formatModeSelect = document.getElementById("formatMode");
const outputJoinerInput = document.getElementById("outputJoiner");
const trimLinesInput = document.getElementById("trimLines");
const skipEmptyInput = document.getElementById("skipEmpty");
const templateInput = document.getElementById("templateInput");
const formatButton = document.getElementById("formatText");
const copyButton = document.getElementById("copyOutput");
const resetButton = document.getElementById("resetFormatter");
const outputText = document.getElementById("formattedOutput");
const statusBox = document.getElementById("formatStatus");

function decodeEscapes(value) {
    return value
        .replace(/\\r\\n/g, "\r\n")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t");
}

function applyTemplate(template, tokens) {
    return template.replace(/\{([a-z0-9_]+)\}/gi, (fullMatch, key) => {
        const normalizedKey = key.toLowerCase();
        return Object.prototype.hasOwnProperty.call(tokens, normalizedKey)
            ? tokens[normalizedKey]
            : fullMatch;
    });
}

function buildTokens(line, fullText, index) {
    return {
        line,
        line_trimmed: line.trim(),
        index: String(index + 1),
        index0: String(index),
        upper: line.toUpperCase(),
        lower: line.toLowerCase(),
        text: fullText,
    };
}

function setStatus(message) {
    statusBox.textContent = message;
}

function formatText() {
    const sourceText = sourceTextInput.value;
    const template = templateInput.value;
    const mode = formatModeSelect.value;
    const trimLines = trimLinesInput.checked;
    const skipEmpty = skipEmptyInput.checked;
    const outputJoiner = decodeEscapes(outputJoinerInput.value || "\\n");

    if (!sourceText.trim()) {
        outputText.value = "";
        setStatus("Paste some source text to format.");
        return;
    }

    if (!template) {
        outputText.value = "";
        setStatus("Add a format template before converting.");
        return;
    }

    if (mode === "full") {
        const workingText = trimLines ? sourceText.trim() : sourceText;

        if (skipEmpty && !workingText.trim()) {
            outputText.value = "";
            setStatus("Source text is empty after applying the selected options.");
            return;
        }

        outputText.value = applyTemplate(template, buildTokens(workingText, sourceText, 0));
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

    outputText.value = preparedLines
        .map((line, index) => applyTemplate(template, buildTokens(line, sourceText, index)))
        .join(outputJoiner);

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
    outputJoinerInput.value = "\\n";
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

templateInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        formatText();
    }
});
