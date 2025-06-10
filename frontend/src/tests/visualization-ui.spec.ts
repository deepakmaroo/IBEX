import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { expect } from 'chai';
import * as chrome from 'selenium-webdriver/chrome';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { ConfigurationState } from 'src/renderer/types';

/**
 * UI Test Suite for the Visualization Component
 * Tests the Electron application's visualization interface using Selenium WebDriver
 */
describe('UI Tests for Visualization Component', function () {
  // Extended timeout to accommodate Electron startup and UI rendering
  this.timeout(30000);

  let driver: WebDriver;
  let electron: ChildProcessWithoutNullStreams;

  /**
   * Waits for the Electron app's API to be available in the renderer process
   * This ensures all IPC communication is ready before running tests
   */
  const waitForApi = async () => {
    await driver.wait(async () => {
      const result = await driver.executeScript(
        'return typeof window.api !== "undefined"',
      );
      return result === true;
    }, 10000);
  };

  /**
   * Sets the application state for testing purposes
   * Uses the exposed test API to manipulate the app's configuration state
   * @param state - Partial configuration state to apply
   */
  const setTestState = async (state: Partial<ConfigurationState>) => {
    await driver.executeScript((s: Partial<ConfigurationState>) => {
      // @ts-ignore
      return window.api.setTestState(s);
    }, state);
  };

  /**
   * Setup phase: Start Electron app and initialize WebDriver
   * Runs once before all tests in this suite
   */
  before(async () => {
    // Get the Electron binary path from node_modules
    const electronBinary = require('electron');
    const appDir = path.resolve(__dirname, '..', '..');

    // Spawn the Electron application process
    electron = spawn(electronBinary, ['.'], {
      cwd: appDir,
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: 'true',        // Enable detailed logging
        ELECTRON_ENABLE_STACK_DUMPING: 'true',  // Enable stack traces on crashes
      },
    });

    // Wait for Electron app to fully initialize
    await new Promise((r) => setTimeout(r, 5000));

    const options = new Options()
      .addArguments('--remote-debugging-port=9222')
      .addArguments('--no-sandbox')
      .addArguments('--disable-dev-shm-usage');

    // Initialize WebDriver to connect to Electron's Chromium instance
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options as chrome.Options)
      .build();

    // Ensure the app's API is ready before proceeding with tests
    await waitForApi();
  });

  /**
   * Cleanup after each test: Reset application state
   * Ensures tests don't interfere with each other
   */
  afterEach(async () => {
    await setTestState({ configurations: [], active: null });
  });

  /**
   * Final cleanup: Close WebDriver and terminate Electron process
   * Runs once after all tests in this suite
   */
  after(async () => {
    if (driver) await driver.quit();
    if (electron) electron.kill();
  });


  it('Should show "No configurations available" text if configurations is empty', async () => {
    // Empty state
    await setTestState({
      configurations: [],
      active: null,
    });

    // Wait for and locate the "no configurations" message
    const noConfigText = await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(), 'No configurations available')]"),
      ),
      10000,
    );

    const isDisplayed = await noConfigText.isDisplayed();
    expect(isDisplayed).to.be.true;
  });

  it('Should display the Visualization component and show the left and right panels', async () => {
    // Sample configuration
    await setTestState({
      configurations: [
        {
          name: 'TestConfig1',
          dataURI: [],
          checkedNodeURI: [],
          customDataTree: [],
          dataPlot: [],
        },
      ],
      active: {
        name: 'TestConfig1',
        dataURI: [],
        checkedNodeURI: [],
        customDataTree: [],
        dataPlot: [],
      },
    });

    // Locate all required elements
    const container = await driver.wait(
      until.elementLocated(By.css('[data-testid="visualization-container"]')),
      1000,
    );

    const leftPanel = await driver.wait(
      until.elementLocated(By.css('[data-testid="visualization-left-panel"]')),
      1000,
    );

    const rightPanel = await driver.wait(
      until.elementLocated(By.css('[data-testid="visualization-right-panel"]')),
      1000,
    );

    expect(await container.isDisplayed()).to.be.true;
    expect(await leftPanel.isDisplayed()).to.be.true;
    expect(await rightPanel.isDisplayed()).to.be.true;
  });

  it('Should verify the correct width for the left and right panels', async () => {
    // Sample configuration
    await setTestState({
      configurations: [
        {
          name: 'TestConfig1',
          dataURI: [],
          checkedNodeURI: [],
          customDataTree: [],
          dataPlot: [],
        },
      ],
      active: {
        name: 'TestConfig1',
        dataURI: [],
        checkedNodeURI: [],
        customDataTree: [],
        dataPlot: [],
      },
    });

    // Locate all required elements
    const container = await driver.wait(
      until.elementLocated(By.css('[data-testid="visualization-container"]')),
      1000,
    );
    const leftPanel = await driver.wait(
      until.elementLocated(By.css('[data-testid="visualization-left-panel"]')),
      1000,
    );
    const rightPanel = await driver.wait(
      until.elementLocated(By.css('[data-testid="visualization-right-panel"]')),
      1000,
    );

    expect(await container.isDisplayed()).to.be.true;
    expect(await leftPanel.isDisplayed()).to.be.true;
    expect(await rightPanel.isDisplayed()).to.be.true;

    // Get bounding rectangles for dimension calculations
    const containerRect: any = await driver.executeScript(() => {
      const el = document.querySelector(
        '[data-testid="visualization-container"]',
      );
      return el?.getBoundingClientRect();
    });

    const leftRect: any = await driver.executeScript(() => {
      const el = document.querySelector(
        '[data-testid="visualization-left-panel"]',
      );
      return el?.getBoundingClientRect();
    });

    const rightRect: any = await driver.executeScript(() => {
      const el = document.querySelector(
        '[data-testid="visualization-right-panel"]',
      );
      return el?.getBoundingClientRect();
    });

    const containerWidth = containerRect?.width;
    const leftWidth = leftRect?.width;
    const rightWidth = rightRect?.width;

    const totalPanelsWidth = leftWidth + rightWidth;
    const remaining = containerWidth - totalPanelsWidth;

    expect(remaining).to.be.lessThan(32);

    const leftRatio = leftWidth / totalPanelsWidth;
    const rightRatio = rightWidth / totalPanelsWidth;

    // Assert expected ratios: 1/6 for left panel, 5/6 for right panel
    // Using closeTo() to account for floating-point precision and browser rendering differences
    expect(leftRatio).to.be.closeTo(0.1666, 0.01);   // ~16.67%
    expect(rightRatio).to.be.closeTo(0.8333, 0.01);  // ~83.33%
  });


    it('Should "No configurations available / No chart generates" is display', async () => {
    // Sample configuration
    await setTestState({
      configurations: [
        {
          name: 'TestConfig1',
          dataURI: [],
          checkedNodeURI: [],
          customDataTree: [],
          dataPlot: [],
        },
      ],
      active: {
        name: 'TestConfig1',
        dataURI: [],
        checkedNodeURI: [],
        customDataTree: [],
        dataPlot: [],
      },
    });

    // Passed
    const noConfigText = await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(), 'No chart generates')]"),
      ),
      10000,
    );

    // // Failed
    // const noConfigText = await driver.wait(
    //   until.elementLocated(
    //     By.xpath("//*[contains(text(), 'No configurations available')]"),
    //   ),
    //   10000,
    // );

    const isDisplayed = await noConfigText.isDisplayed();
    expect(isDisplayed).to.be.true;

  });
});