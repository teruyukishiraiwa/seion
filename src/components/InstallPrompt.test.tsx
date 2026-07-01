// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstallPrompt } from "./InstallPrompt";

afterEach(cleanup);

describe("InstallPrompt", () => {
  it("offers the native install action on supported browsers", () => {
    const install = vi.fn();
    render(<InstallPrompt open isIos={false} onInstall={install} onDismiss={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "インストール" }));
    expect(install).toHaveBeenCalledOnce();
  });

  it("shows Safari home-screen guidance on iOS", () => {
    render(<InstallPrompt open isIos onInstall={vi.fn()} onDismiss={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/ホーム画面に追加/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "インストール" })).toBeNull();
  });
});