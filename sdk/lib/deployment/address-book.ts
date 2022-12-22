import fs from 'fs'
import { assertObject } from './utils'

export interface AddressBook {
  listEntries: () => Array<string>
  getEntry: (contractName: string) => AddressBookEntry
  setEntry: (contractName: string, entry: AddressBookEntry) => void
  json: AddressBookJson
}

export type AddressBookEntry = {
  address: string
  constructorArgs?: Array<string>
  initArgs?: Array<string>
  creationCodeHash?: string
  runtimeCodeHash?: string
  txHash?: string
  proxy?: boolean
  implementation?: AddressBookEntry
  libraries?: { [libraryName: string]: string }
}

// JSON format:
// {
//   "ChainId": {
//     "ContractName": {}
//     ...
//    }
// }
export type AddressBookJson<
  ChainId extends string = string,
  ContractName extends string = string,
> = Record<ChainId, Record<ContractName, AddressBookEntry>>

export const getAddressBook = (path: string, chainId: string | number): AddressBook => {
  if (!path) throw new Error(`A path to the address book file is required.`)
  if (!fs.existsSync(path)) throw new Error(`Address book path provided does not exist!`)

  if (typeof chainId === 'number') chainId = chainId.toString()
  if (!chainId) throw new Error(`A chainId is required.`)

  const addressBook = JSON.parse(fs.readFileSync(path, 'utf8') || '{}')
  assertAddressBookJson(addressBook)

  if (!addressBook[chainId]) {
    addressBook[chainId] = {}
  }

  const listEntries = (): Array<string> => {
    return Object.keys(addressBook[chainId])
  }

  const getEntry = (contractName: string): AddressBookEntry => {
    try {
      return addressBook[chainId][contractName]
    } catch (e) {
      return { address: '0x0000000000000000000000000000000000000000' } // Don't use ethers.constants.AddressZero to avoid costly import
    }
  }

  const setEntry = (contractName: string, entry: AddressBookEntry): void => {
    addressBook[chainId][contractName] = entry
    try {
      fs.writeFileSync(path, JSON.stringify(addressBook, null, 2))
    } catch (e) {
      console.log(`Error saving artifacts: ${e.message}`)
    }
  }

  return {
    listEntries,
    getEntry,
    setEntry,
    json: addressBook,
  }
}

// Type assertions
function assertAddressBookJson(json: unknown): asserts json is AddressBookJson {
  assertObject(json)

  for (const chainId of Object.keys(json)) {
    const contractList = json[chainId]
    assertObject(contractList)

    const contractNames = Object.keys(contractList)
    for (const contractName of contractNames) {
      assertAddressBookEntry(contractList[contractName])
    }
  }
}

function assertAddressBookEntry(json: unknown): asserts json is AddressBookEntry {
  assertObject(json)

  if (typeof json.address !== 'string') throw new Error('Invalid address')
  if (json.constructorArgs && !Array.isArray(json.constructorArgs))
    throw new Error('Invalid constructorArgs')
  if (json.initArgs && !Array.isArray(json.initArgs)) throw new Error('Invalid initArgs')
  if (json.creationCodeHash && typeof json.creationCodeHash !== 'string')
    throw new Error('Invalid creationCodeHash')
  if (json.runtimeCodeHash && typeof json.runtimeCodeHash !== 'string')
    throw new Error('Invalid runtimeCodeHash')
  if (json.txHash && typeof json.txHash !== 'string') throw new Error('Invalid txHash')
  if (json.proxy && typeof json.proxy !== 'boolean') throw new Error('Invalid proxy')
  if (json.implementation && typeof json.implementation !== 'object')
    throw new Error('Invalid implementation')
  if (json.libraries && typeof json.libraries !== 'object') throw new Error('Invalid libraries')
}
