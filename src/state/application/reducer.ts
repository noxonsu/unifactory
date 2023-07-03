import { createReducer, nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { SUPPORTED_NETWORKS } from '../../connectors'
import { Addition } from '../../constants/onout'
import {
  setAppManagement,
  retrieveDomainData,
  addPopup,
  PopupContent,
  removePopup,
  updateBlockNumber,
  updateAppOptions,
  ApplicationModal,
  setOpenModal,
} from './actions'

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export type StorageState = {
  admin: string
  contracts: {
    [key in keyof typeof SUPPORTED_NETWORKS]: {
      factory: string
      router: string
    }
  }
  tokenListsByChain: {
    [chainId: string]: {
      [tokenListId: string]: TokenList
    }
  }
  tokenLists: TokenList[]
  factory: string
  router: string
  pairHash: string
  feeRecipient: string
  protocolFee: number | undefined
  totalFee: number | undefined
  allFeeToProtocol: boolean | undefined
  possibleProtocolPercent: number[]
  totalSwaps: number | undefined
  domain: string
  projectName: string
  brandColor: string
  backgroundColorDark: string
  backgroundColorLight: string
  textColorDark: string
  textColorLight: string
  logo: string
  favicon: string
  background: string
  navigationLinks: { name: string; source: string }[]
  menuLinks: { name: string; source: string }[]
  socialLinks: string[]
  addressesOfTokenLists: string[]
  disableSourceCopyright: boolean
  defaultSwapCurrency: { input: string; output: string }
  onoutFeeTo: string
  additions: Partial<
    Record<
      Addition,
      {
        key: string
        isValid: boolean
      }
    >
  >
}

export type ApplicationState = StorageState & {
  readonly appManagement: boolean
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly popupList: PopupList
  readonly openModal: ApplicationModal | null
}

const initialState: ApplicationState = {
  // external data -----------
  admin: '',
  contracts: {},
  factory: '',
  router: '',
  pairHash: '',
  feeRecipient: '',
  protocolFee: undefined,
  totalFee: undefined,
  allFeeToProtocol: undefined,
  possibleProtocolPercent: [],
  totalSwaps: undefined,
  disableSourceCopyright: false,
  domain: '',
  projectName: '',
  brandColor: '',
  backgroundColorDark: '',
  backgroundColorLight: '',
  textColorDark: '',
  textColorLight: '',
  logo: '',
  favicon: '',
  background: '',
  tokenListsByChain: {},
  tokenLists: [],
  navigationLinks: [],
  menuLinks: [],
  socialLinks: [],
  addressesOfTokenLists: [],
  defaultSwapCurrency: { input: '', output: '' },
  onoutFeeTo: '',
  additions: {},
  // --------------------------
  appManagement: false,
  blockNumber: {},
  popupList: [],
  openModal: null,
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(setAppManagement, (state, action) => {
      const { status } = action.payload

      state.appManagement = status
    })
    .addCase(retrieveDomainData, (state, action) => {
      const data = action.payload

      if (data) {
        // validation in the utils/app.ts > fetchSettings()
        Object.keys(data).forEach((key: string) => {
          if (key === 'defaultSwapCurrency') {
            const { input, output } = data[key]

            if (input) state.defaultSwapCurrency.input = input
            if (output) state.defaultSwapCurrency.output = output
          } else {
            // @ts-ignore
            state[key] = data[key]
          }
        })
      }
    })
    .addCase(updateAppOptions, (state, action) => {
      if (action.payload?.length) {
        action.payload.forEach(({ key, value }) => {
          // @ts-ignore
          if (key) state[key] = value
        })
      }
    })
    .addCase(updateBlockNumber, (state, action) => {
      const { chainId, blockNumber } = action.payload
      if (typeof state.blockNumber[chainId] !== 'number') {
        state.blockNumber[chainId] = blockNumber
      } else {
        state.blockNumber[chainId] = Math.max(blockNumber, state.blockNumber[chainId])
      }
    })
    .addCase(setOpenModal, (state, action) => {
      state.openModal = action.payload
    })
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = 15_000 } }) => {
      state.popupList = (key ? state.popupList.filter((popup) => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ])
    })
    .addCase(removePopup, (state, action) => {
      const { key } = action.payload

      state.popupList.forEach((p) => {
        if (p.key === key) {
          p.show = false
        }
      })
    })
)
