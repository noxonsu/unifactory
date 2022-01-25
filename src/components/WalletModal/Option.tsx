import React from 'react'
import styled from 'styled-components'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { ExternalLink } from 'theme'
import { useIsDarkMode } from 'state/user/hooks'

const InfoCard = styled.button<{ active?: boolean }>`
  background-color: ${({ theme, active }) => (active ? theme.bg3 : theme.bg2)};
  padding: 1rem;
  outline: none;
  border-radius: 1rem;
  width: 100%;
  min-width: 7rem;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: 6rem;
  `};

  ${({ theme }) => theme.mediaWidth.mobileS`
    min-width: 5rem;
  `};
`

const OptionCard = styled(InfoCard as any)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0.4rem;
  padding: 0.6rem;
`

const OptionCardClickable = styled(OptionCard as any)<{
  clickable?: boolean
  color?: string
  widthPercent?: number
  isDark: boolean
}>`
  position: relative;
  width: ${({ widthPercent }) => widthPercent}%;
  border: 1px solid transparent;

  ${({ isDark, theme }) => `background-color: ${isDark ? theme.bg3 : theme.bg1};`}

  &:hover {
    ${({ color, clickable }) =>
      clickable ? (color ? `border-color: ${color}; cursor: pointer;` : 'cursor: pointer;') : ''};
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  transition: 0.1s;

  ${({ theme, widthPercent }) => theme.mediaWidth.upToExtraSmall`
    width: ${widthPercent - widthPercent / 4}%;
  `};

  ${({ theme }) => theme.mediaWidth.mobileS`
    width: 40%;
  `};
`

const CheckMarkWrapper = styled.div`
  position: absolute;
  top: 7%;
  left: 7%;
  border-radius: 50%;
  width: 1.4rem;
  height: 1.4rem;
  background-color: ${({ theme }) => theme.green1};
  color: ${({ theme }) => theme.white1};
`

const Text = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.primary1 : ({ theme }) => theme.text1)};
  font-size: 0.7rem;
  line-height: 1.2rem;
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 0.6rem;
  `};

  ${({ theme }) => theme.mediaWidth.mobileS`
    font-size: 0.54rem;
  `};
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.text1};
  margin-top: 10px;
  font-size: 12px;
`

const IconWrapper = styled.div<{ size?: number | null }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  margin-bottom: 0.4rem;
  align-items: center;
  justify-content: center;

  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '24px')};
    width: ${({ size }) => (size ? size + 'px' : '24px')};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};

  ${({ theme, size }) => theme.mediaWidth.upToExtraSmall`
    & > img,
    span {
      height: ${size ? size - size / 4 + 'px' : '18px'};
      width: ${size ? size - size / 4 + 'px' : '18px'};
    }
  `};

  ${({ theme, size }) => theme.mediaWidth.mobileS`
    & > img,
    span {
      height: ${size ? size - size / 3 + 'px' : '16px'};
      width: ${size ? size - size / 3 + 'px' : '16px'};
    }
  `};
`

export default function Option({
  link = null,
  clickable = true,
  size,
  onClick = null,
  color,
  widthPercent = 17,
  header,
  subheader = null,
  icon,
  active = false,
  id,
}: {
  link?: string | null
  clickable?: boolean
  size?: number | null
  onClick?: null | (() => void)
  color: string
  widthPercent?: number
  header: React.ReactNode
  subheader: React.ReactNode | null
  icon: string
  active?: boolean
  id: string
}) {
  const isDark = useIsDarkMode()

  const content = (
    <OptionCardClickable
      isDark={isDark}
      id={id}
      onClick={onClick}
      clickable={clickable && !active}
      active={active}
      color={color}
      widthPercent={widthPercent}
    >
      {active && (
        <CheckMarkWrapper>
          <IoIosCheckmarkCircleOutline size="100%" />
        </CheckMarkWrapper>
      )}

      <IconWrapper size={size}>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <Text>{header}</Text>
      {subheader && <SubHeader>{subheader}</SubHeader>}
    </OptionCardClickable>
  )
  if (link) {
    return <ExternalLink href={link}>{content}</ExternalLink>
  }

  return content
}
