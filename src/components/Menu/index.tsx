import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { IoIosReturnLeft } from 'react-icons/io'
import { HiOutlineSun, HiMoon } from 'react-icons/hi'
import { MdLanguage } from 'react-icons/md'
import { RiArrowRightUpLine } from 'react-icons/ri'
import i18n, { availableLanguages, LANG_NAME } from '../../i18n'
import { ReactComponent as MenuIcon } from 'assets/images/menu.svg'
import { useDarkModeManager } from 'state/user/hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ApplicationModal, setAppManagement } from 'state/application/actions'
import { useModalOpen, useToggleModal, useAppState } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { useActiveWeb3React } from 'hooks'
import useWordpressInfo from 'hooks/useWordpressInfo'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

export const StyledMenuButton = styled.button`
  width: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg1};
  transition: 0.2s;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;
  box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px, rgba(0, 0, 0, 0.04) 0px 16px 24px,
    rgba(0, 0, 0, 0.01) 0px 24px 32px;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.bg1};
  transition: 0.2s;
`

const MenuFlyout = styled.span`
  min-width: 8.6rem;
  background-color: ${({ theme }) => theme.bg1};
  border-radius: 0.5rem;
  box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px, rgba(0, 0, 0, 0.04) 0px 16px 24px,
    rgba(0, 0, 0, 0.01) 0px 24px 32px;
  padding: 0.6rem 0.9rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  right: 0rem;
  z-index: 100;
  transition: 0.2s;
`

const MenuButton = styled.span`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding: 0 0 0.6rem;
  color: ${({ theme }) => theme.text2};
  word-break: keep-all;
  white-space: nowrap;
  font-size: 0.9em;
  transition: 0.2s;

  :last-child {
    padding-bottom: 0;
  }

  :hover,
  :focus {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
`

const MenuItem = styled(ExternalLink)`
  cursor: pointer;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 0.6rem;
  color: ${({ theme }) => theme.text2};
  word-break: keep-all;
  white-space: nowrap;
  font-size: 0.9em;
  transition: 0.2s;
  text-decoration: none;

  :last-child {
    padding-bottom: 0;
  }

  :hover,
  :focus {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
`

const IconWrapper = styled.span`
  width: 0.8rem;
  margin-left: 0.6rem;
`

const Title = styled.h4`
  margin: 0.3rem 0 0.8rem;
  font-weight: 500;
`

export const ClickableMenuItem = styled.a<{ active: boolean }>`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  transition: 0.2s;

  :hover,
  :focus {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }

  > svg {
    margin-right: 8px;
  }
`

const ReturnButton = styled.button`
  padding: 0 0 0 0.4rem;
  border: none;
  text-align: left;
  font-size: 1.4rem;
  background-color: transparent;
  color: ${({ theme }) => theme.text1};

  :hover,
  :focus {
    cursor: pointer;
  }
`

function LanguageMenu({ close }: { close: () => void }) {
  return (
    <MenuFlyout>
      <ReturnButton onClick={close}>
        <IoIosReturnLeft size="" />
      </ReturnButton>

      {availableLanguages.map((lang) => (
        <ClickableMenuItem active={i18n.language === lang} key={lang} onClick={() => i18n.changeLanguage(lang)}>
          {LANG_NAME[lang] || lang.toUpperCase()}
        </ClickableMenuItem>
      ))}
    </MenuFlyout>
  )
}

export default function Menu() {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  const wordpressInfo = useWordpressInfo()
  const { admin, menuLinks } = useAppState()
  const dispatch = useDispatch()

  const [isAdmin, setIsAdmin] = useState<boolean>(account?.toLowerCase() === admin?.toLowerCase())

  useEffect(() => {
    setIsAdmin(
      account?.toLowerCase() === (wordpressInfo?.wpAdmin ? wordpressInfo.wpAdmin.toLowerCase() : admin?.toLowerCase())
    )
  }, [wordpressInfo, account, admin])

  const openSettings = () => {
    dispatch(setAppManagement({ status: true }))
  }

  const node = useRef<HTMLDivElement>()
  const [menu, setMenu] = useState<'main' | 'lang'>('main')
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  const [darkMode, toggleDarkMode] = useDarkModeManager()

  useEffect(() => setMenu('main'), [open])
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle}>
        <StyledMenuIcon />
      </StyledMenuButton>

      {open && (
        <>
          {menu === 'lang' ? (
            <LanguageMenu close={() => setMenu('main')} />
          ) : (
            <MenuFlyout>
              <Title>{t('settings')}</Title>
              <MenuButton onClick={toggleDarkMode}>
                {darkMode ? (
                  <>
                    {t('lightTheme')}
                    <IconWrapper>
                      <HiOutlineSun size="100%" />
                    </IconWrapper>
                  </>
                ) : (
                  <>
                    {t('darkTheme')}
                    <IconWrapper>
                      <HiMoon size="100%" />
                    </IconWrapper>
                  </>
                )}
              </MenuButton>
              <MenuButton onClick={() => setMenu('lang')}>
                {t('language')}
                <IconWrapper>
                  <MdLanguage size="100%" />
                </IconWrapper>
              </MenuButton>

              {Boolean(menuLinks?.length) &&
                menuLinks.map((item: { source: string; name: string }, index: number) => (
                  <MenuItem key={index} href={item.source} target="_blank">
                    {item.name} <RiArrowRightUpLine />
                  </MenuItem>
                ))}

              {isAdmin && <MenuButton onClick={openSettings}>{t('manage')}</MenuButton>}
            </MenuFlyout>
          )}
        </>
      )}
    </StyledMenu>
  )
}
