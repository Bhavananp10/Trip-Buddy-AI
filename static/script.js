let currentThreadId = localStorage.getItem("travel_thread_id") || null;
let latestAnswerMarkdown = "";

function setPrompt(text) {
    document.getElementById("userInput").value = text;
}

function setLoading(isLoading) {
    const sendBtn = document.getElementById("sendBtn");
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");

    sendBtn.disabled = isLoading;

    if (isLoading) {
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");
    } else {
        btnText.classList.remove("hidden");
        btnLoader.classList.add("hidden");
    }
}

function showError(message) {
    const errorBox = document.getElementById("errorBox");

    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {
    const errorBox = document.getElementById("errorBox");

    errorBox.classList.add("hidden");
    errorBox.textContent = "";
}

function showResult(answer, threadId) {
    latestAnswerMarkdown = answer;

    const resultSection = document.getElementById("resultSection");
    const resultBox = document.getElementById("resultBox");
    const threadInfo = document.getElementById("threadInfo");

    if (typeof marked !== "undefined") {
        resultBox.innerHTML = marked.parse(answer);
    } else {
        resultBox.innerText = answer;
    }

    threadInfo.textContent = `Thread ID: ${threadId}`;

    resultSection.classList.remove("hidden");

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function sendMessage() {
    hideError();

    const input = document.getElementById("userInput");
    const message = input.value.trim();

    if (!message) {
        showError("Please enter your travel request first.");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch("/api/travel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                thread_id: currentThreadId
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Something went wrong.");
        }

        currentThreadId = data.thread_id;
        localStorage.setItem("travel_thread_id", currentThreadId);

        showResult(data.answer, data.thread_id);

    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

function copyResult() {
    const resultBox = document.getElementById("resultBox");
    const text = resultBox.innerText;

    if (!text) {
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            const copyBtn = document.querySelector(".copy-btn");
            const oldText = copyBtn.textContent;

            copyBtn.textContent = "Copied!";

            setTimeout(() => {
                copyBtn.textContent = oldText;
            }, 1400);
        })
        .catch(() => {
            showError("Could not copy result.");
        });
}

function extractDestinationName() {
    const resultBox = document.getElementById("resultBox");
    if (!resultBox) {
        return null;
    }

    const rows = resultBox.querySelectorAll("tr");
    for (const row of rows) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
            const label = cells[0].textContent.trim().replace(/:$/, "").toLowerCase();
            if (label === "destination") {
                return { value: cells[cells.length - 1].textContent.trim(), structured: true };
            }
        }
    }

    const strongs = resultBox.querySelectorAll("strong");
    for (const strong of strongs) {
        const label = strong.textContent.trim().replace(/:$/, "").toLowerCase();
        if (label === "destination" && strong.parentElement) {
            const value = strong.parentElement.textContent.replace(strong.textContent, "").trim();
            if (value) {
                return { value: value, structured: true };
            }
        }
    }

    const heading = resultBox.querySelector("h1, h2");
    return heading ? { value: heading.textContent.trim(), structured: false } : null;
}

function buildPdfFilename() {
    const destination = extractDestinationName();
    // A "Destination:" field value (e.g. "Goa - South & North Goa (beaches)")
    // is shortened to its first segment. A heading (e.g. "5-Day Family
    // Getaway - Delhi -> Visakhapatnam") is kept whole so a leading number
    // like "5-Day" doesn't get cut off at the hyphen.
    let name = "";
    if (destination) {
        name = destination.structured
            ? destination.value.split(/[-–—(),\/→]/)[0].trim()
            : destination.value;
    }
    const safeName = name.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 60);
    return `${safeName || "Trip"} trip.pdf`;
}

function downloadPDF() {
    const pdfContent = document.getElementById("pdfContent");

    if (!latestAnswerMarkdown || !pdfContent) {
        showError("No travel plan available to download.");
        return;
    }

    const downloadBtn = document.querySelector(".download-btn");
    const oldText = downloadBtn.textContent;

    downloadBtn.textContent = "Preparing PDF...";
    downloadBtn.disabled = true;

    const options = {
        margin: 0.5,
        filename: buildPdfFilename(),
        image: {
            type: "jpeg",
            quality: 0.98
        },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            // Without this, this html2canvas build applies the page's current
            // scroll offset twice, which pushes the captured content down and
            // leaves a large blank gap at the top of the exported PDF.
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
        },
        pagebreak: {
            // "avoid-all" tries to keep every block (including large tables)
            // from splitting across a page, which can shove an entire table
            // onto the next page and leave a blank gap behind it. "css" mode
            // (combined with the page-break-inside CSS on table rows) keeps
            // rows intact while still letting tables flow across pages.
            mode: ["css", "legacy"]
        }
    };

    html2pdf()
        .set(options)
        .from(pdfContent)
        .save()
        .then(() => {
            downloadBtn.textContent = oldText;
            downloadBtn.disabled = false;
        })
        .catch(() => {
            downloadBtn.textContent = oldText;
            downloadBtn.disabled = false;
            showError("Could not download PDF.");
        });
}

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "Enter") {
        sendMessage();
    }
});