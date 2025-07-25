import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  ButtonHTMLAttributes,
  ClassAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import type { JSX } from "react/jsx-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RebootOTADialog } from "./RebootOTADialog.tsx";

const rebootOtaMock = vi.fn();
let mockConnection: { rebootOta: (delay: number) => void } | undefined = {
  rebootOta: rebootOtaMock,
};

vi.mock("@core/stores/deviceStore.ts", () => ({
  useDevice: () => ({
    connection: mockConnection,
  }),
}));

vi.mock("@components/UI/Button.tsx", async () => {
  const actual = await vi.importActual("@components/UI/Button.tsx");
  return {
    ...actual,
    Button: (
      props: JSX.IntrinsicAttributes &
        ClassAttributes<HTMLButtonElement> &
        ButtonHTMLAttributes<HTMLButtonElement>,
    ) => <button {...props} />,
  };
});

vi.mock("@components/UI/Input.tsx", async () => {
  const actual = await vi.importActual("@components/UI/Input.tsx");
  return {
    ...actual,
    Input: (
      props: JSX.IntrinsicAttributes &
        ClassAttributes<HTMLInputElement> &
        InputHTMLAttributes<HTMLInputElement>,
    ) => <input {...props} />,
  };
});

vi.mock("@components/UI/Dialog.tsx", () => {
  return {
    Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialogContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    DialogHeader: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    DialogTitle: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
    DialogDescription: ({ children }: { children: ReactNode }) => (
      <p>{children}</p>
    ),
    DialogClose: () => null,
  };
});

describe("RebootOTADialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    rebootOtaMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders dialog with default input value", () => {
    render(<RebootOTADialog open onOpenChange={() => {}} />);
    expect(screen.getByPlaceholderText(/enter delay/i)).toHaveValue(5);
    expect(
      screen.getByRole("heading", { name: /schedule reboot/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/reboot to ota mode now/i)).toBeInTheDocument();
  });

  it("schedules a reboot with delay and calls rebootOta", async () => {
    const onOpenChangeMock = vi.fn();
    render(<RebootOTADialog open onOpenChange={onOpenChangeMock} />);

    fireEvent.change(screen.getByPlaceholderText(/enter delay/i), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByTestId("scheduleRebootBtn"));

    expect(screen.getByText(/reboot has been scheduled/i)).toBeInTheDocument();

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(rebootOtaMock).toHaveBeenCalledWith(0);
      expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    });
  });

  it("triggers an instant reboot", async () => {
    const onOpenChangeMock = vi.fn();
    render(<RebootOTADialog open onOpenChange={onOpenChangeMock} />);

    fireEvent.click(screen.getByText(/reboot to ota mode now/i));

    await waitFor(() => {
      expect(rebootOtaMock).toHaveBeenCalledWith(5);
      expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    });
  });

  it("does not call reboot if connection is undefined", async () => {
    const onOpenChangeMock = vi.fn();

    mockConnection = undefined;

    render(<RebootOTADialog open onOpenChange={onOpenChangeMock} />);

    fireEvent.click(screen.getByTestId("scheduleRebootBtn"));
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(rebootOtaMock).not.toHaveBeenCalled();
      expect(onOpenChangeMock).not.toHaveBeenCalled();
    });

    mockConnection = { rebootOta: rebootOtaMock };
  });
});
