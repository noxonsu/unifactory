import React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import TempLogo from 'assets/images/templogo.png'
import { RiArrowRightUpLine } from 'react-icons/ri'
import { useActiveWeb3React } from 'hooks'
import { useAppState } from 'state/application/hooks'
import Menu from '../Menu'
import { LightCard } from '../Card'
// import { CURRENCY } from 'assets/images'
import Row, { RowFixed } from '../Row'
import Web3Status from '../Web3Status'
import networks from 'networks.json'

const HeaderFrame = styled.header`
  width: 100vw;
  margin: 0.4rem auto;
  padding: 0.4rem 1.6rem;
  z-index: 2;
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 60px 1fr 120px;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 60px 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0.5rem 1rem;
  `}
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row-reverse;
    align-items: center;
  `};
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;
`

const HeaderRow = styled(RowFixed)`
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`

const NavlLinks = styled(Row)`
  width: auto;
  margin: 0 auto;
  padding: 0.3rem;
  flex-wrap: wrap;
  justify-content: center;
  border-radius: 0.8rem;
  box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px, rgba(0, 0, 0, 0.04) 0px 16px 24px,
    rgba(0, 0, 0, 0.01) 0px 24px 32px;
  background-color: ${({ theme }) => theme.bg1};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin: 0;
    margin-left: 4%;
    margin-right: auto;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    position: fixed;
    margin-left: 0;
    bottom: 0;
    padding: 0.6rem;
    width: 100%;
    left: 0%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  `};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg2)};
  border-radius: 0.7rem;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;
  box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px, rgba(0, 0, 0, 0.04) 0px 16px 24px,
    rgba(0, 0, 0, 0.01) 0px 24px 32px;

  :focus {
    border: 1px solid blue;
  }
`

const HideSmall = styled.div`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const NetworkCard = styled(LightCard)`
  border-radius: 0.7rem;
  padding: 8px 12px;
  box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px, rgba(0, 0, 0, 0.04) 0px 16px 24px,
    rgba(0, 0, 0, 0.01) 0px 24px 32px;
  word-break: keep-all;
  white-space: nowrap;
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};

  img {
    max-width: 1.2rem;
    margin-right: 1%;
  }
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const Icon = styled.div`
  width: 4rem;
  transition: transform 0.2s ease;
  :hover {
    transform: scale(1.1);
  }
`

const LogoImage = styled.img`
  width: 100%;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 0.9rem;
  width: fit-content;
  padding: 0.3rem 0.6rem;
  font-weight: 500;
  transition: 0.12s;

  &:not(:last-child) {
    margin-right: 0.16rem;
  }

  &:hover {
    color: ${({ theme }) => theme.text1};
  }

  &.${activeClassName} {
    color: ${({ theme }) => theme.white1};
    background-color: ${({ theme }) => theme.primary2};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 10rem;
    width: 100%;
    margin: .1rem;
    padding: 0.4rem 6%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${({ theme }) => theme.bg3};
    font-size: 1.1em;
  `};
`

const StyledExternalLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  font-size: 0.9rem;
  border-radius: 12px;
  width: fit-content;
  padding: 0.3rem 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
  transition: 0.2s;
  word-break: keep-all;
  white-space: nowrap;

  &:not(:last-child) {
    margin-right: 0.14rem;
  }

  &:hover {
    color: ${({ theme }) => theme.text1};
  }

  .name {
    margin-right: 0.1rem;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 10rem;
    width: 100%;
    margin: .1rem;
    padding: 0.4rem 6%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${({ theme }) => theme.bg3};
    font-size: 1.1em;
  `};
`

export default function Header() {
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()
  const { logo: logoUrl, navigationLinks } = useAppState()

  return (
    <HeaderFrame>
      <HeaderRow>
        <Title href=".">
          <Icon>
            <LogoImage src={logoUrl || TempLogo} alt="logo" />
          </Icon>
        </Title>
      </HeaderRow>

      <NavlLinks>
        <StyledNavLink id="header-swap-nav-link" to={'/swap'}>
          {t('swap')}
        </StyledNavLink>
        <StyledNavLink
          id="header-pool-nav-link"
          to="/pool"
          isActive={(match, { pathname }) =>
            Boolean(match) ||
            pathname.startsWith('/add') ||
            pathname.startsWith('/remove') ||
            pathname.startsWith('/create') ||
            pathname.startsWith('/find')
          }
        >
          {t('pool')}
        </StyledNavLink>

        {Boolean(navigationLinks.length) &&
          navigationLinks.map((item: { source: string; name: string }, index) => (
            <StyledExternalLink href={item.source} key={index} target="_blank">
              <span className="name">{item.name}</span> <RiArrowRightUpLine />
            </StyledExternalLink>
          ))}
      </NavlLinks>

      <HeaderControls>
        <HeaderElement>
          <HideSmall>
            {/* @ts-ignore */}
            {chainId && networks[chainId]?.name && (
              // @ts-ignore
              <NetworkCard title={`${networks[chainId].name} network`}>
                {/* TOOD: fix element styles to correctly display network image */}
                {/* @ts-ignore */}
                {/* {!!CURRENCY[chainId] && <img src={CURRENCY[chainId]} alt="network logo" />} */}
                {/* @ts-ignore */}
                {networks[chainId].name}
              </NetworkCard>
            )}
          </HideSmall>
          <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            <Web3Status />
          </AccountElement>
        </HeaderElement>

        <HeaderElementWrap>
          <Menu />
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}
