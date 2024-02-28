import * as core from '@actions/core'
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  animals
} from 'unique-names-generator'

interface ActionInputs {
  action: string
  temboApiEndpoint: string
  orgId: string
  instanceId: string
  instanceName: string
  temboToken: string
  env: string
  pollInterval: number
  maxAttempt: number
}

export function getInputs(): ActionInputs {
  // Set Random Name if `instance-name` is empty
  const randomNameConfig: Config = {
    dictionaries: [animals, adjectives],
    separator: '-',
    length: 2
  }
  const defaultRandomName: string = uniqueNamesGenerator(randomNameConfig)

  // Ensure correct type on `action` input
  type Action = 'branch' | 'delete'
  const actionInput: string = core.getInput('action') || 'branch'
  const validActions: Action[] = ['branch', 'delete']

  if (!validActions.includes(actionInput as Action)) {
    throw new Error(`Unsupported operation: ${actionInput}`)
  }

  // Return inputs from the action
  return {
    action: actionInput as Action,
    temboApiEndpoint:
      core.getInput('tembo-api-endpoint') || 'https://api.tembo.io',
    orgId: core.getInput('org-id', {required: true}),
    instanceId: core.getInput('instance-id', {required: true}),
    instanceName: core.getInput('instance-name') || defaultRandomName,
    temboToken: core.getInput('tembo-token', {required: true}),
    env: core.getInput('environment') || 'prod',
    pollInterval: Number(core.getInput('polling-interval')) || 5000,
    maxAttempt: Number(core.getInput('max-polling-attempts')) || 60
  }
}
