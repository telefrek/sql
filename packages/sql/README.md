# Telefrek SQL

This package is designed to showcase typescript parsing, validation and
customization capabilities when dealing with SQL queries that can be executed
against a variety of backends. It is initially being written as a tutorial
series for how to build something ambitious and new but is something I also
intend to use in future projects and will be releasing packages and updates for
in the future.

## Structure

There are several sub packages within this main SQL project related to the
specific areas they are handling in the parsing and query building process. The
query package contains the parsing, building and validation components that are
used to manage the queries themselves in the project. The ast is the backbone
for communication between components and represents the SQL independent of it's
parsed or re-hydrated forms. The engines represent code designed to manage and
execute queries at runtime without having to know about the individual sources.
Finally the schema packages are intended to help with managing database schemas
that are used to validate queries and represent the entities that are expected
to exist as well as their shape in the target database.

## Testing

For now the primary testing is done with some mostly silly tests that fail as
soon as the TypeScript compilation becomes invalid to help track down
regressions or issues with the realtime parsing system. There are other tests
that verify that the builders generate the same structures that the parsers
expect and define. Finally most of the tests are grouped into a single file to
help find performance issues when dealing with dozens or hundreds of queries
within a single file. I might eventually split more of them out but for now I
want a place to be able to stress the type system and force a lot of
recompilation.
