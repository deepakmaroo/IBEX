import { expect } from 'chai';
import { By, until, WebDriver } from 'selenium-webdriver';
import { mockConfigurationState } from './utils';
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
  let driver: WebDriver;

  before(async () => {
    await startApp();
    driver = getDriver();
    await waitForApi();
  });

  after(async () => {
    await stopApp();
  });

  afterEach(async () => {
    await setTestState({ configurations: [], active: null });

    try {
      const overlay = await driver.findElement(
        By.css('.mantine-Modal-overlay'),
      );
      const displayed = await overlay.isDisplayed();
      if (displayed) {
        const close = await driver.findElement(
          By.css('[data-testid="modal-close-button"]'),
        );
        await close.click();
        await driver.wait(until.stalenessOf(overlay), 10000);
      }
    } catch (e) {
      // no modal to close
    }
  });

  async function waitForOverlayToDisappear() {
    try {
      const overlay = await driver.findElement(
        By.css('.mantine-Modal-overlay'),
      );
      if (await overlay.isDisplayed()) {
        await driver.wait(until.stalenessOf(overlay), 10000);
      }
    } catch (e) {
      console.warn('No overlay to wait for');
    }
  }
  it('Should create new configuration from header', async () => {
    const newConfigButton = await driver.wait(
      until.elementLocated(By.css('[data-testid="header-add-configuration"]')),
      5000,
    );
    await newConfigButton.click();

    const configCreateModal = await driver.wait(
      until.elementLocated(By.css('[data-testid="config-create-modal"]')),
      5000,
    );
    expect(await configCreateModal.isDisplayed()).to.be.true;

    const input = await driver.wait(
      until.elementLocated(By.css('[data-testid="config-create-name-input"]')),
      5000,
    );
    await input.clear();
    await input.sendKeys('My New Config');

    const createButton = await driver.wait(
      until.elementLocated(
        By.css('[data-testid="config-create-submit-button"]'),
      ),
      5000,
    );
    await createButton.click();

    await waitForOverlayToDisappear();

    //Add a retry mechanism to ensure the state is updated
    let state;
    for (let i = 0; i < 5; i++) {
      state = await getTestState();
      if (state.configurations.find((c) => c.name === 'My New Config')) break;
      await new Promise((res) => setTimeout(res, 300)); // attendre 300 ms
    }

    const names = state.configurations.map((c) => c.name);
    expect(names).to.include('My New Config');
  });

  it('Should delete configuration from header', async () => {
    await setTestState(mockConfigurationState);

    const deleteButton = await driver.wait(
      until.elementLocated(
        By.css('[data-testid="header-delete-configuration"]'),
      ),
      5000,
    );
    await deleteButton.click();

    const confirmationModal = await driver.wait(
      until.elementLocated(By.css('[data-testid="confirm-modal"]')),
      10000,
    );
    expect(await confirmationModal.isDisplayed()).to.be.true;

    const confirmationText = await driver
      .findElement(By.css('[data-testid="config-delete-confirmation-text"]'))
      .getText();
    expect(confirmationText).to.equal(
      'Are you sure you want to delete the configuration?',
    );

    const confirmButton = await driver.findElement(
      By.css('[data-testid="confirm-modal-confirm-button"]'),
    );
    await confirmButton.click();

    await waitForOverlayToDisappear();

    const state = await getTestState();
    expect(state.configurations.length).to.equal(1);
  });

  it('Should save configuration from header', async () => {
    await setTestState(mockConfigurationState);

    await waitForOverlayToDisappear();

    const saveButton = await driver.wait(
      until.elementLocated(By.css('[data-testid="header-save-configuration"]')),
      5000,
    );
    await driver.wait(until.elementIsVisible(saveButton), 5000);
    await saveButton.click();

    await driver.wait(async () => {
      const state = await getTestState();
      return state.active?.saved === true;
    }, 5000);

    const state = await getTestState();
    expect(state.active?.saved).to.be.true;
  });
});
