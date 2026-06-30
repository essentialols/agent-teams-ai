# Package Consumption

Use the published GitHub Packages artifact:

```ini
@vioxen:registry=https://npm.pkg.github.com
```

CI consumers should provide a token with package read access through their
environment, for example `NODE_AUTH_TOKEN` or the job `GITHUB_TOKEN`. Do not
commit package tokens to `.npmrc`.

```json
{
  "@vioxen/subscription-runtime": "0.1.0-main.1"
}
```

Production services should commit their lockfile. The lockfile pins the exact
package artifact that was installed. To pull a newer published version:

```bash
npm update @vioxen/subscription-runtime
```

Then rebuild and commit the lockfile.
