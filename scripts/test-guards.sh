#!/bin/bash
# Guard-hook test suite. Run: npm run test:guards
#
# Every case asserts BOTH directions. A guard that denies everything is not a working
# guard — it is a broken one that will be switched off within a week. The allow cases
# matter as much as the deny cases, and the allow case for the review marker
# (.git/arbi-review-marker) encodes the pack's hardest-won lesson: denying the whole
# .claude/** tree also denies the review gate's own marker and deadlocks every commit.
set -uo pipefail
cd "$(dirname "$0")/.."

PASS=0
FAIL=0

t() { # t <hook> <json> <allow|deny> <label>
  local out rc got
  out=$(printf '%s' "$2" | ".claude/hooks/$1" 2>&1); rc=$?
  got=allow; [ $rc -eq 2 ] && got=deny
  if [ "$got" = "$3" ]; then
    printf '  ok   [%-5s] %s\n' "$3" "$4"; PASS=$((PASS + 1))
  else
    printf '  FAIL want=%s got=%s :: %s\n' "$3" "$got" "$4"; printf '        %s\n' "$(echo "$out" | head -1)"
    FAIL=$((FAIL + 1))
  fi
}
B() { printf '{"tool_name":"Bash","tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)"; }

echo "authority-guard — boundaries denied, arbi's memory writable"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":"CLAUDE.md"}}' deny "edit CLAUDE.md"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":".claude/agents/arbi.md"}}' deny "edit the arbi agent"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":".claude/settings.json"}}' deny "edit settings.json"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":"docs/product/arbi-permission-model.md"}}' deny "edit the permission model"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":"docs/product/north-star.md"}}' deny "edit the north star"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":".github/workflows/quality-gates.yml"}}' deny "edit CI"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":"supabase/migrations/001_initial_schema.sql"}}' deny "edit a migration"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":"docs/product/roadmap-state.md"}}' allow "write roadmap-state (I2, arbi's memory)"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":"docs/product/decision-log.md"}}' allow "write decision-log (I2)"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":"docs/product/arbi-run-ledger.md"}}' allow "write run ledger (I2)"
t authority-guard.sh '{"tool_name":"Edit","tool_input":{"file_path":"src/lib/seed.ts"}}' allow "edit product source"
t authority-guard.sh "$(B 'echo x > CLAUDE.md')" deny "shell redirect onto CLAUDE.md"
t authority-guard.sh "$(B 'sed -i s/a/b/ .claude/hooks/push-guard.sh')" deny "sed -i on a guard hook"
t authority-guard.sh "$(B 'grep -n foo CLAUDE.md')" allow "read-only grep of an authority file"

echo "push-guard — merge granted, bypass denied"
t push-guard.sh "$(B 'gh pr merge 12 --squash')" allow "ordinary gh pr merge (tier I6a)"
t push-guard.sh "$(B 'gh pr merge 12 --squash --admin')" deny "--admin bypasses required checks"
t push-guard.sh "$(B 'git push -u origin claude/my-branch')" allow "push to a claude/** branch"
t push-guard.sh "$(B 'git push --force origin main')" deny "force-push to main"
t push-guard.sh "$(B 'git push origin HEAD:main')" deny "refspec push to main"
t push-guard.sh "$(B 'git push origin claude/x:main')" deny "claude/x:main refspec trick"
t push-guard.sh "$(B 'git push origin main')" deny "direct push to main (skips CI)"
t push-guard.sh "$(B 'git push --delete origin foo')" deny "delete push"
t push-guard.sh "$(B 'gh run rerun 123')" deny "gh run rerun instead of diagnosing"
t push-guard.sh "$(B 'gh workflow disable quality-gates.yml')" deny "disabling CI"
t push-guard.sh "$(B 'git reset --hard origin/main')" deny "hard reset onto main"
t push-guard.sh "$(B 'git status && git log --oneline -3')" allow "ordinary read-only git"

echo "pr-draft-guard — born draft, promoted deliberately"
t pr-draft-guard.sh '{"tool_name":"mcp__github__create_pull_request","tool_input":{"draft":true}}' allow "create draft PR"
t pr-draft-guard.sh '{"tool_name":"mcp__github__create_pull_request","tool_input":{"draft":false}}' deny "create non-draft PR"
t pr-draft-guard.sh '{"tool_name":"mcp__github__update_pull_request","tool_input":{"draft":false}}' allow "mark ready — precedes a legitimate merge"
t pr-draft-guard.sh "$(B 'gh pr create --draft --title x')" allow "gh pr create --draft"
t pr-draft-guard.sh "$(B 'gh pr create --title x')" deny "gh pr create without --draft"
t pr-draft-guard.sh "$(B 'gh pr merge 3 --auto --squash')" deny "--auto queues an unobserved merge"

echo "unattended-guard — I5 / I6b / I7 fail closed"
t unattended-guard.sh '{"tool_name":"mcp__Supabase__apply_migration","tool_input":{}}' deny "apply_migration (I5)"
t unattended-guard.sh '{"tool_name":"mcp__Supabase__execute_sql","tool_input":{}}' deny "write-capable execute_sql (I5)"
t unattended-guard.sh '{"tool_name":"mcp__Supabase__deploy_edge_function","tool_input":{}}' deny "deploy edge function (I6b)"
t unattended-guard.sh '{"tool_name":"mcp__supabase-ro__execute_sql","tool_input":{}}' allow "the read-only Supabase server"
t unattended-guard.sh '{"tool_name":"mcp__Supabase__list_tables","tool_input":{}}' allow "read-only list_tables"
t unattended-guard.sh "$(B 'npm run db:push')" deny "drizzle-kit push writes a live schema (I5)"
t unattended-guard.sh "$(B 'npm run db:generate')" allow "db:generate only writes files"
t unattended-guard.sh "$(B 'supabase secrets set ANTHROPIC_API_KEY=x')" deny "setting a secret (I5)"
t unattended-guard.sh "$(B 'gh secret set FOO')" deny "setting a GitHub secret (I5)"
t unattended-guard.sh "$(B 'eas submit --platform ios')" deny "EAS submit (I7)"
t unattended-guard.sh "$(B 'eas update --branch production')" deny "OTA update reaches installed apps (I7)"
t unattended-guard.sh "$(B 'npm run check')" allow "ordinary build check"

echo "review-gate — staging and committing stay separate steps"
t review-gate.sh "$(B 'git commit -m "x"')" allow "plain commit with no src/ staged"
t review-gate.sh "$(B 'git commit -am "x"')" deny "commit -am stages and commits indivisibly"
t review-gate.sh "$(B 'git add -A && git commit -m x')" deny "compound add && commit"
t review-gate.sh "$(B 'git add src/foo.ts')" allow "staging on its own"
t authority-guard.sh "$(B 'echo abc > .git/arbi-review-marker')" allow "the review marker is writable — no deadlock"

echo
if [ "$FAIL" -eq 0 ]; then
  echo "guards: $PASS passed, 0 failed"
else
  echo "guards: $PASS passed, $FAIL FAILED"
  exit 1
fi
