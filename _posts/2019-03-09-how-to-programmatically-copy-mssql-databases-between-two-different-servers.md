---
layout: post
title: How to programmatically copy MSSQL-databases between two different servers
category: Devops
excerpt_separator:  <!--more-->
tags:
  - Devops
  - Docker
  - SQL
  - curl
  - Windows
---

A scenario I have come across a lot is wanting to update my test environment MSSQL-database with a fresh backup from my production environment database. This can be done in several ways, but none of those I know about have been to my liking. These include:
1. Manually backing up the production environment database and then manually restoring it in the test environment
2. Scheduling a backup and restore
3. <a href="https://www.cybrary.it/0p3n/best-way-copy-sql-server-database-one-server-another/" title="Best Way to Copy SQL Server Database From One Server to Another" target="_blank">Using Tasks -> Copy database</a>

The above options each come with their own limitations:
1. Having to do it manually
2. Restoring the test database with a fresh backup on a schedule would mean that test data would only live for however long the window between restores is
3. The database servers need to be able to communicate. Ports need to be open and so on

I have found that what I want is a way to do the following:
1. Create a database backup from the source machine
2. Download the backup file to localhost
3. Upload the backup file to the target machine
4. Restore the backup file

This turns out to be possible using a combination of Docker, mssql-tools and curl. However, the solution provides you have a Windows domain account on both the source and the target machine and that your account has sufficient access rights.

### Creating a Docker image for copying MSSQL-databases between servers

Start by creating the directory `c:\dbbackup` on both the source and target machine. Then, on localhost, create a folder with two files:
1. `Dockerfile`
2. `run.sh`

You want `Dockerfile` to look like this:
```docker
FROM mcr.microsoft.com/mssql-tools:v1

RUN apt-get -y update --fix-missing && \
    apt-get -y install curl

ADD run.sh ./run.sh
CMD ["/bin/bash", "./run.sh"]
```

You want `run.sh` to look like this:
```bash
#!/usr/bin/env bash

# Exit on first error
set -e

# Backup database on source machine
/opt/mssql-tools/bin/sqlcmd -S ${FROM_SQL_HOST} \
    -U ${FROM_SQL_USER} \
    -P ${FROM_SQL_PASSWORD} \
    -Q "BACKUP DATABASE ${FROM_DATABASE_NAME} TO DISK = N'c:\dbbackup\${FROM_DATABASE_NAME}.bak' WITH INIT, STATS = 10"

# Download backup file to localhost
curl \
    -u "${DOMAIN_USERNAME}:${DOMAIN_PASSWORD}" \
    smb://${FROM_SQL_HOST}/c$/dbbackup/${FROM_DATABASE_NAME}.bak > ${FROM_DATABASE_NAME}.bak

# Upload backup file to target machine
curl \
    --upload-file ${FROM_DATABASE_NAME}.bak \
    -u "${DOMAIN_USERNAME}:${DOMAIN_PASSWORD}" \
    smb://${TO_SQL_HOST}/c$/dbbackup/

# Set target database offline
/opt/mssql-tools/bin/sqlcmd -S ${TO_SQL_HOST} \
    -U ${TO_SQL_USER} \
    -P ${TO_SQL_PASSWORD} \
    -Q "ALTER DATABASE ${TO_DATABASE_NAME} SET OFFLINE WITH ROLLBACK IMMEDIATE"

# Restore backup on target machine
/opt/mssql-tools/bin/sqlcmd -S ${TO_SQL_HOST} \
    -U ${TO_SQL_USER} \
    -P ${TO_SQL_PASSWORD} \
    -Q "RESTORE DATABASE ${TO_DATABASE_NAME} FROM DISK = N'c:\dbbackup\${FROM_DATABASE_NAME}.bak' WITH REPLACE"

# Set target database online
/opt/mssql-tools/bin/sqlcmd -S ${TO_SQL_HOST} \
    -U ${TO_SQL_USER} \
    -P ${TO_SQL_PASSWORD} \
    -Q "ALTER DATABASE ${TO_DATABASE_NAME} SET ONLINE"
```

Run it using
```bash
docker build -t mssqlcp . && docker run -it --rm \
  -e "DOMAIN_USERNAME=DOMAINNAME\Username" \
  -e "DOMAIN_PASSWORD=Password" \
  -e "FROM_SQL_HOST=sourcemachineip" \
  -e "FROM_SQL_USER=proddbusername" \
  -e "FROM_SQL_PASSWORD=proddbpassword" \
  -e "FROM_DATABASE_NAME=fromdbname" \
  -e "TO_SQL_HOST=tomachineip" \
  -e "TO_SQL_USER=testdbuser" \
  -e "TO_SQL_PASSWORD=testdbpassword" \
  -e "TO_DATABASE_NAME=todbname" \
   mssqlcp
```

### Compress backups

You may want to tell SQL-server to compress your backup files. This can be done by running the following on the source SQL-server:
```sql
EXEC sp_configure 'backup compression default', 1
RECONFIGURE WITH OVERRIDE
```