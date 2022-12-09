import { ContractFactory } from 'ethers'
import { LinkReferences } from 'hardhat/types'
import { loadArtifact } from '../artifacts'

export const getContractFactory = (
  name: string,
  libraries?: { [libraryName: string]: string },
): ContractFactory => {
  const artifact = loadArtifact(name)
  // Fixup libraries
  if (libraries && Object.keys(libraries).length > 0) {
    artifact.bytecode = linkLibraries(artifact, libraries)
  }
  return new ContractFactory(artifact.abi, artifact.bytecode)
}

const linkLibraries = (
  artifact: {
    bytecode: string
    linkReferences?: LinkReferences
  },
  libraries?: { [libraryName: string]: string },
): string => {
  let bytecode = artifact.bytecode

  if (libraries) {
    if (artifact.linkReferences) {
      for (const fileReferences of Object.values(artifact.linkReferences)) {
        for (const [libName, fixups] of Object.entries(fileReferences)) {
          const addr = libraries[libName]
          if (addr === undefined) {
            continue
          }

          for (const fixup of fixups) {
            bytecode =
              bytecode.substr(0, 2 + fixup.start * 2) +
              addr.substr(2) +
              bytecode.substr(2 + (fixup.start + fixup.length) * 2)
          }
        }
      }
    }
  }
  return bytecode
}
