/**
 * Tests for Route Transition System
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
	applyEnterTransition,
	applyExitTransition,
	Transition as TransitionComponent,
	type Transition,
} from "./transitions";

describe("Transition System", () => {
	describe("applyEnterTransition", () => {
		let element: HTMLDivElement;

		beforeEach(() => {
			// Arrange
			element = document.createElement("div");
			document.body.appendChild(element);
		});

		afterEach(() => {
			// Cleanup
			document.body.removeChild(element);
		});

		it("should apply default enter class", async () => {
			// Arrange
			const initialClasses = element.className;

			// Act
			const promise = applyEnterTransition(element);

			// Assert - during animation
			expect(element.classList.contains("route-enter")).toBe(true);

			// Wait for animation to complete
			await promise;

			// Assert - after animation
			expect(element.classList.contains("route-enter")).toBe(false);
			expect(element.className).toBe(initialClasses);
		});

		it("should apply custom enter class", async () => {
			// Arrange
			const transition: Transition = {
				enterClass: "fade-in",
				duration: 100,
			};

			// Act
			const promise = applyEnterTransition(element, transition);

			// Assert - during animation
			expect(element.classList.contains("fade-in")).toBe(true);

			// Wait for animation to complete
			await promise;

			// Assert - after animation
			expect(element.classList.contains("fade-in")).toBe(false);
		});

		it("should respect custom duration", async () => {
			// Arrange
			const transition: Transition = {
				duration: 100,
			};
			const startTime = Date.now();

			// Act
			await applyEnterTransition(element, transition);

			// Assert - duration approximately correct
			const elapsed = Date.now() - startTime;
			expect(elapsed).toBeGreaterThanOrEqual(100);
			expect(elapsed).toBeLessThan(150); // allow some margin
		});

		it("should handle multiple classes on element", async () => {
			// Arrange
			element.className = "existing-class another-class";

			// Act
			const promise = applyEnterTransition(element);

			// Assert - during animation
			expect(element.classList.contains("existing-class")).toBe(true);
			expect(element.classList.contains("another-class")).toBe(true);
			expect(element.classList.contains("route-enter")).toBe(true);

			await promise;

			// Assert - after animation
			expect(element.classList.contains("existing-class")).toBe(true);
			expect(element.classList.contains("another-class")).toBe(true);
			expect(element.classList.contains("route-enter")).toBe(false);
		});

		it("should handle concurrent enter transitions", async () => {
			// Arrange
			const transition1: Transition = { enterClass: "enter-1", duration: 50 };
			const transition2: Transition = { enterClass: "enter-2", duration: 50 };

			// Act
			const promise1 = applyEnterTransition(element, transition1);
			const promise2 = applyEnterTransition(element, transition2);

			// Assert - both classes present during animation
			expect(element.classList.contains("enter-1")).toBe(true);
			expect(element.classList.contains("enter-2")).toBe(true);

			await Promise.all([promise1, promise2]);

			// Assert - both classes removed after animation
			expect(element.classList.contains("enter-1")).toBe(false);
			expect(element.classList.contains("enter-2")).toBe(false);
		});
	});

	describe("applyExitTransition", () => {
		let element: HTMLDivElement;

		beforeEach(() => {
			// Arrange
			element = document.createElement("div");
			document.body.appendChild(element);
		});

		afterEach(() => {
			// Cleanup
			document.body.removeChild(element);
		});

		it("should apply default exit class", async () => {
			// Arrange
			const initialClasses = element.className;

			// Act
			const promise = applyExitTransition(element);

			// Assert - during animation
			expect(element.classList.contains("route-exit")).toBe(true);

			// Wait for animation to complete
			await promise;

			// Assert - after animation
			expect(element.classList.contains("route-exit")).toBe(false);
			expect(element.className).toBe(initialClasses);
		});

		it("should apply custom exit class", async () => {
			// Arrange
			const transition: Transition = {
				exitClass: "fade-out",
				duration: 100,
			};

			// Act
			const promise = applyExitTransition(element, transition);

			// Assert - during animation
			expect(element.classList.contains("fade-out")).toBe(true);

			// Wait for animation to complete
			await promise;

			// Assert - after animation
			expect(element.classList.contains("fade-out")).toBe(false);
		});

		it("should respect custom duration", async () => {
			// Arrange
			const transition: Transition = {
				duration: 100,
			};
			const startTime = Date.now();

			// Act
			await applyExitTransition(element, transition);

			// Assert - duration approximately correct
			const elapsed = Date.now() - startTime;
			expect(elapsed).toBeGreaterThanOrEqual(100);
			expect(elapsed).toBeLessThan(150); // allow some margin
		});

		it("should handle multiple classes on element", async () => {
			// Arrange
			element.className = "existing-class another-class";

			// Act
			const promise = applyExitTransition(element);

			// Assert - during animation
			expect(element.classList.contains("existing-class")).toBe(true);
			expect(element.classList.contains("another-class")).toBe(true);
			expect(element.classList.contains("route-exit")).toBe(true);

			await promise;

			// Assert - after animation
			expect(element.classList.contains("existing-class")).toBe(true);
			expect(element.classList.contains("another-class")).toBe(true);
			expect(element.classList.contains("route-exit")).toBe(false);
		});

		it("should handle concurrent exit transitions", async () => {
			// Arrange
			const transition1: Transition = { exitClass: "exit-1", duration: 50 };
			const transition2: Transition = { exitClass: "exit-2", duration: 50 };

			// Act
			const promise1 = applyExitTransition(element, transition1);
			const promise2 = applyExitTransition(element, transition2);

			// Assert - both classes present during animation
			expect(element.classList.contains("exit-1")).toBe(true);
			expect(element.classList.contains("exit-2")).toBe(true);

			await Promise.all([promise1, promise2]);

			// Assert - both classes removed after animation
			expect(element.classList.contains("exit-1")).toBe(false);
			expect(element.classList.contains("exit-2")).toBe(false);
		});
	});

	describe("Transition Component", () => {
		it("should render children", () => {
			// Arrange
			const childContent = document.createElement("div");
			childContent.textContent = "Test Content";

			// Act
			const result = TransitionComponent({
				children: () => childContent,
			});

			// Assert
			expect(result).toBe(childContent);
		});

		it("should pass through children unchanged", () => {
			// Arrange
			const children = () => document.createElement("span");
			const expectedChild = children();

			// Act
			const result = TransitionComponent({
				config: { duration: 500 },
				children: () => expectedChild,
			});

			// Assert
			expect(result).toBe(expectedChild);
		});

		it("should accept transition config", () => {
			// Arrange
			const config: Transition = {
				enterClass: "custom-enter",
				exitClass: "custom-exit",
				duration: 1000,
			};

			// Act & Assert - should not throw
			const result = TransitionComponent({
				config,
				children: () => document.createElement("div"),
			});

			expect(result).toBeDefined();
		});
	});

	describe("Combined Enter and Exit", () => {
		let element: HTMLDivElement;

		beforeEach(() => {
			// Arrange
			element = document.createElement("div");
			document.body.appendChild(element);
		});

		afterEach(() => {
			// Cleanup
			document.body.removeChild(element);
		});

		it("should handle enter followed by exit", async () => {
			// Arrange
			const transition: Transition = {
				enterClass: "enter",
				exitClass: "exit",
				duration: 50,
			};

			// Act - Enter transition
			await applyEnterTransition(element, transition);

			// Assert - enter class removed
			expect(element.classList.contains("enter")).toBe(false);

			// Act - Exit transition
			const exitPromise = applyExitTransition(element, transition);

			// Assert - exit class applied
			expect(element.classList.contains("exit")).toBe(true);

			await exitPromise;

			// Assert - exit class removed
			expect(element.classList.contains("exit")).toBe(false);
		});

		it("should handle overlapping transitions", async () => {
			// Arrange
			const transition: Transition = {
				enterClass: "enter",
				exitClass: "exit",
				duration: 100,
			};

			// Act - Start enter transition
			const enterPromise = applyEnterTransition(element, transition);

			// Act - Start exit transition before enter completes
			await new Promise((resolve) => setTimeout(resolve, 50));
			const exitPromise = applyExitTransition(element, transition);

			// Assert - both classes present
			expect(element.classList.contains("enter")).toBe(true);
			expect(element.classList.contains("exit")).toBe(true);

			// Wait for both to complete
			await Promise.all([enterPromise, exitPromise]);

			// Assert - both classes removed
			expect(element.classList.contains("enter")).toBe(false);
			expect(element.classList.contains("exit")).toBe(false);
		});
	});

	describe("Edge Cases", () => {
		it("should handle zero duration", async () => {
			// Arrange
			const element = document.createElement("div");
			document.body.appendChild(element);
			const transition: Transition = { duration: 0 };

			// Act
			await applyEnterTransition(element, transition);

			// Assert - class should be removed immediately
			expect(element.classList.contains("route-enter")).toBe(false);

			// Cleanup
			document.body.removeChild(element);
		});

		it("should handle very long duration", async () => {
			// Arrange
			const element = document.createElement("div");
			document.body.appendChild(element);
			const transition: Transition = { duration: 1000 };

			// Act - start transition but don't wait for completion
			const promise = applyEnterTransition(element, transition);

			// Assert - class should be present during animation
			expect(element.classList.contains("route-enter")).toBe(true);

			// Cleanup - don't wait for completion
			document.body.removeChild(element);

			// Wait for promise to resolve (cleanup)
			await promise;
		});

		it("should handle empty string classes", async () => {
			// Arrange
			const element = document.createElement("div");
			document.body.appendChild(element);
			const transition: Transition = {
				enterClass: "",
				duration: 50,
			};

			// Act
			await applyEnterTransition(element, transition);

			// Assert - should not crash
			expect(element.className).toBe("");

			// Cleanup
			document.body.removeChild(element);
		});
	});
});
