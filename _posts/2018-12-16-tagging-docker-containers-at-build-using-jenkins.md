---
layout: post
title: How to use Jenkins to build properly tagged Docker images and push them to a registry
category: Devops
excerpt_separator:  <!--more-->
tags:
  - Devops
  - Docker
  - Git
  - Jenkins
---

Using Docker to build your software with Jenkins comes with several perks:
1. You can test your build locally. If it builds on your machine it will build in Jenkins.
2. Your build server doesn't need anything more than Docker installed, making the installation and maintenance of your build server much easier.

Furthermore; if you keep the git commits you are building tagged in Git using <a href="https://semver.org/" title="Semver" target="_blank">Semver</a>,
 you can easily make sure Jenkins automatically tags and pushes your images to the registry of your choice.

## Prerequisites

### Dockerfile
Your repository will need to contain a Dockerfile which describes how to build your project.

### Jenkins plugins
Make sure you have the following Jenkins plugins installed:
1. <a href="https://wiki.jenkins-ci.org/display/JENKINS/EnvInject+Plugin" title="EnvInject Plugin" target="_blank">EnvInject Plugin</a>
2. <a href="https://wiki.jenkins.io/display/JENKINS/CloudBees+Docker+Build+and+Publish+plugin" title="CloudBees Docker Build and Publish plugin" target="_blank">CloudBees Docker Build and Publish plugin</a>

### Bash script

This bash script looks for a tag on your latest commit in your git repository. If a tag exists and matches the structure of a 
<a href="https://semver.org/" title="Semver" target="_blank">Semver</a> tag it will extract tags for MAJOR, MINOR and PATCH. For
example; if the tag is `1.2.3` the script will extract the following:
1. `GIT_TAG_MAJOR=1`
2. `GIT_TAG_MINOR=1.2`
2. `GIT_TAG_PATCH=1.2.3`

The script will always set the tag `latest`.

The tags are also combined to one variable `DOCKER_TAGS`. All the varibles set by the script are written to the file
`${WORKSPACE}/env.properties` and injected to the build as environmental variables.

```bash
GIT_TAG=$(git tag -l --points-at HEAD)

if echo $GIT_TAG | grep -Pq '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$';
then
  GIT_TAG_PATCH="$(echo $GIT_TAG | sed -e 's/\(\([0-9]\+\)\.\([0-9]\+\)\.\([0-9]\+\)\(-[a-zA-Z0-9]\+\)\?\|.*\)/\2.\3.\4\5/')"
  GIT_TAG_MINOR="$(echo $GIT_TAG | sed -e 's/\(\([0-9]\+\)\.\([0-9]\+\)\.\([0-9]\+\)\(-[a-zA-Z0-9]\+\)\?\|.*\)/\2.\3\5/')"
  GIT_TAG_MAJOR="$(echo $GIT_TAG | sed -e 's/\(\([0-9]\+\)\.\([0-9]\+\)\.\([0-9]\+\)\(-[a-zA-Z0-9]\+\)\?\|.*\)/\2\5/')"

	echo "GIT_TAG=$GIT_TAG" >> ${WORKSPACE}/env.properties
	echo "GIT_TAG_PATCH=${GIT_TAG_PATCH}" >> ${WORKSPACE}/env.properties
	echo "GIT_TAG_MINOR=${GIT_TAG_MINOR}" >> ${WORKSPACE}/env.properties
	echo "GIT_TAG_MAJOR=${GIT_TAG_MAJOR}" >> ${WORKSPACE}/env.properties
	echo "DOCKER_TAGS=latest,${GIT_TAG_MAJOR},${GIT_TAG_MINOR},${GIT_TAG_PATCH}" >> ${WORKSPACE}/env.properties
else
	echo "DOCKER_TAGS=latest" >> ${WORKSPACE}/env.properties
fi
```

## Settning up your Jenkins build

1. Under Source Code Management, make sure your build is set up to monitor a git repository.
2. Under Build add the Execute Shell build step. Paste the Bash script as the command.
3. Add an Inject environmental variables step and set `Properties File Path` to `${WORKSPACE}/env.properties`.
4. Add a Docker Build and Publish build step and fill out Repository Name, Docker registry URL and Registry credentials with your information and set Tag to `${DOCKER_TAGS}`.
5. Build.

Once the build finishes your registry should contain a new image with the tags we extracted using the bash script.