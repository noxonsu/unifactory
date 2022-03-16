import React, { useState, useEffect } from 'react'
import { RiCloseFill } from 'react-icons/ri'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useAddPopup } from 'state/application/hooks'
import styled from 'styled-components'
import { ButtonPrimary, CleanButton } from 'components/Button'
import Input from 'components/Input'
import InputPanel from 'components/InputPanel'
import { useTranslation } from 'react-i18next'
import { saveProjectOption } from 'utils/storage'
import { returnTokenInfo, isValidAddress } from 'utils/contract'
import { storageMethods } from '../../constants'
import { shortenAddress } from 'utils'
import Accordion from 'components/Accordion'

const TokenRow = styled.div`
  margin: 0.2rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.bg3};

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

export function TokenList(props: {
  activeWeb3React: any
  isNewList: boolean
  pending: boolean
  setPending: (x: any) => void
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
}) {
  const { list, activeWeb3React, setPending, isNewList } = props
  const { library, chainId } = activeWeb3React
  const { t } = useTranslation()
  const addTransaction = useTransactionAdder()
  const addPopup = useAddPopup()

  const [tokenListName, setTokenListName] = useState(list.name || '')
  const [tokenListLogo, setTokenListLogo] = useState(list.logoURI || '')
  const [tokens, setTokens] = useState(list.tokens || [])
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [newTokenLogo, setNewTokenLogo] = useState('')
  const [tokenAddressIsCorrect, setTokenAddressIsCorrect] = useState(true)

  useEffect(() => {
    setTokenAddressIsCorrect(isValidAddress(library, newTokenAddress))
  }, [library, newTokenAddress])

  const addNewToken = async () => {
    const tokenInList = tokens.find((item: any) => item.address.toLowerCase() === newTokenAddress.toLowerCase())

    if (tokenInList) return

    setPending(true)

    const tokenInfo = await returnTokenInfo(library, newTokenAddress)

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
        chainId,
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
    const updatedList = tokens.filter((item: any) => item.address.toLowerCase() !== address.toLowerCase())

    setTokens(updatedList)
  }

  const saveTokenList = async () => {
    setPending(true)

    try {
      await saveProjectOption({
        library,
        method: isNewList ? storageMethods.addTokenList : storageMethods.updateTokenList,
        value: {
          oldName: list.name,
          name: tokenListName,
          logoURI: tokenListLogo,
          tokens,
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

  return (
    <Accordion title={list.name}>
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
        <Button onClick={addNewToken} disabled={!tokenAddressIsCorrect}>
          {t('add')} {t('token')}
        </Button>
      </div>

      <div>
        <Button onClick={saveTokenList} disabled={!tokenListName || !tokens.length}>
          {isNewList ? t('saveTokenList') : t('updateTokenList')}
        </Button>
      </div>
    </Accordion>
  )
}
