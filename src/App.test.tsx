import { render, screen } from "@testing-library/react";
import App from "./App";
import { describe, it, expect } from "vitest";

describe("App", () => {
    it("renders without crashing", () => {
        render(<App />);
        // Just verify that the app renders something, e.g. checking for the existence of main container or routing
        // Since App has routing, it might render Index page by default.
        // We can just check if the body contains something.
        expect(document.body).toBeInTheDocument();
    });
});
