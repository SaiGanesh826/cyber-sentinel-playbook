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

## Architecture rules
- Password Security workshop answer keys live only in `src/lib/pw-bank.server.ts`/`pw-engine.server.ts`, loaded via dynamic import inside server-function handlers; employee responses never include answer keys so answers stay hidden until submission.
- Workshop attempts (`pw_attempts`) are only written through server functions using the admin client; uniqueness of question sets is enforced by a DB unique index per campaign, not client code.
