import { expect } from 'chai';
import { By, until, WebElement } from 'selenium-webdriver';
import {
  ensureCssElementIsDisplayed,
  findCssElementAndClickIt,
  mockConfigurationState,
  waitForValue,
  writeTextInCssElement,
} from './utils';
import {
  startApp,
  getDriver,
  stopApp,
  waitForApi,
  setTestState,
  getTestState,
} from './setup';

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

  async function waitForElementToDisappear(
    element: WebElement,
    timeout = 10000,
  ) {
    try {
      if (await element.isDisplayed()) {
        const start = Date.now();
        await getDriver().wait(until.elementIsNotVisible(element), timeout);
        const elapsed = Date.now() - start;
        console.info(`Waited ${elapsed} ms for element to disappear`);
      }
    } catch {
      console.warn('Element did not disappear within timeout');
    }
  }

  it('Should create new configuration from header', async () => {
    await findCssElementAndClickIt('header-add-configuration');
    const configCreateModal = await ensureCssElementIsDisplayed(
      'config-create-modal',
    );
    await writeTextInCssElement('config-create-name-input', 'My New Config');
    await findCssElementAndClickIt('config-create-submit-button');
    await waitForElementToDisappear(configCreateModal);

    await waitForValue(
      async () => (await getTestState()).configurations.length,
      1,
    );
    await waitForValue(
      async () => (await getTestState()).configurations[0].name,
      'My New Config',
    );

    // The URI selection modal should apear, we should close it for the next test
    const configUriSelectionModal = await ensureCssElementIsDisplayed(
      'config-uri-selection-modal',
    );
    // Find the close button INSIDE the modal
    const closeButton = await configUriSelectionModal.findElement(
      By.css('button.mantine-Modal-close'),
    );
    // Click it to close
    await closeButton.click();
    // Wait for the modal to disappear
    await waitForElementToDisappear(configUriSelectionModal);
  });

  it('Should delete configuration from header', async () => {
    await setTestState(mockConfigurationState);

    const deleteButton = await getDriver().wait(
      until.elementLocated(
        By.css('[data-testid="header-delete-configuration"]'),
      ),
      5000,
    );
    await deleteButton.click();

    const confirmationModal = await getDriver().wait(
      until.elementLocated(By.css('[data-testid="confirm-modal"]')),
      10000,
    );
    expect(await confirmationModal.isDisplayed()).to.be.true;

    const confirmationText = await getDriver()
      .findElement(By.css('[data-testid="config-delete-confirmation-text"]'))
      .getText();
    expect(confirmationText).to.equal(
      'Are you sure you want to delete the configuration?',
    );

    const confirmButton = await getDriver().findElement(
      By.css('[data-testid="confirm-modal-confirm-button"]'),
    );
    await confirmButton.click();

    await waitForElementToDisappear(confirmationModal);

    const state = await getTestState();
    expect(state.configurations.length).to.equal(1);
  });

  it('Should save configuration from header', async () => {
    await setTestState(mockConfigurationState);

    const saveButton = await getDriver().wait(
      until.elementLocated(By.css('[data-testid="header-save-configuration"]')),
      5000,
    );
    await getDriver().wait(until.elementIsVisible(saveButton), 5000);

    let state = await getTestState();
    expect(state.active?.saved).to.be.undefined;

    await saveButton.click();

    state = await getTestState();
    expect(state.active?.saved).to.be.true;
  });

  it('Should load the configuration from header', async () => {
    const loadButton = await getDriver().wait(
      until.elementLocated(By.css('[data-testid="header-load-configuration"]')),
      5000,
    );
    await getDriver().wait(until.elementIsVisible(loadButton), 5000);

    let state = await getTestState();
    expect(state.configurations.length).to.equal(0);

    await loadButton.click();

    state = await getTestState();
    expect(state.configurations.length).to.equal(1);
  });
});
