import { TokenList } from '@uniswap/token-lists'
import ajv, { Ajv } from 'ajv'
import tokenListSchema from '@uniswap/token-lists/src/tokenlist.schema.json'
import contenthashToUri from './contenthashToUri'
import { parseENSAddress } from './parseENSAddress'
import uriToHttp from './uriToHttp'

enum ValidationSchema {
  LIST = 'list',
  TOKENS = 'tokens',
}

const validator = new Promise<Ajv>(async (resolve) => {
  const validator = new ajv({ allErrors: false, verbose: true, validateSchema: 'log' })
    .addSchema(tokenListSchema, ValidationSchema.LIST)
    // Adds a meta scheme of Pick<TokenList, 'tokens'>
    .addSchema(
      {
        ...tokenListSchema,
        $id: tokenListSchema.$id + '#tokens',
        required: ['tokens'],
      },
      ValidationSchema.TOKENS
    )

  resolve(validator)
})

export async function validatedTokenList(json: TokenList): Promise<TokenList | void> {
  const validate = (await validator).getSchema(ValidationSchema.LIST)
  const result = validate?.(json)

  if (result) return json

  console.group('%c Token list failed validation', 'background: brown; color: yellow;')
  console.log('json', json)
  console.log('result', result)
  console.groupEnd()
}

export function returnValidList(json: TokenList) {
  try {
    if (validatedTokenList(json) instanceof Error) {
      console.error(new Error(`Token list failed validation: ${json?.name}`))
      return false
    }
  } catch (error) {
    console.error(error)
    return false
  }

  return json
}

/**
 * Contains the logic for resolving a list URL to a validated token list
 * @param listUrl list url
 * @param resolveENSContentHash resolves an ens name to a contenthash
 */
export default async function getTokenList(
  listUrl: string,
  resolveENSContentHash: (ensName: string) => Promise<string>
): Promise<TokenList> {
  const parsedENS = parseENSAddress(listUrl)
  let urls: string[]

  if (parsedENS) {
    let contentHashUri

    try {
      contentHashUri = await resolveENSContentHash(parsedENS.ensName)
    } catch (error) {
      console.debug(`Failed to resolve ENS name: ${parsedENS.ensName}`, error)
      throw new Error(`Failed to resolve ENS name: ${parsedENS.ensName}`)
    }

    let translatedUri

    try {
      translatedUri = contenthashToUri(contentHashUri)
    } catch (error) {
      console.debug('Failed to translate contenthash to URI', contentHashUri)
      throw new Error(`Failed to translate contenthash to URI: ${contentHashUri}`)
    }
    urls = uriToHttp(`${translatedUri}${parsedENS.ensPath ?? ''}`)
  } else {
    urls = uriToHttp(listUrl)
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const isLast = i === urls.length - 1
    let response

    try {
      response = await fetch(url)
    } catch (error) {
      console.debug('Failed to fetch list', listUrl, error)
      if (isLast) throw new Error(`Failed to download list ${listUrl}`)
      continue
    }

    if (!response.ok) {
      if (isLast) throw new Error(`Failed to download list ${listUrl}`)
      continue
    }

    const json = await response.json()
    const list = returnValidList(json)

    if (!list) {
      throw new Error(`Token list failed validation`)
    }

    return list
  }
  throw new Error('Unrecognized list URL protocol.')
}
