# `tembo-io/database-branching-action`

- [`tembo-io/database-branching-action`](#tembo-iodatabase-branching)
    - [Usage](#usage)
        - [Inputs](#inputs)
        - [Outputs](#outputs)
    - [Examples](#examples)
        - [Simple branching call](#simple-branching-call)
        - [Trigger workflow on pull request](#trigger-workflow-on-pull-request)

## Usage

### Inputs

```yaml
- uses: tembo-io/database-branching-action@v1
  with:
    # The action of the run to either branch a database or destroy/delete a database
    # Optional. Default is 'branch'
    action:

    # The Tembo orginization id associated with your Tembo account.
    # eg: org_2GjOcQXiQhyg6sOfwY9AL76Yv3t
    # Required.
    org-id:

    # The Tembo instance id of the instance you want to branch from.
    # eg: inst_1799344738885_lgEZvW_2
    # Required
    instance-id:

    # The name of the new branched instance you are creating
    # Optional. Default is a randomly generated name
    instance-name:

    # The JWT token generated for use with your orginization 
    # https://cloud.tembo.io/generate-jwt
    # Required
    tembo-token:

    # The length of time between polling events when querying the Tembo API
    # Optional. Default 5000 (5 seconds)
    polling-interval:

    # The number of polling attempts when calling the Tembo API
    # Optional. Default 60
    max-polling-attempts:
```

### Outputs

| Name | Description | Example |
| - | - | - |
| `instance_id` | The instance ID of the new Tembo branched instance | `inst_1709075092950_QhNBzB_32` |
| `instance_name` | The name of the new Tembo branched instance | `panther-shaky-1` |
| `host` | The connection host of the new Tembo branched instance | `org-tembo-inst-panther-shaky-1.data-1.use1.tembo.io` |
| `port` | The connection port of the new Tembo branched instance | `5432` |
| `user` | The username of the new Tembo branched instance (**base64 encoded**) | `cG9zdGdyZXM=` |
| `password` | The password of the new Tembo branched instance (**base64 encoded**) | `cG9zdGdyZXNwb3N0Z3Jlc3Bvc3RncmVzMQ==` |

## Examples

### Simple branching with delete

```yaml
    - name: Test Action Execution
      id: tembo-branching-action
      uses: tembo-io/database-branching-action@v1
      with:
        org-id: org_2GjOcQXiQhyg6sOfwY9AL76Yv3t
        instance-id: inst_1799344738885_lgEZvW_2
        tembo-token: ${{ secrets.TEMBO_TOKEN }}

    - name: Delete Branched Database
      uses: tembo-io/database-branching-action@v1
        action: delete
        org-id: org_2GjOcQXiQhyg6sOfwY9AL76Yv3t
        instance-id: ${{ steps.tembo-branching-action.outputs.instance_id }}
        tembo-token: ${{ secrets.TEMBO_TOKEN }}
```

### Trigger workflow on pull request

```yaml
database-branching:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    - name: Set Up Database Branching
      if: ${{ github.event_name == 'pull_request' && github.event.action == 'opened' }}
      id: db-branch-create
      uses: tembo-io/database-branching-action@v1
      with:
        action: 'create'
        tembo-token: ${{ secrets.TEMBO_TOKEN }}
        org-id: org_2GjOcQXiQhyg6sOfwY9AL76Yv3t
        instance-name: branched-pr-${{ github.event.number }}
        instance-id: inst_1799344738885_lgEZvW_2
        tembo-token: ${{ secrets.TEMBO_TOKEN }}

    # Step for cleaning up after PR is closed
    - name: Clean Up Database Branch
      if: ${{ github.event_name == 'pull_request' && (github.event.action == 'closed' || github.event.action == 'merged') }}
      uses: tembo-io/database-branching-action@v1
      with:
        action: delete
        org-id: org_2GjOcQXiQhyg6sOfwY9AL76Yv3t
        instance-id: ${{ steps.tembo-branching-action.outputs.instance_id }}
        tembo-token: ${{ secrets.TEMBO_TOKEN }}

    - name: Echo Database URI
      if: ${{ steps.db-branch-create.outputs.host }}
      run: echo "Database URI: ${{ steps.db-branch-create.outputs.host }}"
```