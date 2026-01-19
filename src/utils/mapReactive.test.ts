import { describe, expect, test } from "bun:test";
import { createState } from "../state";
import { mapReactive } from "./helpers";

describe("mapReactive", () => {
  test("should map array values reactively", () => {
    // Arrange
    const state = createState({ items: [1, 2, 3] });
    const mapped = mapReactive(state.items, (n) => n * 2);

    // Act
    const result = mapped.get();

    // Assert
    expect(result).toEqual([2, 4, 6]);
  });

  test("should update when source array changes", () => {
    // Arrange
    const state = createState({ items: [1, 2, 3] });
    const mapped = mapReactive(state.items, (n) => n * 2);
    const updates: number[][] = [];

    mapped.subscribe((arr) => updates.push(arr));

    // Act
    state.set((prev) => ({ ...prev, items: [4, 5] }));

    // Assert
    expect(updates).toEqual([[8, 10]]);
    expect(mapped.get()).toEqual([8, 10]);
  });

  test("should pass index to mapper function", () => {
    // Arrange
    const state = createState({ items: ["a", "b", "c"] });
    const mapped = mapReactive(state.items, (item, idx) => `${idx}:${item}`);

    // Act
    const result = mapped.get();

    // Assert
    expect(result).toEqual(["0:a", "1:b", "2:c"]);
  });

  test("should handle empty arrays", () => {
    // Arrange
    const state = createState({ items: [] as number[] });
    const mapped = mapReactive(state.items, (n) => n * 2);

    // Act
    const result = mapped.get();

    // Assert
    expect(result).toEqual([]);
  });

  test("should support multiple subscribers", () => {
    // Arrange
    const state = createState({ items: [1, 2] });
    const mapped = mapReactive(state.items, (n) => n * 2);
    const updates1: number[][] = [];
    const updates2: number[][] = [];

    mapped.subscribe((arr) => updates1.push([...arr]));
    mapped.subscribe((arr) => updates2.push([...arr]));

    // Act
    state.set((prev) => ({ ...prev, items: [3, 4, 5] }));

    // Assert
    expect(updates1).toEqual([[6, 8, 10]]);
    expect(updates2).toEqual([[6, 8, 10]]);
  });

  test("should support unsubscribe", () => {
    // Arrange
    const state = createState({ items: [1, 2] });
    const mapped = mapReactive(state.items, (n) => n * 2);
    const updates: number[][] = [];

    const unsub = mapped.subscribe((arr) => updates.push(arr));

    // Act
    state.set((prev) => ({ ...prev, items: [3] }));
    unsub();
    state.set((prev) => ({ ...prev, items: [4] }));

    // Assert
    expect(updates).toEqual([[6]]);
    expect(mapped.get()).toEqual([8]);
  });

  test("should work with complex objects", () => {
    // Arrange
    type Todo = { id: number; text: string };
    const state = createState({
      todos: [
        { id: 1, text: "task 1" },
        { id: 2, text: "task 2" },
      ] as Todo[],
    });

    const mapped = mapReactive(state.todos, (todo) => ({
      ...todo,
      text: todo.text.toUpperCase(),
    }));

    // Act
    const result = mapped.get();

    // Assert
    expect(result).toEqual([
      { id: 1, text: "TASK 1" },
      { id: 2, text: "TASK 2" },
    ]);
  });

  test("should re-map when source updates with complex objects", () => {
    // Arrange
    type Todo = { id: number; text: string };
    const state = createState({
      todos: [{ id: 1, text: "task 1" }] as Todo[],
    });

    const mapped = mapReactive(state.todos, (todo) => todo.text);
    const updates: string[][] = [];

    mapped.subscribe((arr) => updates.push(arr));

    // Act
    state.set((prev) => ({
      ...prev,
      todos: [...prev.todos, { id: 2, text: "task 2" }],
    }));

    // Assert
    expect(updates).toEqual([["task 1", "task 2"]]);
    expect(mapped.get()).toEqual(["task 1", "task 2"]);
  });
});
