# grime_time_site

Public site project for **Grime Time** (exterior cleaning). **Stack (planned):** [Payload CMS](https://payloadcms.com/) with the [with-vercel-website](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website) template, **Supabase** Postgres, **Vercel** hosting. Planning and PRD live under [`.planning/`](.planning/); tooling comes from the [RepoPlanner](https://github.com/MagicbornStudios/RepoPlanner) submodule.

## Quick start

```bash
git submodule update --init --recursive
npm install
npm run planning -- snapshot
```

## Planning CLI

```bash
npm run planning -- <command>
```

See [`.planning/README.md`](.planning/README.md) for details.
