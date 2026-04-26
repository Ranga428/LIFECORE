# 📌 Commit Changes
git add <file>        # stage specific file
git add .             # stage all changes
git commit -m "Your commit message"

# 🌱 Branch Management
git branch <branch-name>       # create branch
git checkout <branch-name>     # switch to branch
git checkout -b <branch-name>  # create + switch in one step

# 🔀 Merging Branches
git checkout main              # switch to target branch
git merge <branch-name>        # merge branch into current

# 🔄 Revert Local Branch to Remote
git fetch origin
git reset --hard origin/<branch-name>
# (⚠️ discards local changes; stash first if needed)
git stash                      # save local changes temporarily

# 📡 Fetch & Pull Remote Updates
git fetch origin               # update remote tracking info
git pull origin <branch-name>  # fetch + merge
git pull --rebase origin <branch-name>  # cleaner history

# 🚀 Push Feature Branch into Main
git push origin <feature-branch>   # push feature branch to remote
git checkout main                  # switch to main
git pull origin main               # update local main
git merge <feature-branch>         # merge feature branch into main
git push origin main               # push updated main to remote
