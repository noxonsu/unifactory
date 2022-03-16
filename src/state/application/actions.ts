import { createAction } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { StorageState } from './reducer'

export type PopupContent =
  | {
      error: {
        message: string
        code?: number | string
      }
    }
  | {
      txn: {
        hash: string
        success: boolean
        summary?: string
      }
    }
  | {
      listUpdate: {
        listUrl: string
        oldList: TokenList
        newList: TokenList
        auto: boolean
      }
    }

export enum ApplicationModal {
  WALLET,
  SETTINGS,
  SELF_CLAIM,
  ADDRESS_CLAIM,
  CLAIM_POPUP,
  MENU,
  DELEGATE,
  VOTE,
  LANGUAGE,
}

export const setAppManagement = createAction<{ status: boolean }>('application/setAppManagement')

export const retrieveDomainData = createAction<null | StorageState>('application/retrieveDomainData')

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('application/updateBlockNumber')

export const updateActivePools = createAction<{ pools: any[] }>('aplication/updateActivePools')

export const setOpenModal = createAction<ApplicationModal | null>('application/setOpenModal')

export const addPopup =
  createAction<{ key?: string; removeAfterMs?: number | null; content: PopupContent }>('application/addPopup')

export const removePopup = createAction<{ key: string }>('application/removePopup')
