import fs from 'fs'
import lodash from 'lodash'
import { Contract, ContractFunction, ContractReceipt, ContractTransaction, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'

// Returns a contract connect function that wrapps contract calls with wrapCalls
export function getWrappedConnect(
  contract: Contract,
  contractName: string,
): (signerOrProvider: string | Provider | Signer) => Contract {
  const call = contract.connect.bind(contract)
  const override = (signerOrProvider: string | Provider | Signer): Contract => {
    const connectedContract = call(signerOrProvider)
    connectedContract.connect = getWrappedConnect(connectedContract, contractName)
    return wrapCalls(connectedContract, contractName)
  }
  return override
}

// Returns a contract with wrapped calls
// The wrapper will run the tx, wait for confirmation and log the details
export function wrapCalls(contract: Contract, contractName: string): Contract {
  const wrappedContract = lodash.cloneDeep(contract)

  for (const fn of Object.keys(contract.functions)) {
    const call: ContractFunction<ContractTransaction> = contract.functions[fn]
    const override = async (...args: Array<any>): Promise<ContractTransaction> => {
      // Make the call
      const tx = await call(...args)
      logContractCall(tx, contractName, fn, args)

      // Wait for confirmation
      const receipt = await contract.provider.waitForTransaction(tx.hash)
      logContractReceipt(tx, receipt)
      return tx
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    wrappedContract[fn] = override
    wrappedContract.functions[fn] = override
  }

  return wrappedContract
}

function logContractCall(
  tx: ContractTransaction,
  contractName: string,
  fn: string,
  args: Array<any>,
) {
  const msg: string[] = []
  msg.push(`> Sent transaction ${contractName}.${fn}`)
  msg.push(`   sender: ${tx.from}`)
  msg.push(`   contract: ${tx.to}`)
  msg.push(`   params: [ ${args} ]`)
  msg.push(`   txHash: ${tx.hash}`)

  logToConsoleAndFile(msg)
}

function logContractReceipt(tx: ContractTransaction, receipt: ContractReceipt) {
  const msg: string[] = []
  msg.push(
    receipt.status ? `✔ Transaction succeeded: ${tx.hash}` : `✖ Transaction failed: ${tx.hash}`,
  )

  logToConsoleAndFile(msg)
}

function logToConsoleAndFile(msg: string[]) {
  const isoDate = new Date().toISOString()
  const fileName = `tx-${isoDate.substring(0, 10)}.log`

  msg.map((line) => {
    console.log(line)
    fs.appendFileSync(fileName, `[${isoDate}] ${line}\n`)
  })
}
