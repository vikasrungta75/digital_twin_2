#!/bin/sh

# Clone the repository
git clone https://oauth2:VGF2r3g5sBSEmWMhNVZX@gitlab.ravity.io/devops/gcp-production.git
cd gcp-production/valcode-fleet/prod-valcode-v1

# Update deployment.yaml with the new image tag
sed -i "s|image:.*|image: \"$GCP_REGISTRY/$GCP_PROJECT_NAME/$VALCODE_PRODUCTION_IMAGE_NAME_v1:$IMAGE_TAG\"|g" deployment.yaml
# sed -i "s|image:.*|image: \"$AZURE_REGISTRY/$AZURE_PROJECT_NAME/$VALCODE_PRODUCTION_IMAGE_NAME_v1:$IMAGE_TAG\"|g" deployment.yaml

# Configure Git user
git config --global user.email "devops@ravity.io"
git config --global user.name "devops"

# Add the updated deployment.yaml to the Git staging area
git add deployment.yaml

# Commit the changes
git commit -m "Update deployment.yaml with new image tag for prod-valcode v1"

# Push the changes to the remote repository
git push origin main
