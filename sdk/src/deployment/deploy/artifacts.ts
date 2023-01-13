import path from 'path'
import { Artifacts } from 'hardhat/internal/artifacts'

import type { Artifact } from 'hardhat/types'

/**
 * Load a contract's artifact from the build output folder
 *
 * @param name Name of the contract
 * @param buildDir Path to the build output folder. Defaults to `build/contracts`
 * @returns The artifact corresponding to the contract name
 */
export const loadArtifact = (name: string, buildDir?: string): Artifact => {
  const artifacts = new Artifacts(path.resolve(buildDir ?? 'build/contracts'))
  return artifacts.readArtifactSync(name)
}
