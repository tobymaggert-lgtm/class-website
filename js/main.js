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

function renderDotplot(containerId, data, options = {}) {
	const container = document.getElementById(containerId);
	if (!container) return;

	const min = options.min ?? Math.min(...data);
	const max = options.max ?? Math.max(...data);
	const label = options.label ?? 'Value';
	const title = options.title ?? '';

	const counts = {};
	data.forEach((val) => {
		counts[val] = (counts[val] || 0) + 1;
	});

	let html = '';
	if (title) html += `<h5>${title}</h5>`;
	html += `<div class="dotplot" role="img" aria-label="${title || label} dotplot">
		<div style="display: flex; align-items: flex-end; gap: 8px; min-height: 120px; padding: 12px 6px; border-bottom: 1px solid #b8c2cc;">`;

	for (let val = min; val <= max; val += 1) {
		const count = counts[val] || 0;
		html += `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">`;
		for (let dot = 0; dot < count; dot += 1) {
			html += `<div style="width: 12px; height: 12px; border-radius: 50%; background: #9aaabd; cursor: pointer;" title="${val}"></div>`;
		}
		html += `<span style="font-size: 0.75rem; font-weight: 600; min-width: 30px; text-align: center;">${val}</span>`;
		html += `</div>`;
	}
	html += `</div></div>`;

	container.innerHTML = html;

	window.renderDotplot = renderDotplot;
}

function renderHistogram(containerId, data, intervalWidth, options = {}) {
	const container = document.getElementById(containerId);
	if (!container) return;

	const min = options.min ?? Math.min(...data);
	const max = options.max ?? Math.max(...data);
	const label = options.label ?? 'Value';
	const title = options.title ?? '';
	const startPoint =
		options.startPoint ?? Math.floor(min / intervalWidth) * intervalWidth;

	const intervals = [];

	for (let start = startPoint; start <= max; start += intervalWidth) {
		intervals.push({
			start,
			end: start + intervalWidth,
			count: 0
		});
	}

	data.forEach((val) => {
		for (const interval of intervals) {
			if (val >= interval.start && val < interval.end) {
				interval.count += 1;
				break;
			}
		}
	});

	const maxCount = Math.max(...intervals.map((i) => i.count), 1);

	const graphHeight = 150;

	let html = '';

	if (title) {
		html += `<h5>${title}</h5>`;
	}

	html += `
		<div class="histogram" role="img" aria-label="${title || label} histogram">
			<div style="
				display: flex;
				align-items: flex-end;
				gap: 2px;
				height: ${graphHeight}px;
				padding: 12px 6px 0;
				border-bottom: 1px solid #b8c2cc;
			">
	`;

	intervals.forEach((interval) => {
		const height =
			interval.count === 0
				? 0
				: Math.max(4, (interval.count / maxCount) * graphHeight);

		const intervalLabel = `${interval.start}-${interval.end - 1}`;

		html += `
			<div style="
				display: flex;
				flex: 1 0 30px;
				flex-direction: column;
				align-items: center;
				justify-content: flex-end;
				gap: 5px;
				height: 100%;
			">
				<div
					style="
						width: 100%;
						height: ${height}px;
						background: #9aaabd;
						cursor: pointer;
					"
					title="${intervalLabel}: ${interval.count}"
				></div>

				<span style="font-size: 0.7rem; white-space: nowrap;">
					${intervalLabel}
				</span>
			</div>
		`;
	});

	html += `
			</div>
		</div>
	`;

	container.innerHTML = html;
}

document.querySelectorAll('[data-histogram-control]').forEach((select) => {
	select.addEventListener('change', () => {
		const containerId = select.dataset.histogramControl;
		const container = document.getElementById(containerId);
		const dataAttr = container.dataset.histogramData;
		const data = JSON.parse(dataAttr);
		const intervalWidth = Number(select.value);
		const title = container.dataset.histogramTitle || '';
		const min = container.dataset.histogramMin ? Number(container.dataset.histogramMin) : Math.min(...data);
		const max = container.dataset.histogramMax ? Number(container.dataset.histogramMax) : Math.max(...data);
		const startPoint = container.dataset.histogramStart ? Number(container.dataset.histogramStart) : Math.floor(min / intervalWidth) * intervalWidth;

		renderHistogram(containerId, data, intervalWidth, { min, max, title, startPoint });
	});
});
