# Postmortem: OIDC Trust Policy Rejected GitHub Actions

**Date:** 2026-10-12
**Duration:** ~30 minutes across two failed workflow runs
**Impact:** CI/CD pipeline could not deploy; no production impact (dev stage only)

## Summary

The Deploy workflow failed to assume the AWS deploy role via OIDC with `AccessDenied: Not authorized to perform sts:AssumeRoleWithWebIdentity`. The trust policy rejected GitHub's JWT because the `sub` claim format didn't match the expected value.

## Timeline

1. Initial deploy workflow pushed. First run failed at "Configure AWS credentials via OIDC" after 2m 5s of retries.
2. Assumed the issue was the GitHub `@<id>` suffix format added in mid-2023. Updated the trust policy to include the numeric IDs.
3. Re-ran the workflow. Same error, same 13 retry attempts.
4. Added a debug step to the workflow that decodes the OIDC JWT and prints its claims.
5. Ran the workflow with debug enabled. The JWT's `sub` claim was:

       repo:KallieKay@200847887/dailylog@1372218309:environment:production

   Not `:ref:refs/heads/main` as the trust policy expected.
6. Updated the trust policy to match the actual `sub` claim.
7. Applied. Workflow passed in ~2 minutes.

## Root cause

The workflow's deploy job uses a **GitHub Environment** (`environment: production`). When a job uses a GitHub Environment, GitHub changes the OIDC `sub` claim format from:

    repo:<owner>@<owner_id>/<repo>@<repo_id>:ref:refs/heads/main

to:

    repo:<owner>@<owner_id>/<repo>@<repo_id>:environment:<env_name>

The trust policy was written for the ref-based format, which no longer matched.

## What we missed

- **Documentation gap:** GitHub's own docs describe both formats, but most tutorials predate the environment-based format.
- **Debug step missing:** the first two failures were diagnosed by guessing. Adding a debug step that prints the JWT payload would have made the fix obvious in one iteration.

## What went well

- The AWS side surfaced a clear `AccessDenied` error naming `sts:AssumeRoleWithWebIdentity`. No guessing about the category of the problem.
- The `configure-aws-credentials` action retried before failing. Helpful for transient issues, noisy when the underlying cause is configuration.

## Action items

- [x] Fix trust policy to match environment-based `sub` claim
- [x] Remove the debug step from `deploy.yml`
- [ ] Add a comment to `github_oidc.tf` documenting the `sub` claim format and how to inspect it

## Lessons

1. **Decode the JWT early.** The moment a trust policy rejection happens, print the token's claims. Two failed runs would have been one.
2. **Environment-based OIDC is different.** If you use GitHub Environments (which you should, for approval gates and deployment tracking), the trust policy must match the environment-based `sub`.
3. **The `@<id>` suffix is now standard.** GitHub adds numeric IDs to the owner and repo names in the `sub` claim to prevent renamed-repo attacks. Any trust policy that omits them will fail for repos created after July 2026.
4. **Environments change the security model.** `environment:production` in a workflow is not just metadata — it's a different OIDC claim namespace. Any trust policy that works for a plain branch push will break when you add an environment.