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

function createSignificanceSimulation(panel, index) {
	const trials = Number(panel.dataset.trials);
	const observed = Number(panel.dataset.observed);
	const singleOutput = panel.querySelector('[data-output="single"]');
	const summaryOutput = panel.querySelector('[data-output="summary"]');
	const chartOutput = panel.querySelector('[data-output="chart"]');
	const chartId = `significance-chart-${index}`;
	let results = [];

	chartOutput.id = chartId;

	function runOne() {
		let makes = 0;
		for (let throwNumber = 0; throwNumber < trials; throwNumber += 1) {
			if (Math.random() < 0.5) makes += 1;
		}
		return makes;
	}

	function updateDisplay() {
		const unusualCount = results.filter((result) => result >= observed).length;
		const proportion = (unusualCount / results.length * 100).toFixed(1);
		summaryOutput.textContent = `${unusualCount} of ${results.length} simulations produced ${observed} or more makes (${proportion}%).`;
		renderDotplot(chartId, results, {
			title: `${trials} Free-Throw Simulation Results`
		});	}

	panel.querySelector('[data-action="single"]').addEventListener("click", () => {
		const makes = runOne();
		singleOutput.textContent = `This simulation produced ${makes} makes out of ${trials}.`;
	});

	panel.querySelector('[data-action="batch"]').addEventListener("click", () => {
		results = Array.from({ length: 100 }, runOne);
		updateDisplay();
	});
}

document.querySelectorAll("[data-significance-simulation]").forEach(createSignificanceSimulation);

function createPValueSimulation(panel) {
	const trials = Number(panel.dataset.trials);
	const defaultObserved = Number(panel.dataset.observed);
	const simulationCount = panel.querySelector("#lesson-10-simulation-count");
	const observedControl = panel.querySelector("#lesson-10-observed");
	const summaryOutput = panel.querySelector('[data-output="p-value-summary"]');
	const chartOutput = panel.querySelector('[data-output="p-value-chart"]');

	function runSimulation() {
		const count = Math.max(100, Number(simulationCount.value) || 1000);
		const observed = Math.min(
			trials,
			Math.max(0, Number(observedControl.value) || defaultObserved)
		);

		const results = [];

		// Run simulations
		for (let simulation = 0; simulation < count; simulation += 1) {
			let heads = 0;

			for (let flip = 0; flip < trials; flip += 1) {
				if (Math.random() < 0.5) heads += 1;
			}

			results.push(heads);
		}

		// Calculate p-value
		const extremeCount = results.filter(
			(result) => result >= observed
		).length;

		const pValue = extremeCount / results.length;

		summaryOutput.textContent =
			`${extremeCount} of ${results.length} simulations produced ` +
			`${observed} or more heads. Estimated p-value = ${pValue.toFixed(3)}.`;

		// Count results
		const counts = Array.from(
			{ length: trials + 1 },
			() => 0
		);

		results.forEach((result) => {
			counts[result] += 1;
		});

		const maximum = Math.max(...counts, 1);

		// Build frequency bar graph
		let html = `
			<div style="margin-top: 20px;">
				<h5>Number of Heads in ${trials} Flips</h5>

				<div style="
					display: flex;
					align-items: flex-end;
					gap: 2px;
					height: 220px;
					padding: 10px 6px 0;
					border-bottom: 1px solid #b8c2cc;
				">
		`;

		counts.forEach((frequency, result) => {
			const height = frequency > 0
				? Math.max(3, (frequency / maximum) * 180)
				: 0;

			const qualifying = result >= observed;

			html += `
				<div style="
					flex: 1;
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: flex-end;
					align-items: center;
				">
					<div
						style="
							width: 100%;
							height: ${height}px;
							background: ${qualifying ? "#d58a8a" : "#9aaabd"};
							cursor: pointer;
						"
						title="${result} heads: ${frequency} simulations"
					></div>

					<span style="
						font-size: 0.75rem;
						font-weight: 600;
						margin-top: 5px;
					">${result}</span>
				</div>
			`;
		});

		html += `
				</div>

				<div style="
					text-align: center;
					font-size: 0.8rem;
					margin-top: 8px;
				">
					Number of Heads
				</div>
			</div>
		`;

		chartOutput.innerHTML = html;
	}

	panel
		.querySelector('[data-action="run-p-value"]')
		.addEventListener("click", runSimulation);
}

document.querySelectorAll("[data-p-value-simulation]").forEach(createPValueSimulation);

function renderDotplot(containerId, data, options = {}) {
	const container = document.getElementById(containerId);
	if (!container) return;

	const dataMin = Math.min(...data);
	const dataMax = Math.max(...data);

	// Default to 2 values beyond the observed range
	const min = options.min ?? dataMin - 2;
	const max = options.max ?? dataMax + 2;

	const label = options.label ?? 'Value';
	const title = options.title ?? '';

	const counts = {};
	data.forEach((val) => {
		counts[val] = (counts[val] || 0) + 1;
	});

	let html = '';

	if (title) html += `<h5>${title}</h5>`;

	html += `
		<div class="dotplot" role="img" aria-label="${title || label} dotplot">
			<div style="
				display: flex;
				align-items: flex-end;
				gap: 8px;
				min-height: 120px;
				padding: 12px 6px;
				border-bottom: 1px solid #b8c2cc;
			">
	`;

	for (let val = min; val <= max; val += 1) {
		const count = counts[val] || 0;

		html += `
			<div style="
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 4px;
			">
		`;

		for (let dot = 0; dot < count; dot += 1) {
			html += `
				<div style="
					width: 12px;
					height: 12px;
					border-radius: 50%;
					background: #9aaabd;
					cursor: pointer;
				" title="${val}"></div>
			`;
		}

		html += `
				<span style="
					font-size: 0.75rem;
					font-weight: 600;
					min-width: 10px;
					text-align: center;
				">${val}</span>
			</div>
		`;
	}

	html += `
			</div>
		</div>
	`;

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

function renderBarGraph(containerId, data, options = {}) {
	const container = document.getElementById(containerId);
	if (!container) return;

	const min = options.min ?? Math.min(...data);
	const max = options.max ?? Math.max(...data);
	const label = options.label ?? 'Value';
	const title = options.title ?? '';

	// Count frequency of each value
	const counts = {};
	for (let val = min; val <= max; val += 1) {
		counts[val] = 0;
	}

	data.forEach((val) => {
		if (counts[val] !== undefined) {
			counts[val] += 1;
		}
	});

	const maxCount = Math.max(...Object.values(counts), 1);
	const graphHeight = 180;

	let html = '';

	if (title) {
		html += `<h5>${title}</h5>`;
	}

	html += `
		<div class="bar-graph" role="img" aria-label="${title || label} frequency bar graph">
			<div style="
				display: flex;
				align-items: flex-end;
				height: ${graphHeight}px;
				gap: 2px;
				padding: 10px 6px 0;
				border-bottom: 1px solid #b8c2cc;
			">
	`;

	for (let val = min; val <= max; val += 1) {
		const count = counts[val] || 0;
		const height = count > 0
			? Math.max(2, (count / maxCount) * graphHeight)
			: 0;

		html += `
			<div style="
				flex: 1;
				height: 100%;
				display: flex;
				flex-direction: column;
				justify-content: flex-end;
				align-items: center;
			">
				<div
					style="
						width: 100%;
						height: ${height}px;
						background: #9aaabd;
						cursor: pointer;
						position: relative;
					"
					title="${val} heads: ${count} simulations"
					onmouseenter="this.querySelector('.bar-tooltip').style.display='block'"
					onmouseleave="this.querySelector('.bar-tooltip').style.display='none'"
				>
					<span class="bar-tooltip" style="
						display: none;
						position: absolute;
						bottom: calc(100% + 6px);
						left: 50%;
						transform: translateX(-50%);
						background: #333;
						color: white;
						padding: 4px 7px;
						border-radius: 4px;
						font-size: 0.75rem;
						white-space: nowrap;
						z-index: 100;
						pointer-events: none;
					">
						${val} heads: ${count} simulations
					</span>
				</div>

				<span style="
					font-size: 0.75rem;
					font-weight: 600;
					margin-top: 5px;
				">${val}</span>
			</div>
		`;
	}

	html += `
			</div>

			<div style="
				text-align: center;
				font-size: 0.8rem;
				margin-top: 8px;
			">
				Number of Heads
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

function initializeLineOfFitWidget() {
	const container = document.getElementById("lesson-8-line-fit-widget");
	if (!container) return;

	const data = [
		{ x: 4, y: 68 }, { x: 5, y: 70 }, { x: 5, y: 74 }, { x: 6, y: 72 },
		{ x: 6, y: 76 }, { x: 7, y: 78 }, { x: 7, y: 80 }, { x: 7, y: 83 },
		{ x: 8, y: 79 }, { x: 8, y: 84 }, { x: 8, y: 87 }, { x: 9, y: 85 },
		{ x: 9, y: 89 }, { x: 10, y: 91 }, { x: 10, y: 88 }, { x: 11, y: 94 }
	];
	const meanX = data.reduce((sum, point) => sum + point.x, 0) / data.length;
	const meanY = data.reduce((sum, point) => sum + point.y, 0) / data.length;
	const sumXX = data.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
	const sumYY = data.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
	const sumXY = data.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
	const regressionSlope = sumXY / sumXX;
	const regressionIntercept = meanY - regressionSlope * meanX;
	const correlation = sumXY / Math.sqrt(sumXX * sumYY);
	let slope = 3;
	let intercept = 52;

	function formatNumber(value) {
		return value.toFixed(2).replace(/\.00$/, "");
	}

	function correlationDescription(value) {
		const strength = Math.abs(value) >= 0.8 ? "very strong" : Math.abs(value) >= 0.6 ? "strong" : Math.abs(value) >= 0.35 ? "moderate" : Math.abs(value) >= 0.15 ? "weak" : "little or no";
		if (strength === "little or no") return "This indicates little or no linear association.";
		return `This indicates a ${strength} ${value > 0 ? "positive" : "negative"} linear association.`;
	}

	function lineEquation(lineSlope, lineIntercept, symbol = "y") {
		return `${symbol} = ${formatNumber(lineSlope)}x ${lineIntercept < 0 ? "-" : "+"} ${formatNumber(Math.abs(lineIntercept))}`;
	}

	container.innerHTML = `<div class="line-fit-controls"><label for="lesson-8-slope">Student slope: <output id="lesson-8-slope-value">3</output><input id="lesson-8-slope" type="range" min="0" max="6" step="0.1" value="3"></label><label for="lesson-8-intercept">Student y-intercept: <output id="lesson-8-intercept-value">52</output><input id="lesson-8-intercept" type="range" min="35" max="75" step="0.5" value="52"></label><label class="line-fit-check"><input id="lesson-8-regression" type="checkbox"> Show Regression Line</label></div><div class="line-fit-equations"><p><strong>Your line:</strong> <output id="lesson-8-student-equation">y = 3x + 52</output></p><p class="line-fit-regression-details" hidden><strong>Least-Squares Regression Line:</strong> <output>${lineEquation(regressionSlope, regressionIntercept, "ŷ")}</output></p><p class="line-fit-regression-details" hidden><strong>Regression slope:</strong> ${formatNumber(regressionSlope)} &nbsp; <strong>y-intercept:</strong> ${formatNumber(regressionIntercept)}</p><p><strong>r = </strong><output id="lesson-8-student-r"></output> <span id="lesson-8-student-r-description"></span></p></div><div class="line-fit-chart-wrap"><svg class="line-fit-chart" viewBox="0 0 720 390" role="img" aria-label="Scatterplot of hours of sleep and test scores with adjustable student line and optional regression line"></svg></div>`;

	const chart = container.querySelector("svg");
	const slopeControl = container.querySelector("#lesson-8-slope");
	const interceptControl = container.querySelector("#lesson-8-intercept");
	const regressionControl = container.querySelector("#lesson-8-regression");
	const regressionDetails = container.querySelectorAll(".line-fit-regression-details");
	const chartWidth = 720;
	const chartHeight = 390;
	const margin = { left: 62, right: 22, top: 22, bottom: 52 };
	const xMin = 3;
	const xMax = 12;
	const yMin = 60;
	const yMax = 100;
	const xScale = (value) => margin.left + ((value - xMin) / (xMax - xMin)) * (chartWidth - margin.left - margin.right);
	const yScale = (value) => chartHeight - margin.bottom - ((value - yMin) / (yMax - yMin)) * (chartHeight - margin.top - margin.bottom);

	function render() {
		const ticks = [4, 6, 8, 10, 12].map((value) => `<line class="line-fit-grid" x1="${xScale(value)}" y1="${margin.top}" x2="${xScale(value)}" y2="${chartHeight - margin.bottom}"></line><text x="${xScale(value)}" y="${chartHeight - 28}" text-anchor="middle">${value}</text>`).join("") + [60, 70, 80, 90, 100].map((value) => `<line class="line-fit-grid" x1="${margin.left}" y1="${yScale(value)}" x2="${chartWidth - margin.right}" y2="${yScale(value)}"></line><text x="${margin.left - 10}" y="${yScale(value) + 4}" text-anchor="end">${value}</text>`).join("");
		const regressionLine = `<line class="line-fit-regression" x1="${xScale(xMin)}" y1="${yScale(regressionSlope * xMin + regressionIntercept)}" x2="${xScale(xMax)}" y2="${yScale(regressionSlope * xMax + regressionIntercept)}"></line>`;
		const studentLine = `<line class="line-fit-student" x1="${xScale(xMin)}" y1="${yScale(slope * xMin + intercept)}" x2="${xScale(xMax)}" y2="${yScale(slope * xMax + intercept)}"></line>`;
		const regression = regressionControl.checked ? regressionLine : "";
		const squaredError = data.reduce((sum, point) => sum + (point.y - (slope * point.x + intercept)) ** 2, 0);
		const studentR = Math.sqrt(Math.max(0, 1 - squaredError / sumYY));
		const points = data.map((point) => `<circle class="line-fit-point" cx="${xScale(point.x)}" cy="${yScale(point.y)}" r="5"><title>${point.x} hours, ${point.y} points</title></circle>`).join("");
		chart.innerHTML = `${ticks}<line class="line-fit-axis" x1="${margin.left}" y1="${chartHeight - margin.bottom}" x2="${chartWidth - margin.right}" y2="${chartHeight - margin.bottom}"></line><line class="line-fit-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${chartHeight - margin.bottom}"></line>${regression}${studentLine}${points}<text class="line-fit-axis-label" x="390" y="382" text-anchor="middle">Hours of Sleep</text><text class="line-fit-axis-label" transform="translate(16 205) rotate(-90)" text-anchor="middle">Test Score</text>`;
		container.querySelector("#lesson-8-slope-value").value = formatNumber(slope);
		container.querySelector("#lesson-8-intercept-value").value = formatNumber(intercept);
		container.querySelector("#lesson-8-student-equation").value = lineEquation(slope, intercept);
		container.querySelector("#lesson-8-student-r").value = formatNumber(studentR);
		container.querySelector("#lesson-8-student-r-description").textContent = correlationDescription(studentR);
		regressionDetails.forEach((detail) => { detail.hidden = !regressionControl.checked; });
	}

	slopeControl.addEventListener("input", () => { slope = Number(slopeControl.value); render(); });
	interceptControl.addEventListener("input", () => { intercept = Number(interceptControl.value); render(); });
	regressionControl.addEventListener("change", render);
	render();
}

initializeLineOfFitWidget();
