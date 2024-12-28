document.addEventListener("DOMContentLoaded", function () {
	const domainForm = document.getElementById("domainForm");
	const domainInput = document.getElementById("domainInput");
	const clearButton = document.getElementById("clearButton");
	const pasteButton = document.getElementById("pasteButton");
	const positiveResult = document.getElementById("positiveResult");
	const negativeResult = document.getElementById("negativeResult");
	const errorParagraph = document.getElementById("error");

	// Function to display error message
	function displayError(message) {
		errorParagraph.innerHTML = message; // Set error message text
	}

	function validateDomain(domain) {
		if (domain === "" || domain === null || !domain.includes(".")) {
			displayError(`ERROR: Invalid input.`);
			return false;
		}

		if (/[^a-zA-Z0-9.-]/.test(domain)) {
			displayError(
				`ERROR: A domain can only contain letters, numbers, dots, and hyphens.`
			);
			return false;
		}

		if (domain.includes("..")) {
			displayError(`ERROR: A domain cannot contain consecutive dots.`);
			return false;
		}

		if (domain.startsWith("-") || domain.endsWith("-")) {
			displayError(`ERROR: A domain cannot start or end with a hyphen.`);
			return false;
		}

		const parts = domain.split(".");
		if (
			parts.length < 2 ||
			parts[0].length < 1 ||
			parts[parts.length - 1].length < 2
		) {
			displayError(
				`ERROR: A valid domain must have at least one character before the dot and two characters after.`
			);
			return false;
		}

		const tld = parts.pop();
		if (!/^[a-zA-Z]+$/.test(tld)) {
			displayError(
				`ERROR: The top-level domain (TLD) must contain only letters (e.g., .com, .org).`
			);
			return false;
		}

		if (domain.length > 253 || parts.some((part) => part.length > 63)) {
			displayError(
				`ERROR: A domain cannot exceed 253 characters, and each section cannot exceed 63 characters.`
			);
			return false;
		}

		const reservedDomains = ["example.com", "localhost", "test"];
		if (
			reservedDomains.includes(domain.toLowerCase()) ||
			/^(?:\d{1,3}\.){3}\d{1,3}$/.test(domain)
		) {
			displayError(
				`ERROR: The input cannot be a reserved domain or an IP address.`
			);
			return false;
		}

		return true;
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

	// Function to handle form submission
	function handleFormSubmit(event) {
		event.preventDefault(); // Prevent default form submission behavior
		clearError(); // Clear any previous error message
		clearResults(); // Clear any previous results
		const input = domainInput.value.trim(); // Get input value and trim whitespace
		const domain = simplifyDomain(input); // Simplify the domain name

		// Check if the domain is valid
		if (!validateDomain(domain)) {
			return; // Stop execution if validation fails
		}

		// Check if the domain is registered
		isDomainRegistered(domain)
			.then((isRegistered) => {
				if (isRegistered) {
					positiveResult.textContent = `REGISTERED: A dns record was found for '${domain}'.`;
					negativeResult.textContent = ""; // Clear negative result
				} else {
					negativeResult.textContent = `UNREGISTERED: No dns record was found for '${domain}'.`;
					positiveResult.textContent = ""; // Clear positive result
				}
				clearError(); // Clear any previous error message
			})
			.catch((err) => {
				console.error("Error:", err);
				displayError(`ERROR: An error occurred. Please try again.`); // Display error message
			});
	}

	// Add event listener for form submission
	domainForm.addEventListener("submit", handleFormSubmit);

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
			const checkWithGoogleDNS = () => {
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
								// If not found, recheck with Cloudflare DNS
								checkWithCloudflareDNS();
							}
						} else {
							reject(
								new Error(
									"Failed to fetch DNS information from Google."
								)
							);
						}
					}
				};
				xhr.send();
			};

			const checkWithCloudflareDNS = () => {
				const xhr = new XMLHttpRequest();
				xhr.open(
					"GET",
					`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
					true
				);
				xhr.setRequestHeader("Accept", "application/dns-json");
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
							reject(
								new Error(
									"Failed to fetch DNS information from Cloudflare."
								)
							);
						}
					}
				};
				xhr.send();
			};

			// Start with Google DNS
			checkWithGoogleDNS();
		});
	}
});

// Focus the input field when the page loads
document.addEventListener("DOMContentLoaded", () => {
	const domainInput = document.getElementById("domainInput");

	// Automatically focus the input field when the page loads
	domainInput.focus();

	// Add an event listener to the document to detect typing
	document.addEventListener("keydown", (event) => {
		// Check if the input is not focused
		if (document.activeElement !== domainInput) {
			domainInput.focus();
		}
	});
});
