import { createReducer, nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists/dist/types'
import {
  setAppManagement,
  retrieveDomainData,
  addPopup,
  PopupContent,
  removePopup,
  updateBlockNumber,
  updateActivePools,
  ApplicationModal,
  setOpenModal,
} from './actions'

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export type StorageState = {
  admin: string
  factory: string
  router: string
  pairHash: string
  feeRecipient: string
  protocolFee: number | undefined
  totalFee: number | undefined
  allFeeToProtocol: boolean | undefined
  possibleProtocolPercent: number[]
  totalSwaps: number | undefined
  projectName: string
  brandColor: string
  backgroundColorDark: string
  backgroundColorLight: string
  textColorDark: string
  textColorLight: string
  logo: string
  tokenLists: TokenList[]
  navigationLinks: { name: string; source: string }[]
  menuLinks: { name: string; source: string }[]
  socialLinks: string[]
  addressesOfTokenLists: string[]
  disableSourceCopyright: boolean
}

export type ApplicationState = StorageState & {
  readonly appManagement: boolean
  readonly pools: string[]
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly popupList: PopupList
  readonly openModal: ApplicationModal | null
}

const initialState: ApplicationState = {
  appManagement: false,
  admin: '',
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
  pools: [],
  projectName: '',
  brandColor: '',
  backgroundColorDark: '',
  backgroundColorLight: '',
  textColorDark: '',
  textColorLight: '',
  logo: '',
  tokenLists: [],
  navigationLinks: [],
  menuLinks: [],
  socialLinks: [],
  addressesOfTokenLists: [],
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

      if (data && Object.keys(data).length) {
        Object.keys(data).forEach((key: string) => {
          // @ts-ignore
          state[key] = data[key]
        })
      }
    })
    .addCase(updateActivePools, (state, action) => {
      const { pools } = action.payload

      state.pools = pools
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
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = 15000 } }) => {
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
