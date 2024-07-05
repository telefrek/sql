# SQL Table Schemas

This package has utilities that help define the structure of a database schema
(tables, columns, foreign keys) as well as builders to create the types and
objects that are bound together. The schemas here are used by validators and
other components to ensure that the SQL AST being passed into them is valid
according to the user defined schema.

Future extensions to this package will also include tools that can manage schema
changes with a database and ensure that they are handled appropriately by the
downstream systems through a similar AST style language describing the changes
to what we have for SQL queries themselves.
