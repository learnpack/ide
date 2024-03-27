#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo "Error: No commit message provided."
  echo "Usage: ./script.sh 'Your commit message'"
  exit 1
fi


# Execute npm build
npm run build

# Check if npm build was successful
if [ $? -ne 0 ]; then
  echo "npm run build failed."
  exit 1
fi

# Add changes to git
git add .

# Commit changes with provided message
git commit -m "$1"

# Check if git commit was successful
if [ $? -ne 0 ]; then
  echo "git commit failed."
  exit 1
fi

# Push changes to master branch
git push origin master

# Check if git push was successful
if [ $? -ne 0 ]; then
  echo "git push failed."
  exit 1
fi

echo "Build and push completed successfully."