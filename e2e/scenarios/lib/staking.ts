import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumberish, ethers } from 'ethers'
import { GraphNetworkContracts } from '../../../sdk/deployments/network'
import { randomHexBytes } from '../../../sdk/lib/utils'
import { ensureGRTAllowance } from './accounts'

export const stake = async (
  contracts: GraphNetworkContracts,
  indexer: SignerWithAddress,
  amount: BigNumberish,
): Promise<void> => {
  // Approve
  await ensureGRTAllowance(indexer, contracts.Staking.address, amount, contracts.GraphToken)
  const allowance = await contracts.GraphToken.allowance(indexer.address, contracts.Staking.address)
  console.log(`Allowance: ${ethers.utils.formatEther(allowance)}`)

  // Stake
  console.log(`\nStaking ${ethers.utils.formatEther(amount)} tokens...`)
  await contracts.Staking.connect(indexer).stake(amount)
}

export const allocateFrom = async (
  contracts: GraphNetworkContracts,
  indexer: SignerWithAddress,
  allocationSigner: SignerWithAddress,
  subgraphDeploymentID: string,
  amount: BigNumberish,
): Promise<void> => {
  const allocationId = allocationSigner.address
  const messageHash = ethers.utils.solidityKeccak256(
    ['address', 'address'],
    [indexer.address, allocationId],
  )
  const messageHashBytes = ethers.utils.arrayify(messageHash)
  const proof = await allocationSigner.signMessage(messageHashBytes)
  const metadata = ethers.constants.HashZero

  console.log(`\nAllocating ${amount} tokens on ${allocationId}...`)
  await contracts.Staking.connect(indexer).allocateFrom(
    indexer.address,
    subgraphDeploymentID,
    amount,
    allocationId,
    metadata,
    proof,
    {
      gasLimit: 4_000_000,
    },
  )
}

export const closeAllocation = async (
  contracts: GraphNetworkContracts,
  indexer: SignerWithAddress,
  allocationId: string,
): Promise<void> => {
  const poi = randomHexBytes()

  console.log(`\nClosing ${allocationId}...`)
  await contracts.Staking.connect(indexer).closeAllocation(allocationId, poi, {
    gasLimit: 4_000_000,
  })
}
