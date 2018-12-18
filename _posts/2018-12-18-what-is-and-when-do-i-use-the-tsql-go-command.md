---
layout: post
title: What is and when do I use the TSQL GO command?
category: SQL
excerpt_separator:  <!--more-->
tags:
  - SQL
  - MSSQL
  - T-SQL
  - Microsoft
---
If you've ever used Microsoft SQL Server Management Studio you may have noticed that `GO` is seemingly scattered everywhere.

## What is GO?
The command `GO` is not part of the Transact-SQL (T-SQL) language at all. `GO` is a statement delimiter, or an SQL Server Utility Statement, provided by Microsoft SQL Server. However, `GO` is recognised by most T-SQL-interpreters.

The purpose of `GO` is simply to signal the end of a batch of Transact-SQL statements.

According to the <a href="https://docs.microsoft.com/en-us/sql/t-sql/language-elements/sql-server-utilities-statements-go?view=sql-server-2017" title="SQL Server Utilities Statements - GO" target="_blank">docs</a>, `GO` takes one parameter; `count`. While pretty much anyone who has used Microsoft SQL Server Management Studio has seen `GO` being used, it's
not too common to see `GO` used with a parameter.

The parameter `count` is a positive integer that when set will run the previous batch of commands `count` times. This 
effectively makes it the equivalent of a `repeat n times`-shortcut.

### Local variable scope in batches
Variables of the type `declare @foo` are limited to a batch and can no longer be referenced after a `GO` has been executed.

## When to use GO?
1. If you are running a large number of statements you may run out of log space. In order to avoid this you can use `GO` to make smaller statements that will run after eachother.
2. Certain SQL-statements must be separated using `GO` in order for the statements following the initial statement to execute successfully.
    * Dropping and recreating a table with the same name.
    * Creating a stored procedure and then executing it.
    * Adding a column to a table and then using that column.