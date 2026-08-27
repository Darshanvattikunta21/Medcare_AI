import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import LoginScreen from "../app/login";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

const mockLogin = jest.fn();
jest.mock("../lib/use-auth", () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    error: null,
  }),
}));

describe("LoginScreen Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email and password inputs with defaults", async () => {
    const { getByPlaceholderText } = await render(<LoginScreen />);
    
    expect(getByPlaceholderText("your@email.com")).toBeTruthy();
    expect(getByPlaceholderText("Enter password")).toBeTruthy();
  });

  it("calls login function on sign in click with valid credentials", async () => {
    const { getByText } = await render(<LoginScreen />);
    
    const signInButton = getByText(/Sign In/);
    await act(async () => {
      fireEvent.press(signInButton);
    });
    
    expect(mockLogin).toHaveBeenCalledWith("ravi@email.com", "demo123");
  });

  it("shows error for invalid email structure", async () => {
    const { getByPlaceholderText, getByText, findByText } = await render(<LoginScreen />);
    
    const emailField = getByPlaceholderText("your@email.com");
    await act(async () => {
      fireEvent.changeText(emailField, "invalidemail");
    });
    
    const signInButton = getByText(/Sign In/);
    await act(async () => {
      fireEvent.press(signInButton);
    });
    
    expect(await findByText(/Please enter a valid email address/)).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
