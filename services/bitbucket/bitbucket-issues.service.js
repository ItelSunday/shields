'use strict'

const Joi = require('joi')
const { metric } = require('../text-formatters')
const { BaseJsonService } = require('..')
const { nonNegativeInteger } = require('../validators')

const bitbucketIssuesSchema = Joi.object({
  count: nonNegativeInteger,
}).required()

function issueClassGenerator(raw) {
  const routePrefix = raw ? 'issues-raw' : 'issues'
  const badgeSuffix = raw ? '' : ' open'

  return class BitbucketIssues extends BaseJsonService {
    static get name() {
      return `BitbucketIssues${raw ? 'Raw' : ''}`
    }

    static get category() {
      return 'issue-tracking'
    }

    static get route() {
      return {
        base: `bitbucket/${routePrefix}`,
        pattern: ':user/:repo',
      }
    }

    static get examples() {
      return [
        {
          title: 'Bitbucket open issues',
          namedParams: {
            user: 'atlassian',
            repo: 'python-bitbucket',
          },
          staticPreview: this.render({ issues: 33 }),
        },
      ]
    }

    static get defaultBadgeData() {
      return { label: 'issues' }
    }

    static render({ issues }) {
      return {
        message: `${metric(issues)}${badgeSuffix}`,
        color: issues ? 'yellow' : 'brightgreen',
      }
    }

    async fetch({ user, repo }) {
      const url = `https://bitbucket.org/api/1.0/repositories/${user}/${repo}/issues/`
      return this._requestJson({
        url,
        schema: bitbucketIssuesSchema,
        options: {
          qs: { limit: 0, status: ['new', 'open'] },
          useQuerystring: true,
        },
        errorMessages: { 403: 'private repo' },
      })
    }

    async handle({ user, repo }) {
      const data = await this.fetch({ user, repo })
      return this.constructor.render({ issues: data.count })
    }
  }
}

module.exports = [true, false].map(issueClassGenerator)
