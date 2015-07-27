## Contributing Agreement  

### Pull Requests

#### Basic Steps

* Fork it
* Create your feature branch (git checkout -b my-new-feature)
* Commit your changes (git commit -am 'Add some feature')
* Push to the branch (git push origin my-new-feature)
* Create new Pull Request

If your patch **changes the API or fixes a bug** please use one of the following prefixes in your commit subject:

- `[fixed] ...`
- `[changed] ...`
- `[added] ...`
- `[removed] ...`

That ensures the subject line of your commit makes it into the auto-generated changelog. Do not use these tags if your change doesn't fix a bug and doesn't change the public API.

Commits with changed, added, or removed, should probably be reviewed by another collaborator.

#### When using `[changed]` or `[removed]`...

Please include an upgrade path with example code in the commit message. If it doesn't make sense to do this, then it doesn't make sense to use `[changed]` or `[removed]` :)


### Terms

* Prefer upper-case for abbreviation, i.e. use `URL` instead of `url` or `Url`
* Do not use `path` term. Use `dir` for directories, `URI` for URI.


### Style Guide

Use `ESLint` to catch most styling issues that may exist in your code.

However, there are still some styles that the linter cannot pick up. If you are unsure about something, looking at [Airbnb's Style Guide](https://github.com/airbnb/javascript) will guide you in the right direction.


### Code Conventions

* 2 spaces for indentation (no tabs)
* Use `'` for JavaScript strings
* Prefer access to external object (which you get from HTTP, config, etc; which you put to outside - HTTP, templates, etc) properties with using `'`. For internal objects (data structures of code API) - use `.`. Both rules provide correct code minification in advanced mode.  
* Use semicolons `;`
* 80 character line length
* Do not use the optional parameters of setTimeout and setInterval


### Documentation

* Please update the docs with any API changes, the code and docs should always be in sync.
* Do not wrap lines at 80 characters
