document.addEventListener("DOMContentLoaded", function () {
    const domainForm = document.getElementById("domainForm");
    const domainInput = document.getElementById("domainInput");
    const clearButton = document.getElementById("clearButton");
    const pasteButton = document.getElementById("pasteButton");
    const positiveResult = document.getElementById("positiveResult");
    const negativeResult = document.getElementById("negativeResult");
    const errorParagraph = document.getElementById("error");

    // Define icon
    const exclamationIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/>
            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
        </svg>
    `;

    // Function to handle form submission
    function handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission behavior
        const input = domainInput.value.trim(); // Get input value and trim whitespace
        const domain = simplifyDomain(input); // Simplify the domain name

        if (domain === "") {
            displayError(`${exclamationIcon} Invalid input.`); // Display error message
            return;
        }

        // Check if the domain is registered
        isDomainRegistered(domain)
            .then((isRegistered) => {
                if (isRegistered) {
                    positiveResult.textContent = `The domain '${domain}' is REGISTERED.`;
                    negativeResult.textContent = ""; // Clear negative result
                } else {
                    negativeResult.textContent = `The domain '${domain}' is NOT DETECTED.`;
                    positiveResult.textContent = ""; // Clear positive result
                }
                clearError(); // Clear any previous error message
            })
            .catch((err) => {
                console.error("Error:", err);
                displayError(
                    `${exclamationIcon} An error occurred. Please try again.`
                ); // Display error message
            });
    }

    // Add event listener for form submission
    domainForm.addEventListener("submit", handleFormSubmit);

    // Function to display error message
    function displayError(message) {
        errorParagraph.innerHTML = message; // Set error message text
    }

    // Function to clear error message
    function clearError() {
        errorParagraph.textContent = ""; // Clear error message
    }

    // Function to handle clearing the input field
    clearButton.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default link behavior
        domainInput.value = ""; // Clear the input field
        clearError(); // Clear any previous error message
        clearResults(); // Clear any previous results
    });

    // Function to handle pasting text from clipboard
    pasteButton.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default link behavior
        navigator.clipboard
            .readText() // Read text from clipboard
            .then((text) => {
                domainInput.value = text; // Paste text into input field
                clearError(); // Clear any previous error message
                clearResults(); // Clear any previous results
            })
            .catch((err) => {
                console.error("Error reading from clipboard:", err);
            });
    });

    // Function to clear both positive and negative results
    function clearResults() {
        positiveResult.textContent = "";
        negativeResult.textContent = "";
    }

    // Function to check if the domain is registered
    function isDomainRegistered(domain) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(
                "GET",
                `https://dns.google.com/resolve?name=${domain}&type=A`,
                true
            );
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        if (response.Answer && response.Answer.length > 0) {
                            resolve(true); // Domain is registered
                        } else {
                            resolve(false); // Domain not registered
                        }
                    } else {
                        reject(new Error("Failed to fetch DNS information."));
                    }
                }
            };
            xhr.send();
        });
    }

    // Function to simplify the domain name
    function simplifyDomain(input) {
        // Remove protocol and www prefix if present
        let simplified = input
            .trim()
            .replace(/^https?:\/\//, "")
            .replace("www.", "");

        // Remove anything after the main domain if there's a slash
        simplified = simplified.split("/")[0];

        // Remove trailing dot, if present
        simplified = simplified.replace(/\.$/, "");

        // Return the simplified domain
        return simplified;
    }
});
