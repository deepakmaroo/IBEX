import { By, until, WebElement } from 'selenium-webdriver';
import { expect } from 'chai';
import { getDriver } from '../setup';

export async function getCssElementFromDataTestId(
  cssElementDataTestIdName: string,
): Promise<WebElement> {
  const cssElement = await getDriver().wait(
    until.elementLocated(By.css(`[data-testid="${cssElementDataTestIdName}"]`)),
    5000,
  );

  if (!cssElement) {
    throw new Error(
      `No CSS element found under the name ${cssElementDataTestIdName}, abort`,
    );
  }

  return cssElement;
}

export async function waitForElementToDisappear(
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

export async function ensureCssElementIsDisplayed(
  cssElementDataTestIdName: string,
): Promise<WebElement> {
  console.info('Finding and clicking element : ', cssElementDataTestIdName);
  const configCreateModal = await getCssElementFromDataTestId(
    cssElementDataTestIdName,
  );
  expect(await configCreateModal.isDisplayed()).to.be.true;
  return configCreateModal;
}

export async function writeTextInCssElement(
  cssElementDataTestIdName: string,
  text: string,
) {
  const input = await getCssElementFromDataTestId(cssElementDataTestIdName);
  await input.clear();
  await input.sendKeys(text);
}

export async function findCssElementAndClickIt(
  cssElementDataTestIdName: string,
) {
  const button = await ensureCssElementIsDisplayed(cssElementDataTestIdName);

  for (let i = 0; i < 5; i++) {
    await new Promise((res) => setTimeout(res, 300));

    if (await button.isEnabled()) {
      break;
    }
  }

  expect(await button.isEnabled()).to.be.true;
  await button.click();
}

export async function waitForValue<T>(
  callback: () => Promise<T>,
  expected: T,
  comparator: (actual: T, expected: T) => boolean = (a, b) => a === b,
  retries = 5,
  delayMs = 300,
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    const actual = await callback();
    if (comparator(actual, expected)) {
      return; // success
    }
    await new Promise((res) => setTimeout(res, delayMs));
  }

  // final assertion
  const final = await callback();
  expect(comparator(final, expected)).to.be.true;
}
