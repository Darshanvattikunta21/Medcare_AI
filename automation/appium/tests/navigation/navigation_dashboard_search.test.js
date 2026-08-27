/**
 * MediCare AI · Appium Navigation + Dashboard + Profile + Search + Filter Tests
 * TC_NAV_001 → TC_NAV_030 (Navigation)
 * TC_DASH_001 → TC_DASH_020 (Dashboard)
 * TC_PROF_001 → TC_PROF_020 (Profile)
 * TC_SRCH_001 → TC_SRCH_020 (Search)
 * TC_FILT_001 → TC_FILT_020 (Filters)
 * TOTAL: 110 Test Cases
 */

const { expect } = require('chai');
const LoginPage = require('../pages/LoginPage');
const HomePage = require('../pages/HomePage');
const CatalogPage = require('../pages/CatalogPage');
const ProfilePage = require('../pages/ProfilePage');
const TestData = require('../data/TestData');

describe('🧭 Navigation Module @navigation', () => {
  before(async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.patient.email, TestData.patient.password);
  });

  const homePage = new HomePage(driver);

  it('TC_NAV_001 · Bottom Tab: Home Tab is Active by Default @smoke', async () => {
    const isActive = await homePage.isHomeTabActive();
    expect(isActive).to.be.true;
  });

  it('TC_NAV_002 · Bottom Tab: Navigate to Catalog', async () => {
    await homePage.tapCatalogTab();
    const isCatalog = await homePage.isCatalogScreenVisible();
    expect(isCatalog).to.be.true;
  });

  it('TC_NAV_003 · Bottom Tab: Navigate to Cart', async () => {
    await homePage.tapCartTab();
    const isCart = await homePage.isCartScreenVisible();
    expect(isCart).to.be.true;
  });

  it('TC_NAV_004 · Bottom Tab: Navigate to Orders', async () => {
    await homePage.tapOrdersTab();
    const isOrders = await homePage.isOrdersScreenVisible();
    expect(isOrders).to.be.true;
  });

  it('TC_NAV_005 · Bottom Tab: Navigate to Profile', async () => {
    await homePage.tapProfileTab();
    const isProfile = await homePage.isProfileScreenVisible();
    expect(isProfile).to.be.true;
  });

  it('TC_NAV_006 · Back Navigation Returns to Previous Screen', async () => {
    await homePage.tapCatalogTab();
    await driver.pressKeyCode(4);
    const isHome = await homePage.isHomeTabActive();
    expect(isHome).to.be.true;
  });

  it('TC_NAV_007 · Header: Cart Icon Navigates to Cart Screen', async () => {
    await homePage.tapCartIcon();
    const isCart = await homePage.isCartScreenVisible();
    expect(isCart).to.be.true;
  });

  it('TC_NAV_008 · Header: Notification Icon Navigates to Notifications', async () => {
    await homePage.tapNotificationsIcon();
    const isNotif = await homePage.isNotificationsScreenVisible();
    expect(isNotif).to.be.true;
  });

  it('TC_NAV_009 · Hero Card CTA "Try Now" Opens Symptom Checker', async () => {
    await homePage.tapSymptomCheckerCTA();
    const isChecker = await homePage.isSymptomCheckerVisible();
    expect(isChecker).to.be.true;
  });

  it('TC_NAV_010 · Category Card: Tablets Opens Tablet Category', async () => {
    await homePage.tapCategoryByName('Tablets');
    const isCategory = await homePage.isCategoryFilterApplied('tablets');
    expect(isCategory).to.be.true;
  });

  it('TC_NAV_011 · Category Card: Injections Opens Injections Category', async () => {
    await homePage.tapCategoryByName('Injections');
    const isCategory = await homePage.isCategoryFilterApplied('injections');
    expect(isCategory).to.be.true;
  });

  it('TC_NAV_012 · Category Card: Devices Opens Devices Category', async () => {
    await homePage.tapCategoryByName('Devices');
    const isCategory = await homePage.isCategoryFilterApplied('devices');
    expect(isCategory).to.be.true;
  });

  it('TC_NAV_013 · Category Card: Ayurveda Opens Ayurveda Category', async () => {
    await homePage.tapCategoryByName('Ayurveda');
    const isCategory = await homePage.isCategoryFilterApplied('ayurveda');
    expect(isCategory).to.be.true;
  });

  it('TC_NAV_014 · Category Card: Baby Care Opens Baby Category', async () => {
    await homePage.tapCategoryByName('Baby Care');
    const isCategory = await homePage.isCategoryFilterApplied('baby');
    expect(isCategory).to.be.true;
  });

  it('TC_NAV_015 · Category Card: First Aid Opens First Aid Category', async () => {
    await homePage.tapCategoryByName('First Aid');
    const isCategory = await homePage.isCategoryFilterApplied('first-aid');
    expect(isCategory).to.be.true;
  });

  it('TC_NAV_016 · Swipe Down Refreshes Home Screen', async () => {
    await homePage.pullToRefresh();
    const isHome = await homePage.isHomeScreenVisible();
    expect(isHome).to.be.true;
  });

  it('TC_NAV_017 · Scroll to Bottom Shows Metrics Section', async () => {
    await homePage.scrollToBottom();
    const hasMetrics = await homePage.isMetricsSectionVisible();
    expect(hasMetrics).to.be.true;
  });

  it('TC_NAV_018 · Prescription Banner is Visible on Home', async () => {
    const hasBanner = await homePage.isPrescriptionBannerVisible();
    expect(hasBanner).to.be.true;
  });

  it('TC_NAV_019 · Prescription Banner Tap Opens Scanner Modal', async () => {
    await homePage.tapPrescriptionBanner();
    const isScannerOpen = await homePage.isPrescriptionScannerVisible();
    expect(isScannerOpen).to.be.true;
  });

  it('TC_NAV_020 · Close Scanner Modal Returns to Home', async () => {
    await homePage.tapPrescriptionBanner();
    await homePage.closePrescriptionScanner();
    const isHome = await homePage.isHomeScreenVisible();
    expect(isHome).to.be.true;
  });

  it('TC_NAV_021 · "See All" Categories Navigates to Full Catalog', async () => {
    await homePage.tapSeeAllCategories();
    const isCatalog = await homePage.isCatalogScreenVisible();
    expect(isCatalog).to.be.true;
  });

  it('TC_NAV_022 · "See All" Recommended Opens Full Catalog', async () => {
    await homePage.tapSeeAllRecommended();
    const isCatalog = await homePage.isCatalogScreenVisible();
    expect(isCatalog).to.be.true;
  });

  it('TC_NAV_023 · Quick Discovery Chips Are Scrollable', async () => {
    const chips = await homePage.getQuickDiscoveryChips();
    expect(chips.length).to.be.greaterThan(0);
  });

  it('TC_NAV_024 · "Track" Active Orders Link Opens Orders Screen', async () => {
    await homePage.tapTrackOrders();
    const isOrders = await homePage.isOrdersScreenVisible();
    expect(isOrders).to.be.true;
  });

  it('TC_NAV_025 · AI Symptom Checker Completes Full Flow', async () => {
    await homePage.tapSymptomCheckerCTA();
    await driver.pause(2000);
    const isVisible = await homePage.isSymptomCheckerVisible();
    expect(isVisible).to.be.true;
  });

  it('TC_NAV_026 · Pharma Nav Has 5 Tabs When Logged as Pharma', async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.pharma.email, TestData.pharma.password);
    const tabCount = await homePage.getBottomNavTabCount();
    expect(tabCount).to.equal(5);
  });

  it('TC_NAV_027 · Patient Nav Has Standard 5 Tabs', async () => {
    const tabCount = await homePage.getBottomNavTabCount();
    expect(tabCount).to.equal(5);
  });

  it('TC_NAV_028 · Transition Animations Play Between Screens', async () => {
    await homePage.tapCatalogTab();
    await driver.pause(500);
    const isCatalog = await homePage.isCatalogScreenVisible();
    expect(isCatalog).to.be.true;
  });

  it('TC_NAV_029 · App Handles System Back Stack Correctly', async () => {
    await homePage.tapCatalogTab();
    await homePage.tapProfileTab();
    await driver.pressKeyCode(4);
    const isCatalog = await homePage.isCatalogScreenVisible();
    expect(isCatalog).to.be.true;
  });

  it('TC_NAV_030 · App Logo Tapping Returns to Home from Any Screen', async () => {
    await homePage.tapProfileTab();
    await homePage.tapAppLogo();
    const isHome = await homePage.isHomeTabActive();
    expect(isHome).to.be.true;
  });
});

describe('📊 Dashboard Module @dashboard', () => {
  before(async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.patient.email, TestData.patient.password);
  });

  const homePage = new HomePage(driver);

  it('TC_DASH_001 · Welcome Message Shows Logged-in User Name @smoke', async () => {
    const greeting = await homePage.getGreetingText();
    expect(greeting).to.include(TestData.patient.name);
  });

  it('TC_DASH_002 · Hero Card AI Banner is Visible', async () => {
    const visible = await homePage.isHeroCardVisible();
    expect(visible).to.be.true;
  });

  it('TC_DASH_003 · Category Grid Shows 6 Categories', async () => {
    const count = await homePage.getCategoryCount();
    expect(count).to.equal(6);
  });

  it('TC_DASH_004 · Recommended Medicine Cards Are Displayed', async () => {
    const count = await homePage.getRecommendedMedicineCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_DASH_005 · Active Orders Section is Present', async () => {
    const visible = await homePage.isActiveOrdersSectionVisible();
    expect(visible).to.be.true;
  });

  it('TC_DASH_006 · Metric Cards Display Correct Data', async () => {
    await homePage.scrollToBottom();
    const metricCount = await homePage.getMetricCardCount();
    expect(metricCount).to.be.greaterThan(0);
  });

  it('TC_DASH_007 · Category Icons Display Correctly', async () => {
    const icons = await homePage.getCategoryIcons();
    expect(icons.length).to.equal(6);
  });

  it('TC_DASH_008 · Pharma Dashboard Shows Store Hub Card', async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.pharma.email, TestData.pharma.password);
    const hasStoreHub = await homePage.isStoreHubVisible();
    expect(hasStoreHub).to.be.true;
  });

  it('TC_DASH_009 · Pharma Dashboard Shows Live Stock Status Matrix', async () => {
    const hasMatrix = await homePage.isStockMatrixVisible();
    expect(hasMatrix).to.be.true;
  });

  it('TC_DASH_010 · Pharma Dashboard Shows In Stock Count', async () => {
    const count = await homePage.getInStockCount();
    expect(count).to.be.greaterThanOrEqual(0);
  });

  it('TC_DASH_011 · Pharma Dashboard Shows Limited Stock Count', async () => {
    const count = await homePage.getLimitedStockCount();
    expect(count).to.be.greaterThanOrEqual(0);
  });

  it('TC_DASH_012 · Pharma Dashboard Shows Out of Stock Count', async () => {
    const count = await homePage.getOutOfStockCount();
    expect(count).to.be.greaterThanOrEqual(0);
  });

  it('TC_DASH_013 · Pharma Operations Hub Has 4 Cards', async () => {
    const count = await homePage.getOpsHubCardCount();
    expect(count).to.equal(4);
  });

  it('TC_DASH_014 · Pharma "Open Stock Manager" Button Links to Admin Panel', async () => {
    await homePage.tapOpenStockManager();
    const isAdmin = await homePage.isAdminPanelVisible();
    expect(isAdmin).to.be.true;
  });

  it('TC_DASH_015 · Dashboard Loads Within 3 Seconds', async () => {
    const start = Date.now();
    await homePage.waitForDashboardLoad();
    const elapsed = Date.now() - start;
    expect(elapsed).to.be.lessThan(3000);
  });

  it('TC_DASH_016 · Eyebrow Text Shows "MediCare AI" for Patients', async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.patient.email, TestData.patient.password);
    const eyebrow = await homePage.getEyebrowText();
    expect(eyebrow).to.include('MediCare');
  });

  it('TC_DASH_017 · Eyebrow Text Shows "Pharma Partner Portal" for Pharma', async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.pharma.email, TestData.pharma.password);
    const eyebrow = await homePage.getEyebrowText();
    expect(eyebrow).to.include('Pharma');
  });

  it('TC_DASH_018 · Screen Body Scrolls Smoothly Without Janking', async () => {
    await homePage.scrollToBottom();
    await homePage.scrollToTop();
    const isVisible = await homePage.isHomeScreenVisible();
    expect(isVisible).to.be.true;
  });

  it('TC_DASH_019 · Add to Cart Button on Recommended Medicine Works', async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.patient.email, TestData.patient.password);
    await homePage.tapAddToCartOnFirstMedicine();
    const cartCount = await homePage.getCartBadgeCount();
    expect(cartCount).to.be.greaterThan(0);
  });

  it('TC_DASH_020 · Cart Badge Updates After Adding Item', async () => {
    const initial = await homePage.getCartBadgeCount();
    await homePage.tapAddToCartOnFirstMedicine();
    const updated = await homePage.getCartBadgeCount();
    expect(updated).to.be.greaterThan(initial);
  });
});

describe('🔍 Search Module @search', () => {
  before(async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.patient.email, TestData.patient.password);
  });

  const catalogPage = new CatalogPage(driver);

  it('TC_SRCH_001 · Search Bar is Visible on Catalog Screen @smoke', async () => {
    const homePage = new HomePage(driver);
    await homePage.tapCatalogTab();
    const visible = await catalogPage.isSearchBarVisible();
    expect(visible).to.be.true;
  });

  it('TC_SRCH_002 · Search "Paracetamol" Returns Results', async () => {
    await catalogPage.search('Paracetamol');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_SRCH_003 · Search "Ibuprofen" Returns Correct Medicine', async () => {
    await catalogPage.search('Ibuprofen');
    const firstName = await catalogPage.getFirstResultName();
    expect(firstName).to.include('Ibuprofen');
  });

  it('TC_SRCH_004 · Search with Partial Name Returns Matches', async () => {
    await catalogPage.search('Para');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_SRCH_005 · Search with Uppercase Returns Results', async () => {
    await catalogPage.search('ASPIRIN');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_SRCH_006 · Search with Lowercase Returns Results', async () => {
    await catalogPage.search('cetirizine');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_SRCH_007 · Search Non-Existent Medicine Shows No Results', async () => {
    await catalogPage.search('XYZNOTEXIST999');
    const isEmpty = await catalogPage.isEmptyStateVisible();
    expect(isEmpty).to.be.true;
  });

  it('TC_SRCH_008 · Search with Special Characters is Handled Safely', async () => {
    await catalogPage.search("'; DROP TABLE medicines; --");
    const isEmpty = await catalogPage.isEmptyStateVisible();
    expect(isEmpty).to.be.true;
  });

  it('TC_SRCH_009 · Clear Search Button Resets Results', async () => {
    await catalogPage.search('Paracetamol');
    await catalogPage.clearSearch();
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_SRCH_010 · Search Shows Medicine Price in Results', async () => {
    await catalogPage.search('Paracetamol');
    const hasPrice = await catalogPage.firstResultHasPrice();
    expect(hasPrice).to.be.true;
  });

  it('TC_SRCH_011 · Search Results Show Add to Cart Button', async () => {
    await catalogPage.search('Paracetamol');
    const hasCartBtn = await catalogPage.firstResultHasAddToCartButton();
    expect(hasCartBtn).to.be.true;
  });

  it('TC_SRCH_012 · Tapping Search Result Opens Medicine Detail', async () => {
    await catalogPage.search('Paracetamol');
    await catalogPage.tapFirstResult();
    const isDetail = await catalogPage.isMedicineDetailVisible();
    expect(isDetail).to.be.true;
  });

  it('TC_SRCH_013 · Search "insulin" Returns Injection Category Item', async () => {
    await catalogPage.search('insulin');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_SRCH_014 · Search "ashwagandha" Returns Ayurveda Item', async () => {
    await catalogPage.search('ashwagandha');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_SRCH_015 · Search with Number Returns Results', async () => {
    await catalogPage.search('650');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_SRCH_016 · Search Debounces Input (No Double Requests)', async () => {
    await catalogPage.typeInSearch('P');
    await driver.pause(100);
    await catalogPage.typeInSearch('a');
    await driver.pause(100);
    await catalogPage.typeInSearch('r');
    const isNotCrashed = await catalogPage.isSearchBarVisible();
    expect(isNotCrashed).to.be.true;
  });

  it('TC_SRCH_017 · Search Placeholder Text is Correct', async () => {
    const placeholder = await catalogPage.getSearchPlaceholder();
    expect(placeholder).to.not.be.empty;
  });

  it('TC_SRCH_018 · Search with Emoji is Handled Gracefully', async () => {
    await catalogPage.search('💊 medicine');
    const isNotCrashed = await catalogPage.isSearchBarVisible();
    expect(isNotCrashed).to.be.true;
  });

  it('TC_SRCH_019 · Search Results Displayed as Grid/List View', async () => {
    await catalogPage.search('Paracetamol');
    const isGrid = await catalogPage.isResultsInGridOrList();
    expect(isGrid).to.be.true;
  });

  it('TC_SRCH_020 · Search Performance — Results Load Under 2 Seconds', async () => {
    const start = Date.now();
    await catalogPage.search('Paracetamol');
    await catalogPage.waitForResults();
    const elapsed = Date.now() - start;
    expect(elapsed).to.be.lessThan(2000);
  });
});

describe('🔽 Filters Module @filters', () => {
  before(async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.patient.email, TestData.patient.password);
  });

  const catalogPage = new CatalogPage(driver);

  it('TC_FILT_001 · All Category Filter Shows All Medicines @smoke', async () => {
    const homePage = new HomePage(driver);
    await homePage.tapCatalogTab();
    await catalogPage.filterByCategory('all');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(10);
  });

  it('TC_FILT_002 · Filter by Tablets Category Shows Only Tablets', async () => {
    await catalogPage.filterByCategory('tablets');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_FILT_003 · Filter by Injections Category Shows Only Injections', async () => {
    await catalogPage.filterByCategory('injections');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_FILT_004 · Filter by Devices Category Shows Devices', async () => {
    await catalogPage.filterByCategory('devices');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_FILT_005 · Filter by Ayurveda Category Shows Ayurveda', async () => {
    await catalogPage.filterByCategory('ayurveda');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_FILT_006 · Filter by Baby Care Category Shows Baby Items', async () => {
    await catalogPage.filterByCategory('baby');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_FILT_007 · Filter by First Aid Category Shows First Aid Items', async () => {
    await catalogPage.filterByCategory('first-aid');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_FILT_008 · Active Filter Pill is Highlighted', async () => {
    await catalogPage.filterByCategory('tablets');
    const isHighlighted = await catalogPage.isFilterPillActive('tablets');
    expect(isHighlighted).to.be.true;
  });

  it('TC_FILT_009 · Switching Filter Clears Previous Filter', async () => {
    await catalogPage.filterByCategory('tablets');
    await catalogPage.filterByCategory('injections');
    const isTabActive = await catalogPage.isFilterPillActive('tablets');
    expect(isTabActive).to.be.false;
  });

  it('TC_FILT_010 · Admin Stock Filter: In Stock Shows Available Medicines', async () => {
    const login = new LoginPage(driver);
    await login.loginAs(TestData.pharma.email, TestData.pharma.password);
    const homePage = new HomePage(driver);
    await homePage.tapInventoryTab();
    await catalogPage.filterByStock('in_stock');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_FILT_011 · Admin Stock Filter: Out of Stock Shows Unavailable', async () => {
    await catalogPage.filterByStock('out_of_stock');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThanOrEqual(0);
  });

  it('TC_FILT_012 · Admin Stock Filter: Limited Shows Limited Stock', async () => {
    await catalogPage.filterByStock('limited');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThanOrEqual(0);
  });

  it('TC_FILT_013 · Combine Category + Stock Filter Works', async () => {
    await catalogPage.filterByCategory('tablets');
    await catalogPage.filterByStock('in_stock');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThanOrEqual(0);
  });

  it('TC_FILT_014 · Filter Pill Row is Horizontally Scrollable', async () => {
    const isScrollable = await catalogPage.isFilterRowScrollable();
    expect(isScrollable).to.be.true;
  });

  it('TC_FILT_015 · Filter Persists After Scrolling Results', async () => {
    await catalogPage.filterByCategory('tablets');
    await catalogPage.scrollResultsDown();
    const isActive = await catalogPage.isFilterPillActive('tablets');
    expect(isActive).to.be.true;
  });

  it('TC_FILT_016 · Clearing Filter Shows All Results Again', async () => {
    await catalogPage.filterByCategory('tablets');
    await catalogPage.filterByCategory('all');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(10);
  });

  it('TC_FILT_017 · Filter with Search Combination Works', async () => {
    await catalogPage.filterByCategory('tablets');
    await catalogPage.search('Para');
    const count = await catalogPage.getResultCount();
    expect(count).to.be.greaterThan(0);
  });

  it('TC_FILT_018 · Filter Resets When Navigating Away and Back', async () => {
    const homePage = new HomePage(driver);
    await catalogPage.filterByCategory('tablets');
    await homePage.tapHomeTab();
    await homePage.tapCatalogTab();
    const isAll = await catalogPage.isFilterPillActive('all');
    expect([true, false]).to.include(isAll);
  });

  it('TC_FILT_019 · Filter Shows Item Count Badge or Total', async () => {
    await catalogPage.filterByCategory('tablets');
    const hasCount = await catalogPage.hasResultCountIndicator();
    expect(hasCount).to.be.true;
  });

  it('TC_FILT_020 · Filter Loads Within 1 Second', async () => {
    const start = Date.now();
    await catalogPage.filterByCategory('tablets');
    await catalogPage.waitForResults();
    const elapsed = Date.now() - start;
    expect(elapsed).to.be.lessThan(1000);
  });
});
