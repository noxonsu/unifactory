import React, { useState, useEffect } from 'react'
import { RiCloseFill } from 'react-icons/ri'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useAddPopup } from 'state/application/hooks'
import { useAppState } from 'state/application/hooks'
import styled from 'styled-components'
import { ButtonPrimary, CleanButton, ButtonError } from 'components/Button'
import Input from 'components/Input'
import InputPanel from 'components/InputPanel'
import Accordion from 'components/Accordion'
import { useTranslation } from 'react-i18next'
import { saveAppData } from 'utils/storage'
import { returnTokenInfo, isValidAddress } from 'utils/contract'
import { shortenAddress } from 'utils'
import { STORAGE_NETWORK_ID, STORAGE_NETWORK_NAME } from '../../constants'

const TokenRow = styled.div`
  margin: 0.2rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  background-color: ${({ theme }) => theme.green2};

  .address {
    display: flex;
    align-items: center;
  }
`

const RemoveButton = styled(CleanButton)`
  padding: 0.3rem;
`

const Button = styled(ButtonPrimary)`
  font-size: 0.8em;
  margin-top: 0.3rem;
`

const DeleteListButton = styled(ButtonError)`
  font-size: 0.8em;
  margin-top: 0.3rem;
`

const Row = styled.div`
  display: flex;
  gap: 0.3rem;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-wrap: wrap;
  `}
`

const makeListStructure = (chaniId: string, listId: string, list: { name: string; logoURI: string; tokens: any[] }) => {
  return JSON.stringify({
    chainId: chaniId,
    listId,
    name: list.name || '',
    logo: list.logoURI || '',
    tokens: list.tokens || [],
  })
}

type Props = {
  activeWeb3React: any
  isNewList: boolean
  pending: boolean
  setPending: (v: boolean) => void
  listChainId: string
  listId: string
  list: {
    name: string
    logoURI: string
    tokens: any[]
    timestamp?: string
    version?: {
      major: number
      minor: number
      patch: number
    }
  }
  deleteTokenList: (chainId: string, listId: string) => void
  switchToNetwork: (chainId: number) => void
}

export function TokenList(props: Props) {
  const {
    listChainId,
    listId,
    list,
    activeWeb3React,
    setPending,
    isNewList,
    deleteTokenList,
    switchToNetwork,
    pending,
  } = props
  const { library, chainId, account } = activeWeb3React
  const { t } = useTranslation()
  const addTransaction = useTransactionAdder()
  const addPopup = useAddPopup()
  const { tokenListsByChain: stateTokenListsByChain } = useAppState()

  const [sourceListStructure] = useState(makeListStructure(listChainId, listId, list))
  const [needToUpdate, setNeedToUpdate] = useState(false)
  const [tokenListChainId, setTokenListChainId] = useState(listChainId)
  const [tokenListId, setTokenListId] = useState(listId)
  const [tokenListName, setTokenListName] = useState(list.name || '')
  const [tokenListLogo, setTokenListLogo] = useState(list.logoURI || '')
  const [tokens, setTokens] = useState(list.tokens || [])
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [newTokenLogo, setNewTokenLogo] = useState('')
  const [tokenAddressIsCorrect, setTokenAddressIsCorrect] = useState(true)

  useEffect(() => {
    setTokenAddressIsCorrect(isValidAddress(newTokenAddress))
  }, [library, newTokenAddress])

  const addNewToken = async () => {
    const tokenInList = tokens.find((item: any) => item.address.toLowerCase() === newTokenAddress.toLowerCase())

    if (tokenInList) return

    setPending(true)

    const tokenInfo = await returnTokenInfo(tokenListChainId, newTokenAddress)

    if (tokenInfo) {
      const { name, symbol, decimals } = tokenInfo
      const token: {
        name: string
        symbol: string
        decimals: number
        address: string
        chainId: number
        logoURI?: string
      } = {
        name,
        symbol,
        decimals: Number(decimals),
        address: newTokenAddress,
        chainId: parseInt(tokenListChainId),
      }

      if (newTokenLogo) token.logoURI = newTokenLogo

      setTokens((oldTokens: any) => [...oldTokens, token])
      setNewTokenAddress('')
    } else {
      addPopup(
        {
          error: {
            message: 'Seems it is not a token or an address from a different network. Double check it',
          },
        },
        'wrongTokenAddressInAdminTokenList'
      )
    }

    setPending(false)
  }

  const removeToken = (address: string) => {
    const updatedList = tokens.filter(
      (item: { address: string }) => item.address.toLowerCase() !== address.toLowerCase()
    )

    setTokens(updatedList)
  }

  const [canSaveTokenList, setCanSaveTokenList] = useState(false)

  useEffect(() => {
    const currentStructure = makeListStructure(tokenListChainId, tokenListId, {
      name: tokenListName,
      logoURI: tokenListLogo,
      tokens,
    })

    const needToUpdate = isNewList || sourceListStructure !== currentStructure

    setNeedToUpdate(needToUpdate)
    setCanSaveTokenList(
      Boolean(
        chainId === STORAGE_NETWORK_ID &&
          tokenListChainId &&
          tokenListId &&
          tokenListName &&
          tokens.length &&
          needToUpdate
      )
    )
  }, [
    sourceListStructure,
    isNewList,
    chainId,
    tokenListChainId,
    tokenListId,
    tokenListName,
    tokens,
    list,
    listChainId,
    listId,
    tokenListLogo,
  ])

  const saveTokenList = async () => {
    setPending(true)

    try {
      await saveAppData({
        //@ts-ignore
        library,
        owner: account,
        data: {
          tokenList: {
            needToUpdate,
            oldChainId: listChainId,
            oldId: listId,
            oldName: list.name,
            chainId: tokenListChainId,
            id: tokenListId,
            name: tokenListName,
            logoURI: tokenListLogo,
            tokens,
          },
        },
        onHash: (hash: string) => {
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Token list is saved`,
            }
          )
        },
      })
    } catch (error) {
      addPopup({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }

    setPending(false)
  }

  const onDeleteList = () => deleteTokenList(tokenListChainId, tokenListId)

  return (
    <Accordion title={list.name} className={`${pending ? 'disabled' : ''}`}>
      <Input
        label={`${t('listNetworkId')} *`}
        questionHelper={t('listNetworkIdDescription')}
        value={tokenListChainId}
        onChange={setTokenListChainId}
      />
      <Input
        label={`${t('listId')} *`}
        questionHelper={t('listIdDescription')}
        value={tokenListId}
        onChange={setTokenListId}
      />
      <Input label={`${t('listName')} *`} value={tokenListName} onChange={setTokenListName} />
      <Input label={t('logo')} value={tokenListLogo} onChange={setTokenListLogo} />
      {tokens.length ? (
        <div>
          {tokens.map(({ name, symbol, address }: { name: string; symbol: string; address: string }, index: number) => (
            <TokenRow key={index}>
              <span>
                {name} <small>({symbol})</small>:
              </span>{' '}
              <div className="address">
                <span className="monospace">{shortenAddress(address)}</span>
                <RemoveButton type="button" onClick={() => removeToken(address)} title="Remove token">
                  <RiCloseFill />
                </RemoveButton>
              </div>
            </TokenRow>
          ))}
        </div>
      ) : (
        <p>{t('noTokens')}</p>
      )}
      <div key={newTokenAddress}>
        <InputPanel label={`${t('tokenAddress')} *`} value={newTokenAddress} onChange={setNewTokenAddress} />
        <InputPanel label={t('tokenLogo')} value={newTokenLogo} onChange={setNewTokenLogo} />

        <Button onClick={addNewToken} disabled={!(tokenAddressIsCorrect && tokenListChainId)}>
          {!tokenListChainId ? (
            t('fillTokenListChainId')
          ) : !tokenAddressIsCorrect ? (
            t('enterValidTokenAddress')
          ) : (
            <span>
              {t('add')} {t('token')}
            </span>
          )}
        </Button>
      </div>

      {chainId !== STORAGE_NETWORK_ID ? (
        <Button onClick={() => switchToNetwork(STORAGE_NETWORK_ID)}>
          {t('switchToNetwork', { network: STORAGE_NETWORK_NAME })}
        </Button>
      ) : (
        <Row>
          <Button onClick={saveTokenList} disabled={!canSaveTokenList}>
            {isNewList ? t('saveTokenList') : t('updateTokenList')}
          </Button>
          {/* we don't add new lists in the state until they are saved with transaction
            so if they're there it means the user has saved them and we can delete it
          */}
          {!!stateTokenListsByChain[listChainId]?.[listId] && (
            <DeleteListButton onClick={onDeleteList} error>
              {t('deleteTokenList')}
            </DeleteListButton>
          )}
        </Row>
      )}
    </Accordion>
  )
}
