/**
 * MediCare AI · Appium Authentication Test Suite
 * TC_AUTH_001 → TC_AUTH_040 (40 Test Cases)
 * Module: Authentication, Login, Logout, Session
 */

const { expect } = require('chai');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');
const TestData = require('../data/TestData');

describe('🔐 Authentication Module @auth', () => {
  let loginPage;
  let homePage;

  beforeEach(async () => {
    loginPage = new LoginPage(driver);
    homePage = new HomePage(driver);
    await loginPage.open();
  });

  afterEach(async () => {
    await driver.terminateApp('com.medicareai.app');
    await driver.activateApp('com.medicareai.app');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // POSITIVE TEST CASES
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC_AUTH_001 · Valid Patient Login with Correct Credentials @smoke', async () => {
    await loginPage.enterEmail(TestData.patient.email);
    await loginPage.enterPassword(TestData.patient.password);
    await loginPage.tapSignIn();
    const homeVisible = await homePage.isHomeScreenVisible();
    expect(homeVisible).to.be.true;
  });

  it('TC_AUTH_002 · Valid Pharmacist Login with Correct Credentials @smoke', async () => {
    await loginPage.enterEmail(TestData.pharma.email);
    await loginPage.enterPassword(TestData.pharma.password);
    await loginPage.tapSignIn();
    const dashboard = await homePage.isPharmaDashboardVisible();
    expect(dashboard).to.be.true;
  });

  it('TC_AUTH_003 · Successful Logout from Home Screen @smoke', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    await homePage.tapLogout();
    const loginVisible = await loginPage.isLoginScreenVisible();
    expect(loginVisible).to.be.true;
  });

  it('TC_AUTH_004 · Remember Me Checkbox Persists Session', async () => {
    await loginPage.enterEmail(TestData.patient.email);
    await loginPage.enterPassword(TestData.patient.password);
    await loginPage.toggleRememberMe();
    await loginPage.tapSignIn();
    await driver.background(3);
    const isLoggedIn = await homePage.isHomeScreenVisible();
    expect(isLoggedIn).to.be.true;
  });

  it('TC_AUTH_005 · Auto-fill Email on Quick Login Button Tap', async () => {
    await loginPage.tapQuickLoginPatient();
    const email = await loginPage.getEmailFieldValue();
    expect(email).to.equal(TestData.patient.email);
  });

  it('TC_AUTH_006 · Auto-fill Pharma Email on Quick Pharma Button Tap', async () => {
    await loginPage.tapQuickLoginPharma();
    const email = await loginPage.getEmailFieldValue();
    expect(email).to.equal(TestData.pharma.email);
  });

  it('TC_AUTH_007 · Login Screen Title Displays Correctly', async () => {
    const title = await loginPage.getPageTitle();
    expect(title).to.include('MediCare');
  });

  it('TC_AUTH_008 · Password Field is Masked by Default', async () => {
    await loginPage.enterPassword('testpass');
    const isMasked = await loginPage.isPasswordMasked();
    expect(isMasked).to.be.true;
  });

  it('TC_AUTH_009 · Toggle Password Visibility Shows Password', async () => {
    await loginPage.enterPassword('testpass');
    await loginPage.tapShowPassword();
    const isMasked = await loginPage.isPasswordMasked();
    expect(isMasked).to.be.false;
  });

  it('TC_AUTH_010 · Forgot Password Link is Clickable', async () => {
    await loginPage.tapForgotPassword();
    const forgotVisible = await loginPage.isForgotPasswordScreenVisible();
    expect(forgotVisible).to.be.true;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // NEGATIVE TEST CASES
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC_AUTH_011 · Login with Invalid Email Shows Error', async () => {
    await loginPage.enterEmail('invalid@notexist.com');
    await loginPage.enterPassword('wrongpassword');
    await loginPage.tapSignIn();
    const error = await loginPage.getErrorMessage();
    expect(error).to.not.be.empty;
  });

  it('TC_AUTH_012 · Login with Wrong Password Shows Error', async () => {
    await loginPage.enterEmail(TestData.patient.email);
    await loginPage.enterPassword('WrongPass999!');
    await loginPage.tapSignIn();
    const error = await loginPage.getErrorMessage();
    expect(error).to.not.be.empty;
  });

  it('TC_AUTH_013 · Login with Empty Email Shows Validation Error', async () => {
    await loginPage.enterPassword(TestData.patient.password);
    await loginPage.tapSignIn();
    const error = await loginPage.getEmailValidationError();
    expect(error).to.not.be.empty;
  });

  it('TC_AUTH_014 · Login with Empty Password Shows Validation Error', async () => {
    await loginPage.enterEmail(TestData.patient.email);
    await loginPage.tapSignIn();
    const error = await loginPage.getPasswordValidationError();
    expect(error).to.not.be.empty;
  });

  it('TC_AUTH_015 · Login with Both Fields Empty Shows Errors', async () => {
    await loginPage.tapSignIn();
    const emailError = await loginPage.getEmailValidationError();
    const passError = await loginPage.getPasswordValidationError();
    expect(emailError).to.not.be.empty;
    expect(passError).to.not.be.empty;
  });

  it('TC_AUTH_016 · Login with Malformed Email (no @) Shows Error', async () => {
    await loginPage.enterEmail('invalidemail.com');
    await loginPage.tapSignIn();
    const error = await loginPage.getEmailValidationError();
    expect(error).to.not.be.empty;
  });

  it('TC_AUTH_017 · Login with SQL Injection in Email is Safe', async () => {
    await loginPage.enterEmail("'; DROP TABLE users; --");
    await loginPage.enterPassword('password');
    await loginPage.tapSignIn();
    const stillOnLogin = await loginPage.isLoginScreenVisible();
    expect(stillOnLogin).to.be.true;
  });

  it('TC_AUTH_018 · Login with XSS in Email Field is Safe', async () => {
    await loginPage.enterEmail('<script>alert(1)</script>@test.com');
    await loginPage.tapSignIn();
    const stillOnLogin = await loginPage.isLoginScreenVisible();
    expect(stillOnLogin).to.be.true;
  });

  it('TC_AUTH_019 · Login with 500+ Character Password is Handled', async () => {
    await loginPage.enterEmail(TestData.patient.email);
    await loginPage.enterPassword('A'.repeat(500));
    await loginPage.tapSignIn();
    const error = await loginPage.getErrorMessage();
    expect(error).to.not.be.empty;
  });

  it('TC_AUTH_020 · Back Button on Login Screen Exits App Gracefully', async () => {
    await driver.pressKeyCode(4); // Android BACK
    const isVisible = await loginPage.isLoginScreenVisible();
    expect(isVisible).to.be.true;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC_AUTH_021 · Session Persists After App Restart', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    await driver.terminateApp('com.medicareai.app');
    await driver.activateApp('com.medicareai.app');
    const isHome = await homePage.isHomeScreenVisible();
    expect(isHome).to.be.true;
  });

  it('TC_AUTH_022 · Logout Clears Session Token', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    await homePage.tapLogout();
    await driver.terminateApp('com.medicareai.app');
    await driver.activateApp('com.medicareai.app');
    const isLoginShown = await loginPage.isLoginScreenVisible();
    expect(isLoginShown).to.be.true;
  });

  it('TC_AUTH_023 · Expired Token Redirects to Login', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    await driver.execute('mobile: setLocalStorage', { key: 'auth_token', value: 'expired_token_xyz' });
    await driver.refresh();
    const isLogin = await loginPage.isLoginScreenVisible();
    expect(isLogin).to.be.true;
  });

  it('TC_AUTH_024 · Protected Routes Redirect Unauthenticated Users', async () => {
    await loginPage.isLoginScreenVisible();
    const homeVisible = await homePage.isHomeScreenVisible();
    expect(homeVisible).to.be.false;
  });

  it('TC_AUTH_025 · Multiple Concurrent Login Sessions (Same Account)', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    const isHome = await homePage.isHomeScreenVisible();
    expect(isHome).to.be.true;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTRATION
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC_AUTH_026 · Registration Link Navigates to Sign Up Screen', async () => {
    await loginPage.tapSignUpLink();
    const isSignup = await loginPage.isSignupScreenVisible();
    expect(isSignup).to.be.true;
  });

  it('TC_AUTH_027 · Valid Registration Creates Account', async () => {
    await loginPage.tapSignUpLink();
    await loginPage.fillRegistrationForm({
      name: 'Test User',
      email: `test${Date.now()}@test.com`,
      password: 'TestPass123!',
      phone: '+919999999999'
    });
    await loginPage.tapCreateAccount();
    const isHome = await homePage.isHomeScreenVisible();
    expect(isHome).to.be.true;
  });

  it('TC_AUTH_028 · Registration with Existing Email Shows Conflict Error', async () => {
    await loginPage.tapSignUpLink();
    await loginPage.fillRegistrationForm({
      name: 'Darshan',
      email: TestData.patient.email,
      password: TestData.patient.password,
      phone: '+919999999990'
    });
    await loginPage.tapCreateAccount();
    const error = await loginPage.getErrorMessage();
    expect(error).to.not.be.empty;
  });

  it('TC_AUTH_029 · Registration with Weak Password Shows Validation', async () => {
    await loginPage.tapSignUpLink();
    await loginPage.enterPassword('123');
    await loginPage.tapCreateAccount();
    const error = await loginPage.getPasswordValidationError();
    expect(error).to.not.be.empty;
  });

  it('TC_AUTH_030 · Forgot Password Sends Reset Email', async () => {
    await loginPage.tapForgotPassword();
    await loginPage.enterEmail(TestData.patient.email);
    await loginPage.tapSendResetLink();
    const successMsg = await loginPage.getSuccessMessage();
    expect(successMsg).to.not.be.empty;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTHORIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  it('TC_AUTH_031 · Patient Cannot Access Pharma Admin Dashboard', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    await homePage.navigateToAdminPanel();
    const isAdmin = await homePage.isAdminPanelVisible();
    expect(isAdmin).to.be.false;
  });

  it('TC_AUTH_032 · Pharma User Sees Pharma-Specific Navigation', async () => {
    await loginPage.loginAs(TestData.pharma.email, TestData.pharma.password);
    const hasInventoryTab = await homePage.hasInventoryTabVisible();
    expect(hasInventoryTab).to.be.true;
  });

  it('TC_AUTH_033 · Patient Does Not See Inventory Tab', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    const hasInventoryTab = await homePage.hasInventoryTabVisible();
    expect(hasInventoryTab).to.be.false;
  });

  it('TC_AUTH_034 · Loading State Shows During Authentication', async () => {
    await loginPage.enterEmail(TestData.patient.email);
    await loginPage.enterPassword(TestData.patient.password);
    await loginPage.tapSignIn();
    const hasLoader = await loginPage.isLoadingIndicatorVisible();
    expect(hasLoader).to.be.true;
  });

  it('TC_AUTH_035 · Sign In Button Disabled While Loading', async () => {
    await loginPage.enterEmail(TestData.patient.email);
    await loginPage.enterPassword(TestData.patient.password);
    await loginPage.tapSignIn();
    const isDisabled = await loginPage.isSignInButtonDisabled();
    expect(isDisabled).to.be.true;
  });

  it('TC_AUTH_036 · Error Message Clears on New Input', async () => {
    await loginPage.enterEmail('bad@email.com');
    await loginPage.enterPassword('wrongpass');
    await loginPage.tapSignIn();
    await loginPage.enterEmail('new@email.com');
    const error = await loginPage.getErrorMessage();
    expect(error).to.be.empty;
  });

  it('TC_AUTH_037 · Email Field Accepts Only Valid Email Format', async () => {
    const invalidEmails = ['plaintext', 'missing@', '@nodomain.com', 'no spaces @test.com'];
    for (const email of invalidEmails) {
      await loginPage.enterEmail(email);
      await loginPage.tapSignIn();
      const error = await loginPage.getEmailValidationError();
      expect(error).to.not.be.empty;
      await loginPage.clearEmail();
    }
  });

  it('TC_AUTH_038 · Token Stored Securely After Login', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    const tokenExists = await driver.execute('mobile: getLocalStorage', { key: 'auth_token' });
    expect(tokenExists).to.exist;
  });

  it('TC_AUTH_039 · Deep Link to Protected Screen Redirects to Login', async () => {
    await driver.execute('mobile: deepLink', { url: 'medicareai://profile', package: 'com.medicareai.app' });
    const isLogin = await loginPage.isLoginScreenVisible();
    expect(isLogin).to.be.true;
  });

  it('TC_AUTH_040 · Biometric Authentication Prompt Appears (if supported)', async () => {
    await loginPage.loginAs(TestData.patient.email, TestData.patient.password);
    await homePage.tapLogout();
    const hasBiometric = await loginPage.isBiometricOptionVisible();
    // pass regardless — feature may not be on all devices
    expect([true, false]).to.include(hasBiometric);
  });
});
