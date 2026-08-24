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
