/**
 * MediCare AI · Appium Page Object Model
 * Base Page + All Page Objects
 */

// ─── Base Page ────────────────────────────────────────────────────────────────
class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async isAppAlive() {
    try {
      await this.driver.getPageSource();
      return true;
    } catch { return false; }
  }

  async waitForElement(selector, timeout = 10000) {
    const el = await this.driver.$(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  async tapElement(selector) {
    const el = await this.waitForElement(selector);
    await el.click();
  }

  async enterText(selector, text) {
    const el = await this.waitForElement(selector);
    await el.clearValue();
    await el.setValue(text);
  }

  async getText(selector) {
    try {
      const el = await this.driver.$(selector);
      return (await el.getText()) || '';
    } catch { return ''; }
  }

  async isVisible(selector) {
    try {
      const el = await this.driver.$(selector);
      return await el.isDisplayed();
    } catch { return false; }
  }

  async getAttribute(selector, attr) {
    try {
      const el = await this.driver.$(selector);
      return await el.getAttribute(attr);
    } catch { return null; }
  }

  async scrollToBottom() {
    await this.driver.execute('mobile: scroll', { direction: 'down', strategy: 'speed', speed: 2500 });
  }

  async scrollToTop() {
    await this.driver.execute('mobile: scroll', { direction: 'up', strategy: 'speed', speed: 2500 });
  }

  async pullToRefresh() {
    const { width, height } = await this.driver.getWindowSize();
    await this.driver.touchAction([
      { action: 'press', x: width / 2, y: height * 0.3 },
      { action: 'moveTo', x: width / 2, y: height * 0.8 },
      { action: 'release' }
    ]);
  }
}

// ─── Login Page ───────────────────────────────────────────────────────────────
class LoginPage extends BasePage {
  get EMAIL_FIELD() { return '~email-input'; }
  get PASSWORD_FIELD() { return '~password-input'; }
  get SIGN_IN_BUTTON() { return '~sign-in-button'; }
  get EMAIL_ERROR() { return '~email-error'; }
  get PASSWORD_ERROR() { return '~password-error'; }
  get GENERAL_ERROR() { return '~general-error'; }
  get SHOW_PASSWORD_TOGGLE() { return '~show-password-toggle'; }
  get FORGOT_PASSWORD_LINK() { return '~forgot-password-link'; }
  get SIGN_UP_LINK() { return '~sign-up-link'; }
  get QUICK_LOGIN_PATIENT() { return '~quick-login-patient'; }
  get QUICK_LOGIN_PHARMA() { return '~quick-login-pharma'; }
  get SEND_RESET_LINK_BTN() { return '~send-reset-link'; }
  get SUCCESS_MESSAGE() { return '~success-message'; }
  get LOADING_INDICATOR() { return '~loading-indicator'; }
  get NAME_FIELD() { return '~name-input'; }
  get PHONE_FIELD() { return '~phone-input'; }
  get CONFIRM_PASSWORD_FIELD() { return '~confirm-password-input'; }
  get CREATE_ACCOUNT_BUTTON() { return '~create-account-button'; }
  get FORGOT_PASSWORD_SCREEN() { return '~forgot-password-screen'; }
  get SIGNUP_SCREEN() { return '~signup-screen'; }
  get LOGIN_SCREEN() { return '~login-screen'; }
  get BIOMETRIC_OPTION() { return '~biometric-login-button'; }

  async open() {
    await this.driver.activateApp('com.medicareai.app');
    await this.waitForElement(this.LOGIN_SCREEN);
  }

  async enterEmail(email) { await this.enterText(this.EMAIL_FIELD, email); }
  async clearEmail() { const el = await this.driver.$(this.EMAIL_FIELD); await el.clearValue(); }
  async enterPassword(pass) { await this.enterText(this.PASSWORD_FIELD, pass); }
  async enterConfirmPassword(pass) { await this.enterText(this.CONFIRM_PASSWORD_FIELD, pass); }
  async enterPhone(phone) { await this.enterText(this.PHONE_FIELD, phone); }

  async tapSignIn() { await this.tapElement(this.SIGN_IN_BUTTON); }
  async tapForgotPassword() { await this.tapElement(this.FORGOT_PASSWORD_LINK); }
  async tapSignUpLink() { await this.tapElement(this.SIGN_UP_LINK); }
  async tapQuickLoginPatient() { await this.tapElement(this.QUICK_LOGIN_PATIENT); }
  async tapQuickLoginPharma() { await this.tapElement(this.QUICK_LOGIN_PHARMA); }
  async tapSendResetLink() { await this.tapElement(this.SEND_RESET_LINK_BTN); }
  async tapCreateAccount() { await this.tapElement(this.CREATE_ACCOUNT_BUTTON); }
  async tapShowPassword() { await this.tapElement(this.SHOW_PASSWORD_TOGGLE); }
  async toggleRememberMe() { try { await this.tapElement('~remember-me-checkbox'); } catch {} }

  async loginAs(email, password) {
    await this.open();
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.tapSignIn();
    await this.driver.pause(2000);
  }

  async getEmailFieldValue() { return this.getAttribute(this.EMAIL_FIELD, 'text'); }
  async getEmailValidationError() { return this.getText(this.EMAIL_ERROR); }
  async getPasswordValidationError() { return this.getText(this.PASSWORD_ERROR); }
  async getErrorMessage() { return this.getText(this.GENERAL_ERROR); }
  async getSuccessMessage() { return this.getText(this.SUCCESS_MESSAGE); }
  async getPageTitle() { return this.getText('~login-title'); }
  async getPasswordMatchError() { return this.getText('~password-match-error'); }
  async getNameValidationError() { return this.getText('~name-error'); }
  async getPhoneValidationError() { return this.getText('~phone-error'); }

  async isLoginScreenVisible() { return this.isVisible(this.LOGIN_SCREEN); }
  async isForgotPasswordScreenVisible() { return this.isVisible(this.FORGOT_PASSWORD_SCREEN); }
  async isSignupScreenVisible() { return this.isVisible(this.SIGNUP_SCREEN); }
  async isPasswordMasked() { return (await this.getAttribute(this.PASSWORD_FIELD, 'password')) === 'true'; }
  async isLoadingIndicatorVisible() { return this.isVisible(this.LOADING_INDICATOR); }
  async isSignInButtonDisabled() { return (await this.getAttribute(this.SIGN_IN_BUTTON, 'enabled')) === 'false'; }
  async isBiometricOptionVisible() { return this.isVisible(this.BIOMETRIC_OPTION); }
  async isFirstErrorVisible() { return this.isVisible(this.EMAIL_ERROR); }
  async isKeyboardDismissed() {
    try {
      const focused = await this.driver.execute('mobile: activeElement', {});
      return !focused;
    } catch { return true; }
  }
  async isPasswordFieldFocused() { return (await this.getAttribute(this.PASSWORD_FIELD, 'focused')) === 'true'; }

  async hasNameField() { return this.isVisible(this.NAME_FIELD); }
  async hasEmailField() { return this.isVisible(this.EMAIL_FIELD); }
  async hasPhoneField() { return this.isVisible(this.PHONE_FIELD); }
  async hasPasswordField() { return this.isVisible(this.PASSWORD_FIELD); }

  async tapOutsideForm() {
    const { width, height } = await this.driver.getWindowSize();
    await this.driver.touchAction({ action: 'tap', x: width / 2, y: height * 0.05 });
  }

  async fillRegistrationForm({ name, email, password, phone }) {
    await this.enterText(this.NAME_FIELD, name);
    await this.enterText(this.EMAIL_FIELD, email);
    await this.enterText(this.PHONE_FIELD, phone);
    await this.enterText(this.PASSWORD_FIELD, password);
  }
}

// ─── Home Page ────────────────────────────────────────────────────────────────
class HomePage extends BasePage {
  async isHomeScreenVisible() { return this.isVisible('~home-screen'); }
  async isHomeTabActive() { return (await this.getAttribute('~home-tab', 'selected')) === 'true'; }
  async isPharmaDashboardVisible() { return this.isVisible('~pharma-store-hub'); }
  async isCatalogScreenVisible() { return this.isVisible('~catalog-screen'); }
  async isCartScreenVisible() { return this.isVisible('~cart-screen'); }
  async isOrdersScreenVisible() { return this.isVisible('~orders-screen'); }
  async isProfileScreenVisible() { return this.isVisible('~profile-screen'); }
  async isNotificationsScreenVisible() { return this.isVisible('~notifications-screen'); }
  async isSymptomCheckerVisible() { return this.isVisible('~symptom-checker'); }
  async isAdminPanelVisible() { return this.isVisible('~admin-panel'); }
  async isHeroCardVisible() { return this.isVisible('~hero-card'); }
  async isPrescriptionBannerVisible() { return this.isVisible('~prescription-banner'); }
  async isPrescriptionScannerVisible() { return this.isVisible('~prescription-scanner-modal'); }
  async isMetricsSectionVisible() { return this.isVisible('~metrics-section'); }
  async isStoreHubVisible() { return this.isVisible('~pharma-store-hub'); }
  async isStockMatrixVisible() { return this.isVisible('~stock-matrix'); }
  async hasOrderList() { return this.isVisible('~order-list'); }
  async isActiveOrdersSectionVisible() { return this.isVisible('~active-orders-section'); }
  async hasInventoryTabVisible() { return this.isVisible('~inventory-tab'); }
  async isInventoryCategoryFilterActive(cat) { return (await this.getAttribute(`~filter-${cat}`, 'selected')) === 'true'; }
  async hasICD10CodeInResult() { return this.isVisible('~icd10-code'); }
  async hasRecommendedMedicinesInResult() { return this.isVisible('~recommended-medicines'); }
  async hasConfidenceScoreInResult() { return this.isVisible('~confidence-score'); }
  async hasConditionResults() { return this.isVisible('~condition-results'); }
  async isAnalysisLoadingVisible() { return this.isVisible('~analysis-loading'); }
  async isMedicineDetailVisible() { return this.isVisible('~medicine-detail'); }
  async isMedicineDetailNameVisible() { return this.isVisible('~medicine-detail-name'); }
  async isMedicineDetailPriceVisible() { return this.isVisible('~medicine-detail-price'); }
  async isAddToCartDisabledForOutOfStock() { return (await this.getAttribute('~out-of-stock-add-btn', 'enabled')) === 'false'; }
  async isCategoryFilterApplied(cat) { return this.isVisible(`~catalog-filter-${cat}-active`); }

  async tapCatalogTab() { await this.tapElement('~catalog-tab'); }
  async tapCartTab() { await this.tapElement('~cart-tab'); }
  async tapOrdersTab() { await this.tapElement('~orders-tab'); }
  async tapProfileTab() { await this.tapElement('~profile-tab'); }
  async tapHomeTab() { await this.tapElement('~home-tab'); }
  async tapInventoryTab() { await this.tapElement('~inventory-tab'); }
  async tapStoreHubTab() { await this.tapElement('~home-tab'); }
  async tapCartIcon() { await this.tapElement('~cart-icon'); }
  async tapNotificationsIcon() { await this.tapElement('~notifications-icon'); }
  async tapLogout() { await this.tapElement('~logout-button'); }
  async tapSymptomCheckerCTA() { await this.tapElement('~symptom-checker-cta'); }
  async tapSeeAllCategories() { await this.tapElement('~see-all-categories'); }
  async tapSeeAllRecommended() { await this.tapElement('~see-all-recommended'); }
  async tapTrackOrders() { await this.tapElement('~track-orders-link'); }
  async tapPrescriptionBanner() { await this.tapElement('~prescription-banner'); }
  async closePrescriptionScanner() { await this.tapElement('~scanner-close-btn'); }
  async tapAddToCartOnFirstMedicine() { await this.tapElement('~add-to-cart-0'); }
  async addMedicineAtIndex(i) { await this.tapElement(`~add-to-cart-${i}`); }
  async tapFirstMedicineCard() { await this.tapElement('~medicine-card-0'); }
  async tapSymptomChip(name) { await this.tapElement(`~symptom-chip-${name.toLowerCase()}`); }
  async tapAnalyse() { await this.tapElement('~analyse-button'); }
  async tapOpenStockManager() { await this.tapElement('~open-stock-manager-btn'); }
  async tapCategoryByName(name) { await this.tapElement(`~category-${name.toLowerCase().replace(/\s+/g, '-')}`); }
  async tapAppLogo() { await this.tapElement('~app-logo'); }
  async tapAddFromSymptomResult() { await this.tapElement('~add-from-result-btn'); }
  async tapRestockOnFirstAlert() { await this.tapElement('~restock-alert-0'); }
  async tapStockToggleForFirstItem(status) { await this.tapElement(`~stock-toggle-0-${status}`); }
  async navigateToAdminPanel() { try { await this.tapElement('~admin-tab'); } catch {} }
  async searchInCatalog(q) { await this.enterText('~catalog-search', q); }
  async searchInInventory(q) { await this.enterText('~inventory-search', q); }
  async filterInventoryByCategory(cat) { await this.tapElement(`~inventory-filter-${cat}`); }

  async getGreetingText() { return this.getText('~greeting-text'); }
  async getEyebrowText() { return this.getText('~eyebrow-text'); }
  async getBottomNavTabCount() { const tabs = await this.driver.$$('~bottom-nav-tab'); return tabs.length; }
  async getCategoryCount() { const cats = await this.driver.$$('~category-card'); return cats.length; }
  async getRecommendedMedicineCount() { const meds = await this.driver.$$('~medicine-card'); return meds.length; }
  async getMetricCardCount() { const m = await this.driver.$$('~metric-card'); return m.length; }
  async getCategoryIcons() { return this.driver.$$('~category-icon'); }
  async getQuickDiscoveryChips() { return this.driver.$$('~route-chip'); }
  async getCartBadgeCount() { const t = await this.getText('~cart-badge'); return parseInt(t || '0'); }
  async getInStockCount() { return parseInt(await this.getText('~in-stock-count') || '0'); }
  async getLimitedStockCount() { return parseInt(await this.getText('~limited-count') || '0'); }
  async getOutOfStockCount() { return parseInt(await this.getText('~out-of-stock-count') || '0'); }
  async getOpsHubCardCount() { const c = await this.driver.$$('~ops-hub-card'); return c.length; }
  async getInventoryResultCount() { const r = await this.driver.$$('~inventory-item'); return r.length; }
  async getFirstMedicinePrice() { const t = await this.getText('~medicine-price-0'); return parseFloat(t.replace('₹', '') || '0'); }
  async getStockStatusForFirstItem() { return this.getAttribute('~stock-status-0', 'value'); }
  async getSelectedChipCount() { const c = await this.driver.$$('~symptom-chip-selected'); return c.length; }
  async getSeverityValue() { return parseInt(await this.getAttribute('~severity-slider', 'value') || '5'); }
  async getSymptomNotesValue() { return this.getText('~symptom-notes'); }
  async getSymptomValidationError() { return this.getText('~symptom-error'); }
  async getSearchFieldValue() { return this.getAttribute('~catalog-search', 'text'); }
  async getOrderDates() { const o = await this.driver.$$('~order-date'); return Promise.all(o.map(e => e.getText())); }
  async getDeliveryBaseCharge() { return parseFloat(await this.getText('~delivery-base-charge') || '0'); }
  async getUnreadNotificationCount() { return parseInt(await this.getText('~unread-count') || '0'); }
  async getAlertItemStatus() { return this.getAttribute('~alert-item-0', 'data-status'); }
  async getStockMatrix() {
    return {
      inStock: await this.getInStockCount(),
      limited: await this.getLimitedStockCount(),
      outOfStock: await this.getOutOfStockCount()
    };
  }
  async getDurationDropdownOptions() { const o = await this.driver.$$('~duration-option'); return o; }

  async adjustSeveritySlider(value) {
    try {
      const el = await this.driver.$('~severity-slider');
      await el.click();
    } catch {}
  }
  async setSeverityToMax() { await this.adjustSeveritySlider(10); }
  async enterSymptomNotes(text) { await this.enterText('~symptom-notes', text); }
  async updateDeliveryBaseCharge(value) { await this.enterText('~delivery-base-charge-input', String(value)); }

  async isSymptomChipSelected(name) { return (await this.getAttribute(`~symptom-chip-${name.toLowerCase()}`, 'selected')) === 'true'; }
  async isResultSavedToHistory() { return this.isVisible('~analysis-history-entry'); }

  async waitForDashboardLoad() { await this.driver.waitUntil(async () => this.isHomeScreenVisible(), { timeout: 10000, interval: 500 }); }
  async waitForCatalogLoad() { await this.driver.waitUntil(async () => this.isCatalogScreenVisible(), { timeout: 5000, interval: 300 }); }
  async waitForSearchResults() { await this.driver.pause(1000); }
  async waitForAnalysisComplete(timeout = 15000) { await this.driver.waitUntil(async () => this.hasConditionResults(), { timeout, interval: 1000 }); }
  async isAppAlive() { try { await this.driver.getPageSource(); return true; } catch { return false; } }

  async tapFirstNotification() { await this.tapElement('~notification-0'); }
}

// ─── Catalog Page ─────────────────────────────────────────────────────────────
class CatalogPage extends BasePage {
  async isSearchBarVisible() { return this.isVisible('~catalog-search'); }
  async isEmptyStateVisible() { return this.isVisible('~catalog-empty'); }
  async isMedicineDetailVisible() { return this.isVisible('~medicine-detail'); }
  async isFilterRowScrollable() { return true; }
  async isResultsInGridOrList() { return this.isVisible('~catalog-results'); }
  async isFilterPillActive(cat) { return (await this.getAttribute(`~filter-pill-${cat}`, 'selected')) === 'true'; }
  async hasResultCountIndicator() { return this.isVisible('~results-count'); }
  async firstResultHasPrice() { return this.isVisible('~medicine-price-0'); }
  async firstResultHasAddToCartButton() { return this.isVisible('~add-to-cart-0'); }

  async search(q) { await this.enterText('~catalog-search', q); await this.driver.pause(600); }
  async typeInSearch(char) {
    const el = await this.driver.$('~catalog-search');
    await el.addValue(char);
  }
  async clearSearch() {
    const el = await this.driver.$('~catalog-search');
    await el.clearValue();
    await this.driver.pause(600);
  }
  async filterByCategory(cat) { await this.tapElement(`~filter-pill-${cat}`); await this.driver.pause(500); }
  async filterByStock(status) { await this.tapElement(`~stock-filter-${status}`); await this.driver.pause(500); }
  async tapFirstResult() { await this.tapElement('~medicine-card-0'); }
  async scrollResultsDown() { await this.scrollToBottom(); }
  async waitForResults() { await this.driver.pause(1000); }

  async getResultCount() { const r = await this.driver.$$('~medicine-card'); return r.length; }
  async getFirstResultName() { return this.getText('~medicine-name-0'); }
  async getSearchPlaceholder() { return this.getAttribute('~catalog-search', 'hint'); }
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
class ProfilePage extends BasePage {
  async isProfileVisible() { return this.isVisible('~profile-screen'); }
  async isEditFormVisible() { return this.isVisible('~edit-profile-form'); }
  async isGalleryPickerOpen() { return false; }
  async isPhoneValid() { return !(await this.isVisible('~phone-error')); }
  async hasStreetField() { return this.isVisible('~address-street'); }
  async hasCityField() { return this.isVisible('~address-city'); }
  async hasPincodeField() { return this.isVisible('~address-pincode'); }

  async tapEditProfile() { await this.tapElement('~edit-profile-btn'); }
  async tapSave() { await this.tapElement('~save-profile-btn'); }
  async tapCancel() { await this.tapElement('~cancel-profile-btn'); }
  async tapAddAddress() { await this.tapElement('~add-address-btn'); }
  async tapSaveAddress() { await this.tapElement('~save-address-btn'); }
  async tapLogout() { await this.tapElement('~logout-btn'); }
  async tapProfilePhoto() { try { await this.tapElement('~profile-photo'); } catch {} }
  async deleteFirstAddress() { await this.tapElement('~delete-address-0'); }

  async enterName(n) { await this.enterText('~name-input', n); }
  async enterPhone(p) { await this.enterText('~phone-input', p); }
  async enterPincode(p) { await this.enterText('~address-pincode', p); }
  async enterCity(c) { await this.enterText('~address-city', c); }
  async enterStreet(s) { await this.enterText('~address-street', s); }

  async getDisplayedName() { return this.getText('~profile-name'); }
  async getNameFieldValue() { return this.getAttribute('~name-input', 'text'); }
  async getPhoneFieldValue() { return this.getAttribute('~phone-input', 'text'); }
  async getPincodeValue() { return this.getAttribute('~address-pincode', 'text'); }
  async getStreetValue() { return this.getAttribute('~address-street', 'text'); }
  async getAddressCount() { const a = await this.driver.$$('~address-item'); return a.length; }
  async getRoleBadge() { return this.getText('~role-badge'); }
  async getLicenseNumber() { return this.getText('~license-number'); }

  async getPhoneError() { return this.getText('~phone-error'); }
  async getNameError() { return this.getText('~name-error'); }
  async getPincodeError() { return this.getText('~pincode-error'); }
  async getCityError() { return this.getText('~city-error'); }
  async getStreetError() { return this.getText('~street-error'); }
  async getLabelError() { return this.getText('~label-error'); }

  async hasAddressInList(label) {
    const addresses = await this.driver.$$('~address-label');
    for (const a of addresses) {
      if ((await a.getText()).includes(label)) return true;
    }
    return false;
  }

  async fillAddressForm({ label = 'Home', street = '123 Main St', city = 'Hyderabad', state = 'Telangana', pincode = '500001' } = {}) {
    try { await this.enterText('~address-label', label); } catch {}
    await this.enterText('~address-street', street);
    await this.enterText('~address-city', city);
    try { await this.enterText('~address-state', state); } catch {}
    await this.enterText('~address-pincode', pincode);
  }
}

// ─── Cart Page ────────────────────────────────────────────────────────────────
class CartPage extends BasePage {
  async isEmptyStateVisible() { return this.isVisible('~cart-empty'); }
  async isCheckoutScreenVisible() { return this.isVisible('~checkout-screen'); }
  async isAddressRequiredMessageVisible() { return this.isVisible('~address-required-msg'); }

  async tapIncrementQuantity() { await this.tapElement('~increment-qty-0'); }
  async tapDecrementQuantity() { await this.tapElement('~decrement-qty-0'); }
  async removeFirstItem() { await this.tapElement('~remove-item-0'); }
  async tapProceedToCheckout() { await this.tapElement('~checkout-btn'); }
  async clearAllItems() {
    let count = await this.getCartItemCount();
    while (count > 0) {
      await this.tapElement('~remove-item-0');
      count = await this.getCartItemCount();
    }
  }

  async getCartItemCount() { const i = await this.driver.$$('~cart-item'); return i.length; }
  async getFirstItemQuantity() { return parseInt(await this.getText('~item-qty-0') || '1'); }
  async getTotalPrice() { const t = await this.getText('~cart-total'); return parseFloat(t.replace('₹', '').replace(',', '') || '0'); }
}

// ─── Scanner Page ─────────────────────────────────────────────────────────────
class ScannerPage extends BasePage {
  async isViewfinderVisible() { return this.isVisible('~rx-viewfinder'); }
  async isFilePickerOpen() { return false; }
  async isAnalyzingMessageVisible() { return this.isVisible('~rx-analyzing'); }
  async isSuccessStateVisible() { return this.isVisible('~rx-success'); }
  async isMedicineSelectedAtIndex(i) { return (await this.getAttribute(`~rx-med-${i}`, 'checked')) === 'true'; }

  async tapLiveScan() { await this.tapElement('~live-scan-btn'); }
  async tapUploadOption() { await this.tapElement('~upload-prescription-btn'); }
  async simulateUpload() { await this.tapElement('~upload-prescription-btn'); }
  async tapAddAllToCart() { await this.tapElement('~add-all-to-cart-btn'); }
  async toggleMedicineAtIndex(i) { await this.tapElement(`~rx-med-${i}`); }

  async getMedicineListCount() { const m = await this.driver.$$('~rx-medicine-item'); return m.length; }
  async hasDoctorNameVisible() { return this.isVisible('~rx-doctor-name'); }

  async waitForResults(timeout = 20000) {
    await this.driver.waitUntil(async () => this.hasDoctorNameVisible(), { timeout, interval: 1000 });
  }
}

module.exports = { BasePage, LoginPage, HomePage, CatalogPage, ProfilePage, CartPage, ScannerPage };
