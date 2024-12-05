#!/bin/bash

# Default value for the check flag
CHECK=true

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --check|--no-check|-ch|--no-ch) 
            if [[ "$1" == "--no-check" || "$1" == "--no-ch" || "$1" == "-ch" ]]; then
                CHECK=false
            fi
            shift
            ;;
        *) 
            # Check if a commit message was provided
            if [ -z "$1" ]; then
                echo "Error: No commit message provided."
                echo "Usage: ./autoUpload.sh 'Your commit message' [--check | --no-check]"
                exit 1
            fi
            COMMIT_MESSAGE="$1"
            shift
            ;;
    esac
done

# Run the check script if the CHECK flag is true
if [ "$CHECK" = true ]; then
    node src/utils/checkDeleted.js
    # Check if the check script was successful
    if [ $? -ne 0 ]; then
        echo "checkDeleted.js failed."
        exit 1
    fi
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
git commit -m "$COMMIT_MESSAGE"

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
