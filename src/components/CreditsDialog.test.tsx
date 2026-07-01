// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreditsDialog } from "./CreditsDialog";

afterEach(cleanup);

describe("CreditsDialog", () => {
  it("shows the refined creator information and repository link", () => {
    render(<CreditsDialog open onClose={vi.fn()} />);
    expect(screen.getByText("白岩晃行")).toBeTruthy();
    const repositoryLinks = screen.getAllByRole("link", { name: /GitHub repository/ });
    expect(repositoryLinks).toHaveLength(2);
    repositoryLinks.forEach((link) => expect(link.getAttribute("href")).toBe("https://github.com/teruyukishiraiwa/seion"));
  });

  it("closes with Escape", () => {
    const close = vi.fn();
    render(<CreditsDialog open onClose={close} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });
});