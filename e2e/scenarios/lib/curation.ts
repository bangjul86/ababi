import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumberish } from 'ethers'
import { GraphNetworkContracts } from '../../../sdk/deployments/network'
import { ensureGRTAllowance } from './accounts'

export const signal = async (
  contracts: GraphNetworkContracts,
  curator: SignerWithAddress,
  subgraphId: string,
  amount: BigNumberish,
): Promise<void> => {
  // Approve
  await ensureGRTAllowance(curator, contracts.GNS.address, amount, contracts.GraphToken)

  // Add signal
  console.log(`\nAdd ${amount} in signal to subgraphId ${subgraphId}..`)
  await contracts.GNS.connect(curator).mintSignal(subgraphId, amount, 0, {
    gasLimit: 4_000_000,
  })
}
