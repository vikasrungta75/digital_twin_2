#!/bin/sh

# Clone the repository
git clone https://oauth2:Rdv_cgu_EiW5Z4_dAxXN@gitlab.ravity.io/devops/8.5_platform.git
cd 8.5_platform/valcode-fleet/valcode-v1

# Update deployment.yaml with the new image tag
sed -i "s|image:.*|image: \"$AZURE_REGISTRY/$AZURE_PROJECT_NAME/$VALCODE_STG_V1_IMAGE_NAME:$IMAGE_TAG\"|g" deployment.yaml

# Configure Git user
git config --global user.email "devops@ravity.io"
git config --global user.name "devops"

# Add the updated deployment.yaml to the Git staging area
git add deployment.yaml

# Commit the changes
git commit -m "Update deployment.yaml with new image tag for VALCODE_STG v1"

# Push the changes to the remote repository
git push origin main
