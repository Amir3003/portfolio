# Apply the refactor

1. Copy the files in this folder over the project (same relative paths).
2. Delete every file listed in DELETED_FILES.txt.
3. Untrack the database files and make sure no env file is tracked:

       git rm --cached "voyage ai/AItouragent/zari_travel.db" "voyage ai/AItouragent/zari_travel.db-shm" "voyage ai/AItouragent/zari_travel.db-wal"
       git ls-files | grep -E "(^|/)\.env($|\.)" | grep -v "\.env\.example$"   # must print nothing

   The old database was committed earlier, so it still exists in git history. If it ever held real
   user data, rewrite history (git filter-repo --path "voyage ai/AItouragent/zari_travel.db" --invert-paths)
   and treat anything in it as exposed.
4. Set the variables from .env.example in your hosting dashboard (never commit real values).
5. Run: pnpm install && pnpm exec tsc --noEmit && pnpm build
