import { By, until } from 'selenium-webdriver';
import {
  startApp,
  getDriver,
  stopApp,
  waitForApi,
  setTestState,
  getTestState,
} from './setup';
import {
  ensureCssElementIsDisplayed,
  findCssElementAndClickIt,
  waitForElementToDisappear,
  waitForValue,
  writeTextInCssElement,
} from './utils';

/**
 * UI Test Suite for the Visualization Component
 */
describe('UI Tests for Header Component', function () {
  this.timeout(30000);

  before(async () => {
    await startApp();
    await waitForApi();
  });

  after(async () => {
    await stopApp();
  });

  afterEach(async () => {
    await setTestState({ configurations: [], active: null });

    try {
      const overlay = await getDriver().findElement(
        By.css('.mantine-Modal-overlay'),
      );
      const displayed = await overlay.isDisplayed();
      if (displayed) {
        const close = await getDriver().findElement(
          By.css('[data-testid="modal-close-button"]'),
        );
        await close.click();
        await getDriver().wait(until.stalenessOf(overlay), 10000);
      }
    } catch {
      // no modal to close
    }
  });

  it('Should create a new configuration, and plot data on it', async () => {
    ///
    /// Create a new configuration named 'New Plot Config'
    ///
    await findCssElementAndClickIt('header-add-configuration');
    const configCreateModal = await ensureCssElementIsDisplayed(
      'config-create-modal',
    );
    await writeTextInCssElement('config-create-name-input', 'New Plot Config');
    await findCssElementAndClickIt('config-create-submit-button');
    await waitForElementToDisappear(configCreateModal);
    await waitForValue(
      async () => (await getTestState()).configurations.length,
      1,
    );
    await waitForValue(
      async () => (await getTestState()).configurations[0].name,
      'New Plot Config',
    );

    ///
    /// Add the URI 'imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3' to the configuration and navigate in the accordion node tree
    ///
    await ensureCssElementIsDisplayed('config-uri-selection-modal');
    await writeTextInCssElement(
      'config-uri-selection-modal-uri-text-input',
      'imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3',
    );
    await findCssElementAndClickIt('config-uri-selection-modal-add-uri-button');
    await findCssElementAndClickIt(
      'config-uri-selection-modal-validate-button',
      10000,
      200,
      100,
    );
    await ensureCssElementIsDisplayed(
      'uriAccordion-imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3',
      10000,
    );
    await findCssElementAndClickIt(
      'uriAccordion-imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3',
      10000,
      200,
      100,
    );
    await findCssElementAndClickIt(
      'folder-imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3#core_profiles:0/',
      10000,
      200,
      100,
    );
    await findCssElementAndClickIt(
      'folder-imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3#core_profiles:0/profiles_1d[:]/',
      10000,
      200,
      100,
    );
    await findCssElementAndClickIt(
      'folder-imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3#core_profiles:0/profiles_1d[:]/ion[:]/',
      10000,
      200,
      100,
    );

    ///
    /// The accordion node tree is now unfold, check that the plot are correctly added into the active configuration
    ///
    await waitForValue(
      async () => (await getTestState()).active.dataPlot.length,
      0,
    );
    // Click on temperature checkbox to start a new plot
    await findCssElementAndClickIt(
      'checkbox-imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3#core_profiles:0/profiles_1d[:]/ion[:]/temperature',
    );
    // Check that there is one dataplot created
    await waitForValue(
      async () => (await getTestState()).active.dataPlot.length,
      1,
    );
    // Check that the Y plot is defined
    await waitForValue(
      async () => (await getTestState()).active.dataPlot[0].yAxisData,
      undefined,
      (actual, expected) => actual != expected,
    );
    // Check that the Y2 plot is undefined
    await waitForValue(
      async () => (await getTestState()).active.dataPlot[0].y2AxisData,
      undefined,
      (actual, expected) => actual == expected,
    );
    // Click on density checkbox to plot a second axis
    await findCssElementAndClickIt(
      'checkbox-imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3#core_profiles:0/profiles_1d[:]/ion[:]/density',
    );
    // Check that the Y plot is defined
    await waitForValue(
      async () => (await getTestState()).active.dataPlot[0].yAxisData,
      undefined,
      (actual, expected) => actual != expected,
    );
    // Check that the Y2 plot is defined too
    await waitForValue(
      async () => (await getTestState()).active.dataPlot[0].y2AxisData,
      undefined,
      (actual, expected) => actual != expected,
    );
  });
});
