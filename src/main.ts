import * as core from '@actions/core'
import {branching} from './branching'
import {deleteInstance} from './deleteInstance'
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  animals
} from 'unique-names-generator'

export async function run(): Promise<void> {
  // Setup random name generator
  const randomNameConfig: Config = {
    dictionaries: [animals, adjectives],
    separator: '-',
    length: 2
  }
  const defaultRandomName: string = uniqueNamesGenerator(randomNameConfig)
  // Retreive inputs from the action
  const operation: string = core.getInput('operation') || 'create'
  const temboApiEndpoint: string =
    core.getInput('tembo-api-endpoint') || 'https://api.tembo.io'
  const orgId: string = core.getInput('org-id', {required: true})
  const instanceId: string = core.getInput('instance-id', {required: true})
  const instanceName: string =
    core.getInput('instance-name') || defaultRandomName
  const temboToken: string = core.getInput('tembo-token', {required: true})
  const env: string = core.getInput('environment') || 'prod'
  const pollInterval: number = Number(core.getInput('polling-interval')) || 5000
  const maxAttempt: number = Number(core.getInput('max-polling-attempts')) || 60

  switch (operation) {
    case 'branch':
      // Call the branching function
      await branching({
        temboApiEndpoint,
        instanceId,
        orgId,
        instanceName,
        env,
        temboToken,
        pollInterval,
        maxAttempt
      })
      break
    case 'delete':
      // Call the delete instance function
      await deleteInstance({temboApiEndpoint, orgId, instanceId, temboToken})
      break
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(err)
    core.setFailed(`Unhandled error: ${err}`)
  })
}
