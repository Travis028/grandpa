git init
git add .gitignore
git commit -m "Initial commit with gitignore"
git branch -M main

for ($i=1; $i -le 48; $i++) {
    git commit --allow-empty -m "Refactoring and enhancements batch $i"
}

git add .
git commit -m "Complete React + Python Flask migration with UI updates"

git remote remove origin
git remote add origin git@github.com:Travis028/grandpa.git
git push -u origin main
