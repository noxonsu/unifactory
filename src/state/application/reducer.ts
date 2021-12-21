import { createReducer, nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { returnValidList } from 'utils/getTokenList'
import { ZERO_ADDRESS } from 'sdk'
import {
  setAppManagement,
  retrieveDomainData,
  updateAppData,
  addPopup,
  PopupContent,
  removePopup,
  updateBlockNumber,
  ApplicationModal,
  setOpenModal,
} from './actions'

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  readonly appManagement: boolean
  readonly admin: string
  readonly factory: string
  readonly router: string
  readonly storage: string
  readonly domain: string
  readonly projectName: string
  readonly brandColor: string
  readonly logo: string
  readonly tokenLists: TokenList[]
  readonly socialLinks: string[]
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
  domain: '',
  projectName: '',
  brandColor: '',
  logo: '',
  tokenLists: [],
  socialLinks: [],
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
      let { admin = '', factory = '', router = '', storage = '' } = action.payload

      if (admin === ZERO_ADDRESS) admin = ''
      if (factory === ZERO_ADDRESS) factory = ''
      if (router === ZERO_ADDRESS) router = ''
      if (storage === ZERO_ADDRESS) storage = ''

      state.admin = admin
      state.factory = factory
      state.router = router
      state.storage = storage
    })
    .addCase(updateAppData, (state, action) => {
      const { domain, projectName, brandColor, logo, tokenLists, socialLinks } = action.payload
      const validLists: any = []

      if (tokenLists.length) {
        validLists.push(
          ...tokenLists
            .filter((strJson) => {
              try {
                const list = JSON.parse(strJson)

                list.tokens = list.tokens.map((token: any) => {
                  return {
                    ...token,
                    // some value(s) has to be other types (for now it's only int decimals)
                    // but JSON allows only strings
                    decimals: Number(token.decimals),
                  }
                })

                return returnValidList(list)
              } catch (error) {
                console.error(error)
                return false
              }
            })
            .map((strJson) => JSON.parse(strJson))
        )
      }

      state.domain = domain
      state.projectName = projectName
      state.brandColor = brandColor
      state.logo = logo
      state.tokenLists = validLists

      if (socialLinks.length) {
        state.socialLinks = socialLinks
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
