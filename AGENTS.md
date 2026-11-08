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
- Patient records (details, medication plans, discharge answers) live in a single browser-saved store shared by all pages, so every screen reads the same patient list.
- Clinical rules (turning plans, side-effect tiers) live in src/lib/care-engine.ts as pure functions with tests; content is per-patient and gated by nurse approval — keeps rules reviewable.
