import React from 'react'
import styled from 'styled-components'
import validUrl from 'valid-url'
import { useAppState } from 'state/application/hooks'
import Polling from '../Header/Polling'
import { TiSocialInstagram } from 'react-icons/ti'
import { FaTelegramPlane } from 'react-icons/fa'
import { BsQuestionCircle } from 'react-icons/bs'
import { SiTwitter } from 'react-icons/si'
import { AiOutlineYoutube } from 'react-icons/ai'
import { BsFacebook, BsGithub, BsDiscord, BsMedium, BsReddit, BsLinkedin, BsLightningChargeFill } from 'react-icons/bs'

const FooterWrapper = styled.div`
  padding: 0.3rem;
  font-size: 0.9em;
  color: ${({ theme }) => theme.text2};

  // add padding when internal links are in the bottom position
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-bottom: 3.6rem;
  `};
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const Copyright = styled.p`
  margin: 1rem 0;
`

const SocialLinksWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
`

const SocialLink = styled.a`
  font-size: 1.6em;
  color: ${({ theme }) => theme.primary3};
  transition: 0.2s;

  & + & {
    margin-left: 17%;
  }

  :hover {
    opacity: 0.7;
  }
`

const returnIconByUri = (uri: string) => {
  const lowerUri = uri.toLowerCase()
  let icon = <BsQuestionCircle title={uri} />

  if (uri.length) {
    if (lowerUri.match(/twitter/)) icon = <SiTwitter title="Twitter" />
    if (lowerUri.match(/instagram/)) icon = <TiSocialInstagram title="Instagram" />
    if (lowerUri.match(/t\.me/)) icon = <FaTelegramPlane title="Telegram" />
    if (lowerUri.match(/youtube/)) icon = <AiOutlineYoutube title="Youtube" />
    if (lowerUri.match(/facebook/)) icon = <BsFacebook title="Facebook" />
    if (lowerUri.match(/github/)) icon = <BsGithub title="Github" />
    if (lowerUri.match(/discord/)) icon = <BsDiscord title="Discord" />
    if (lowerUri.match(/medium/)) icon = <BsMedium title="Medium" />
    if (lowerUri.match(/reddit/)) icon = <BsReddit title="Reddit" />
    if (lowerUri.match(/linkedin/)) icon = <BsLinkedin title="Linkedin" />
    if (lowerUri.match(/snapshot/)) icon = <BsLightningChargeFill title="Snapshot" />
  }

  return icon
}

export default function Footer() {
  const { projectName, socialLinks } = useAppState()

  const year = new Date().getFullYear()
  const copyright = `© ${projectName} ${year}`

  return (
    <FooterWrapper>
      <Content>
        {projectName && <Copyright>{copyright}</Copyright>}

        {socialLinks.length ? (
          <SocialLinksWrapper>
            {socialLinks.map((link: string, index: number) => {
              if (validUrl.isUri(link)) {
                return (
                  <SocialLink key={index} href={link} target="_blank">
                    {returnIconByUri(link)}
                  </SocialLink>
                )
              }

              return null
            })}
          </SocialLinksWrapper>
        ) : null}
      </Content>

      <Polling />
    </FooterWrapper>
  )
}
