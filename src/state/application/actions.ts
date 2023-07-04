import { createAction } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { Trade } from 'sdk'
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
        trade?: Trade
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

export type StorageKeys = keyof StorageState

export const setAppManagement = createAction<{ status: boolean }>('application/setAppManagement')

export const retrieveDomainData = createAction<null | StorageState>('application/retrieveDomainData')

export const updateAppOptions =
  createAction<{ key: StorageKeys; value: StorageState[StorageKeys] }[]>('application/updateAppOptions')

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('application/updateBlockNumber')

export const setOpenModal = createAction<ApplicationModal | null>('application/setOpenModal')

export const addPopup =
  createAction<{ key?: string; removeAfterMs?: number | null; content: PopupContent }>('application/addPopup')

export const removePopup = createAction<{ key: string }>('application/removePopup')
