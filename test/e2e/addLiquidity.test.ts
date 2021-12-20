import puppeteer from 'puppeteer'
import dappeteer from '@chainsafe/dappeteer'
import { clickOn } from '../utils'

const SECOND = 1_000
const TEN_SECONDS = 10 * SECOND
const MINUTE = 60 * SECOND
const localApp = 'http://localhost:3000/'
// Rinkeby
const WEENUS = '0x711e1a4a500e6aaa0df2b934982506fc78e00833'
const XEENUS = '0x77379ed253c4731f365fcccee8e7bbe07261d103'

jest.setTimeout(MINUTE)

describe('Add liquidity', () => {
  const startupDelay = TEN_SECONDS * 3
  let browser: undefined | puppeteer.Browser
  let page: undefined | puppeteer.Page
  let metamask: any

  beforeAll(async () => {
    console.group('%c Log', 'color: orange; font-size: 14px')
    console.log('dappeteer: ', dappeteer)
    console.groupEnd()

    browser = await dappeteer.launch(puppeteer, { metamaskVersion: 'v10.1.1' })
    metamask = await dappeteer.setupMetamask(browser)
    page = await browser.newPage()

    await metamask.switchNetwork('rinkeby')
    await page.goto(localApp)
  }, startupDelay)

  afterAll(async () => {
    if (page) await page.close()
    if (browser) await browser.close()
  })

  it('it works', async () => {
    if (browser && page) {
      try {
        console.group('%c Log', 'color: orange; font-size: 14px')
        console.log('page.itlte(): ', page.title())
        console.log('metamask: ', metamask)
        console.groupEnd()

        // await clickOn({
        //   page,
        //   selector: '#pool-nav-link',
        // })
        // TODO: define which one of two inputs in usage
        // click on open-currency-select-button
        // select a token a
        // enter the amount in token-amount-input
        // the same actions for the second token
        // approve and add liquidity
        // await metamask.confirmTransaction()
      } catch (error) {
        console.error(error)
      }
    } else {
      throw new Error('No the browser or the page')
    }
  })
})
