import { FlattenSimpleInterpolation, ThemedCssFunction } from 'styled-components'

export type Color = string
export interface Colors {
  white: Color
  black: Color

  text1: Color
  text2: Color
  text3: Color
  text4: Color
  text5: Color

  bg1: Color
  bg2: Color
  bg3: Color
  bg4: Color
  bg5: Color

  modalBG: Color
  advancedBG: Color

  primary1: Color
  primary2: Color
  primary3: Color
  primary4: Color
  primary5: Color

  primaryText1: Color

  red1: Color
  red1Soft: Color
  red2: Color
  red3: Color
  green1: Color
  green1Soft: Color
  green2: Color
  yellow1: Color
  yellow2: Color
  yellow3: Color
  blue1: Color
  blue2: Color
  blue2Soft: Color
  white1: Color
}

export interface Grids {
  sm: number
  md: number
  lg: number
}

declare module 'styled-components' {
  export interface DefaultTheme extends Colors {
    grids: Grids

    // shadows
    shadow1: string

    // media queries
    mediaWidth: {
      upToExtraSmall: ThemedCssFunction<DefaultTheme>
      upToSmall: ThemedCssFunction<DefaultTheme>
      upToMedium: ThemedCssFunction<DefaultTheme>
      upToLarge: ThemedCssFunction<DefaultTheme>
      laptop: ThemedCssFunction<DefaultTheme>
      tabletL: ThemedCssFunction<DefaultTheme>
      tabletM: ThemedCssFunction<DefaultTheme>
      mobileL: ThemedCssFunction<DefaultTheme>
      mobileM: ThemedCssFunction<DefaultTheme>
      mobileS: ThemedCssFunction<DefaultTheme>
    }

    // css snippets
    flexColumnNoWrap: FlattenSimpleInterpolation
    flexRowNoWrap: FlattenSimpleInterpolation
  }
}
