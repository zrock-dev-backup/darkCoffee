format:
	git add src/
	git diff --cached --name-only --diff-filter=AM  | sed 's/frontend\///' | xargs npx prettier --write

run:
	nix run

