import puppeteer from 'puppeteer'
import * as dappeteer from '@chainsafe/dappeteer'
import fs from 'fs'

let link = 'http://localhost:9001/'

if (process.env.ACTIONS) {
  link = ``
}

export const SECOND = 1_000
export const TEN_SECONDS = SECOND * 10
export const THIRTY_SECONDS = SECOND * 30
export const MINUTE = SECOND * 60

// if it's true then you will be able to see puppeteer's browser
// Github flows don't work with that
const isDebug = true
const pageViewport = {
  width: 1400,
  height: 1080,
}

export const timeOut = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const createBrowser = async (): Promise<{
  browser: puppeteer.Browser
  page: puppeteer.Page
}> => {
  const browser = await puppeteer.launch({
    headless: !isDebug,
    // slowMo: 100,
  })

  const page = await browser.newPage()
  await page.setViewport(pageViewport)

  page.on('error', (err) => {
    console.error('[puppeteer] error: ', err)
  })

  await page.goto(link)

  return { browser, page }
}

export const createMetamaskBrowser = async () => {
  try {
    const browser = await dappeteer.launch(puppeteer, { metamaskVersion: dappeteer.RECOMMENDED_METAMASK_VERSION })
    const metamask = await dappeteer.setupMetamask(browser, {
      // seed: process.env.METAMASK_SEED,
      // password: 'password1234',
    })
    const page = await browser.newPage()
    await page.setViewport(pageViewport)

    return {
      browser,
      page,
      metamask,
    }
  } catch (error) {
    throw new Error(`Fail on browser creation: ${error.message}`)
  }
}

export const clickOn = async (params) => {
  const { page, selector } = params

  await page.$(selector).then(async (item) => {
    if (item) {
      item.click()
      await timeOut(SECOND)
    } else {
      throw new Error(`Selector (${selector}) is not found`)
    }
  })
}

export const takeScreenshot = async (page: puppeteer.Page, fileName: string) => {
  const screenPath = 'test/screenshots'
  const dir = screenPath

  if (!fs.existsSync(dir)) {
    await fs.mkdir(dir, (err) => {
      if (err) throw err

      console.log(`${screenPath} directory is created`)
    })
  }

  await page.screenshot({
    path: `${screenPath}/${fileName}.jpg`,
    type: 'jpeg',
  })
}

export const importCustomToken = async (page: puppeteer.Page, address: string) => {
  try {
    const selectButton = await page.$('#open-currency-select-button')
    await selectButton.click()
    await clickOn({
      page,
      selector: '#list-token-manage-button',
    })
    await clickOn({
      page,
      selector: '#manage-modal-tokens-tab',
    })

    const tokenSearchInput = await page.$('#token-search-input')
    await tokenSearchInput.type(address)
    // token search delay
    await timeOut(SECOND * 5)
    await clickOn({
      page,
      selector: `#import-token-${address.toLowerCase()}`,
    })
    await clickOn({
      page,
      selector: '#understand-checkbox',
    })
    await clickOn({
      page,
      selector: '#import-current-token',
    })
  } catch (error) {
    throw new Error(`Fail on token import: (${address}). ${error.message}`)
  }
}

export const fillFormInputs = async (params: {
  page: puppeteer.Page
  tokenA: string
  amountA: number
  tokenB: string
  amountB: number
}) => {
  const { page, tokenA, amountA, tokenB, amountB } = params

  try {
    const [selectOfTokenA, selectOfTokenB] = await page.$$('#open-currency-select-button')

    async function fillOneSide(select, inputId, tokenAddr, amount) {
      await select.click()
      await timeOut(SECOND * 2)
      await clickOn({
        page,
        selector: `#token-item-${tokenAddr.toLowerCase()}`,
      })
      await timeOut(SECOND)
      const input = await page.$(inputId)
      await input.type(String(amount))
    }

    await fillOneSide(selectOfTokenA, '#add-liquidity-input-tokena .token-amount-input', tokenA, amountA)
    await fillOneSide(selectOfTokenB, '#add-liquidity-input-tokenb .token-amount-input', tokenB, amountB)
  } catch (error) {
    throw new Error(`Fail on form filling: ${error.message}`)
  }
}
