/**
 * MediCare AI · Appium Configuration
 * Framework: WebdriverIO + Appium + Mocha
 * Target: Android 11 (API 30)
 */

const { config: baseConfig } = require('./config/base.config');

exports.config = {
  ...baseConfig,

  // ── Runner ──────────────────────────────────────────────────────────────────
  runner: 'local',

  // ── Appium Host ─────────────────────────────────────────────────────────────
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT || '4723'),
  path: '/wd/hub',

  // ── Capabilities ────────────────────────────────────────────────────────────
  capabilities: [
    {
      platformName: 'Android',
      'appium:deviceName': process.env.AVD_NAME || 'MediCare_E2E_AVD',
      'appium:platformVersion': process.env.ANDROID_VERSION || '11.0',
      'appium:automationName': 'UiAutomator2',
      'appium:app': process.env.APK_PATH || './dist/android/app-debug.apk',
      'appium:appPackage': process.env.APP_PACKAGE || 'com.medicareai.app',
      'appium:appActivity': '.MainActivity',
      'appium:newCommandTimeout': 120,
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:uiautomator2ServerLaunchTimeout': 60000,
      'appium:uiautomator2ServerInstallTimeout': 60000,
      'appium:adbExecTimeout': 60000,
      'appium:systemPort': 8200,
      'appium:mjpegServerPort': 9100,
    }
  ],

  // ── Test Framework ──────────────────────────────────────────────────────────
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
    retries: parseInt(process.env.RETRIES || '2'),
  },

  // ── Test Files ───────────────────────────────────────────────────────────────
  specs: [
    './tests/**/*.test.js'
  ],
  exclude: [],

  // ── Reporters ───────────────────────────────────────────────────────────────
  reporters: [
    'spec',
    ['json', {
      outputDir: './results',
      outputFileFormat: (options) => `results-${options.cid}-${Date.now()}.json`
    }],
    ['allure', {
      outputDir: './results/allure-raw',
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }]
  ],

  // ── Screenshot on Failure ────────────────────────────────────────────────────
  afterTest: async function (test, context, { error, result, duration, passed }) {
    if (!passed) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `./screenshots/FAIL_${test.title.replace(/\s+/g, '_')}_${timestamp}.png`;
      try {
        await driver.saveScreenshot(screenshotPath);
        console.log(`Screenshot saved: ${screenshotPath}`);
      } catch (e) {
        console.error('Screenshot failed:', e.message);
      }
    }
  },

  // ── Services ────────────────────────────────────────────────────────────────
  services: [
    ['appium', {
      command: 'appium',
      args: {
        port: 4723,
        log: './logs/appium.log',
        relaxedSecurity: true,
      }
    }]
  ],

  // ── Hooks ────────────────────────────────────────────────────────────────────
  onPrepare: function () {
    const fs = require('fs');
    ['./results', './screenshots', './logs'].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    console.log('🚀 MediCare AI Appium E2E Suite Starting...');
  },

  onComplete: function (exitCode, config, capabilities, results) {
    console.log(`\n📊 Test Suite Complete. Exit Code: ${exitCode}`);
  },
};
