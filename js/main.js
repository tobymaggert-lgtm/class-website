document.querySelectorAll("[data-answer-target]").forEach((button) => {
	button.addEventListener("click", () => {
		const answer = document.getElementById(button.dataset.answerTarget);
		const isHidden = answer.hidden;

		answer.hidden = !isHidden;
		button.setAttribute("aria-expanded", String(isHidden));
		button.textContent = isHidden
			? (button.dataset.hideLabel || "Hide Possible Answers")
			: (button.dataset.showLabel || "Show Possible Answers");
	});
});

document.querySelectorAll(".glossary-term").forEach((term) => {
	term.addEventListener("click", () => {
		if (window.matchMedia("(hover: none)").matches) {
			const isOpen = term.classList.toggle("is-open");
			term.setAttribute("aria-expanded", String(isOpen));
		}
	});

	term.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			const isOpen = term.classList.toggle("is-open");
			term.setAttribute("aria-expanded", String(isOpen));
		}
	});
});

function createSimulation(panel) {
	const simulationType = panel.dataset.simulation;
	const singleOutput = panel.querySelector('[data-output="single"]');
	const summaryOutput = panel.querySelector('[data-output="summary"]');
	const chartOutput = panel.querySelector('[data-output="chart"]');
	const cutoffControl = panel.querySelector('[data-control="cutoff"]');
	let results = [];

	function runOne() {
		let score = 0;
		const trialCount = simulationType === "coin" ? 10 : 20;

		for (let trial = 0; trial < trialCount; trial += 1) {
			const firstOutcome = Math.random() < 0.5;
			if (simulationType === "coin" ? firstOutcome : firstOutcome === (Math.random() < 0.5)) {
				score += 1;
			}
		}

		return score;
	}

	function updateDisplay() {
		const cutoff = Number(cutoffControl.value);
		const qualifyingCount = results.filter((score) => score >= cutoff).length;
		const proportion = results.length ? (qualifyingCount / results.length).toFixed(2) : "0.00";
		const maximum = simulationType === "coin" ? 10 : 20;
		const counts = Array.from({ length: maximum + 1 }, () => 0);

		results.forEach((score) => {
			counts[score] += 1;
		});

		if (!results.length) {
			summaryOutput.textContent = "No batch simulations yet.";
			chartOutput.innerHTML = "";
			return;
		}

		summaryOutput.textContent = `${qualifyingCount} of ${results.length} simulations were at or above ${cutoff} (${proportion}).`;
		chartOutput.innerHTML = counts.map((count, score) => {
			const height = Math.max(4, (count / Math.max(...counts)) * 100);
			const qualifying = score >= cutoff ? " is-qualifying" : "";
			return `<div class="chart-column${qualifying}"><span class="chart-bar" style="height: ${height}%" title="${score}: ${count}"></span><span class="chart-label">${score}</span></div>`;
		}).join("");
	}

	panel.querySelector('[data-action="single"]').addEventListener("click", () => {
		const score = runOne();
		singleOutput.textContent = simulationType === "coin"
			? `This simulation produced ${score} heads out of 10 flips.`
			: `This simulation produced ${score} correct guesses out of 20.`;
	});

	panel.querySelector('[data-action="batch"]').addEventListener("click", () => {
		results = Array.from({ length: 100 }, runOne);
		updateDisplay();
	});

	cutoffControl.addEventListener("change", updateDisplay);
}

document.querySelectorAll("[data-simulation]").forEach(createSimulation);
