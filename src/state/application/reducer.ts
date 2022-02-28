import isNumber from 'is-number'
import { createReducer, nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { ZERO_ADDRESS } from 'sdk'
import {
  setAppManagement,
  retrieveDomainData,
  updateAppData,
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
  readonly domain: string
  readonly projectName: string
  readonly brandColor: string
  readonly backgroundColorDark: string
  readonly backgroundColorLight: string
  readonly textColorDark: string
  readonly textColorLight: string
  readonly logo: string
  readonly tokenLists: TokenList[]
  readonly navigationLinks: { name: string; source: string }[]
  readonly menuLinks: { name: string; source: string }[]
  readonly socialLinks: string[]
  readonly addressesOfTokenLists: string[]
  readonly disableSourceCopyright: boolean
}

export type ApplicationState = StorageState & {
  readonly appManagement: boolean
  readonly admin: string
  readonly factory: string
  readonly router: string
  readonly storage: string
  readonly pairHash: string
  readonly feeRecipient: string
  readonly protocolFee: number | undefined
  readonly totalFee: number | undefined
  readonly allFeeToProtocol: boolean | undefined
  readonly possibleProtocolPercent: number[]
  readonly totalSwaps: number | undefined
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
  storage: '',
  pairHash: '',
  feeRecipient: '',
  protocolFee: undefined,
  totalFee: undefined,
  allFeeToProtocol: undefined,
  possibleProtocolPercent: [],
  totalSwaps: undefined,
  disableSourceCopyright: false,
  pools: [],
  domain: '',
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
      const domainData = action.payload

      if (domainData) {
        let {
          admin = '',
          factory = '',
          router = '',
          storageAddr = '',
          pairHash = '',
          feeRecipient = '',
          protocolFee,
          totalFee,
          allFeeToProtocol,
          possibleProtocolPercent,
          totalSwaps,
        } = domainData

        if (admin === ZERO_ADDRESS) admin = ''
        if (factory === ZERO_ADDRESS) factory = ''
        if (router === ZERO_ADDRESS) router = ''
        if (storageAddr === ZERO_ADDRESS) storageAddr = ''
        if (feeRecipient === ZERO_ADDRESS) feeRecipient = ''
        if (possibleProtocolPercent?.length)
          state.possibleProtocolPercent = possibleProtocolPercent.map((percent) => Number(percent))
        if (isNumber(protocolFee)) state.protocolFee = Number(protocolFee)
        if (isNumber(totalFee)) state.totalFee = Number(totalFee)
        if (isNumber(totalSwaps)) state.totalSwaps = Number(totalSwaps)
        if (typeof allFeeToProtocol === 'boolean') state.allFeeToProtocol = allFeeToProtocol

        state.admin = admin
        state.factory = factory
        state.router = router
        state.storage = storageAddr
        state.pairHash = pairHash
        state.feeRecipient = feeRecipient
      } else {
        state.admin = ''
        state.factory = ''
        state.router = ''
        state.storage = ''
        state.pairHash = ''
        state.feeRecipient = ''
      }
    })
    .addCase(updateAppData, (state, action) => {
      const appData = action.payload
      if (appData) {
        Object.keys(appData).forEach((key: string) => {
          // @ts-ignore
          state[key] = appData[key]
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
