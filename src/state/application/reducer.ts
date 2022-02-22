import isNumber from 'is-number'
import { createReducer, nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { ZERO_ADDRESS } from 'sdk'
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

export type DomainState = {
  admin: string
  factory: string
  router: string
  storage: string
  pairHash: string
  feeRecipient: string
  protocolFee?: number
  totalFee?: number
  allFeeToProtocol?: boolean
  possibleProtocolPercent?: number[]
  totalSwaps: number | undefined
}

export type StorageState = null | {
  readonly domain: string
  readonly projectName: string
  readonly brandColor: string
  readonly logo: string
  readonly tokenLists: TokenList[]
  readonly navigationLinks: { name: string; source: string }[]
  readonly menuLinks: { name: string; source: string }[]
  readonly socialLinks: string[]
  readonly addressesOfTokenLists: string[]
  readonly disableSourceCopyright: boolean
}

export type DomainData = DomainState & StorageState

export type ApplicationState = DomainData & {
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

      if (data) {
        let {
          admin = '',
          factory = '',
          router = '',
          storage = '',
          pairHash = '',
          feeRecipient = '',
          protocolFee,
          totalFee,
          allFeeToProtocol,
          possibleProtocolPercent,
          totalSwaps,
          domain,
          projectName,
          brandColor,
          logo,
          tokenLists,
          navigationLinks,
          menuLinks,
          socialLinks,
          addressesOfTokenLists,
          disableSourceCopyright,
        } = data

        if (admin === ZERO_ADDRESS) admin = ''
        if (factory === ZERO_ADDRESS) factory = ''
        if (router === ZERO_ADDRESS) router = ''
        if (storage === ZERO_ADDRESS) storage = ''
        if (feeRecipient === ZERO_ADDRESS) feeRecipient = ''
        if (possibleProtocolPercent?.length)
          state.possibleProtocolPercent = possibleProtocolPercent.map((percent) => Number(percent))
        if (isNumber(protocolFee)) state.protocolFee = Number(protocolFee)
        if (isNumber(totalFee)) state.totalFee = Number(totalFee)
        if (isNumber(totalSwaps)) state.totalSwaps = Number(totalSwaps)
        if (typeof allFeeToProtocol === 'boolean') state.allFeeToProtocol = allFeeToProtocol
        if (tokenLists.length) state.tokenLists = tokenLists
        if (navigationLinks.length) state.navigationLinks = navigationLinks
        if (menuLinks.length) state.menuLinks = menuLinks
        if (socialLinks.length) state.socialLinks = socialLinks
        if (addressesOfTokenLists.length) state.addressesOfTokenLists = addressesOfTokenLists

        state.admin = admin
        state.factory = factory
        state.router = router
        state.storage = storage
        state.pairHash = pairHash
        state.feeRecipient = feeRecipient
        state.domain = domain
        state.projectName = projectName
        state.brandColor = brandColor
        state.logo = logo
        state.disableSourceCopyright = disableSourceCopyright || false
      } else {
        state.admin = ''
        state.factory = ''
        state.router = ''
        state.storage = ''
        state.pairHash = ''
        state.feeRecipient = ''
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
