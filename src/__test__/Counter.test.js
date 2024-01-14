// Counter.test.js
// import React, { useState } from "../mini-react/react";
import { render, fireEvent } from "@testing-library/react";
import { CounterClass, CounterFunction } from "./Counter";
import { renderHook, act } from "@testing-library/react-hooks";
import React, { useState } from "react";

describe("CounterClass component", () => {
	test("renders initial count", () => {
		const { getByText } = render(<CounterClass />);
		expect(getByText(/Count:/i).textContent).toBe("Count: 0");
	});

	test("increments count on button click", () => {
		const { getByText } = render(<CounterClass />);
		fireEvent.click(getByText("Increment"));
		expect(getByText(/Count:/i).textContent).toBe("Count: 1");
	});
});

describe("CounterFunction component", () => {
	test("renders initial count", () => {
		const { getByText } = render(<CounterFunction />);
		expect(getByText(/Count:/i).textContent).toBe("Count: 0");
	});

	test("increments count on button click", () => {
		const { getByText } = render(<CounterFunction />);
		fireEvent.click(getByText("Increment"));
		expect(getByText(/Count:/i).textContent).toBe("Count: 1");
	});
});

// Your own useState implementation
describe("useState custom implementation", () => {
	test("returns initial state and updater function", () => {
		const { result } = renderHook(() => useState(0));
		const [state, setState] = result.current;

		expect(state).toBe(0);
		expect(typeof setState).toBe("function");
	});

	test("updates state with updater function", () => {
		const { result } = renderHook(() => useState(0));
		const [, setState] = result.current;

		act(() => {
			setState((prev) => prev + 1);
		});

		const [state] = result.current;
		expect(state).toBe(1);
	});
});
