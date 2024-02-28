import * as core from '@actions/core'
import {getInputs} from './getInputs'
import {branching} from './branching'
import {deleteInstance} from './deleteInstance'

export async function run(): Promise<void> {
  try {
    // Get Action inputs
    const inputs = getInputs()

    switch (inputs.action) {
      case 'branch':
        // Call the branching function
        await branching({
          temboApiEndpoint: inputs.temboApiEndpoint,
          instanceId: inputs.instanceId,
          orgId: inputs.orgId,
          instanceName: inputs.instanceName,
          env: inputs.env,
          temboToken: inputs.temboToken,
          pollInterval: inputs.pollInterval,
          maxAttempt: inputs.maxAttempt
        })
        break
      case 'delete':
        // Call the delete instance function
        await deleteInstance({
          temboApiEndpoint: inputs.temboApiEndpoint,
          orgId: inputs.orgId,
          instanceId: inputs.instanceId,
          temboToken: inputs.temboToken
        })
        break
      default:
        // Handle unsupported action
        throw new Error(`Unsupported operation: ${inputs.action}`)
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error}`)
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(err)
    core.setFailed(`Unhandled error: ${err}`)
  })
}
