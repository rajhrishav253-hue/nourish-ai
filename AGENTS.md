<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep report date bucketing and numeric calculations in the browser-safe analytics module, with concrete unit tests, so all report periods use the same rules.
- Analytics reads the owner's persisted food and weight logs in paginated queries; use the existing profiles query key for shared targets and the logs/weights prefixes for mutation invalidation.
- Show absent weigh-ins as missing rather than fabricating measurements; daily averages divide by elapsed calendar days, and monthly weight averages use recorded daily means.
- Vercel builds switch the server output to the Vercel preset only when the VERCEL env var is set, so Lovable publishing keeps its own target untouched.
