import { render, screen } from "@testing-library/react";
import { LogPanel } from "./LogPanel";
import { LogEntry } from "../stores/useNetworkStore";
import { describe, it, expect } from "vitest";

describe("LogPanel", () => {
    it("renders empty state when no logs provided", () => {
        render(<LogPanel logs={[]} />);
        expect(screen.getByText(/No events yet/i)).toBeInTheDocument();
    });

    it("renders logs correctly", () => {
        const mockLogs: LogEntry[] = [
            {
                id: "1",
                timestamp: 1678886400000,
                message: "Packet delivered",
                type: "packet_delivered",
            },
            {
                id: "2",
                timestamp: 1678886405000,
                message: "Node failed",
                type: "node_failed",
                nodeId: "node-1"
            }
        ];

        render(<LogPanel logs={mockLogs} />);

        expect(screen.getByText("Packet delivered")).toBeInTheDocument();
        expect(screen.getByText("Node failed")).toBeInTheDocument();
        expect(screen.getByText(/Node: node-1/i)).toBeInTheDocument();
    });
});
